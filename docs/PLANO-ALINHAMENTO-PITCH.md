# Plano de alinhamento site ↔ pitch Hacktown

Aprovado pelo Rodrigo em 2026-09-01. Fonte: [PITCH-HACKTOWN-2026.md](PITCH-HACKTOWN-2026.md).

**Diagnóstico em uma frase:** o site vende um módulo do Nexo; o pitch vende um
orquestrador de nove. Time, prazo e diferenciais são consequência dessa distância.

## As decisões que moldam o plano

| Decisão | Escolha | Consequência |
|---|---|---|
| Nomear concorrentes no quadro de diferenciais | **Não** — comparar com "SaaS de Compras" | Afirmar "ROI não demonstrado" sobre empresa nomeada é propaganda comparativa contestável. A tabela do pitch já usa esse rótulo; só os logos ficam de fora |
| "Agente operando em 90 dias" | **Publicar como está** | Vira a frase-âncora de "Como começamos", que hoje tem quatro passos e nenhum prazo |
| Academy e Cursos no menu | **Manter os dois** | A Fase 4 perde o item de menu; sobra só metadados |
| Ordem | **/nexo → home → time → metadados** | Começa pela maior lacuna; cada fase sobe com testes e deploy próprios |

## Fase 1 · `/nexo` vira o orquestrador — **no ar em 2026-09-04**

Executada em `/preview/nexo`, aprovada e promovida. A capa virou o próprio mapa
do orquestrador (grafo da home com nove nós), a pedido do Rodrigo; a Camada 1
descreve os nove módulos, não os cinco agentes do Compras.

Hoje a página conta o fluxo de Compras (RC → RFP → Contratos → Spend) e para.

- **Mapa dos nove módulos** (slide 5): Nexo no centro, módulos ao redor. É o que
  muda a leitura de "ferramenta de cotação" para "plataforma de gestão de gastos".
- **As três camadas** (slide 6): agentes → orquestração Anthropic → ambiente do
  cliente. O site já cita ISO, Claude e Desk Manager soltos; falta a arquitetura.
- **Quatro seções "na prática"** (slides 8–11), cada uma com três passos, um
  número de prova e uma frase:
  - Spend Logístico — +900 cenários de rota, ocupação e FTL vs. LTL por corte
  - Benchmarking Preços Varejo — 28% de dispersão no mesmo SKU
  - Spend via NF — $216k endereçável em 6 oportunidades de consolidação
  - Orçamento — 100% consolidado sem planilha paralela

**Depende do Rodrigo:** as telas dos módulos em resolução de site. Sem elas, a
seção sai com números e texto; com elas, muito mais forte.

## Fase 2 · Home ganha o problema e a tese — **no ar em 2026-09-04**

Executada em `/preview/home`, aprovada e promovida. O quadro de diferenciais
ficou **só na `/nexo`** (decisão do Rodrigo em 2026-09-04), com o "90 dias" na
linha "Tempo até valor".

- **Seção "O problema"** entre a hero e as soluções (slides 3–4): 57% das horas
  automatizáveis e 70% do custo em fornecedores, com fonte McKinsey visível, e
  as três dores — atendimento, Excel, disparo manual.
- **Quadro de diferenciais** (slide 12) contra "SaaS de Compras": onde ficam os
  dados, custo de entrada, tempo até valor, ROI, ISO 27001. Cinco linhas.
- **"Agente operando em 90 dias"** na seção "Como começamos" da `/nexo`.

## Fase 3 · Quem constrói

Seção com os três sócios — nome, cargo, lastro — na home, antes do contato.
Entra também no JSON-LD da organização como `founder`.

| | Cargo | Lastro |
|---|---|---|
| Rodrigo Costa | Sales VP | 18+ anos em Procurement · ex-Diretor de Compras LATAM Bayer |
| Jesse Guimarães | COO · M.Sc. | Professor de IA na Anhembi Morumbi · 20+ anos em IT · ex-CTO GEP Cost Drivers, SBT e Warner Bros |
| Ronaldo Bueno | CTO | AI Agent Developer e LLM Engineer |

**Depende do Rodrigo:** as três fotos em resolução de site e a confirmação dos
textos de lastro.

## Fase 4 · Metadados

Title e description da home e da `/nexo` refletindo "orquestrador" e "gestão de
gastos". Artigos e sitemap não mudam. Menu não muda (decisão acima).

## Fica de fora, com motivo

- **TAM/SAM/SOM e os 137 mil** — números para investidor. Para o comprador, só
  "93% gerenciam Compras sem plataforma" serve, como *você não está sozinho*.
- **"Única ISO 27001 no mercado de Compras"** — exclusividade pública é difícil
  de sustentar se um concorrente certificar amanhã. No site: "certificada
  ISO/IEC 27001". A exclusividade fica no pitch.
- **Logos dos concorrentes** — pela decisão 1.

## Regras que valem em todas as fases

- Toda copy vai para `lib/content.ts`, verbatim do pitch (ver CLAUDE.md).
- Nada de número sem fonte no texto visível quando o pitch traz a fonte.
- Cada fase: build limpo, `test:unit`, `test:e2e` contra o build novo
  (armadilha 12), screenshot nos dois temas, deploy, verificação por `BUILD_ID`.
