# Hunt

Vitrine pública de produtos de startups, ordenada por upvotes. Visitantes navegam e filtram por trending topics, usuários logados votam e um admin cadastra os produtos. Projeto 06 do portfólio, inspirado no Product Hunt.

> Em construção. O andamento por fase está em [Etapas](#etapas).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4 · Prisma 7 + PostgreSQL · Zod · pino · Vitest. Nas próximas fases entram Clerk e Playwright. Deploy na Vercel, com o banco de produção no Railway.

## Como rodar

Pré-requisitos: Node.js 22.22 ou mais novo na linha 22 (veja `.nvmrc`; com nvm, `nvm install 22`), npm e Docker.

```bash
npm ci                    # também gera o Prisma Client
cp .env.example .env.local
npm run db:up             # Postgres local na porta 5435
npm run db:deploy         # aplica as migrations
npm run db:seed           # topics + demo (SEED_DEMO=true)
npm run dev
```

A aplicação sobe em http://localhost:3000. Se faltar alguma variável de ambiente, o `dev` e o `build` falham na hora com a lista do que está errado.

Por enquanto a home lê os produtos do mock (`PRODUCT_SOURCE=mock`). A leitura do banco entra na Fase 5.

## Scripts

| Script                            | O que faz                                                     |
| --------------------------------- | ------------------------------------------------------------- |
| `npm run dev`                     | Servidor de desenvolvimento                                   |
| `npm run build`                   | Build de produção                                             |
| `npm run start`                   | Sobe o build de produção                                      |
| `npm run lint`                    | ESLint                                                        |
| `npm run typecheck`               | Gera os tipos de rota do Next e roda `tsc --noEmit`           |
| `npm run format` / `format:check` | Prettier (escreve / só confere)                               |
| `npm test`                        | Testes (Vitest)                                               |
| `npm run test:coverage`           | Testes com cobertura (mínimo de 80% em `src/server/services`) |
| `npm run db:up` / `db:down`       | Sobe / derruba o Postgres do `docker-compose.yml`             |
| `npm run db:migrate`              | Cria e aplica migrations em desenvolvimento                   |
| `npm run db:deploy`               | Aplica as migrations pendentes (sem criar novas)              |
| `npm run db:seed`                 | Seed idempotente (topics e, com `SEED_DEMO=true`, a demo)     |
| `npm run db:studio`               | Prisma Studio                                                 |

## Variáveis de ambiente

Todas ficam em `.env.example` e são validadas com Zod em `src/server/env.ts`. O schema cresce por fase: hoje exige `PRODUCT_SOURCE` (`mock` ou `prisma`) e `LOG_LEVEL`, e `DATABASE_URL` passa a ser obrigatória com `PRODUCT_SOURCE=prisma`. `DIRECT_URL` só é usada com pooler (o CLI do Prisma conecta direto). As do Clerk entram na Fase 6.

O Prisma 7 não lê `.env*` sozinho: o `prisma.config.ts` e o seed carregam os mesmos arquivos que o Next via `@next/env`.

## Banco de dados

Schema em `prisma/schema.prisma`, com 6 tabelas: `users`, `products`, `votes`, `topics`, `product_topics` e `editorial_reviews`. O Prisma não declara CHECK constraints, então elas foram escritas à mão na migration inicial (`--create-only`):

- textos obrigatórios não vazios (`title`, `description`, `external_id`, `slug`, `name`);
- `url` e `logo_url` só com `http://` ou `https://` (bloqueia `javascript:`);
- `upvotes >= 0` e `visits >= 0`;
- `rating` entre 1 e 5.

O seed (`prisma/seed.ts`) roda quantas vezes for preciso sem duplicar nada:

- **sempre** cria os 5 topics fixos (`ia`, `produtividade`, `marketing`, `saas`, `tech`);
- **com `SEED_DEMO=true`** cria os produtos de `src/mocks/products.json` (mesmos ids), com topics, revisões, 298 usuários fictícios (`seed_demo_user_0001`, ...) e 631 votos, mantendo `upvotes = count(votes)`.

Em produção (Railway) a variável fica vazia e o banco começa só com os topics. As migrations de produção rodam num job do GitHub no merge na `main` (Fase 9), nunca no build da Vercel.

No Railway, a URL é a `DATABASE_PUBLIC_URL` do serviço Postgres (a `DATABASE_URL` interna só funciona dentro do Railway) com `?sslmode=no-verify` no fim. O certificado do Railway é autoassinado: com `sslmode=require` o driver `pg` recusa a conexão e, sem parâmetro nenhum, conecta sem SSL. `no-verify` criptografa a conexão sem validar o certificado, e funciona tanto no driver quanto no CLI do Prisma.

## API

| Método | Rota               | Resposta                                                                                                 |
| ------ | ------------------ | -------------------------------------------------------------------------------------------------------- |
| GET    | `/api/v1/products` | `{ "data": ProductDTO[] }` com os produtos lançados, por votos (e, no empate, os mais recentes primeiro) |

No nível 1 os dados vêm de `src/mocks/products.json`.

## Design

O design system "nova" foi extraído do Figma Make e está em [`docs/design/`](docs/design/DESIGN-SYSTEM.md). Os tokens viraram o `@theme` do Tailwind em `src/app/globals.css`, que é a fonte de verdade no código, com alguns ajustes: fonte mínima de 11px, textos com contraste AA, cinzas consolidados, anel de foco e navegação visível no celular. A lista completa está em [Ajustes aplicados](docs/design/DESIGN-SYSTEM.md#10-ajustes-aplicados-v100).

## Estrutura

```
prisma/           schema.prisma · migrations/ · seed.ts
src/app/          páginas, layouts e rotas de API
src/components/   layout/ · products/ · sidebar/ · topics/ · admin/ · ui/
src/server/       env, logger, errors, repositories/, services/
src/lib/          validation/ (Zod) e utilitários
src/mocks/        dados do nível 1
src/types/        DTOs da API
tests/            unit/ · integration/ · api/ · e2e/
docs/design/      design system extraído do Figma Make (referência)
```

As regras de produto, a arquitetura e os casos de teste estão em [`CLAUDE.md`](CLAUDE.md).

## Etapas

| Nível   | Entrega                                                  | Status               |
| ------- | -------------------------------------------------------- | -------------------- |
| 1       | Layout + listagem vinda de API mock                      | Concluído (`v1.0.0`) |
| 2 (MVP) | Banco real, login, votos, visitas, admin, coluna lateral | Em andamento         |
| 3       | Filtro por trending topics                               | —                    |

## Fluxo de trabalho

- Commits no padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/).
- Uma branch por nível (`feat/nivel-1-listagem-mock`, ...) e branches curtas por tarefa, com PR e squash merge.
- O CI (GitHub Actions) roda install → lint → typecheck → `prisma validate` → testes → build → `npm audit` em todo PR.
- A Vercel gera um preview para cada PR.
