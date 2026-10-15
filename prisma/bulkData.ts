import { createHash } from "node:crypto";

import { SEED_TOPICS } from "@/lib/topics";
import type { MockProductRecord } from "@/server/repositories/mockProductRepository";

/**
 * Produtos gerados para a medição de desempenho (CLAUDE.md › Etapas, Fase 11):
 * com os 5 da demo, o banco fica com 1.000 produtos. Tudo é determinístico (a
 * mesma saída a cada execução), para o seed continuar idempotente.
 */
export const BULK_PRODUCT_COUNT = 995;

/**
 * Teto de votos dos gerados: abaixo do mais votado da demo (298), que continua
 * no topo, e sem precisar de mais usuários fictícios que os da demo.
 */
export const BULK_MAX_UPVOTES = 280;

/** Data do gerado mais recente; os outros vêm antes, um a cada 263 minutos. */
const NEWEST_CREATED_AT = Date.UTC(2026, 8, 20, 12, 0, 0);
const CREATED_AT_STEP_MS = 263 * 60_000;

// 33 × 31 = 1.023 combinações: cada índice vira um nome diferente.
const NAME_PREFIXES = [
  "Aurora",
  "Brisa",
  "Cobalto",
  "Delta",
  "Eco",
  "Farol",
  "Gaia",
  "Halo",
  "Íris",
  "Jade",
  "Kora",
  "Lume",
  "Mira",
  "Nimbo",
  "Onda",
  "Prisma",
  "Quasar",
  "Raio",
  "Sena",
  "Tara",
  "Uno",
  "Vela",
  "Zênite",
  "Atlas",
  "Bento",
  "Ciclo",
  "Duna",
  "Brasa",
  "Fluxo",
  "Grão",
  "Horizonte",
  "Ímpeto",
  "Jornada",
] as const;

const NAME_SUFFIXES = [
  "Notes",
  "Flow",
  "Desk",
  "Hub",
  "Board",
  "Sync",
  "Pay",
  "Mail",
  "Docs",
  "Track",
  "Plan",
  "Chat",
  "Cloud",
  "Forms",
  "Metrics",
  "Pages",
  "Tasks",
  "Ads",
  "Stack",
  "Labs",
  "Data",
  "Shop",
  "Code",
  "Vision",
  "Voice",
  "Learn",
  "Health",
  "Ops",
  "Team",
  "Studio",
  "Pilot",
] as const;

type SeedTopic = (typeof SEED_TOPICS)[number];

/** Começo da descrição, pelo primeiro topic do produto. */
const DESCRIPTION_OPENERS: Record<SeedTopic["slug"], readonly string[]> = {
  ia: [
    "Assistente com inteligência artificial que",
    "Copiloto com IA que",
    "Modelo treinado no contexto da sua empresa que",
    "Agente autônomo que",
  ],
  produtividade: [
    "Espaço de trabalho que",
    "Gerenciador de tarefas que",
    "Agenda inteligente que",
    "Caderno digital que",
  ],
  marketing: [
    "Plataforma de campanhas que",
    "Painel de métricas de marketing que",
    "Ferramenta de SEO que",
    "Editor de anúncios que",
  ],
  saas: [
    "Plataforma em nuvem que",
    "Sistema de assinaturas que",
    "Portal para clientes que",
    "Suíte para empresas que",
  ],
  tech: [
    "API para desenvolvedores que",
    "Ferramenta de linha de comando que",
    "Infraestrutura gerenciada que",
    "Kit de desenvolvimento que",
  ],
};

const DESCRIPTION_BENEFITS = [
  "organiza o trabalho do time em um só lugar.",
  "automatiza tarefas repetitivas em poucos cliques.",
  "transforma dados soltos em decisões claras.",
  "conecta as ferramentas que você já usa.",
  "acompanha resultados em tempo real.",
  "reduz o tempo gasto com reuniões e e-mails.",
  "gera relatórios prontos para compartilhar.",
  "ajuda pequenas empresas a crescer com menos esforço.",
  "deixa o atendimento ao cliente mais rápido.",
  "simplifica o lançamento de novos projetos.",
  "centraliza documentos, prazos e aprovações.",
  "mostra o que priorizar a cada manhã.",
] as const;

const DESCRIPTION_EXTRAS = [
  "Sem instalação e com plano gratuito para começar.",
  "Funciona no navegador, no celular e no desktop.",
  "Integra com as ferramentas de chat e de documentos do time.",
  "Feito para equipes remotas de qualquer tamanho.",
  "Dados criptografados e backups automáticos todos os dias.",
  "Configure em menos de cinco minutos.",
] as const;

/** Mulberry32: gerador pseudoaleatório pequeno, com semente fixa. */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)]!;
}

/** Embaralhamento de Fisher-Yates com o gerador do produto. */
function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other]!, result[index]!];
  }
  return result;
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
}

/** UUID v4 derivado do índice: o mesmo produto tem sempre o mesmo id. */
export function bulkProductId(index: number): string {
  const hex = createHash("sha256")
    .update(`hunt-bulk-product-${index}`)
    .digest("hex");
  const variant = ((Number.parseInt(hex[16]!, 16) & 0x3) | 0x8).toString(16);

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `${variant}${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join("-");
}

function buildBulkProduct(index: number): MockProductRecord {
  // Um gerador por produto: o produto N é o mesmo seja qual for o total.
  const random = createRandom(index * 2_654_435_761);

  const prefix = NAME_PREFIXES[index % NAME_PREFIXES.length]!;
  const suffix = NAME_SUFFIXES[Math.floor(index / NAME_PREFIXES.length)]!;
  const title = `${prefix} ${suffix}`;

  const topics = shuffle(SEED_TOPICS, random)
    .slice(0, 1 + Math.floor(random() * 3))
    .map(({ slug, name }) => ({ slug, name }));

  const description = [
    `${pick(DESCRIPTION_OPENERS[topics[0]!.slug], random)} ${pick(DESCRIPTION_BENEFITS, random)}`,
    ...(random() < 0.4 ? [pick(DESCRIPTION_EXTRAS, random)] : []),
  ].join(" ");

  // Cauda longa: poucos produtos muito votados, muitos com poucos ou nenhum
  // voto (e vários empates, desempatados pela data).
  const upvotes = Math.floor(BULK_MAX_UPVOTES * random() ** 4);
  const visits =
    upvotes * (1 + Math.floor(random() * 6)) + Math.floor(random() * 40);

  return {
    id: bulkProductId(index),
    title,
    description,
    url: `https://example.com/${slugify(title)}`,
    logoUrl: null,
    upvotes,
    visits,
    status: "LAUNCHED",
    topics,
    review: null,
    createdAt: new Date(NEWEST_CREATED_AT - index * CREATED_AT_STEP_MS),
  };
}

/** Os produtos gerados, todos `LAUNCHED` (o pior caso da lista principal). */
export function buildBulkProducts(
  count = BULK_PRODUCT_COUNT,
): MockProductRecord[] {
  if (count > NAME_PREFIXES.length * NAME_SUFFIXES.length) {
    throw new Error(`Nomes insuficientes para ${count} produtos gerados`);
  }

  return Array.from({ length: count }, (_, index) => buildBulkProduct(index));
}
