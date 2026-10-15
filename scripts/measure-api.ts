import { loadEnvConfig } from "@next/env";

/**
 * `npm run perf:api`: tempo de resposta de `GET /api/v1/products`, do pedido
 * até o fim do corpo (CLAUDE.md › Etapas, Fase 11: p95 < 300 ms com 1.000
 * produtos). Não usa dependência nenhuma além do `fetch` do Node.
 *
 * Variáveis (todas opcionais):
 * - `BASE_URL`: padrão http://localhost:3000;
 * - `PERF_PATH`: padrão /api/v1/products;
 * - `REQUESTS`, `CONCURRENCY` e `WARMUP`: padrão 200, 10 e 20;
 * - `VERCEL_AUTOMATION_BYPASS_SECRET`: para medir um preview protegido da
 *   Vercel (Deployment Protection › Protection Bypass for Automation);
 * - `SESSION_TOKEN`: token de sessão do Clerk, para medir com login
 *   (preenche `viewerHasVoted`).
 */

loadEnvConfig(process.cwd());

const TARGET_P95_MS = 300;

function readCount(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;

  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(
      `${name} deve ser um inteiro positivo (recebido: "${raw}")`,
    );
  }
  return value;
}

/** Percentil pelo método do posto mais próximo (sem interpolação). */
function percentile(sorted: readonly number[], p: number): number {
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.min(sorted.length, Math.max(1, rank)) - 1]!;
}

type Sample = {
  ms: number;
  status: number;
  bytes: number;
  items: number;
  encoding: string | null;
};

async function request(url: string, headers: HeadersInit): Promise<Sample> {
  const startedAt = performance.now();
  const response = await fetch(url, { headers, cache: "no-store" });
  const body = await response.text();
  const ms = performance.now() - startedAt;

  let items = 0;
  if (response.ok) {
    const { data } = JSON.parse(body) as { data: unknown[] };
    items = data.length;
  }

  return {
    ms,
    status: response.status,
    bytes: Buffer.byteLength(body),
    items,
    encoding: response.headers.get("content-encoding"),
  };
}

/** `total` pedidos, no máximo `concurrency` ao mesmo tempo. */
async function run(
  total: number,
  concurrency: number,
  send: () => Promise<Sample>,
): Promise<Sample[]> {
  const samples: Sample[] = [];
  let started = 0;

  async function worker() {
    while (started < total) {
      started++;
      samples.push(await send());
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, total) }, worker),
  );
  return samples;
}

async function main() {
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  const url = new URL(process.env.PERF_PATH || "/api/v1/products", baseUrl);
  const requests = readCount("REQUESTS", 200);
  const concurrency = readCount("CONCURRENCY", 10);
  const warmup = readCount("WARMUP", 20);

  const headers = new Headers({ accept: "application/json" });
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (bypass) headers.set("x-vercel-protection-bypass", bypass);
  const token = process.env.SESSION_TOKEN;
  if (token) headers.set("authorization", `Bearer ${token}`);

  const send = () => request(url.toString(), headers);

  console.info(`GET ${url}${token ? " (com sessão)" : ""}`);
  await run(warmup, concurrency, send);
  const samples = await run(requests, concurrency, send);

  const failed = samples.filter((sample) => sample.status !== 200);
  if (failed.length > 0) {
    const statuses = [...new Set(failed.map((sample) => sample.status))];
    throw new Error(
      `${failed.length} de ${samples.length} requisições falharam (status ${statuses.join(", ")})`,
    );
  }

  const times = samples.map((sample) => sample.ms).sort((a, b) => a - b);
  const mean = times.reduce((sum, ms) => sum + ms, 0) / times.length;
  const [first] = samples;
  const p95 = percentile(times, 95);
  const format = (ms: number) => `${Math.round(ms)} ms`;

  console.info(
    `${requests} requisições (${concurrency} simultâneas, ${warmup} de aquecimento)`,
  );
  console.info(
    `Produtos na resposta: ${first!.items} · corpo: ${Math.round(first!.bytes / 1024)} KB` +
      ` (content-encoding: ${first!.encoding ?? "nenhum"})`,
  );
  console.info(
    [
      `mín ${format(times[0]!)}`,
      `p50 ${format(percentile(times, 50))}`,
      `p95 ${format(p95)}`,
      `p99 ${format(percentile(times, 99))}`,
      `máx ${format(times.at(-1)!)}`,
      `média ${format(mean)}`,
    ].join(" · "),
  );
  console.info(
    `Meta p95 < ${TARGET_P95_MS} ms: ${p95 < TARGET_P95_MS ? "ok" : "ACIMA DA META"}`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
