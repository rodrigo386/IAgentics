---
titulo: "Saving em Compras: como calcular e apresentar para o CFO reconhecer no resultado"
tituloSeo: "Saving em compras: como calcular e provar ao CFO | IAgentics"
descricao: "Saving em compras para o CFO: como escolher o baseline, separar saving de cost avoidance e reportar o realizado que a controladoria valida."
slug: "saving-em-compras-para-o-cfo"
data: 2026-10-09
autor: "Rodrigo Costa"
categoria: "ROI e business case"
produto: "spend-lab"
status: "rascunho"
faq:
  - pergunta: "O que é saving em compras?"
    resposta: "Saving em compras é a redução de custo obtida por uma ação de Compras, medida contra um preço de referência (o baseline) e multiplicada pelo volume efetivamente comprado. Saving que o CFO reconhece é o que aparece como custo menor no resultado do período."
  - pergunta: "Qual a diferença entre saving e cost avoidance?"
    resposta: "Saving reduz o custo em relação ao que a empresa já pagava. Cost avoidance evita um aumento que ainda não tinha acontecido, como um reajuste pedido pelo fornecedor e recusado em parte. Os dois têm valor, mas só o saving baixa o custo contra o período anterior, e por isso eles entram no relatório em linhas separadas."
  - pergunta: "Qual baseline usar para calcular saving?"
    resposta: "O mais aceito pela controladoria é o último preço pago por item, com volume real. Para item novo, a média das cotações válidas do processo é uma alternativa, desde que a regra seja definida antes da negociação e aplicada a todas as categorias."
  - pergunta: "Por que o CFO não enxerga o saving de Compras no resultado?"
    resposta: "Porque o número reportado costuma ser o saving negociado, anualizado sobre volume previsto, enquanto o resultado registra o volume real, com compras feitas fora do contrato e aumentos em outras linhas. Reportar o saving realizado, conciliado com a controladoria, fecha essa diferença."
---

Compras fecha o ano com um número de saving que ocupa um slide inteiro. O CFO
olha o resultado, compara com o custo do ano anterior e não encontra esse
dinheiro. A conversa que vem depois é desconfortável para os dois lados: Compras
sente que o trabalho foi ignorado, e a área financeira sente que recebeu um
número inflado.

Na maior parte dos casos, ninguém mentiu. Os dois estão medindo coisas
diferentes com o mesmo nome. Este texto trata de como calcular **saving em
compras** de um jeito que sobreviva à conciliação com a controladoria, e de como
separar o saving do cost avoidance antes que o CFO faça essa separação por você.

Ele complementa o artigo sobre
[ROI de IA em Compras e o que responder ao CFO](/artigos/roi-de-ia-em-compras-o-que-responder-ao-cfo),
que trata da capacidade liberada pelo time. Aqui o assunto é a outra metade: o
saving em reais, que precisa estar certo para que o resto da conversa aconteça.

## O que é saving em compras

Saving é a redução de custo obtida por uma ação de Compras, medida contra um
preço de referência e multiplicada pelo volume comprado. A fórmula cabe numa
linha:

**saving = (preço de referência − preço novo) × volume comprado**

Os três termos dessa conta são onde as divergências aparecem. Qual é o preço de
referência? Qual volume entra, o previsto ou o real? E em que período o efeito
é contado? Quem responde essas três perguntas de forma explícita, e igual para
todas as categorias, já resolveu boa parte do problema.

## Como escolher o baseline

O baseline é o preço contra o qual o saving é medido. As opções mais comuns:

- **Último preço pago (last price paid):** o preço da última compra do mesmo
  item, com a mesma especificação. É o mais fácil de auditar, porque está no
  histórico de pedidos.
- **Média de preço do período anterior:** suaviza compras pontuais fora da
  curva. Exige definir o período e ponderar pelo volume.
- **Média das cotações recebidas:** usada para item novo, sem histórico. É a
  mais frágil, porque uma cotação alta convidada só para compor o mapa infla o
  saving.
- **Orçamento (budget):** comum em projetos e serviços. Mede a diferença contra o
  planejado, e o CFO tende a ler isso como acerto de previsão.

Nenhum baseline serve para tudo, e o que dá credibilidade é a combinação prévia. A regra
prática é decidir com a controladoria, antes do ano começar, qual baseline vale
para cada tipo de compra, e registrar essa regra num documento curto. Quando o
baseline é escolhido depois da negociação, item a item, o número perde
credibilidade mesmo quando está correto.

Dois cuidados acompanham qualquer baseline. O primeiro é a especificação: se o
item mudou (gramatura, prazo de pagamento, frete incluso), a comparação de preço
precisa de ajuste, senão o saving reflete a mudança de produto. O segundo é o
efeito de mercado: se a commodity caiu e o preço caiu junto, parte do saving veio
do mercado. Muitas empresas reportam essa parte em separado, e essa transparência
costuma aumentar a confiança no resto do número.

## Saving e cost avoidance: por que separar

**Saving** reduz o custo em relação ao que já se pagava. **Cost avoidance** evita
um aumento que ainda não tinha acontecido.

Um exemplo de cost avoidance: o fornecedor pede reajuste de 12% e Compras fecha
em 4%. Os 8 pontos que não entraram têm valor real, porque sem a negociação o
custo seria maior. Só que, no resultado, o custo daquele item subiu 4%. Se esses
8 pontos entram no relatório somados ao saving, o CFO encontra um custo maior
onde Compras apresentou economia.

Por isso os dois aparecem em linhas separadas, sempre. Outras situações que
costumam ser classificadas como cost avoidance:

- Reajuste contratual (por índice) negociado abaixo do índice.
- Item novo comprado abaixo da média das cotações, sem histórico para comparar.
- Condição comercial evitada, como frete que passaria a ser cobrado.
- Ganho de prazo de pagamento, que atua no capital de giro. Esse costuma ir para
  uma terceira linha, de efeito financeiro.

Separar mostra duas contribuições diferentes com o nome certo, e o CFO consegue
reconhecer as duas.

## Saving negociado e saving realizado

A segunda separação é no tempo. O **saving negociado** é calculado no fechamento
do contrato, com o volume previsto, normalmente anualizado. O **saving
realizado** é calculado depois, com o volume que de fato passou pelo contrato no
período.

Entre um e outro, três coisas comem o número:

1. **Volume menor que o previsto.** A demanda caiu, a linha de produção parou, o
   projeto atrasou.
2. **Compra fora do contrato.** Parte da demanda continua indo para o fornecedor
   antigo, ao preço antigo. É o leakage, primo do maverick buying. Em muitas
   empresas, ele responde por [VALIDAR] do saving negociado.
3. **Prazo de vigência.** Um contrato fechado em setembro tem só três meses de
   efeito no ano fiscal, e o saving anualizado aparece inteiro no slide de
   dezembro.

O CFO enxerga o saving realizado, porque é o que o resultado registra. Reportar o
negociado como pipeline e o realizado como resultado resolve a maior parte da
divergência.

## Exemplo prático: uma indústria fictícia

*Exemplo ilustrativo, com números redondos e empresa inventada, para mostrar a
mecânica.*

A Indústria Alfa, fabricante de bens de consumo, renegociou duas linhas de
embalagem no início do ano fiscal.

**Linha 1, caixa de papelão.** Preço de referência (último preço pago): R$ 10,00
por unidade. Preço novo: R$ 9,20. Volume previsto no ano: 200 mil unidades.

- Saving negociado anualizado: R$ 0,80 × 200.000 = **R$ 160.000**.

**Linha 2, fita adesiva.** Preço atual: R$ 5,00. O fornecedor pediu reajuste
para R$ 5,60. Compras fechou em R$ 5,20.

- Cost avoidance: (R$ 5,60 − R$ 5,20) × volume.
- Aumento real de custo: (R$ 5,20 − R$ 5,00) × volume.

Seis meses depois, a controladoria pediu o fechamento do semestre.

Na caixa de papelão, o ritmo previsto daria 100 mil unidades no semestre. Foram
compradas 80 mil. Dessas, 72 mil passaram pelo contrato novo e 8 mil foram
compradas de um fornecedor antigo, ao preço de R$ 10,00, por uma filial que não
foi avisada.

- Saving realizado: R$ 0,80 × 72.000 = **R$ 57.600**.
- Proporcional do negociado no semestre: R$ 80.000.
- Diferença de R$ 22.400, explicada assim: R$ 16.000 de volume menor (20 mil
  unidades × R$ 0,80) e R$ 6.400 de compra fora do contrato (8 mil unidades ×
  R$ 0,80).

Na fita adesiva, foram 50 mil unidades no semestre.

- Cost avoidance: R$ 0,40 × 50.000 = **R$ 20.000**.
- Aumento real de custo: R$ 0,20 × 50.000 = **R$ 10.000**.

O relatório que o CFO reconhece fica assim:

| Linha | Semestre |
|---|---|
| Saving realizado (caixa de papelão) | R$ 57.600 |
| Aumento de custo (fita adesiva) | R$ 10.000 |
| **Efeito líquido no custo contra o baseline** | **R$ 47.600 de redução** |
| Cost avoidance (fita adesiva), em linha separada | R$ 20.000 |
| Perda por compra fora do contrato | R$ 6.400 |

O slide do início do ano diria "R$ 160 mil de saving". O do semestre diz: R$ 47,6
mil de redução líquida no custo, R$ 20 mil de aumento evitado, e R$ 6,4 mil que
escaparam por compra fora do contrato, com a filial identificada. O segundo
número é menor e é o que a controladoria assina. A linha de perda ainda aponta a
próxima ação: comunicar o contrato à filial e bloquear o fornecedor antigo
para aquele item.

## Como apresentar saving para o CFO

Com o cálculo resolvido, a apresentação segue algumas regras simples.

**Use o vocabulário do resultado.** Fale em redução de custo no período, efeito
no custo do produto vendido ou na despesa, conforme a categoria. Se o item vai
para estoque, o efeito no resultado chega com defasagem, e vale dizer isso antes
que perguntem.

**Mostre o líquido.** Saving de uma categoria e aumento de outra no mesmo
fornecedor, ou na mesma família, aparecem juntos. O CFO vai fazer essa conta de
qualquer forma.

**Concilie antes da reunião.** Leve o número já validado pela controladoria, com
a mesma base de dados de pedidos e notas. Saving que só Compras calculou abre
uma auditoria na própria reunião.

**Separe pipeline de resultado.** Saving negociado é promessa com data. Saving
realizado é fato. Os dois cabem no relatório, em colunas diferentes.

**Explique a diferença.** Volume, leakage e vigência, cada um em reais. A
explicação transforma uma lacuna em plano de ação.

## O que precisa estar pronto antes do cálculo

Nada disso funciona sem dado de spend organizado. Para calcular saving realizado,
você precisa ligar o contrato ao pedido, o pedido à nota e o item ao mesmo
código em todas as filiais. Master data duplicado, item cadastrado com descrição
livre e fornecedor com três CNPJs diferentes no sistema fazem o leakage
desaparecer do relatório, porque a compra fora do contrato não é reconhecida como
o mesmo item.

É aqui que muitos projetos de IA em Compras começam: padronizar descrições,
categorizar o spend e encontrar compras do mesmo item em fornecedores
diferentes. E é aqui que a pergunta do CFO volta, agora sobre o próprio projeto.
O módulo de métricas, ROI e governança contínua do
[IA Spend Lab](/spend-lab) trata exatamente de definir esses indicadores antes da
implantação, para que o resultado seja medido com uma régua combinada desde o
primeiro dia.

<!-- faq -->

Se você precisa fechar a régua de saving com a sua controladoria, ou montar o
relatório do próximo fechamento, a IAgentics pode ajudar a desenhar o método e os
indicadores. [Vamos conversar](/#contato)
