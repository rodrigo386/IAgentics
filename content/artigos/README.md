# Artigos — estado atual

Escritos a partir da pauta em [docs/PLANO-CONTEUDO.md](../../docs/PLANO-CONTEUDO.md).

**Formato:** Markdown com frontmatter. Decisão do Rodrigo em 2026-08-20: sem
editor no `/admin`, ele escreve pelo repositório.

**Os cinco foram publicados em 2026-08-20**, por decisão do Rodrigo, junto com
a estreia da rota `/artigos` e a entrada "Artigos" no menu.

Duas ressalvas ficaram registradas e foram publicadas assim mesmo, por chamada
dele — estão aqui para quem revisar depois saber que não passaram despercebidas:

- A seção **"Como medir capacidade liberada"** do artigo do ROI foi escrita por
  mim, não por ele. É defensável e fecha o arco das citações que ele já tinha,
  mas descreve um método que ele não confirmou ser o da IAgentics.
- Os **prompts** do artigo de prompts não foram rodados um a um antes de ir ao
  ar.

Reverter qualquer um é trocar `publicado` por `rascunho`: sai da listagem, sai
do sitemap e passa a responder 404.

### `como-comecar-com-ia-em-compras` (publicado depois, mesmo dia)

Segundo texto do Rodrigo vindo do LinkedIn ("8 horas viram 22 minutos", de
29/05/2026). As três decisões que estavam pendentes foram resolvidas por ele:

1. **ProAICircle saiu.** No LinkedIn a comunidade externa faz sentido; no site
   mandava tráfego para fora do domínio e concorria com o artigo de prompts que
   acabáramos de publicar. O link agora aponta para o artigo próprio.
2. **Data mantida em 29/05/2026**, a original — mais coerente com a
   reivindicação de que o site é a casa do texto, e dá profundidade cronológica
   à listagem em vez de seis artigos nascidos no mesmo dia. Aparece por último,
   que é o correto.
3. **O caso do cliente ficou verbatim**, por decisão dele — inclusive
   "embalagem flexível", que estreita bastante quem pode ser.

O que a adaptação acrescentou ao original: a **conta de payback** (setup de
8-16h contra ~7,5h/semana economizadas ⇒ 1 a 3 semanas), que sai dos números
que ele já tinha e não estava no texto; e **quatro links internos** para os
outros artigos — é este texto que amarra a coleção, porque a tese dele
(conciliação versus decisão) é a que explica os demais.

## Como publicar (ou despublicar)

1. Troque o `status` no frontmatter (`publicado` ↔ `rascunho`).
2. Se houver mais de um artigo com a **mesma data**, dê `ordem` a cada um —
   menor primeiro. Sem isso a sequência da listagem viria do sistema de
   arquivos, que não tem opinião editorial.
3. Rode `npm run test:unit` — a validação de frontmatter roda para todos os
   arquivos, inclusive rascunhos, e avisa antes do build.
4. Build e deploy normais.

O que acontece sozinho ao publicar: o artigo aparece na listagem, entra no
sitemap (junto com `/artigos`, que só entra quando há pelo menos um publicado),
ganha canonical próprio, `og:type=article` com data e JSON-LD de `Article` com
`mainEntityOfPage` — o campo que declara ao Google que a casa do texto é o nosso
domínio, e não a republicação adaptada no LinkedIn.

Enquanto está `rascunho`: fora da listagem, fora do sitemap, e **404** por URL
direta (`dynamicParams = false`) — rascunho não vaza por endereço adivinhado.

## Prontos para revisão

| Ordem | Arquivo | Liga em |
|---|---|---|
| **1º** | `roi-de-ia-em-compras-o-que-responder-ao-cfo.md` | /spend-lab + ebook |
| 2º | `processo-de-compras-sete-passos-ia.md` | /nexo |
| 3º | `agente-de-ia-em-compras-nao-e-agentic-commerce.md` | /nexo |
| 4º | `tail-spend-guia-em-portugues.md` | /spend-lab |
| 5º | `prompts-para-compras.md` | /cursos |

O de prompts tem `status: rascunho — prompts a validar`. Os prompts são bem
construídos, mas quem afirma "é o que usamos" é a IAgentics, não eu. Rodar cada
um uma vez antes de publicar resolve.

### Sobre o artigo do ROI — o primeiro da fila

Adaptação do texto que o Rodrigo publicou no LinkedIn ("O CFO pergunta o ROI da
IA. E agora?"). **É o mais forte da leva**, porque é o único com conversa real —
data, prazo, fala de Diretor, de CFO e de Líder de Compras. Vai primeiro por
isso.

O que mudou na adaptação:

- **Título.** O original é excelente headline de LinkedIn e ruim de busca. O do
  site carrega o termo que alguém procura ("ROI de IA em Compras"). O headline
  original está preservado no frontmatter, em `titulo_linkedin`, para a versão
  da newsletter.
- **A seção "Como medir capacidade liberada" é nova** — quatro cortes sobre as
  horas economizadas, mais um exemplo com números redondos e o teste de "quem,
  com nome, faz o quê, até quando". O original anunciava o framework e entregava
  três títulos de slide; o slide 2 era a tese inteira e não tinha método. Era o
  buraco que fazia o leitor concordar e não fazer nada.
- **CTA reposicionado.** O ebook agora é oferecido no ponto exato da falta —
  logo depois do método, quando o leitor quer profundidade —, não no rodapé
  junto com "chame inbox".
- Correções de digitação do original (o "Se" ausente, colchete solto, "com" em
  duplicidade, "tava" → "estava").

**Aguarda validação do Rodrigo em dois pontos:**

1. **A seção "Como medir" é minha, não dele.** O método é defensável e coerente
   com as citações que ele já tinha — em especial o "faz o mesmo trabalho com
   menos gente", que o teste final endereça direto. Mas ele precisa confirmar
   que descreve o que a IAgentics faz de fato. Se o método real for outro, o
   texto é dele, não meu.
2. **A retenção era deliberada?** Se o método é o produto do ebook, entregá-lo
   no artigo canibaliza a conversão. Nesse caso o corte certo é manter os
   quatro cortes e tirar o exemplo numérico. Chamada comercial, dele.

**Cuidado sinalizado:** "multinacional industrial" + "Diretor de Compras" +
"início de maio" + "piloto de RFP" + fala atribuída ao CFO é um conjunto
identificável para quem está dentro da empresa. A especificidade é justamente o
que dá força ao texto — mas se o cliente não autorizou, vale conversar antes de
o site amplificar.

## Bloqueados — e o que falta

### 4. O que dá errado numa implantação de IA em Compras

**Falta: um caso real com número.** O artigo depende de coisa concreta — uma
implantação que travou, por que travou, o que foi feito e o resultado. Sem isso
vira texto de opinião, que é exatamente o que a pauta diz para evitar, e o
diferencial dele era ser o único que só um praticante consegue escrever.

Não escrevi porque inventar caso de cliente é fraude, não licença poética.

O que eu preciso, e serve mesmo anonimizado ("uma indústria de médio porte"):
- o que a empresa esperava e o que aconteceu
- onde travou — dado, processo, gente ou expectativa
- o que foi feito a respeito
- um número antes/depois, mesmo aproximado

Uma conversa de vinte minutos gravada é suficiente; eu escrevo a partir dela.

### 6. Diagnóstico de maturidade de IA: as perguntas que usamos

**Falta: sua decisão de negócio.** O artigo abre o instrumento do Spend Lab. A
pergunta é quanto abrir — as perguntas sim, a régua de pontuação não? metade
delas? Isso é chamada sua, não minha: envolve o que a IAgentics cobra para
fazer.

Decidido o corte, escrevo no mesmo dia.

## Antes de publicar qualquer um

1. **O índice precisa absorver o site atual.** O Google ainda serve o título do
   site antigo para o domínio. Publicar antes disso é escrever para um
   rastreador que ainda não leu as seis páginas que já existem.
2. **Revisão de quem faz Compras.** Escrevi a partir da literatura da área e do
   material da IAgentics, não de vivência de comprador. Erro de campo derruba a
   credibilidade do texto inteiro.
3. **Cadência.** Um a cada quinze dias, na ordem 1 → 2 → 3 → 4 → 5 → 6. Publicar
   os quatro de uma vez desperdiça três meses de sinal de site vivo.

## Nota sobre os números citados

Só entrou número rastreado até a fonte primária ou institucional:

- **Gartner** (90% da compra B2B intermediada por agentes até 2028, US$ 15 tri) —
  release oficial de 21/10/2025, citado nos artigos 2.
- **APQC** (maverick buying em 1,8% do valor anual; US$ 2,58 por US$ 1.000) —
  publicação da própria APQC, citada nos artigos 2 e 3.
- **Pareto/ABC** (classe C ≈ 5% do gasto, ≈ 50% dos fornecedores) — literatura
  de procurement, citada no artigo 3.

**Ficou de fora:** o "reduz custo em até 30% com digitalização" atribuído à
McKinsey, que aparece em vários blogs brasileiros. Não consegui rastrear até a
publicação original. Número não rastreado não entra em texto assinado pela
IAgentics.

### `o-que-e-mapa-de-cotacao` (publicado em 2026-10-07)

Escrito por mim, a pedido do Rodrigo, junto com a primeira explicação animada
("Mapa de cotação em 30 segundos", marcador `<!-- explicador:mapa-de-cotacao -->`).
**Publicado no mesmo dia, por chamada do Rodrigo.** Ficam registrados os pontos
que eram para conferir antes:

- **O exemplo é fictício** (fornecedores A, B e C), mas as contas fecham: só o C
  cotou tudo (R$ 500.280), o melhor de cada linha soma R$ 485.280.
- **"Muitas empresas adotam três cotações como regra interna"** é afirmação de
  prática de mercado, não de lei — de propósito, para não entrar em compras
  públicas.
- **O que a IA faz no mapa** descreve o que o vídeo do passo a passo do Nexo
  mostra (comparação item a item e sugestão de combinação), sem prometer mais.
