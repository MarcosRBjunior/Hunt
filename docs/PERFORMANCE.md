# Desempenho com 1.000 produtos

Medição da Fase 11 ([`CLAUDE.md`](../CLAUDE.md) › Etapas). As metas são a home com **LCP abaixo de 2 s** e `GET /api/v1/products` com **p95 abaixo de 300 ms**, com 1.000 produtos no banco. Medido em 14/10/2026.

## Resultado

| Meta | Local | Preview na Vercel | |
| --- | --- | --- | --- |
| LCP da home (Lighthouse desktop, 1ª visita) | 1,35 s | **1,28 s** | ✅ |
| `GET /api/v1/products`, p95 no servidor | 25 ms (1 por vez) · 179 ms (10 simultâneas) | **95–105 ms** | ✅ |

A meta de LCP vale no perfil **desktop** do Lighthouse. No mobile simulado, a home não fica abaixo de 2 s nem com 5 produtos ([por quê](#por-que-o-mobile-não-fica-abaixo-de-2-s)). A meta de p95 é lida no servidor: medido do Brasil, o tempo inclui a ida e volta até a função nos EUA ([detalhes](#api)).

Duas mudanças saíram da medição: os primeiros cards passaram a chegar antes do resto da lista, e a barra de rolagem não desloca mais a página ([O que mudou](#o-que-mudou)).

## Ambiente

- **Dados**: `SEED_DEMO=true SEED_BULK=true npm run db:seed`. São os 5 produtos da demo mais 995 gerados por `prisma/bulkData.ts`: 1.000 produtos (999 na lista principal, 1 em "Em breve"), 52.438 votos e 298 usuários fictícios, sem logos (os cards usam o ícone gerado). A home fica com 5,9 MB de HTML (180 KB com brotli) e 24 mil elementos.
- **Local**: notebook com Intel i5-13420H (12 threads) e 7,5 GB de RAM, Linux. Build de produção (`next build` e `next start`, Node 22.23) e Postgres 18 no Docker, tudo na mesma máquina.
- **Preview**: deploy do PR #25 na Vercel (função em `iad1`, Washington) com o banco `hunt_preview` no Railway (Postgres 18). É o mesmo código e a mesma configuração da produção. Medido do Brasil (borda `gru1` da Vercel, em São Paulo).
- **Ferramentas**: Lighthouse 13.5.0 com o Chromium do Playwright, mediana de 5 execuções por combinação; `npm run perf:api`, com 200 requisições depois de 20 de aquecimento.
- **Visitas**: a 1ª visita parte de um navegador sem cookies. Como o projeto usa a instância de desenvolvimento do Clerk ([README](../README.md#clerk-instância-de-desenvolvimento-em-produção)), ela passa por 3 redirecionamentos (`x-clerk-auth-reason: dev-browser-missing`), em produção também. A visita de volta já tem o cookie do Clerk (`__clerk_db_jwt`), sem os redirecionamentos, mas com o cache vazio.

## Como reproduzir

```bash
npm run db:up
SEED_DEMO=true SEED_BULK=true npm run db:seed   # 1.000 produtos
npm run build && npm run start                  # http://localhost:3000

npm run perf:api                                # p95 de GET /api/v1/products
CONCURRENCY=1 npm run perf:api                  # uma requisição por vez
npm run perf:lcp                                # Lighthouse: desktop e mobile, 1ª visita e volta

npm run db:bulk:remove                          # volta só à demo
```

Os dois scripts aceitam `BASE_URL` para medir outro endereço. Um preview protegido da Vercel precisa de `VERCEL_AUTOMATION_BYPASS_SECRET` (Vercel › Settings › Deployment Protection › Protection Bypass for Automation) no `.env.local`. Com `SESSION_TOKEN` (um token de sessão do Clerk), o `perf:api` mede com login. Para a duração no servidor, use o campo `durationMs` do log JSON de cada requisição; na Vercel, `vercel logs --branch <branch> --json`.

## LCP da home

Lighthouse 13.5.0, mediana de 5. Valores em segundos.

| Perfil e visita | 5 produtos (local) | 1.000 (local) | 1.000 (preview) |
| --- | --- | --- | --- |
| **Desktop, 1ª visita** | 1,02 | **1,35** | **1,28** |
| Desktop, visita de volta | 0,68 | 1,06 | — |
| Mobile, 1ª visita | 4,11 | 5,64 | 5,37 |
| Mobile, visita de volta | 2,95 | 4,97 | — |

- **CLS**: 0,018 na 1ª visita e 0,034 na volta, no desktop; 0 no mobile.
- **Nota de desempenho do Lighthouse** (1.000 produtos): 93 no desktop local e 96 no preview; 50 a 59 no mobile.
- **LCP observado no preview** (o tempo real da rede, sem a simulação do Lighthouse): de 1,8 a 2,6 s no desktop. Inclui os 3 redirecionamentos do Clerk e 1 redirecionamento a mais, o do bypass, que só existe no preview.
- **Visita de volta no preview**: não foi medida. Com a proteção da Vercel ligada, o Lighthouse não consegue manter os dois cookies (o do bypass e o do Clerk): o cookie passado por cabeçalho deixa de valer assim que o site grava os seus, e os arquivos do Next caem no login da Vercel.

## API

`GET /api/v1/products` sem filtro: 999 produtos e 416 KB de JSON.

| Ambiente | Concorrência | p50 | p95 | p99 | p95 no servidor |
| --- | --- | --- | --- | --- | --- |
| Local, sem login | 10 | 177 ms | 225 ms | 251 ms | 179 ms |
| Local, sem login | 1 | 22 ms | 31 ms | 39 ms | 25 ms |
| Local, com login | 10 | 197 ms | 245 ms | 267 ms | 173 ms |
| Local, com login | 1 | 27 ms | 37 ms | 41 ms | 31 ms |
| Preview, sem login | 10 | 484 ms | 630 ms | 788 ms | 95 ms |
| Preview, sem login | 1 | 467 ms | 664 ms | 695 ms | 105 ms |

- **Local com 10 simultâneas**: o tempo sobe porque é um processo Node só, e as requisições esperam a vez. Uma por vez, cada uma leva ~25 ms no servidor.
- **Com login**: `viewerHasVoted` acrescenta uma consulta aos votos do usuário, que custa ~6 ms.
- **Preview no cliente**: dos 630–664 ms medidos do Brasil, só ~100 ms são da função. O resto é a ida e volta até Washington e o download do corpo.

## O que mudou

### Primeiros 10 cards antes do resto

A lista inteira ficava num único trecho do streaming, e o navegador só mostrava os cards quando os 1.000 tinham chegado. Na Vercel, a função demora mais para gerar esse HTML do que o notebook local, e o primeiro card (o LCP) esperava por todos.

Agora a `ProductList` manda os 10 primeiros cards direto e o resto num `<Suspense>` dentro do mesmo `<ol>` (`DeferredProductItems`). Não é paginação: a resposta é uma só, com a lista inteira, sem clique nem rolagem.

| Preview, 1ª visita | Antes | Depois |
| --- | --- | --- |
| LCP desktop (Lighthouse) | 2,94 s (de 1,44 a 3,05 s) | **1,28 s** (de 1,13 a 1,37 s) |
| LCP desktop observado | 3,1 a 4,2 s | 1,8 a 2,6 s |
| LCP mobile (Lighthouse) | 7,00 s | 5,37 s |

No local, o efeito é pequeno (desktop de 1,42 s para 1,35 s), porque o servidor local entrega o HTML inteiro em menos de 1 s.

### Barra de rolagem reservada (`scrollbar-gutter`)

Com 1.000 produtos, a primeira pintura ainda cabia na tela, sem barra de rolagem. Quando a lista chegava, a barra (15 px nos sistemas com barra clássica, como Windows e Linux) aparecia e deslocava a página para o lado: **CLS de 0,318** no desktop, que o Lighthouse classifica como ruim. Com `html { scrollbar-gutter: stable }` em `globals.css`, o espaço da barra fica reservado desde o início e o CLS caiu para **0,034**. A nota do Lighthouse desktop subiu de 78 para 94.

### Testado e descartado: `content-visibility: auto` nos cards

O navegador pula o layout dos cards fora da tela. No local, o LCP mobile melhorou pouco (5,25 s → 4,94 s, visita de volta) e o TBT caiu de 303 para 113 ms; no desktop, nada mudou. Ficou de fora porque a propriedade corta o que passa da borda do card: a sombra do hover e a mensagem "Não foi possível votar", que ficava metade escondida debaixo do card seguinte.

## Por que o mobile não fica abaixo de 2 s

O perfil mobile do Lighthouse simula um 4G lento (1,6 Mbps, 150 ms de ida e volta) e uma CPU 4 vezes mais lenta. A simulação conta o documento inteiro, mesmo com streaming.

- **O piso não depende da lista.** Com só 5 produtos, a home já marca 4,11 s na 1ª visita e 2,95 s na volta. Os responsáveis são os scripts do Clerk (~400 KB) e do Next (~250 KB) e, na 1ª visita, os 3 redirecionamentos do Clerk de desenvolvimento.
- **Os 1.000 cards somam de 1,5 a 2 s.** São 5,9 MB de HTML, e mais da metade é o payload do React (RSC), que repete a marcação.
- **O que mudaria isso fica fora do escopo do MVP:**
  - a instância de produção do Clerk, que exige domínio próprio e tira os redirecionamentos da 1ª visita;
  - carregar o Clerk só quando ele é necessário;
  - paginação, que a regra 1 proíbe.
