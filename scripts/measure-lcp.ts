import { execFile } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { loadEnvConfig } from "@next/env";
import { chromium } from "@playwright/test";

/**
 * `npm run perf:lcp`: LCP da home com o Lighthouse (CLAUDE.md › Etapas,
 * Fase 11: < 2 s com 1.000 produtos). Roda o Lighthouse várias vezes em cada
 * combinação e mostra a mediana.
 *
 * Perfis:
 * - desktop: `--preset=desktop`, o perfil da meta (docs/PERFORMANCE.md);
 * - mobile: o padrão do Lighthouse (4G lento e CPU 4x mais lenta, simulados),
 *   só para registro.
 *
 * Visitas:
 * - first: navegador sem cookie nenhum. Com a instância de desenvolvimento do
 *   Clerk, a 1ª visita passa por 3 redirecionamentos (o handshake que cria o
 *   "dev browser");
 * - returning: com o cookie `__clerk_db_jwt` de uma visita anterior, sem o
 *   handshake (mas com o cache vazio).
 *
 * Usa o Chromium do Playwright (`npx playwright install chromium`) e baixa o
 * Lighthouse na versão fixa abaixo via `npx`, para não pesar o `npm ci`.
 *
 * Variáveis (todas opcionais):
 * - `BASE_URL`: padrão http://localhost:3000; `PERF_PATH`: padrão /;
 * - `RUNS`: execuções por combinação, padrão 5;
 * - `PROFILES`: padrão `desktop,mobile`; `VISITS`: padrão `first,returning`;
 * - `VERCEL_AUTOMATION_BYPASS_SECRET`: para medir um preview protegido.
 */

loadEnvConfig(process.cwd());

const LIGHTHOUSE = "lighthouse@13.5.0";
const TARGET_LCP_MS = 2_000;
const PROFILES = ["desktop", "mobile"] as const;
const VISITS = ["first", "returning"] as const;
/** Perfil em que a meta vale (o mobile simulado fica só registrado). */
const TARGET_PROFILE = "desktop";

type Profile = (typeof PROFILES)[number];

type Metrics = {
  lcp: number;
  fcp: number;
  tbt: number;
  cls: number;
  speedIndex: number;
  score: number;
  bytes: number;
};

type LighthouseReport = {
  runtimeError?: { code: string; message: string };
  runWarnings?: string[];
  categories: { performance: { score: number | null } };
  audits: Record<string, { numericValue?: number } | undefined>;
};

const execFileAsync = promisify(execFile);

function readList<T extends string>(name: string, allowed: readonly T[]): T[] {
  const raw = process.env[name] || allowed.join(",");
  return raw.split(",").map((value) => {
    const item = value.trim();
    if (!(allowed as readonly string[]).includes(item)) {
      throw new Error(
        `${name} aceita ${allowed.join(" e ")} (recebido: "${raw}")`,
      );
    }
    return item as T;
  });
}

function readRuns(): number {
  const raw = process.env.RUNS || "5";
  const runs = Number(raw);
  if (!Number.isInteger(runs) || runs < 1) {
    throw new Error(`RUNS deve ser um inteiro positivo (recebido: "${raw}")`);
  }
  return runs;
}

function median(values: readonly number[]): number {
  const sorted = values.toSorted((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]!
    : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

function metric(report: LighthouseReport, audit: string): number {
  const value = report.audits[audit]?.numericValue;
  if (value === undefined) throw new Error(`Lighthouse sem a métrica ${audit}`);
  return value;
}

/** Cabeçalhos extras do Lighthouse: bypass do preview e cookie da visita. */
function extraHeaders(cookie: string | null): Record<string, string> {
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  return {
    ...(bypass && { "x-vercel-protection-bypass": bypass }),
    ...(cookie && { cookie }),
  };
}

/**
 * Faz o handshake do Clerk de desenvolvimento como um navegador faria e
 * devolve o cookie `__clerk_db_jwt` que o app grava no fim. Sem handshake
 * (instância de produção do Clerk), não há cookie a guardar.
 */
async function devBrowserCookie(url: string): Promise<string | null> {
  const appOrigin = new URL(url).origin;
  let next = url;

  for (let hop = 0; hop < 6; hop++) {
    const sameOrigin = new URL(next).origin === appOrigin;
    const response = await fetch(next, {
      redirect: "manual",
      headers: {
        accept: "text/html",
        "sec-fetch-dest": "document",
        ...(sameOrigin && extraHeaders(null)),
      },
    });

    const cookie = response.headers
      .getSetCookie()
      .map((header) => header.split(";")[0]!)
      .find((pair) => pair.startsWith("__clerk_db_jwt="));
    if (sameOrigin && cookie) return cookie;

    const location = response.headers.get("location");
    if (!location) return null;
    next = new URL(location, next).toString();
  }

  throw new Error("Handshake do Clerk sem fim (mais de 6 redirecionamentos)");
}

async function runLighthouse(
  url: string,
  profile: Profile,
  cookie: string | null,
  outputPath: string,
): Promise<Metrics> {
  const headers = extraHeaders(cookie);
  const args = [
    "--yes",
    LIGHTHOUSE,
    url,
    "--only-categories=performance",
    "--output=json",
    `--output-path=${outputPath}`,
    `--chrome-path=${process.env.CHROME_PATH || chromium.executablePath()}`,
    "--chrome-flags=--headless=new --no-sandbox",
    "--quiet",
    ...(profile === "desktop" ? ["--preset=desktop"] : []),
    ...(Object.keys(headers).length > 0
      ? [`--extra-headers=${JSON.stringify(headers)}`]
      : []),
  ];

  await execFileAsync("npx", args, { maxBuffer: 64 * 1024 * 1024 });
  const report = JSON.parse(
    await readFile(outputPath, "utf8"),
  ) as LighthouseReport;

  if (report.runtimeError) {
    throw new Error(
      `Lighthouse falhou: ${report.runtimeError.code} ${report.runtimeError.message}`,
    );
  }
  for (const warning of report.runWarnings ?? []) {
    console.warn(`  aviso do Lighthouse: ${warning}`);
  }

  return {
    lcp: metric(report, "largest-contentful-paint"),
    fcp: metric(report, "first-contentful-paint"),
    tbt: metric(report, "total-blocking-time"),
    cls: metric(report, "cumulative-layout-shift"),
    speedIndex: metric(report, "speed-index"),
    score: Math.round((report.categories.performance.score ?? 0) * 100),
    bytes: metric(report, "total-byte-weight"),
  };
}

function seconds(ms: number): string {
  return `${(ms / 1000).toFixed(2)} s`;
}

async function main() {
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  const url = new URL(process.env.PERF_PATH || "/", baseUrl).toString();
  const runs = readRuns();
  const profiles = readList("PROFILES", PROFILES);
  const visits = readList("VISITS", VISITS);
  const reportDir = await mkdtemp(path.join(tmpdir(), "hunt-lighthouse-"));

  console.info(`Lighthouse (${LIGHTHOUSE}) em ${url}`);
  console.info(`Relatórios JSON em ${reportDir}`);

  const cookie = visits.includes("returning")
    ? await devBrowserCookie(url)
    : null;

  for (const profile of profiles) {
    for (const visit of visits) {
      const label = `${profile}, ${visit === "first" ? "1ª visita" : "visita de volta"}`;
      const results: Metrics[] = [];

      for (let run = 1; run <= runs; run++) {
        const output = path.join(reportDir, `${profile}-${visit}-${run}.json`);
        const result = await runLighthouse(
          url,
          profile,
          visit === "returning" ? cookie : null,
          output,
        );
        results.push(result);
        console.info(
          `  ${label} #${run}: LCP ${seconds(result.lcp)} · FCP ${seconds(result.fcp)}` +
            ` · TBT ${Math.round(result.tbt)} ms · nota ${result.score}`,
        );
      }

      const pick = (key: keyof Metrics) =>
        median(results.map((result) => result[key]));
      const lcp = pick("lcp");
      console.info(
        `${label} (mediana de ${runs}): ` +
          [
            `LCP ${seconds(lcp)}`,
            `FCP ${seconds(pick("fcp"))}`,
            `TBT ${Math.round(pick("tbt"))} ms`,
            `CLS ${pick("cls").toFixed(3)}`,
            `Speed Index ${seconds(pick("speedIndex"))}`,
            `nota ${pick("score")}`,
            `transferido ${Math.round(pick("bytes") / 1024)} KB`,
          ].join(" · "),
      );
      if (profile === TARGET_PROFILE) {
        console.info(
          `  Meta LCP < ${seconds(TARGET_LCP_MS)}: ${lcp < TARGET_LCP_MS ? "ok" : "ACIMA DA META"}`,
        );
      }
    }
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
