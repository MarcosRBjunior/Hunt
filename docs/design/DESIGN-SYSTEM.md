# nova — Design System

Extraído do Figma Make **"Página inicial de plataforma"** (`c31ZDssdB2PzRtHFHBpya4`) e ajustado na v1.0.0 do projeto (veja [Ajustes aplicados](#10-ajustes-aplicados-v100)).

**Fonte de verdade no código:** o bloco `@theme` de [`src/app/globals.css`](../../src/app/globals.css). Os arquivos de `tokens/` são um espelho dele; se mudar um, mude o outro.

## Conteúdo do pacote

| Pasta / arquivo             | O que é                                                                                             |
| --------------------------- | --------------------------------------------------------------------------------------------------- |
| `tokens/tokens.css`         | Todos os tokens como CSS custom properties, já com os ajustes da v1.0.0                             |
| `tokens/tokens.json`        | Os mesmos tokens em JSON, agrupados (Tokens Studio / Style Dictionary)                              |
| `tokens/tailwind-theme.css` | O bloco `@theme` do Tailwind v4 usado pelo projeto                                                  |
| `source/`                   | Código original do Make (React 19 + Vite + Tailwind v4), **sem os ajustes**, guardado como referência |
| `assets/`                   | Imagens do arquivo Make (2560×2200 e 320×275)                                                       |
| `source/src/imports/image.png` | Wireframe importado no Make (702×538)                                                            |

Para rodar o Make original: `cd source && npm install && npm run dev`.

---

## 1. Tipografia

**Família:** Manrope (Google Fonts, carregada com `next/font`), pesos 400 · 500 · 600 · 700 · 800. `font-synthesis: none`.

| Token (Tailwind)    | Tamanho          | Peso      | Line-height | Letter-spacing | Uso                                       |
| ------------------- | ---------------- | --------- | ----------- | -------------- | ----------------------------------------- |
| `text-display`      | clamp(27–36px)   | 400       | 1.15        | -1.6px         | H1 ("O Próximo Grande App", páginas)      |
| `text-logo`         | 22px             | 800       | —           | -0.8px         | Wordmark "nova"                           |
| `text-title`        | 20px             | 400       | 1.25        | -0.7px         | H2 da lateral                             |
| `text-card-title`   | 15px             | 800       | —           | -0.3px         | H3 dos cards                              |
| `text-nav`          | 14px             | 600       | —           | —              | Links do menu, parágrafos de página       |
| `text-button`       | 13px             | 700       | —           | —              | Botões                                    |
| `text-body`         | 12px             | 600 / 700 | —           | -0.1px         | Chips, "Trending topics", estados         |
| `text-caption`      | 11px             | 400–800   | 1.6 (parágrafos) | 0.6–1.5px (caixa alta) | Descrições, tags, rank, eyebrows, rating, footer |

Padrão: títulos com tracking negativo (mais apertado quanto maior), rótulos em caixa alta com tracking positivo. Os títulos `h1`/`h2` usam peso 400, como o Make renderiza de fato (o preflight do Tailwind zera o peso dos headings).

## 2. Cores

### Marca (roxo)

| Token                          | Valor                    | Uso                                              |
| ------------------------------ | ------------------------ | ------------------------------------------------ |
| `primary`                      | `#6258E8`                | Botão primário, links, indicador ativo, logo     |
| `primary-hover`                | `#5249D5`                | Hover do botão primário, eyebrow do "em breve"   |
| `primary-subtle`               | `#F2F0FF`                | Fundo suave                                      |
| `primary-subtle-strong`        | `#EFEDFF`                | Fundo do badge verificado                        |
| `primary-border`               | `#CCC7FA`                | Borda roxa clara                                 |
| `primary-border-soft`          | `#E3E0FB`                | Borda do card "em breve"                         |
| `primary-wash` → `primary-wash-end` | `#F3F1FF` → `#FAFAFF` | Gradiente (135°) do card "em breve"         |

### Texto (4 níveis, todos AA)

| Token         | Valor     | Contraste no branco | Uso                                                |
| ------------- | --------- | ------------------- | -------------------------------------------------- |
| `ink`         | `#17202E` | 16.4:1              | Títulos e texto forte                              |
| `ink-soft`    | `#3F4654` | 9.5:1               | Botão secundário, nota do rating                   |
| `ink-muted`   | `#555C6B` | 6.7:1               | Chips, tags, ícones, upvote                        |
| `ink-subtle`  | `#646A78` | 5.4:1               | Descrições, nav, eyebrows, rank, footer, legendas  |

Todos passam de 4.5:1 também sobre `surface-subtle`, `page`, `surface-tag` e o gradiente do "em breve".

### Superfícies

| Token             | Valor                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------- |
| `page`            | `#F2F4FA` + dois brilhos radiais (roxo 9% no topo-esquerda, verde-água 7% à direita)    |
| `shell`           | `rgb(255 255 255 / .92)` + `backdrop-filter: blur(20px)`                                |
| `surface`         | `#FFFFFF`                                                                               |
| `surface-subtle`  | `#FAFAFD`                                                                               |
| `surface-hover`   | `#F8F8FB`                                                                               |
| `surface-tag`     | `#F4F5F8`                                                                               |

### Bordas (4)

`line-shell` `rgb(31 42 68 / .08)` (container) · `line-soft` `#ECEDF2` (divisores, cards da lateral, footer) · `line` `#E3E5EB` (padrão: header, chips, botões, upvote, painéis) · `line-strong` `#C9CCD6` (hover).

### Destaques

`live` `#F26B55` (pulse, anel `rgb(242 107 85 / .12)`) · `star` `#F5AD32` (estrelas).

### Acentos de produto

| Acento | `accent-*` (ícone/borda) | `-bg` (externo) | `-inner` (interno) | `-soft` (lateral / em breve) |
| ------ | ------------------------ | --------------- | ------------------ | ---------------------------- |
| green  | `#188D78`                | `#E9FAF5`       | `#BDF0DF`          | `#DFF8EF`                    |
| blue   | `#267BC7`                | `#EAF5FF`       | `#BFE2FF`          | `#DCEFFF`                    |
| yellow | `#C98112`                | `#FFF8DF`       | `#FFE4A1`          | `#FFF0C4`                    |
| purple | `#694FD2`                | `#F1EDFF`       | `#D8CBFF`          | `#E8E1FF`                    |

## 3. Espaçamento

Escala usada no layout (px): 2 · 4 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 20 · 22 · 26 · 32 · 34 · 36 · 42 · 46.
Base de 2px, sem grid rígido. Tokens `--space-*` no `tokens.css` (ex.: `--space-4` = 16px); no código, as classes do Tailwind.

## 4. Raios

| Token       | Valor | Uso                                   |
| ----------- | ----- | ------------------------------------- |
| `xs`        | 6px   | Tag                                   |
| `indicator` | 9px   | Barra do nav ativo                    |
| `sm`        | 11px  | Logo mark, logo "em breve"            |
| `md`        | 12px  | Botões, área interna do ícone         |
| `upvote`    | 13px  | Botão de voto                         |
| `icon`      | 15px  | Ícone do card revisado                |
| `lg`        | 16px  | Barra trending, app icon, card revisado, estados |
| `xl`        | 18px  | App card, card "em breve", shell no mobile |
| `shell`     | 26px  | Container da página                   |
| `pill`      | 99px  | Chips                                 |

## 5. Elevação (sombras)

| Token           | Valor                              | Uso                     |
| --------------- | ---------------------------------- | ----------------------- |
| `shell`         | `0 28px 70px rgb(37 44 74 / .09)`  | Container principal     |
| `card-hover`    | `0 14px 36px rgb(33 41 67 / .08)`  | App card em hover       |
| `panel-hover`   | `0 12px 28px rgb(33 41 67 / .07)`  | Card revisado em hover  |
| `primary`       | `0 8px 20px rgb(98 88 232 / .22)`  | Botão primário          |
| `primary-hover` | `0 10px 24px rgb(98 88 232 / .30)` | Botão primário em hover |
| `primary-sm`    | `0 7px 16px rgb(98 88 232 / .22)`  | Upvote em hover (Fase 8) |
| `logo`          | `0 7px 16px rgb(98 88 232 / .25)`  | Logo mark               |
| `live-ring`     | `0 0 0 5px rgb(242 107 85 / .12)`  | Pulse dot               |

Sombras coloridas com o roxo da marca nos elementos de ação; neutras azuladas nas superfícies.

## 6. Movimento

- Durações: 0.2s (padrão), 0.22s (app card), 0.25s (app icon). Easing `ease`.
- Hover: elevação `translateY(-2px)` (botões, cards), `translateX(-3px)` (card revisado).
- Rotações de personalidade: logo `-6deg`, app icon `-7deg` (endireita para `0` + `scale(1.03)` no hover do card), ícone revisado `+7deg`.
- A seta do "Ver todos" desliza 4px no hover.
- `prefers-reduced-motion: reduce` desliga transições e animações.

## 7. Layout e responsivo

- Shell: `min(1360px, 100% - 48px)` (24px no mobile), padding `10px 34px 20px`, centralizado.
- Header: 76px, grid `1fr auto 1fr` (logo · nav · ações).
- Conteúdo: grid `2fr / 1fr` (2/3 + 1/3), lateral com divisor à esquerda.
- **< 1024px (`lg`):** a nav desce para uma linha abaixo do logo, o conteúdo vira 1 coluna, a lateral ganha divisor no topo e "Atualizado agora" some.
- **< 640px (`sm`):** o botão Login some, o rank do card some e o card vira `58px / 1fr / 48px`. Os chips de topics quebram linha.

## 8. Ícones e arte de produto

5 SVGs próprios (`src/components/ui/icons.tsx`), `currentColor`, viewBox 32×32 (seta 20×20): `SparkIcon` (estrela de 4 pontas, também o logo) · `LayerIcon` · `SunIcon` · `OrbitIcon` · `ArrowUpIcon`.
Glifos de texto: `→`, `↓`, `✓`, `★`. O favicon (`src/app/icon.svg`) é a estrela branca sobre o roxo.

**Arte de produto:** quando o produto não tem `logoUrl`, o logo é um dos 4 ícones com um dos 4 acentos, escolhidos pelo `id` (hash FNV-1a em `src/lib/productArt.ts`). O mesmo produto tem sempre a mesma arte, na lista e na lateral.

## 9. Componentes

| Componente (código)                   | Variantes / estados                                   | Anatomia                                                     |
| ------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------ |
| `layout/Logo`                         | —                                                     | Mark 34px roxo rotacionado + wordmark 22/800                 |
| `layout/SiteHeader`                   | link ativo (`aria-current`, barra 22×2 roxa), hover   | Logo · nav 14/600 · Login (secundário) e Registro (primário) |
| `layout/SiteFooter`                   | —                                                     | Crédito do Projeto 06 · GitHub · LinkedIn                    |
| `layout/PageShell`                    | —                                                     | Shell + "Pular para o conteúdo" + header + main + footer     |
| `ui/Button`, `ui/ButtonLink`          | `primary`, `secondary`; hover (lift)                  | 42px altura, min 88px, raio 12, 13/700                       |
| `ui/Eyebrow`                          | default, "em breve" (`primary-hover`)                 | 11/800, tracking 1.5px, caixa alta                           |
| `ui/SectionHeading`                   | `h1` (display) ou `h2` (title)                        | Eyebrow + título + ação opcional ("Ver todos →")             |
| `ui/EmptyState`, `ui/ErrorState`      | erro com "Tentar novamente"                           | Painel tracejado (vazio) ou sólido com `role="alert"` (erro) |
| `ui/Skeleton`                         | —                                                     | Bloco `surface-tag` com `animate-pulse`                      |
| `ui/SectionErrorBoundary`             | —                                                     | `catchError` do Next: isola o erro de uma seção              |
| `topics/TrendingTopicsBar`            | só visual no nível 1                                  | Pulse dot + título + chips (pill 12/600) + "Atualizado agora" |
| `products/ProductCard`                | default, hover (branco, borda, sombra, lift)          | Grid: rank 28 · ícone 68 · texto · upvote 58                 |
| `products/ProductLogo`                | `card`, `review`, `coming`; logo ou arte por `id`     | 58px com área interna (card), 50px (+7°), 38px               |
| `products/UpvoteButton`               | só exibe no nível 1                                   | 54×62, raio 13, seta 19px + contagem 11/800                  |
| `products/ProductList`                | lista ou estado vazio                                 | `ol` de cards, gap 10                                        |
| `sidebar/ReviewedProductCard`         | hover (desliza à esquerda)                            | Título, resumo, rating à esquerda; ícone à direita           |
| `sidebar/Rating`                      | 1 a 5                                                 | ★ `star` + vazias em `line` + "5.0" + "/ 5"                  |
| `sidebar/ComingSoonCard`              | —                                                     | Gradiente roxo claro, logo 38px, eyebrow, título, descrição  |
| `sidebar/Sidebar`                     | —                                                     | Revisados (badge ✓) + divisor "EM BREVE" + em breve          |

## 10. Ajustes aplicados (v1.0.0)

O Make original tinha alguns problemas que o próprio levantamento apontou. Estes foram os ajustes feitos no projeto (o código original continua em `source/`):

| Antes (Make)                                                          | Depois                                                                      | Por quê                                                  |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------- |
| Textos de 7, 8, 9 e 10px (tags, eyebrows, footer, rank)               | Mínimo de 11px (`text-caption`)                                             | Legibilidade                                             |
| ~18 cinzas de texto; `#C2C5CE`, `#A3A7B0`, `#A0A4AE` etc. abaixo de AA | 4 níveis (`ink`, `ink-soft`, `ink-muted`, `ink-subtle`), todos ≥ 4.5:1      | Contraste WCAG AA                                        |
| ~12 tons de borda a 1–2 pontos de distância                           | 4 (`line-shell`, `line-soft`, `line`, `line-strong`)                        | Consolidação; `#ECECF1`/`#ECECF2`/`#ECEEF3` viraram `#ECEDF2` |
| Eyebrow do "em breve" em `#7F79B7` (3.5:1)                            | `primary-hover` `#5249D5`                                                   | Contraste AA                                             |
| Sem estado de foco                                                    | Anel `3px rgb(98 88 232 / .45)`, offset 2px, em `:focus-visible`            | Navegação por teclado                                    |
| Nav some abaixo de 900px                                              | Nav numa linha abaixo do logo abaixo de 1024px                              | Categorias e Sobre ficavam inacessíveis no celular       |
| Grid `1.78fr / minmax(360px, 1fr)`, quebra em 900px                   | Grid `2fr / 1fr`, quebra em 1024px                                          | Regra do CLAUDE.md (2/3 + 1/3 a partir de 1024px)        |
| Descrição do card em 1 linha                                          | 2 linhas (`line-clamp-2`)                                                   | Regra do CLAUDE.md                                       |
| Ícones e cores fixos por produto                                      | Arte escolhida pelo `id` quando não há `logoUrl`                            | Produtos reais vêm do banco                              |
| Fundo "soft" só para verde e azul                                     | Também amarelo (`#FFF0C4`) e roxo (`#E8E1FF`)                               | Qualquer produto pode receber qualquer acento            |
| Link "Quero ser avisado →" no card "em breve"                         | Removido                                                                    | Notificação está fora do escopo                          |
| Footer "Descubra algo extraordinário. · © 2025 nova"                  | Crédito do Projeto 06 + GitHub + LinkedIn                                   | Regra do CLAUDE.md                                       |
| Chips e upvote com hover de ação                                      | Sem hover no nível 1 (filtro na Fase 10, voto na Fase 8)                    | Não sugerir uma ação que ainda não existe                |
| Sem `prefers-reduced-motion`                                          | Transições e animações desligadas quando o usuário pede                     | Acessibilidade                                           |

**Ainda em aberto:** não há dark mode; o tema é só claro.
