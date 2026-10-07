# nova — Design System

Extraído do Figma Make **"Página inicial de plataforma"** (`c31ZDssdB2PzRtHFHBpya4`).
Todos os valores vêm do código-fonte original (`source/src/index.css` e `App.tsx`).

## Conteúdo do pacote

| Pasta / arquivo | O que é |
|---|---|
| `tokens/tokens.css` | 158 tokens como CSS custom properties (fonte da verdade) |
| `tokens/tokens.json` | Os mesmos tokens em JSON, agrupados (Tokens Studio / Style Dictionary) |
| `tokens/tailwind-theme.css` | Bloco `@theme` do Tailwind v4 apontando para os tokens |
| `source/` | Código completo do Make (React 19 + Vite + Tailwind v4), testado com `vite build` |
| `assets/` | Imagens do arquivo Make (2560×2200 e 320×275) |
| `source/src/imports/image.png` | Imagem de referência importada no Make (702×538) |

Para rodar: `cd source && npm install && npm run dev`.

---

## 1. Tipografia

**Família:** Manrope (Google Fonts), pesos 400 · 500 · 600 · 700 · 800.
`font-synthesis: none`.

| Token | Tamanho | Peso | Line-height | Letter-spacing | Uso |
|---|---|---|---|---|---|
| display | clamp(27–36px) | 700 | 1.15 | -1.6px | H1 "O Próximo Grande App" |
| logo | 22px | 800 | — | -0.8px | Wordmark "nova" |
| title | 20px | 700 | 1.25 | -0.7px | H2 da sidebar |
| card-title | 15px | 800 | — | -0.3px | H3 dos cards |
| nav | 14px | 600 | — | — | Links do menu |
| button | 13px | 700 | — | — | Botões |
| body | 12px | 600 / 700 | — | -0.1px | Chips, "Trending topics" |
| small | 11px | 400 / 700 / 800 | — | — | Descrição do card, links, votos |
| caption | 10px | 400 / 800 | 1.6 (parágrafos) | 0.6px (rank) | Rank, rating, textos auxiliares |
| overline | 9px | 800 | — | 1.5px | Eyebrow (CAIXA ALTA), footer |
| caps-heading | 11px | 800 | — | 1.3px | "EM BREVE" (uppercase) |
| tag | 8px | 700 | — | — | Tags dos cards |
| micro | 7px | 800 | — | 1.5px | Eyebrow do card "em breve" |

Padrão: títulos com tracking negativo (mais apertado quanto maior), rótulos em caixa alta com tracking positivo.

## 2. Cores

### Marca (roxo)

| Token | Valor | Uso |
|---|---|---|
| `--color-primary` | `#6258E8` | Botão primário, links, indicador ativo, logo |
| `--color-primary-hover` | `#5249D5` | Hover do botão primário |
| `--color-primary-text-hover` | `#554BD9` | Texto do chip em hover |
| `--color-primary-subtle` | `#F2F0FF` | Fundo do chip em hover |
| `--color-primary-subtle-strong` | `#EFEDFF` | Fundo do badge verificado |
| `--color-primary-border` | `#CCC7FA` | Borda do chip em hover |
| `--color-primary-border-soft` | `#E3E0FB` | Borda do card "em breve" |
| `--color-primary-muted-text` | `#7F79B7` | Eyebrow no card "em breve" |
| `--gradient-primary-soft` | `135deg, #F3F1FF → #FAFAFF` | Fundo do card "em breve" |

### Texto (do mais forte ao mais fraco)

`#17202E` primary · `#18202D` heading · `#1C2330` strong · `#252D3B` emphasis · `#3F4654` secondary · `#4D5461` icon · `#555C6B` chip · `#686E7A` tag · `#777D8B` muted · `#777D8C` muted-alt · `#7E8491` description · `#848995` caps · `#888D98` subtle · `#8A8F9E` overline · `#999DA7` faint · `#A0A4AE` placeholder · `#A3A7B0` footer · `#C2C5CE` rank.

### Superfícies

| Token | Valor |
|---|---|
| `--color-bg-page` | `#F2F4FA` + dois brilhos radiais (roxo 9% no topo-esquerda, verde-água 7% à direita) |
| `--color-bg-shell` | `rgba(255,255,255,.92)` + `backdrop-filter: blur(20px)` |
| `--color-surface` | `#FFFFFF` |
| `--color-surface-subtle` | `#FAFAFD` |
| `--color-surface-hover` | `#F8F8FB` |
| `--color-surface-tag` | `#F4F5F8` |

### Bordas

`rgba(31,42,68,.08)` shell · `#DFE2EA` default · `#C9CCD6` strong (hover) · `#E9EBF2` header · `#E9EAF0` card · `#E5E7EE` panel · `#E3E5EB` chip · `#DFE2E9` upvote · `#E2E4EA` divisor · `#ECECF2` soft · `#ECECF1` hairline · `#ECEEF3` footer.

### Destaques

`#F26B55` live/pulse (anel `rgba(242,107,85,.12)`) · `#F5AD32` estrelas.

### Acentos de produto

| Acento | Ícone/borda (fg) | Fundo externo | Fundo interno | Variações |
|---|---|---|---|---|
| Green | `#188D78` | `#E9FAF5` | `#BDF0DF` | soft `#DFF8EF`, deep `#187F6D`, tint `#C9F1E5` |
| Blue | `#267BC7` | `#EAF5FF` | `#BFE2FF` | soft `#DCEFFF` |
| Yellow | `#C98112` | `#FFF8DF` | `#FFE4A1` | — |
| Purple | `#694FD2` | `#F1EDFF` | `#D8CBFF` | — |

## 3. Espaçamento

Escala usada no layout (px): 2 · 4 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 20 · 22 · 26 · 32 · 34 · 36 · 42 · 46.
Base de 2px, sem grid rígido. Tokens `--space-*` no `tokens.css` (ex.: `--space-4` = 16px).

## 4. Raios

| Token | Valor | Uso |
|---|---|---|
| xs | 6px | Tag |
| indicator | 9px | Barra do nav ativo |
| sm | 11px | Logo mark, logo "em breve" |
| md | 12px | Botões, área interna do ícone |
| upvote | 13px | Botão de voto |
| icon | 15px | Ícone do card revisado |
| lg | 16px | Barra trending, app icon, card revisado |
| xl | 18px | App card, card "em breve" |
| shell | 26px | Container da página (18px no mobile) |
| pill | 99px | Chips |
| full | 50% | Pulse dot, badge |

## 5. Elevação (sombras)

| Token | Valor | Uso |
|---|---|---|
| shell | `0 28px 70px rgba(37,44,74,.09)` | Container principal |
| card-hover | `0 14px 36px rgba(33,41,67,.08)` | App card em hover |
| panel-hover | `0 12px 28px rgba(33,41,67,.07)` | Card revisado em hover |
| primary | `0 8px 20px rgba(98,88,232,.22)` | Botão primário |
| primary-hover | `0 10px 24px rgba(98,88,232,.30)` | Botão primário em hover |
| primary-sm | `0 7px 16px rgba(98,88,232,.22)` | Upvote em hover |
| logo | `0 7px 16px rgba(98,88,232,.25)` | Logo mark |
| live-ring | `0 0 0 5px rgba(242,107,85,.12)` | Pulse dot |

Sombras coloridas com o roxo da marca nos elementos de ação; neutras azuladas nas superfícies.

## 6. Movimento

- Durações: 0.2s (padrão), 0.22s (app card), 0.25s (app icon). Easing `ease`.
- Hover: elevação `translateY(-2px)` (botões, cards, upvote), `-1px` (chips), `translateX(-3px)` (card revisado).
- Rotações de personalidade: logo `-6deg`, app icon `-7deg` (endireita para `0` + `scale(1.03)` no hover do card), ícone revisado `+7deg`.
- Setas (`→`) deslizam 4px no hover dos links.

## 7. Layout e responsivo

- Shell: `min(1360px, 100% - 48px)`, padding `10px 34px 20px`, centralizado.
- Header: 76px, grid `1fr auto 1fr` (logo · nav · ações).
- Conteúdo: grid `1.78fr / minmax(360px, 1fr)`, sidebar com divisor à esquerda.
- **≤ 900px:** nav some, conteúdo vira 1 coluna, sidebar ganha divisor no topo, "Atualizado agora" some.
- **≤ 560px:** botão Login some, trending empilha, rank do card some, card vira `58px / 1fr / 50px`.

## 8. Ícones

5 SVGs próprios, `currentColor`, viewBox 32×32 (seta 20×20):
`SparkIcon` (estrela de 4 pontas, também o logo) · `LayerIcon` (camadas) · `SunIcon` · `OrbitIcon` · `ArrowUpIcon`.
Glifos de texto: `→`, `↓`, `✓`, `★`.

## 9. Componentes

| Componente | Classe | Variantes / estados | Anatomia |
|---|---|---|---|
| Logo | `.logo` | — | Mark 34px roxo rotacionado + wordmark 22/800 |
| NavLink | `nav a` | default, hover, active (barra 22×2 roxa) | 14/600, padding vertical 27px |
| Button | `.button` | `--primary`, `--secondary`; hover (lift) | 42px altura, min 88px, raio 12, 13/700 |
| TrendingBar | `.trending` | — | Pulse dot + título + chips + nota "Atualizado agora" |
| PulseDot | `.pulse-dot` | — | 8px coral com anel de 5px |
| TopicChip | `.topic-chip` | default, hover (roxo claro) | Pill, padding 8×17, 12/600 |
| Eyebrow | `.eyebrow` | default, dentro do card "em breve" (7px, roxo apagado) | 9/800, tracking 1.5px, caixa alta |
| SectionHeading | `.section-heading` | — | Eyebrow + H1 + link "Ver todos →" |
| AppCard | `.app-card` | default (sem fundo), hover (branco, borda, sombra, lift) | Grid: rank 28 · ícone 68 · texto · upvote 58 |
| AppIcon | `.app-icon` | green, blue, yellow, purple | 58px, borda 1px na cor, inner tile raio 12, ícone 27px, rotação -7° |
| Tag | `.tag-row span` | — | 8/700, padding 4×8, raio 6, fundo `#F4F5F8` |
| UpvoteButton | `.upvote` | default, hover (roxo cheio) | 54×62, raio 13, seta 19px + contagem 11/800 |
| ReviewedProduct | `.reviewed-product` | blue, green; hover (desliza à esquerda) | Texto + rating à esquerda, ícone 50px rotacionado +7° |
| Rating | `.rating` | — | ★★★★★ `#F5AD32` + "5.0" + "/ 5" |
| VerifiedBadge | `.verified-badge` | — | Círculo 28px, ✓ roxo |
| DividerHeading | `.coming-heading` | — | Linha · título caixa alta · linha |
| ComingSoonCard | `.coming-item` | — | Gradiente roxo claro, logo 38px, eyebrow, título, texto, link com seta |
| Footer | `footer` | — | 9px, `#A3A7B0`, divisor no topo |

## 10. Pontos de atenção (para refinar o sistema)

- **Tamanhos muito pequenos:** 7, 8 e 9px (tags, eyebrows, footer) ficam abaixo do mínimo de legibilidade recomendado (~11–12px). Vale subir a escala ao formalizar.
- **Contraste:** textos como `#C2C5CE` (rank), `#A3A7B0` (footer) e `#A0A4AE` sobre branco não passam no AA 4.5:1.
- **Cinzas quase duplicados:** há ~18 tons de texto e ~12 de borda, vários a 1–2 pontos de distância (ex.: `#777D8B`/`#777D8C`, `#ECECF1`/`#ECECF2`). Dá para consolidar em ~6 de texto e ~4 de borda.
- **Sem estado de foco:** nenhum `:focus-visible` definido — adicionar anel de foco (sugestão: `0 0 0 3px rgba(98,88,232,.35)`).
- **Sem dark mode:** só existe tema claro.
- O `vite.config.ts` do pacote é uma versão portátil; o original dependia de plugins internos do Figma Make.
