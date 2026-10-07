# CLAUDE.md — Product Hunt Clone (Projeto 06)

Contexto do projeto para o Claude Code. Resume só o que é necessário para implementar; a especificação técnica completa continua sendo a fonte de verdade.

## Como trabalhar neste repositório

- Implemente **uma fase por vez**, na ordem da seção "Etapas". Não adiante funcionalidades de fases futuras.
- Antes de começar uma fase, apresente um plano curto (arquivos a criar/alterar) e espere aprovação.
- Uma fase só termina quando `lint`, `typecheck` e os testes passam e o critério "Pronto quando" é cumprido.
- Não invente regras. Se algo não estiver aqui, pergunte antes de implementar.
- Fixe as versões no `package.json` e siga a documentação oficial **da versão instalada**. Next.js, Clerk e Prisma mudaram APIs recentemente (ex.: `middleware.ts` → `proxy.ts` no Next.js; URL do banco em `prisma.config.ts` no Prisma).

## Produto

Vitrine pública de produtos de startups ordenada por upvotes. Visitantes navegam e filtram, usuários logados votam e um admin cadastra os produtos.

| Nível | Entrega | Branch | Tag |
| --- | --- | --- | --- |
| 1 | Layout + listagem vinda de API mock | `feat/nivel-1-listagem-mock` | `v1.0.0` |
| 2 (MVP) | Banco real, login, votos, visitas, admin, coluna lateral | `refactor/nivel-2-api-real` | `v2.0.0` |
| 3 | Filtro por trending topics | `feat/nivel-3-trending-topics` | `v3.0.0` |

## Stack (fixa)

Next.js (App Router) · React · TypeScript strict · TailwindCSS · Prisma · PostgreSQL (Railway em produção, Docker local) · Clerk · Zod · Vitest + Testing Library · Playwright · Vercel.

Não usar: Express ou servidor separado, Supabase/Firebase ou outro BaaS, localStorage para dados de domínio.

## Arquitetura

- Monólito Next.js: páginas + API REST em `/api/v1`.
- Camadas: `src/app` (rotas, só orquestra) → `src/server/services` (regras de negócio) → `src/server/repositories` (dados) → Prisma.
- `ProductRepository` é uma interface com duas implementações: `MockProductRepository` (nível 1, lê `src/mocks/products.json`) e `PrismaProductRepository` (nível 2). A escolha é feita por `PRODUCT_SOURCE=mock|prisma`. A troca **não pode** alterar componentes de UI.
- Server Components chamam os serviços direto, sem fazer HTTP para o próprio app. Client Components só onde há interação: `UpvoteButton`, `TrendingTopicsBar`, `ProductLink` e formulários do admin.
- Schemas Zod em `src/lib/validation`, compartilhados entre cliente e servidor.
- Prisma Client como singleton em `src/server/db.ts`.
- Erros: os serviços lançam `AppError` (`ValidationError`, `UnauthenticatedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `BusinessRuleError`). Um wrapper `withErrorHandling` converte para HTTP.
- Formato de resposta: sucesso `{ "data": ... }`; erro `{ "error": { "code": "...", "message": "...", "details": {} } }`.
- Home renderizada dinamicamente (sem cache) no MVP.
- Logs JSON (pino) com `requestId`, rota, id interno do usuário e duração. Nunca logar e-mail, token ou cookie.

## Estrutura de pastas

```
prisma/            schema.prisma · migrations/ · seed.ts
scripts/           reconcile-upvotes.ts
src/app/           páginas, layout, loading/error/not-found, api/v1/**, api/webhooks/clerk, api/health
src/components/    layout/ · products/ · sidebar/ · topics/ · admin/ · ui/
src/server/        db.ts · auth.ts · errors.ts · logger.ts · repositories/ · services/
src/lib/           validation/ (Zod) · utils.ts
src/mocks/         products.json
src/types/         api.ts (DTOs)
tests/             unit/ · integration/ · api/ · e2e/
docker-compose.yml Postgres local · .env.example · .github/workflows/ci.yml
```

## Modelo de dados

- **users**: `id` uuid PK · `external_id` text UNIQUE (id do Clerk) · `created_at` · `updated_at`. Não guardar nome, e-mail nem avatar.
- **products**: `id` · `title` varchar(80) não vazio · `description` varchar(500) não vazio · `url` text http(s) · `logo_url` text opcional http(s) · `upvotes` int default 0, ≥ 0 · `visits` int default 0, ≥ 0 · `status` enum `LAUNCHED | UPCOMING` default `LAUNCHED` · timestamps. Índice `(status, upvotes DESC, created_at DESC)`.
- **votes**: `id` · `user_id` FK CASCADE · `product_id` FK CASCADE · timestamps · `UNIQUE(user_id, product_id)` · índice `(product_id)`.
- **topics**: `id` · `slug` varchar(40) UNIQUE · `name` varchar(60). Seed fixo: `ia` (Inteligência artificial), `produtividade` (Produtividade), `marketing` (Marketing), `saas` (SaaS), `tech` (Tech).
- **product_topics**: PK composta `(product_id, topic_id)`, FKs CASCADE, índice `(topic_id)`.
- **editorial_reviews**: `id` · `product_id` UNIQUE FK CASCADE · `rating` smallint 1–5 · `summary` varchar(280) opcional · timestamps.

O Prisma não declara CHECK constraints: gere a migration com `prisma migrate dev --create-only` e adicione os CHECKs (textos não vazios, URLs http(s), `upvotes >= 0`, `visits >= 0`, `rating BETWEEN 1 AND 5`) no SQL.

## Regras de negócio

1. A lista principal mostra só produtos `LAUNCHED`, com `ORDER BY upvotes DESC, created_at DESC`, **sem paginação nem scroll infinito**.
2. Só usuário autenticado vota, no máximo 1 voto por produto (constraint UNIQUE).
3. O voto é toggle: clicar de novo remove o voto.
4. Votar é uma transação (INSERT do voto + `upvotes + 1`); desvotar também (DELETE + `upvotes - 1`). `upvotes` nunca fica negativo. Erro Prisma `P2002` → `409`.
5. Produto `UPCOMING` fica fora da lista principal, aparece em "Em breve" e não recebe voto (`422`).
6. Visitas: todo clique no link do produto soma 1 em `visits`, vindo de qualquer perfil e sem deduplicação. As visitas só são exibidas (card e admin) e **nunca entram na ordenação**.
7. Só o admin cria, edita e remove produtos; usuário comum não cadastra. `upvotes` e `visits` enviados no body são ignorados.
8. Remover um produto apaga em cascata os votos, os topics associados e a revisão.
9. "Produtos revisados por nós": revisão do admin com nota de 1 a 5. A lateral mostra até 3, por nota decrescente.
10. Trending topics: só os 5 do seed, e um produto pode ter vários. O filtro aceita 1 topic por vez (`/?topic=slug`), é público e afeta só a coluna principal.
11. Usuário local: upsert por `external_id` na primeira ação autenticada. O webhook `user.deleted` apaga o usuário e, **na mesma transação, desconta os votos dele de `upvotes`**.
12. O admin é identificado por `publicMetadata.role === "admin"` no Clerk, exposto no token de sessão por custom claims. O papel é checado no servidor em todo handler de admin.
13. O clique no produto abre `url` em nova aba com `rel="noopener noreferrer"`. Não existe página de detalhe.
14. O seed de demonstração cria usuários e votos fictícios para manter `upvotes = count(votes)`. A produção começa vazia.

## API (`/api/v1`)

| Método | Rota | Auth | Sucesso | Erros |
| --- | --- | --- | --- | --- |
| GET | `/products?topic=slug` | Opcional (preenche `viewerHasVoted`) | 200 | 400, 404 `TOPIC_NOT_FOUND` |
| GET | `/products/reviewed?limit=3` | — | 200 | — |
| GET | `/products/upcoming` | — | 200 | — |
| GET | `/topics` (com `productCount`) | — | 200 | — |
| POST | `/products/{id}/vote` | Usuário | 201 | 401, 404, 409 `ALREADY_VOTED`, 422 `PRODUCT_NOT_VOTABLE` |
| DELETE | `/products/{id}/vote` | Usuário | 200 | 401, 404 `VOTE_NOT_FOUND` |
| POST | `/products/{id}/visit` | — | 204 | 400, 404 |
| GET | `/admin/products` | Admin | 200 | 401, 403 |
| POST | `/admin/products` | Admin | 201 | 400, 401, 403 |
| PATCH | `/admin/products/{id}` | Admin | 200 | 400, 401, 403, 404 |
| DELETE | `/admin/products/{id}` | Admin | 204 | 401, 403, 404 |
| PUT | `/admin/products/{id}/review` | Admin | 200 | 400, 401, 403, 404 |
| POST | `/api/webhooks/clerk` (fora de `/v1`) | Assinatura | 200 | 400 |
| GET | `/api/health` | — | 200 | 503 |

Campos do `ProductDTO`: `id`, `title`, `description`, `url`, `logoUrl`, `upvotes`, `visits`, `status`, `topics[{slug,name}]`, `viewerHasVoted`, `createdAt`.

Body do admin: `title` (1–80), `description` (1–500), `url` e `logoUrl` (http/https), `status`, `topicSlugs[]` (existentes, sem repetição). No PATCH, todos os campos são opcionais e `topicSlugs` substitui a lista inteira.

## Frontend

- **Rotas:** `/`, `/produtos`, `/categorias`, `/sobre`, `/sign-in/[[...sign-in]]`, `/sign-up/[[...sign-up]]`, `/admin/produtos`, `/admin/produtos/novo`, `/admin/produtos/[id]/editar`, `/acesso-negado`.
- **Home:**
  - Header: logo, nav Produtos/Categorias/Sobre, Login/Registro ou menu do usuário + link Admin.
  - `TrendingTopicsBar`.
  - Coluna 1, "O Próximo Grande App": `ProductCard` com logo, nome, descrição em 2 linhas, tags, visitas e `UpvoteButton`.
  - Coluna 2: "Produtos Revisados por nós" (estrelas x/5) e "Em breve" (descrição truncada).
  - Footer: crédito do Projeto 06 + links do GitHub e do LinkedIn.
- **Layout:** grid 2/3 + 1/3 a partir de 1024 px; abaixo disso, a lateral desce. Responsivo de 360 a 1440 px.
- **Estados:** toda tela tem loading (skeleton), estado vazio e erro com "Tentar novamente".
- **`UpvoteButton`:** atualização otimista com rollback; visitante vai para `/sign-in?redirect_url=/`.
- **`ProductLink`:** `navigator.sendBeacon` para `/visit` e abre o link; o link funciona mesmo se o beacon falhar.
- **Páginas:**
  - `/produtos`: lista completa, sem a lateral.
  - `/categorias`: os 5 topics com contagem, cada um ligando a `/?topic=slug`.
  - `/sobre`: texto estático.
- **Admin:** tabela com nome, status, votos, visitas, topics, nota e data; formulário com contador de caracteres e pré-visualização do logo; confirmação antes de remover.
- **Login:** e-mail/senha + GitHub, configurados no painel do Clerk.
- **Idioma:** interface em pt-BR.

## Segurança (obrigatório)

- Sessão e papel conferidos **dentro de cada handler**, não só no middleware.
- Papel só em `publicMetadata`, nunca em `unsafeMetadata`.
- Zod em toda entrada; ids validados como UUID antes de chegar ao banco.
- `url` e `logoUrl` aceitam só http(s), validados no Zod e no CHECK (bloqueia `javascript:`).
- `dangerouslySetInnerHTML` proibido por regra do ESLint.
- Webhook do Clerk: verificar a assinatura e responder `400` se ela for inválida; processamento idempotente.
- Só queries parametrizadas do Prisma; `$queryRaw` apenas com template tag.
- Segredos só em variáveis de ambiente; nada sensível com prefixo `NEXT_PUBLIC_`; `.env*` no `.gitignore`.
- Escritas só via POST/PATCH/PUT/DELETE com JSON, conferindo o header `Origin`.
- Headers: CSP compatível com o Clerk, `X-Content-Type-Options: nosniff`, `Referrer-Policy`.
- `npm audit` no CI + Dependabot.
- Riscos aceitos no MVP, sem rate limit: votos via múltiplas contas e visitas infladas.

## Variáveis de ambiente (`.env.example`)

`DATABASE_URL` · `DIRECT_URL` (só se usar pooler) · `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` · `CLERK_SECRET_KEY` · `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` · `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up` · `CLERK_WEBHOOK_SIGNING_SECRET` · `PRODUCT_SOURCE=mock|prisma` · `LOG_LEVEL`

Valide todas com Zod na inicialização (falhar cedo se faltar alguma).

## Etapas

| Fase | Implementar | Pronto quando |
| --- | --- | --- |
| 1 Fundação | Next.js + TS strict + Tailwind + ESLint/Prettier; pastas; env validado; logger e errors mínimos; CI; Vercel com preview por PR; README | PR de teste passa no CI e gera preview |
| 2 Contrato + mock | `ProductDTO`, `ProductRepository`, `MockProductRepository` (4 itens do wireframe: 298/202/102/29 votos + revisados + em breve), `productService`, `GET /products` | Endpoint devolve a lista ordenada (TC-01, TC-02) |
| 3 Front nível 1 | Header, Footer, grid, `TrendingTopicsBar` só visual, `ProductList`/`ProductCard`, Sidebar, páginas Produtos/Categorias/Sobre, estados | Home igual ao wireframe; merge na `main`; tag `v1.0.0` |
| 4 Banco | docker-compose; schema; migration com CHECKs; seed (topics + demo com votos fictícios); Railway | Migrate + seed rodam do zero 2 vezes sem duplicar |
| 5 Refactor | `PrismaProductRepository`; `PRODUCT_SOURCE`; testes de integração com Postgres em Docker | Home com dados reais sem mudar nenhum componente |
| 6 Autenticação | Clerk (e-mail + GitHub), páginas sign-in/up, `AuthButtons`, middleware, custom claims, `getViewer`/`requireUser`/`requireAdmin`, `ensureUser` | Login/logout no preview; testes de permissão; TC-15 |
| 7 Backend voto/admin/visitas | `voteService` (toggle, transação, P2002), endpoints de voto, `viewerHasVoted`, `visits` + `/visit`, CRUD admin, `withErrorHandling`, script de reconciliação | TC-04 a TC-12, TC-17, TC-18, TC-21 a TC-26 |
| 8 Front nível 2 | `UpvoteButton` otimista, `ProductLink` + `VisitCount`, área admin, `/acesso-negado`, invalidação após salvar | Votar e cadastrar produto funcionam ponta a ponta |
| 9 Lateral + produção | Status/`UPCOMING`, `editorial_reviews`, endpoints reviewed/upcoming/review, `ReviewForm`, Clerk de produção, webhook `user.deleted`, `/api/health`, job de migration, E2E | TC-19, TC-20, TC-27 + todos acima; tag `v2.0.0` |
| 10 Nível 3 | `GET /topics`, `?topic=`, `TrendingTopicsBar` interativa com estado na URL, multiselect de topics no admin, Categorias com contagem | TC-13, TC-14; tag `v3.0.0` |
| 11 Fechamento | Seed com 1.000 produtos e medição (home < 2 s LCP, `GET /products` p95 < 300 ms), README final com prints e link | Metas medidas e documentadas |

## Testes obrigatórios

| ID | Caso | Resultado esperado |
| --- | --- | --- |
| TC-01 | Produtos com 298, 29, 202 e 102 votos | Ordem 298, 202, 102, 29 |
| TC-02 | Empate de votos | O mais recente vem primeiro |
| TC-03 | 60 produtos | Todos numa resposta só |
| TC-04 | Voto sem sessão | 401, contador intacto |
| TC-05 | Primeiro voto | 201, +1, 1 linha em `votes` |
| TC-06 | Voto repetido via API | 409, contador intacto |
| TC-07 | 10 requisições simultâneas do mesmo usuário | Exatamente 1 voto |
| TC-08 | Remover voto inexistente | 404; nunca negativo |
| TC-09 | Votar em produto `UPCOMING` | 422 |
| TC-10 | Não-admin em `/admin/products` | 403, nada gravado |
| TC-11 | `upvotes: 500` no body do admin | Produto criado com 0 |
| TC-12 | `url: "javascript:alert(1)"` | 400 no campo `url` |
| TC-13 | `?topic=saas` | Só SaaS, por votos |
| TC-14 | `?topic=inexistente` | 404 / mensagem na UI |
| TC-15 | Primeira ação autenticada repetida 2 vezes | 1 único `User` |
| TC-16 | Webhook sem assinatura | 400, nada gravado |
| TC-17 | Remover produto com votos | Cascata completa |
| TC-18 | Reconciliação após divergência forçada | `upvotes = count(votes)` |
| TC-19 | E2E: visitante clica no voto → login → vota | Contador +1, botão ativo |
| TC-20 | E2E: admin cadastra produto | Aparece na home com 0 votos |
| TC-21 | Visitante sem login clica no link | `visits` +1 e o site abre |
| TC-22 | 3 cliques do mesmo usuário | `visits` +3 |
| TC-23 | Mais visitas e menos votos que outro produto | Continua abaixo do mais votado |
| TC-24 | `/visit` em produto inexistente | 404 |
| TC-25 | `visits: 999` no PATCH | Campo ignorado |
| TC-26 | Votar e clicar de novo | Voto removido, contador volta |
| TC-27 | Webhook `user.deleted` de usuário com 2 votos | Usuário apagado; os 2 produtos descem 1 cada |

Cobertura mínima de 80% em `src/server/services`.

## Padrões

- **Commits:** Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`).
- **Fluxo:** branch por nível + branches curtos por tarefa; PR com CI verde; squash merge.
- **Nomenclatura:** componentes em `PascalCase.tsx`; hooks `useAlgo`; serviços `camelCase`; models Prisma `PascalCase` com tabelas `snake_case` via `@map`; enums `UPPER_SNAKE`; rotas de página em pt-BR e de API em inglês.
- **CI:** install → lint → typecheck → `prisma validate` → testes (Postgres como service container) → build.
- **Migrations de produção:** rodam num job do GitHub no merge na `main`, nunca no build da Vercel (o build também roda em previews).

## Fora de escopo (não implementar)

Paginação, página de detalhe do produto, busca, comentários, perfis públicos, submissão de produto por usuário comum, upload de logo, ranking por dia/semana, visitas no ranking, rate limit, tags além dos 5 topics, servidor backend separado.
