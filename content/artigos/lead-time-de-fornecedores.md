---
titulo: "Lead time de fornecedores: o que compõe, como medir e como reduzir a parte que é sua"
tituloSeo: "Lead time em compras: como medir e reduzir | IAgentics"
descricao: "Lead time em compras soma o tempo interno da requisição e o prazo do fornecedor. Veja como medir cada parte, o efeito no estoque e onde dá para cortar."
slug: "lead-time-de-fornecedores"
data: 2026-10-09
autor: "Rodrigo Costa"
categoria: "Sourcing e cotação"
produto: "nexo"
status: "rascunho"
faq:
  - pergunta: "O que é lead time em compras?"
    resposta: "É o tempo entre o momento em que a necessidade de um item aparece e o momento em que ele está disponível para uso. Inclui a parte interna (requisição, aprovação, cotação e emissão do pedido) e a parte externa (confirmação, produção ou separação, transporte e recebimento)."
  - pergunta: "Qual a diferença entre lead time do fornecedor e lead time de compra?"
    resposta: "O lead time do fornecedor começa quando ele recebe o pedido e termina na entrega. O lead time de compra é maior: começa antes, na abertura da requisição, e soma todo o tempo que o pedido leva para nascer dentro da empresa."
  - pergunta: "Como calcular o lead time médio de um fornecedor?"
    resposta: "Para cada pedido, subtraia a data de emissão da ordem de compra da data de recebimento. Depois calcule a média e a variação desses prazos por fornecedor e por categoria, e compare com o prazo que o fornecedor prometeu na proposta."
  - pergunta: "Como reduzir o lead time sem trocar de fornecedor?"
    resposta: "Atacando a parte interna: requisição completa na abertura, aprovação por alçada com substituto definido, cotação com convite simples para o fornecedor responder, contrato ou catálogo para itens recorrentes e pedido que nasce dos dados da cotação, sem redigitação."
---

Quando um item atrasa, a primeira suspeita costuma cair sobre o fornecedor. Às
vezes ele é mesmo o culpado. Mas, se você abrir as datas de uma requisição
qualquer, é comum descobrir que o pedido passou mais tempo dentro da empresa do
que no caminhão.

Por isso vale separar duas coisas que costumam aparecer com o mesmo nome. O
**lead time do fornecedor** é o prazo que ele leva entre receber o pedido e
entregar. O **lead time de compra** é o tempo total entre a necessidade surgir e
o item estar disponível para uso. O segundo contém o primeiro, e é ele que o
requisitante sente.

Este texto mostra o que compõe o lead time em compras, como medir cada parte,
por que ele mexe no estoque e no prazo da requisição, e onde dá para cortar
sem renegociar nada com ninguém.

## O que compõe o lead time de compra

Dá para dividir o lead time em dois blocos. O primeiro acontece dentro de casa;
o segundo, no fornecedor e no transporte.

**Lead time interno** (do requisitante até a ordem de compra):

1. **Identificação da necessidade e abertura da requisição.** O tempo entre
   alguém perceber que precisa do item e a requisição de compra (RC) existir de
   fato no sistema, completa.
2. **Triagem e aprovação.** Classificação, conferência e o caminho pela cadeia
   de alçada.
3. **Seleção de fornecedores e cotação.** Montar a lista de convidados,
   disparar a RFQ e esperar as respostas.
4. **Análise e aprovação final.** Comparar as propostas no mapa, escolher e
   aprovar a escolha.
5. **Emissão da ordem de compra.** Lançar a OC no ERP e enviar ao fornecedor.

**Lead time externo** (da ordem de compra até o item disponível):

1. **Confirmação do pedido** pelo fornecedor.
2. **Produção ou separação**, dependendo de o item ser feito sob encomenda ou
   sair do estoque dele.
3. **Transporte** até a sua unidade.
4. **Recebimento, conferência e inspeção**, até o item entrar no estoque ou
   chegar a quem pediu.

Repare que o último passo do lead time externo também é interno: a doca, a
conferência física e a inspeção de qualidade são suas. Um item que chega na
sexta e só é conferido na terça soma quatro dias que nenhum fornecedor vai
reconhecer como dele.

## Como medir o lead time

Medir exige uma coisa simples e pouco comum: datas registradas em cada etapa. Se
o ERP e o fluxo de requisição gravam quando cada evento aconteceu, a conta é
subtração. Os marcos que importam são estes:

- data de abertura da RC;
- data de aprovação da RC;
- data de envio da cotação e data de cada resposta;
- data de aprovação da proposta vencedora;
- data de emissão da OC;
- data de confirmação do fornecedor;
- data de emissão da nota fiscal;
- data de recebimento e data de liberação para uso.

Com esses marcos, cada trecho vira um número: RC até OC é o lead time interno;
OC até recebimento é o lead time do fornecedor; recebimento até liberação é o
tempo da sua doca.

Três cuidados para o número servir para decidir alguma coisa:

**Meça por fornecedor e por categoria.** Uma média geral mistura parafuso de
prateleira com equipamento sob encomenda e não diz nada sobre nenhum dos dois.

**Olhe a variação, além da média.** Um fornecedor que entrega sempre em 12 dias
é mais fácil de planejar do que um que entrega em 8 na média, mas às vezes em 3
e às vezes em 20. É a variação que obriga a carregar estoque de segurança.

**Compare o prometido com o realizado.** O prazo que o fornecedor escreveu na
proposta é uma informação; o prazo que ele cumpriu nos últimos pedidos é outra.
A distância entre os dois é um dado de desempenho que deveria aparecer no mapa
de cotação da próxima compra, ao lado do preço.

Se as datas não existem, o primeiro projeto é fazê-las existir. Requisição que
nasce por e-mail ou por telefone não deixa marco nenhum, e o lead time interno
fica invisível justamente onde ele costuma ser maior.

## Como o lead time afeta estoque e prazo

O efeito mais direto aparece no **ponto de pedido**, a quantidade em estoque
que dispara uma nova compra. A fórmula clássica é:

> ponto de pedido = consumo médio diário × lead time + estoque de segurança

O lead time entra multiplicando. Quanto mais tempo a reposição demora, mais
cedo você precisa pedir e mais material fica parado esperando a próxima entrega
chegar. E o estoque de segurança, que protege contra a variação do consumo e do
prazo, também cresce quando o lead time é longo ou instável.

Para os itens que não são de estoque, o efeito aparece no **prazo da
requisição**. O requisitante precisa do item numa data. Se o lead time de compra
é maior do que o tempo que ele tem, sobram três saídas, todas ruins: pagar mais
caro por urgência, aceitar o atraso ou comprar por fora do processo, o maverick
buying que Compras passa o ano tentando reduzir.

## Exemplo: o rolamento da Metalúrgica Fictícia

*Exemplo ilustrativo, com empresa e números inventados para mostrar a conta.*

A Metalúrgica Fictícia consome em média 20 rolamentos por dia numa linha de
produção. Cada rolamento custa R$ 85. Ao levantar as datas dos últimos pedidos,
Compras encontrou este lead time médio:

| Etapa | Dias |
|---|---|
| Abertura da RC (requisição devolvida por falta de dados) | 2 |
| Aprovação (aprovador sem substituto nas ausências) | 4 |
| Cotação (convites por e-mail, respostas lentas) | 6 |
| Análise e aprovação final | 2 |
| Emissão da OC | 1 |
| **Lead time interno** | **15** |
| Fornecedor (confirmação, separação e transporte) | 13 |
| Recebimento e inspeção | 2 |
| **Lead time externo** | **15** |
| **Lead time total** | **30** |

Com 30 dias de lead time, o ponto de pedido (sem contar o estoque de segurança)
fica em 20 × 30 = 600 rolamentos.

A primeira reação foi pressionar o fornecedor. Só que ele responde por 13 dos
30 dias, e a metade inteira do prazo estava do lado de dentro. Compras então
atacou o bloco interno: requisição completa já na abertura, substituto definido
na alçada, convite de cotação que o fornecedor responde num link e um contrato
de fornecimento para o item, que é recorrente. O lead time interno caiu, neste
exemplo, de 15 para 6 dias. O total foi para 21.

Com 21 dias, o ponto de pedido passa a 20 × 21 = 420 rolamentos. São 180
rolamentos a menos para disparar a reposição, o equivalente a 180 × R$ 85 =
R$ 15.300 de material que deixa de precisar estar na prateleira no momento do
pedido. E isso antes de recalcular o estoque de segurança, que tende a cair
junto quando o prazo fica mais curto e mais previsível.

Nenhuma linha do contrato de preço mudou. O fornecedor continuou entregando em
13 dias.

## Como reduzir a parte interna do lead time

A parte externa depende de negociação, de localização do fornecedor e de
modal de transporte. A interna depende de processo, e é a que você controla
amanhã de manhã. Os pontos onde ela costuma travar seguem a mesma sequência dos
[sete passos do processo de compras](/artigos/processo-de-compras-sete-passos-ia):

**Requisição completa na primeira vez.** Cada RC que volta por falta de centro
de custo, especificação ou quantidade reinicia o relógio. Conferir os dados
antes de a requisição entrar na fila tira dias que ninguém percebia como lead
time.

**Aprovação com alçada clara e substituto.** Aprovação parada por férias ou
por caixa de entrada cheia é tempo morto puro. Regra de alçada por valor, com
substituto configurado, resolve a maior parte do problema sem tirar o controle.

**Cotação com menos atrito para o fornecedor.** Fornecedor que precisa criar
conta e senha num portal para responder uma cotação pequena demora ou não
responde. Convite por link, com formulário e anexo, encurta a espera.

**Prazo dentro do mapa de cotação.** Quando o prazo prometido e o histórico de
entrega aparecem ao lado do preço, o comprador evita escolher a proposta mais
barata que chega tarde demais para a necessidade da RC.

**Contrato ou catálogo para o que se repete.** Item recorrente que passa por
cotação completa a cada pedido paga o lead time interno inteiro toda vez. Um
contrato de fornecimento ou um catálogo com preço negociado pula as etapas de
cotação e análise.

**Pedido sem redigitação.** Quando a OC nasce dos dados da requisição e da
proposta vencedora, ela sai no mesmo dia da aprovação e sem erro de
transcrição que depois trava o recebimento.

**Recebimento que não fica para depois.** Conferência e inspeção com prazo
definido fecham o ciclo. Item parado na doca está no estoque para o
financeiro e ausente para quem pediu.

## Onde a IA entra

Boa parte dos dias do lead time interno é espera entre uma etapa e outra:
requisição voltando, aprovador sem aviso, proposta para redigitar. É o tipo de
intervalo que um agente de IA consegue encurtar.

No [Nexo](/nexo), o módulo de Compras da IAgentics, a MIA abre a requisição a
partir de uma descrição em linguagem natural e a IA confere os dados antes de
enviar para Compras. A triagem classifica por categoria e define a cadeia de
aprovação por alçada. O fornecedor recebe convite por link, sem senha e sem
conta, e responde preço, prazo e condições no Portal do Fornecedor. A IA lê os
anexos e monta o mapa comparativo pontuando preço, prazo e condições, e a OC
nasce consolidada a partir da RC, da RFQ e da proposta vencedora, pronta para o
ERP. Como cada etapa fica registrada, as datas que permitem medir o lead time
passam a existir por consequência do próprio fluxo.

A decisão continua com uma pessoa: quem aprova, qual fornecedor ganha, quando
vale pagar mais para receber antes. A máquina tira a espera do caminho.

<!-- faq -->

Se você quer saber quanto do seu lead time de compra está do lado de dentro e
quanto dele dá para cortar, comece pelas datas das últimas requisições. Se
quiser fazer isso com a gente, [Vamos conversar](/#contato)
