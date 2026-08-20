# Plano de conteúdo — iagentics.com.br

Levantamento feito em 2026-08-20 varrendo as SERPs reais do mercado de
Compras/procurement em português, cruzado com o que o site já entrega
(`lib/content.ts`: Nexo, Academy, Spend Lab).

Complementa [PLANO-SEO.md](PLANO-SEO.md), que cuida da fundação técnica. Este
cuida do que publicar.

## Sobre volume de busca

**Este documento não traz volume mensal de busca, e isso é deliberado.** Número
de volume vem de ferramenta com dado do Google (Keyword Planner, que exige conta
no Google Ads, ou Ahrefs/Semrush, pagos). Sem acesso a uma delas, qualquer
número aqui seria inventado — e pauta editorial decidida em cima de volume
fabricado é pior que pauta decidida sem volume nenhum.

O que este levantamento traz é o que dá para observar direto na SERP e que
decide tanto quanto volume: **quem ocupa a primeira página, com que tipo de
conteúdo, em que idioma, e onde não tem ninguém.** Um termo com bom volume e
oito concorrentes com autoridade vale menos, para um domínio novo, que um termo
médio com a primeira página vazia.

Quando houver tráfego, o Search Console vira a fonte de volume — e é de graça.

## O estado de partida (2026-08-20)

Buscando `site:iagentics.com.br`, o Google devolve **uma** página do domínio, a
home, **com o title e a description do site antigo** ("Agentes de IA para PMEs —
Automatize seu Negócio… reduza custos em até 40%… teste grátis de 15 dias").
As outras cinco páginas públicas não aparecem.

**Consequência para a pauta: conteúdo não começa antes do índice absorver o site
atual.** Publicar artigo em cima de um índice desatualizado é gastar esforço num
rastreador que ainda não leu as seis páginas que já existem.

## O que a varredura encontrou

### Frentes saturadas — não entrar por elas

| Busca | Quem ocupa a primeira página |
|---|---|
| redução de custos em compras | Nimbi, GEP CostDrivers, McKinsey, Kaizen, Pix Software |
| automação de compras / cotação | Sienge, Linkana, v30, CotaCompras, Ahlex |
| spend analysis | TOTVS, Linkana, INBRASC, 2BSupply, CMB |
| IA em compras (termo de cabeça) | Sienge, NetSuite, Upflux, Magis, PickSamurai |
| curso de IA para compras | ABIMAQ, FGV, BCN, AB Suprimentos, Vorrätte, Magis |

São blogs de SaaS de procurement estabelecido e instituições de ensino. Domínio
novo não entra nessa briga por artigo genérico — e é exatamente aí que a maioria
das pautas de conteúdo B2B morre.

Nota para o posicionamento da Academy: a linha "curso de IA para compras" já tem
FGV e ABIMAQ. Competir por preço/formato nessa busca é ruim; o caminho é o
conteúdo trazer o aluno pela dúvida técnica, não pela busca por curso.

### Os três vazios reais

**1. "Agente de IA em Compras" não existe em português — o termo foi capturado
por outra coisa.**
Buscando `"agentes de IA" para compras procurement empresa brasil`, a primeira
página inteira é *agentic commerce de consumo*: Visa fechando compras com cartão
do Banco do Brasil, Decolar, bandeiras, varejo (DGABC, Mercado&Consumo, InvestTalk,
Zydon). O único resultado sobre agente dentro do departamento de Compras é a
página de produto da **IBM watsonx Orchestrate** — ou seja, um concorrente
global, sem conteúdo editorial em pt-BR.

Existe um vácuo terminológico: quem busca "agente de IA para compras" no Brasil
encontra notícia sobre IA comprando passagem aérea, não sobre IA conduzindo uma
RC. **É precisamente o que o Nexo é, e ninguém ocupou o termo.**

**2. Tail spend e maverick buying quase não existem em português.**
Buscando `tail spend compras indiretas maverick buying gestão`, a primeira página
é **inteira em inglês**: Precoro, Coupa, JAGGAER, Zycus, Xeeva, Simfoni, Group O,
vserve. Praticamente nada em pt-BR com tratamento sério.

O comprador brasileiro que ouve "tail spend" numa reunião e vai pesquisar não
encontra material na própria língua. É o maior vazio da varredura, e mapeia
direto no agente Spend e no diagnóstico do Spend Lab.

**3. A busca por prompts de compras é atendida por fazenda de prompt.**
Buscando `prompts ChatGPT para comprador negociação com fornecedor`, o que
aparece é `promptsparachatgpt.com.br`, `promptspravoce.com`, "50 prompts para
vendas no WhatsApp" — conteúdo genérico de site que publica prompt para qualquer
profissão. O único material sério é o da 2BSupply (6 prompts para gestão de
contratos).

Quem faz Compras de verdade e publica prompt testado passa esses sites sem
esforço. E a Academy já tem o insumo: "Biblioteca de prompts e padrões" é
entregável da semana 4 do Spend Lab.

### Números que todo mundo cita e ninguém localiza

Apareceram repetidamente na varredura, sempre em texto de terceiro:

- McKinsey: digitalizar procurement reduz custo operacional em **até 30%**
- Gartner: agentes de IA vão intermediar **US$ 15 tri** em transações B2B até 2028
- McKinsey: compras autônomas movimentam **US$ 5 tri** globalmente até 2030
- APQC: maverick buying foi **1,8%** do valor anual de compras (2021–2022)
- Fornecedor a fornecedor: **40% a 80%** do custo total de uma empresa é gasto com fornecedores

Um artigo que reúne e contextualiza esses números para o Brasil vira fonte
citável — inclusive por LLM, que é o canal onde um domínio novo compete sem
gargalo de autoridade.

## A pauta — seis artigos

Cada um respeita três regras: ataca um vazio (não um termo de cabeça), sai de
algo que a IAgentics **tem de fato**, e liga a um produto.

### 1. Os 7 passos do processo de compras — e o que a IA faz em cada um

- **Por que primeiro:** o conteúdo já existe. `nexo.fluxo` em `lib/content.ts`
  tem os sete passos escritos (RC → triagem → RFQ → portal do fornecedor →
  negociação → aprovação → OC no ERP) e um print real por passo. É o artigo mais
  barato da lista e prova a cadência antes de gastar fôlego.
- **Formato que ranqueia:** guia processual numerado — e é o formato que LLM
  cita com mais frequência, porque a resposta já vem estruturada.
- **Liga em:** /nexo
- **Cuidado:** não pode ser a página /nexo reescrita. O artigo descreve o
  processo de compras como disciplina; o Nexo aparece como implementação, não
  como assunto.

### 2. Agente de IA em Compras não é agentic commerce

- **Vazio atacado:** vazio nº 1. Separa a história de consumo (Visa, Decolar,
  bandeiras) da história do departamento de Compras, e define a taxonomia dos
  cinco agentes — RC, RFP, Spend, Onboarding, Contratos (`nexo.agents`).
- **Por que importa mais que tráfego:** é o artigo que ensina buscador e LLM em
  que categoria a IAgentics vive. Hoje não existe essa definição em português.
- **Liga em:** /nexo
- **Usar:** os números do Gartner e da McKinsey acima.

### 3. Tail spend: o guia que não existe em português

- **Vazio atacado:** vazio nº 2 — primeira página 100% em inglês.
- **Conteúdo:** o que é, por que 80% das transações são 20% do gasto, a
  diferença entre tail spend (tamanho) e maverick buying (não conformidade) —
  distinção que os próprios textos em inglês tratam como confusão comum.
- **Liga em:** /spend-lab e o agente Spend
- **Ambição:** virar *a* referência em pt-BR do termo. É plausível, porque não
  há concorrência.

### 4. O que dá errado numa implantação de IA em Compras

- **Ângulo:** o anti-hype. A própria varredura levantou o ponto que ninguém
  desenvolve — "resistência cultural à automação em processos baseados em
  relacionamento pessoal; fornecedor ainda prefere telefone e reunião".
- **Por que este:** é o artigo que só quem senta com o comprador consegue
  escrever, e o que ganha a confiança de um diretor de Compras cético. É também
  o mais provável de atrair link, que é o que falta ao domínio.
- **Liga em:** /spend-lab
- **Requisito:** precisa de caso real, com número. Sem isso vira mais um texto
  de opinião.

### 5. Biblioteca de prompts para quem trabalha com Compras

- **Vazio atacado:** vazio nº 3 — a concorrência é fazenda de prompt.
- **Conteúdo:** prompt testado para análise de proposta, mapa comparativo,
  próxima mensagem de negociação, leitura de cláusula contratual. Com o
  resultado real ao lado, não só o prompt.
- **Liga em:** /cursos (Academy)
- **Efeito colateral desejado:** biblioteca de prompt é salva e compartilhada —
  é formato que gera link e volta de visitante.

### 6. Diagnóstico de maturidade de IA: as perguntas que usamos

- **Conteúdo:** o instrumento do Spend Lab, aberto. As perguntas, não a régua de
  pontuação.
- **Por que funciona:** publicar o próprio diagnóstico é o que transforma leitor
  em lead qualificado — quem responde as perguntas e não gosta do resultado
  procura ajuda. O CTA da /spend-lab já é literalmente "Diagnose de maturidade
  de IA".
- **Liga em:** /spend-lab
- **Decisão de negócio pendente:** quanto do método abrir. É chamada do Rodrigo,
  não minha.

### 0. ROI de IA em Compras: o que responder quando o CFO pergunta

Entrou depois da pauta original, em 2026-08-20, e **passou para a frente de
todos.**

- **Origem:** adaptação do artigo que o Rodrigo publicou no LinkedIn ("O CFO
  pergunta o ROI da IA. E agora?").
- **Por que vai primeiro:** é o único texto da leva com material que ninguém
  mais tem — conversa real, com data, prazo e fala de Diretor de Compras, CFO e
  Líder de Compras. Os outros cinco saem da literatura da área; este sai de
  reunião.
- **Tese:** o saving direto justifica o piloto e não justifica o próximo
  investimento. A pergunta que decide a fase 2 não é "quanto economizamos", é "o
  que vamos fazer com o que voltar".
- **Liga em:** /spend-lab e o ebook *O ROI invisível da IA em Compras*
- **Observação estratégica:** este artigo é a prova do argumento da seção sobre
  LinkedIn — o melhor conteúdo da marca estava construindo autoridade num
  domínio que não é o nosso.

## Ordem e cadência

Ordem recomendada: **0 → 1 → 2 → 3 → 4 → 5 → 6.** Abre com o único que tem caso
real, segue pelo mais barato de produzir (prova o formato), depois ocupa a
categoria, depois o maior vazio, depois o que atrai link, e fecha com os dois de
conversão, quando já existe tráfego para converter.

**Um artigo a cada quinze dias, sustentado por seis meses.** Dez de uma vez e
silêncio depois é pior que não começar: blog parado sinaliza empresa parada. Se
não houver fôlego para a cadência, a decisão certa é não começar.

## A decisão técnica pendente

Não existe rota `/blog` hoje. Dois caminhos:

| | Arquivos MDX no repositório | Banco + editor no /admin |
|---|---|---|
| Publicar | passa por desenvolvimento | Rodrigo publica sozinho |
| Custo inicial | baixo | uma tarefa de desenvolvimento |
| Versionamento | git, de graça | histórico teria que ser construído |
| Imagem | commit no repo | upload (infra já existe para curso) |

**A pergunta que decide é quem escreve.** Se for o Rodrigo com frequência, o
editor no /admin se paga rápido. Se os artigos forem poucos e revisados a quatro
mãos, MDX é mais simples e mais rápido de ter no ar.

Seja qual for, o que entra em `ROTAS_SITEMAP` e o JSON-LD de `Article` saem de
`lib/seo.ts`, como o resto (ver PLANO-SEO.md).
