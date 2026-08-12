# Redesign editorial da plataforma (/app) — Design

**Data:** 2026-08-12
**Status:** aprovado em conversa (3 seções + 2 escolhas visuais no companion), aguardando revisão do spec escrito
**Ciclos anteriores:** plataforma (2026-08-11), admin (2026-08-12), Asaas (2026-08-12)

## Objetivo

Transformar a área do aluno de "grade de cards" em **acervo editorial**: painel com hero "continue de onde parou" e trilhos horizontais por estado do aluno, página de curso com hero de largura total, página de aula com índice lateral persistente. Direção escolhida no benchmarking (abordagem A "acervo editorial", variante **B — editorial completo** nos mockups) — estética MasterClass aplicada ao design system existente, sem virar modo teatro.

## Decisões aprovadas

1. **Dois ciclos, redesign primeiro**: certificados (validação + LinkedIn) ficam para o ciclo seguinte; este redesign reserva os pontos de encaixe (selo "Concluída" no trilho, posição do futuro botão "Ver certificado" no hero do curso).
2. **Trilhos por estado do aluno** (zero mudança de banco): Em andamento / Formações / Concluídos / Em gravação. Descartados: trilhos por nível (ralo com 9 cursos) e categoria nova (cresceria o ciclo com migração + admin).
3. **Painel B — editorial completo** (escolha visual): hero com capa + CTA "Continuar aula N", trilhos horizontais com rolagem, faixa esmaecida "Em gravação".
4. **Aula 1 — índice lateral persistente** (escolha visual): duas colunas no desktop, player à esquerda, lista de aulas sempre visível à direita; padrão Udemy/Alura. Descartado o player em largura total com índice recolhível.
5. **Sem modo teatro**: a plataforma continua respeitando os temas claro/escuro do produto; o clima editorial vem de gradiente violeta sutil sobre tokens, não de fundo preto fixo.

## Escopo

Páginas tocadas: `/app` (painel), `/app/curso/[slug]`, `/app/curso/[slug]/[aula]`. Shell/header, conta, entrar/criar-conta, `/planos` e admin **não mudam**.

Fora de escopo (deste ciclo): certificados; setas de navegação nos trilhos; busca; notas por aula; autoplay; categorias.

## Painel (`/app`)

**Hero "Continue de onde parou"**: faixa larga no topo — capa do curso da última atividade (query nova `buscarUltimaAula`), fundo com gradiente sutil de violeta sobre a superfície do tema, título grande, "X de Y aulas concluídas", CTA pill `Continuar: {título da aula}` com deep link para a aula. **Fallback aluno novo** (nenhum progresso): hero de boas-vindas com a capa da primeira formação do catálogo (menor `ordem`) e CTA "Começar o curso".

**Trilhos horizontais** (nesta ordem; um trilho só aparece se tiver conteúdo):
1. **Em andamento** — cursos com 0% < progresso < 100%
2. **Formações** — o catálogo completo publicado com aulas, **incluindo** os que também aparecem em "Em andamento"/"Concluídos" (repetição intencional, padrão Netflix — o trilho é o catálogo inteiro, os outros são recortes)
3. **Concluídos** — progresso 100%, capa com selo "Concluída" (ponto de encaixe do certificado no ciclo 2)
4. **Em gravação** — publicados sem aulas, capas esmaecidas com o selo atual

Rolagem nativa `overflow-x: auto` + `scroll-snap`, sem setas no v1 (trackpad/touch/swipe); esmaecimento na borda direita indica continuação. `CardCurso` reaproveitado com largura fixa no trilho (capa 3:4, anel de progresso, selo de assinatura, `data-testid="card-curso"` mantido).

## Página de curso (`/app/curso/[slug]`)

Cabeçalho vira **hero horizontal de largura total**: capa maior à esquerda, gradiente violeta sutil, breadcrumb "Meus cursos → {formação}", linha mono uppercase (nível · carga · nº de aulas), título grande, descrição, **barra de progresso fina** (novo — hoje é só texto) e CTA Continuar/Começar. Progresso 100% → selo "Curso concluído" em posição fixa no hero (futuro botão "Ver certificado").

Abaixo, o `IndiceCurso` re-estilizado: módulos como seções com régua, checks violeta nas aulas concluídas. Trava de assinatura (banner com CTA via `cta_destino`) e estado "em produção" permanecem, só re-vestidos.

## Página de aula (`/app/curso/[slug]/[aula]`)

Desktop, duas colunas:
- **Principal**: breadcrumb curto "{formação} · Módulo N · Aula X de Y", player 16:9, título, descrição, linha de ações (Marcar como concluída + Próxima aula, pills).
- **Lateral direita**: índice do curso persistente, `position: sticky`, scroll próprio; aula atual com marcador violeta na borda esquerda, concluídas com check, travadas com o cadeado atual.

Mobile empilha: player → ações → índice. Estados existentes intactos na coluna principal: trava de assinatura, "vídeo em produção", erro de player com Recarregar.

**Componente**: o índice lateral é variante do `IndiceCurso` (prop de modo `lateral`) — mesma fonte de dados e lógica de checks, sem duplicação.

## Técnica

- **Zero dependência nova, zero migração.** Server Components + CSS do design system: violeta `#7607E8` só preenchimento, superfícies radius 0, controles pill, tokens (`bg-bg`, `bg-surface`, `border-line`, `text-fg*`, `text-accent-text`, `bg-accent`). Transições só `hover`/`focus`, respeitando `prefers-reduced-motion`. Funciona nos dois temas.
- **Camada de dados**: única adição é `buscarUltimaAula(userId)` em `lib/plataforma/dados.ts` — join `lesson_progress → lessons → modules → courses`, `order by lesson_progress.updated_at desc limit 1`, filtrando `courses.publicado = true`; recebe `userId` explícito (padrão de segurança das irmãs). Devolve `{ cursoSlug, aulaSlug, aulaTitulo, cursoId } | null`. `temAcesso`, travas, actions e anel de progresso não mudam.
- As rotas já são dinâmicas (layout de `/app` é `force-dynamic`) — sem risco novo de prerender no build do Railway.

## Conteúdo (`lib/content-plataforma.ts`)

- Bloco `painel` cresce: `emAndamento`, `formacoes`, `concluidos`, `emGravacao`, `continuarAula(titulo)`, `boasVindas`, `comecarCurso`, `cursoConcluido`.
- Bloco `curso`: breadcrumb ("Meus cursos").
- Bloco `aula`: `aulaDe(x, y)` ("Aula X de Y").
- Nenhuma string visível em componente; pt-BR; nunca "PMEs". Strings exatas definidas no plano de implementação.

## Testes

- **Integração** (`autorizacao.test.ts`): `buscarUltimaAula` — sem progresso → null; progresso em 2 cursos → devolve o mais recente por `updated_at`; aula de curso oculto nunca aparece.
- **e2e**: `painel.spec` evolui — 9 capas continuam contadas via `data-testid`, hero de boas-vindas para aluno novo, hero "Continuar" após concluir uma aula; `aula.spec` — índice lateral visível no desktop, aula atual destacada, check na concluída; `curso.spec` — ajustes de seletor (barra de progresso, breadcrumb).
- `npm run build` ao final de cada task de página.

## Entrega

Branch própria → SDD (subagentes) → review final → merge → `scripts/deploy-railway.sh`. Sem migração e sem variável nova: deploy simples. Validação em produção: browser real no painel/curso/aula com a conta admin existente.
