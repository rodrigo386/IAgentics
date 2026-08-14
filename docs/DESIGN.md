# IAgentics — Design & Brand

Fonte de verdade visual do site. Os tokens vivem em [`app/globals.css`](../app/globals.css); este documento explica **o que é lei** e por quê. Cores oficiais vêm de `Cores_IAgentics.pdf` (cópia em [`public/brand-colors-reference.pdf`](../public/brand-colors-reference.pdf)).

## 1. Paleta oficial (8 valores, verbatim)

| Token | Hex | Nome |
|---|---|---|
| `--brand-violet` | `#7607E8` | Violeta — **o** acento da marca |
| `--brand-violet-light` | `#8426EA` | Violeta claro (hover no dark) |
| `--brand-indigo` | `#6020EE` | Índigo (hover no light) |
| `--brand-periwinkle` | `#6C66F3` | Periwinkle |
| `--brand-blue` | `#6693F8` | Azul — vira `--accent-text` no dark |
| `--brand-sky` | `#55AFED` | Céu |
| `--brand-ink` | `#131723` | Tinta — fundo do dark, texto do light |
| `--brand-paper` | `#F8F8F8` | Papel — fundo do light, texto do dark |

Nenhum valor fora da rampa entra como cor de marca. Cinzas semânticos (`--fg-muted`, `--fg-subtle`, `--line`) derivam de ink/paper com alpha ou vizinhança e têm contraste medido no globals.css.

### Trava de cor (COLOR CONSISTENCY LOCK)

Um acento só para a página inteira: o violeta `#7607E8`.

- **Usos sancionados**: FILL (botões, barras, véus) e, desde 2026-08-12 (decisão do Rodrigo), **BORDER como indicador de estado** (ex.: marcador da aula atual).
- **Nunca como texto direto.** `#7607E8` sobre ink dá 2.54:1 (reprova). Texto acentuado passa por `--accent-text`, que resolve por tema: light `#7607E8` sobre paper (6.73:1 AA), dark `#6693F8` sobre ink (6.09:1 AA). Ambos são valores oficiais — a identidade se mantém com contraste legal.
- Fill violeta + texto paper = 6.73:1 (AA).

## 2. Trava de forma (SHAPE CONSISTENCY LOCK)

Regra de dois níveis, aplicada em tudo:

- **Superfícies / painéis / imagens / inputs** → raio **0** (`--radius-surface`).
- **Controles interativos (botões, pills)** → raio **total** (`--radius-control: 9999px`). O pill ecoa os círculos perfeitos do símbolo IAgentics.

Card com canto arredondado ou botão quadrado = quebra de sistema.

## 3. Tipografia

- **Sans**: **Space Grotesk** (`--font-sans`, via `next/font`) — geométrica, fala a mesma língua do logo. Display: `tracking-[-0.03em]`, títulos `text-4xl → lg:text-6xl`.
- **Mono**: **JetBrains Mono** (`--font-mono`) — códigos de agente, rótulos e eyebrows. Padrão de rótulo: `font-mono text-[11px] uppercase tracking-[0.16em]`.
- Números tabulares onde algarismos se alinham: classe `.tnum`.
- Sem serifa no projeto. Ênfase dentro de título = itálico/negrito da mesma família.

## 4. Logos e ativos de marca

- **Lockup IAgentics**: `public/iagentics-lockup.png` (branco sobre transparência). Renderiza via **CSS mask** (`.brand-lockup`) pintado com `currentColor` — tematiza sem redesenhar. **Nunca traçar/recriar o logo.**
- **Nexo**: ícone do app em `public/nexo-app-icon.svg` (variantes `nexo-icone.svg` / `nexo-icone-branco.svg`). Gradiente do kit: `#7B5EED → #397CEF`. Nas strings, **"Nexo" em caixa mista** — caps faz leitor de tela soletrar N-E-X-O; o peso visual vem da tipografia.
- **Placas de parceiros e selos** (Desk Manager, Microsoft, Oracle, SAP, ISO 27001, ITIL): sempre sobre placa clara `bg-brand-paper`, **nunca invertidos nem recoloridos** — são arte registrada de terceiros. `--color-brand-paper`/`--color-brand-ink` existem como constantes fixas exatamente para isso (não flipam com o tema).
- Ativos originais fora do repo, em `~/Documents/IAgentics/` (Logos/, PPTS/, kit do Nexo).

## 5. Tema claro/escuro

- Variante por classe: `@custom-variant dark (&:where(.dark, .dark *))`; a classe em `<html>` é setada por script inline no `layout.tsx` antes do paint (preferência do sistema + toggle manual).
- Tudo passa por token semântico (`bg`, `surface`, `fg`, `fg-muted`, `fg-subtle`, `line`, `accent*`). Componente nunca usa hex direto — exceto as constantes de placa (item 4).
- Sombras tintadas: `--shadow-tint` (ink no light, preto no dark). Nada de sombra preta pura sobre fundo claro.

## 6. Movimento

- **Toda animação de entrada é CSS puro** com fill `backwards`/`both`: o estado de repouso é o visível e o escondido só existe durante a animação. Sem JS a página renderiza completa. `initial={{opacity:0}}` do Motion já causou SSR de página em branco aqui — proibido.
- Revelação por scroll: componente `Reveal` (IntersectionObserver adicionando classe). Scrollytelling (ex.: fluxo do Nexo): observer com `rootMargin "-45% 0px -45% 0px"` + crossfade de opacidade, palco `sticky`.
- **`motion-reduce` sempre respeitado** (`motion-reduce:transition-none` / media query nos keyframes).
- Transições de estado: `duration-300`–`500`. Movimento carrega significado (sequência, estado ativo), não decoração.

## 7. Layout

- Contêiner: `max-w-[1400px] mx-auto px-5 sm:px-8`. Grid de 12 colunas no `lg`.
- Hero nunca com `h-screen` — usar `min-h-[100dvh]`.
- Separação por **hairlines** (`border-line`, `border-line-strong`, `divide-y`) e espaço negativo; card só quando elevação comunica hierarquia real.
- Linguagem editorial: eyebrow mono em caps, título com tracking negativo, lead `text-lg text-fg-muted max-w-[46ch]`, colunas assimétricas (5/7, 6/6).
- Z-index só na escala documentada: `--z-grain: 60`, `--z-nav: 50`, `--z-overlay: 40`.

## 8. Copy

- Toda string visível em `lib/content.ts` (+ `content-plataforma.ts`, `content-admin.ts`), verbatim do deck `IAgentics_Clientes_V2.pptx`. pt-BR.
- Ícones: **@phosphor-icons/react**, uma família só, `weight` consistente por contexto.
- Sem emoji na interface.

## 9. Checklist antes de shippar uma seção

1. Acento só violeta, e só como fill/borda de estado? Texto acentuado via `text-accent-text`?
2. Superfícies com raio 0, controles em pill?
3. Strings em `lib/content.ts`?
4. Entrada em CSS com `backwards`/`both`? `motion-reduce` coberto?
5. Placas de terceiros sobre `bg-brand-paper`, sem recolorir?
6. Funciona nos dois temas (rodar com `.dark` no html)?
7. Mobile: sem overflow horizontal, `min-h-[100dvh]` no hero, imagens `max-w-full`?
