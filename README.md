# Hunt

Vitrine pública de produtos de startups, ordenada por upvotes. Visitantes navegam e filtram por trending topics, usuários logados votam e um admin cadastra os produtos. Projeto 06 do portfólio, inspirado no Product Hunt.

> Em construção. O andamento por fase está em [Etapas](#etapas).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4 · Zod · pino · Vitest. Nas próximas fases entram Prisma + PostgreSQL, Clerk e Playwright. Deploy na Vercel.

## Como rodar

Pré-requisitos: Node.js 22 (veja `.nvmrc`) e npm.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

A aplicação sobe em http://localhost:3000. Se faltar alguma variável de ambiente, o `dev` e o `build` falham na hora com a lista do que está errado.

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

## Variáveis de ambiente

Todas ficam em `.env.example` e são validadas com Zod em `src/server/env.ts`. O schema cresce por fase: hoje exige `PRODUCT_SOURCE` (`mock` ou `prisma`) e `LOG_LEVEL`. As do banco entram na Fase 4 e as do Clerk na Fase 6.

## API

| Método | Rota               | Resposta                                                                                                 |
| ------ | ------------------ | -------------------------------------------------------------------------------------------------------- |
| GET    | `/api/v1/products` | `{ "data": ProductDTO[] }` com os produtos lançados, por votos (e, no empate, os mais recentes primeiro) |

No nível 1 os dados vêm de `src/mocks/products.json`.

## Design

O design system "nova" foi extraído do Figma Make e está em [`docs/design/`](docs/design/DESIGN-SYSTEM.md). Os tokens viraram o `@theme` do Tailwind em `src/app/globals.css`, com alguns ajustes: fonte mínima de 11px, textos com contraste AA, cinzas consolidados, anel de foco e navegação visível no celular.

## Estrutura

```
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

| Nível   | Entrega                                                  | Status                       |
| ------- | -------------------------------------------------------- | ---------------------------- |
| 1       | Layout + listagem vinda de API mock                      | Em andamento (Fase 3, front) |
| 2 (MVP) | Banco real, login, votos, visitas, admin, coluna lateral | —                            |
| 3       | Filtro por trending topics                               | —                            |

## Fluxo de trabalho

- Commits no padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/).
- Uma branch por nível (`feat/nivel-1-listagem-mock`, ...) e branches curtas por tarefa, com PR e squash merge.
- O CI (GitHub Actions) roda install → lint → typecheck → testes → build → `npm audit` em todo PR.
- A Vercel gera um preview para cada PR.
