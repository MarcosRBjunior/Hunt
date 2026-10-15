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
 * - `VERCEL_AUTOMATION_BYPASS_SECRET`: para medir um preview protegido da
 *   Vercel. Só mede a 1ª visita (veja `withBypassQuery`).
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
  finalDisplayedUrl: string;
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

/**
 * Tira o segredo de bypass das mensagens do Lighthouse (a URL da 1ª visita o
 * leva na query). Os relatórios JSON ficam com a URL completa.
 */
function redact(text: string): string {
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  return secret ? text.replaceAll(secret, "<segredo>") : text;
}

/** O par `nome=valor` do `Set-Cookie` com esse nome, se houver. */
function findCookie(response: Response, name: string): string | null {
  return (
    response.headers
      .getSetCookie()
      .map((header) => header.split(";")[0]!)
      .find((pair) => pair.startsWith(`${name}=`)) ?? null
  );
}

/**
 * O deploy é protegido pela Vercel e aceita o segredo de bypass? Localmente, ou
 * sem proteção, a resposta não grava o cookie `_vercel_jwt`.
 */
async function isProtectedPreview(url: string): Promise<boolean> {
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (!secret) return false;

  const response = await fetch(url, {
    redirect: "manual",
    headers: {
      "x-vercel-protection-bypass": secret,
      "x-vercel-set-bypass-cookie": "true",
    },
  });
  return findCookie(response, "_vercel_jwt") !== null;
}

/**
 * URL de um preview protegido: o segredo vai na query, e a Vercel grava o
 * cookie de bypass no navegador (SameSite=None, para valer também na volta do
 * handshake do Clerk, que vem de outro site) e redireciona para a URL limpa. É
 * 1 redirecionamento a mais, que não existe em produção.
 *
 * Os outros jeitos falham: o cabeçalho `x-vercel-protection-bypass` iria em
 * todas as requisições, e o CDN do Clerk recusa cabeçalho desconhecido (CORS);
 * e um `cookie` mandado como cabeçalho extra some assim que o navegador tem
 * cookies próprios do site. Por isso a visita de volta (que precisaria de dois
 * cookies) não é medida num preview protegido.
 */
function withBypassQuery(url: string): string {
  const withBypass = new URL(url);
  withBypass.searchParams.set(
    "x-vercel-protection-bypass",
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET!,
  );
  withBypass.searchParams.set("x-vercel-set-bypass-cookie", "samesitenone");
  return withBypass.toString();
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
      },
    });

    const cookie = findCookie(response, "__clerk_db_jwt");
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
    ...(cookie ? [`--extra-headers=${JSON.stringify({ cookie })}`] : []),
  ];

  await execFileAsync("npx", args, { maxBuffer: 64 * 1024 * 1024 });
  const report = JSON.parse(
    await readFile(outputPath, "utf8"),
  ) as LighthouseReport;

  if (report.runtimeError) {
    throw new Error(
      `Lighthouse falhou: ${report.runtimeError.code} ${redact(report.runtimeError.message)}`,
    );
  }
  for (const warning of report.runWarnings ?? []) {
    console.warn(`  aviso do Lighthouse: ${redact(warning)}`);
  }
  // Sem o bypass, um preview protegido mede a tela de login da Vercel.
  if (new URL(report.finalDisplayedUrl).origin !== new URL(url).origin) {
    throw new Error(
      `O Lighthouse terminou em outra página (${redact(report.finalDisplayedUrl)})`,
    );
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
  const protectedPreview = await isProtectedPreview(url);
  const visits = readList("VISITS", VISITS).filter(
    (visit) => !protectedPreview || visit === "first",
  );
  const reportDir = await mkdtemp(path.join(tmpdir(), "hunt-lighthouse-"));

  console.info(`Lighthouse (${LIGHTHOUSE}) em ${url}`);
  console.info(`Relatórios JSON em ${reportDir}`);

  if (protectedPreview) {
    console.info("Preview protegido: só a 1ª visita (veja withBypassQuery)");
  }
  const devBrowser = visits.includes("returning")
    ? await devBrowserCookie(url)
    : null;

  for (const profile of profiles) {
    for (const visit of visits) {
      const label = `${profile}, ${visit === "first" ? "1ª visita" : "visita de volta"}`;
      const results: Metrics[] = [];

      for (let run = 1; run <= runs; run++) {
        const output = path.join(reportDir, `${profile}-${visit}-${run}.json`);
        const result = await runLighthouse(
          protectedPreview ? withBypassQuery(url) : url,
          profile,
          visit === "returning" ? devBrowser : null,
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
