---
titulo: "Prompts para quem trabalha com Compras (e o aviso que ninguém dá antes)"
descricao: "Seis prompts estruturados para análise de proposta, mapa comparativo, negociação e leitura de cláusula — com o que esperar de cada um, onde eles falham, e a regra de dado sigiloso que precede todos."
slug: "prompts-para-compras"
data: 2026-08-20
autor: "IAgentics"
categoria: "IA aplicada"
produto: "academy"
status: "publicado"
ordem: 5
---

A internet em português tem muita lista de "50 prompts para Compras". Quase toda
ela foi escrita por quem publica cinquenta prompts para qualquer profissão e
nunca conduziu uma concorrência.

Aqui vão seis. Menos, mais longos, e com a parte que as listas omitem: o que
esperar da resposta, onde cada um erra, e o que fazer com o resultado.

Antes disso, o aviso.

## O aviso: o que não entra no prompt

**Proposta de fornecedor é informação confidencial de terceiro.** Preço,
condição comercial, estrutura de custo e minuta de contrato foram enviados à sua
empresa sob expectativa de sigilo — muitas vezes sob NDA assinado.

Colar isso numa ferramenta de IA pública, de conta pessoal, é uma decisão com
consequência jurídica, não uma questão de produtividade. Três regras mínimas:

1. **Verifique a política da sua empresa antes.** Se não existe política, essa é
   a primeira coisa a resolver — antes dos prompts.
2. **Prefira ambiente corporativo contratado**, onde o dado não é usado para
   treinamento e há acordo de tratamento. Conta gratuita pessoal raramente
   oferece isso.
3. **Quando não houver ambiente adequado, anonimize.** "Fornecedor A", "B", "C";
   valores em índice em vez de reais; nome de produto genérico. Você perde pouco
   da análise e remove o risco.

Nenhum ganho de dez minutos justifica vazar a proposta de um fornecedor.

Os prompts abaixo assumem que você resolveu esse ponto.

---

## 1. Normalizar propostas para comparação

O trabalho manual mais ingrato de uma cotação: cada fornecedor responde num
formato, e comparar exige colocar tudo na mesma base.

> Você é analista de suprimentos. Vou fornecer propostas de fornecedores
> diferentes para o mesmo escopo.
>
> Tarefa: normalizar as propostas para comparação direta.
>
> Regras:
> - Traga tudo para a mesma base: preço total com frete e impostos incluídos,
>   prazo em dias corridos, pagamento em dias após entrega.
> - Quando uma informação não constar da proposta, escreva "não informado".
>   **Nunca estime, nunca preencha por inferência.**
> - Liste separadamente as diferenças de escopo — item, marca, especificação ou
>   serviço que uma proposta inclui e outra não.
> - Ao final, liste as perguntas que eu preciso fazer a cada fornecedor para
>   tornar as propostas comparáveis.
>
> Formato: tabela comparativa, seguida da lista de diferenças de escopo, seguida
> das perguntas por fornecedor.
>
> Propostas: [colar]

**O que esperar.** A tabela é o produto menos importante. O que costuma valer
mais é a **lista de perguntas** — ela expõe o que você compararia errado sem
perceber.

**Onde falha.** Se você não proibir explicitamente a inferência, o modelo
preenche lacuna com valor plausível. É o erro mais perigoso deste prompt, porque
uma tabela completa parece confiável. A instrução "nunca estime" não é decoração.

---

## 2. Encontrar o que está escondido na diferença de preço

> Recebi propostas com diferença relevante de preço para o mesmo escopo.
>
> Levante as hipóteses que explicam essa diferença, separando-as em:
> (a) diferenças legítimas de escopo, qualidade ou condição;
> (b) diferenças de estrutura de custo do fornecedor;
> (c) sinais de risco — proposta abaixo do custo provável, escopo subdimensionado
>     para ganhar a concorrência, exclusão relevante escondida na entrelinha.
>
> Para cada hipótese, diga qual pergunta ou documento confirmaria ou eliminaria
> ela.
>
> Contexto: [categoria, escopo, propostas anonimizadas]

**Por que este importa.** A proposta mais barata que ganha e depois vira aditivo
é um dos custos mais silenciosos de Compras. Este prompt não decide nada — ele
te dá a lista do que investigar antes de assinar.

---

## 3. Preparar uma negociação

> Você é um negociador experiente em suprimentos. Vou te dar o contexto de uma
> negociação com fornecedor.
>
> Produza:
> 1. Meus pontos de força reais nesta negociação — apenas os que se sustentam no
>    contexto fornecido.
> 2. Os pontos de força prováveis do outro lado.
> 3. Três concessões de baixo custo para mim e valor provável para ele.
> 4. As três objeções mais prováveis e uma resposta para cada.
> 5. Meu ponto de saída: em que condição eu deveria encerrar a negociação.
>
> Não me diga que estou numa posição forte se o contexto não sustentar isso.
> Se meus pontos de força forem fracos, diga com clareza.
>
> Contexto: [histórico com o fornecedor, volume, alternativas disponíveis,
> urgência, o que já foi negociado antes]

**A instrução decisiva é a penúltima linha.** Sem ela, o modelo tende a
concordar com você e a produzir uma preparação animadora e inútil. O item 5 — o
ponto de saída — é o que a maioria das preparações não tem, e é o que evita
fechar mal por inércia.

---

## 4. Ler uma minuta procurando o que te prejudica

> Você é advogado especializado em contratos de fornecimento, atuando **do lado
> do comprador**.
>
> Leia a minuta e aponte, em ordem de gravidade:
> - Cláusulas que transferem risco desproporcional para o comprador
> - Reajuste, índice e periodicidade — e o que acontece se o índice for extinto
> - Renovação automática e prazo de aviso prévio para não renovar
> - Limitação de responsabilidade do fornecedor
> - Condição de rescisão e penalidade assimétrica
> - O que **não está** na minuta e deveria estar
>
> Para cada ponto: cite o trecho, explique o efeito prático em uma frase e
> proponha uma redação alternativa.
>
> Minuta: [colar]

**O item que mais rende é o penúltimo — "o que não está".** Cláusula ausente
(nível de serviço, penalidade por atraso, propriedade de dados) não chama
atenção na leitura, porque não está lá para ser lida.

**Limite importante:** isto não substitui o jurídico. Serve para você chegar ao
jurídico com as perguntas certas em vez de encaminhar 40 páginas sem
priorização.

---

## 5. Auditar a própria carteira de contratos

> Vou fornecer a lista de contratos vigentes da minha área.
>
> Identifique:
> - Contratos que renovam automaticamente nos próximos 120 dias, com a data
>   limite para avisar não renovação
> - Fornecedores diferentes na mesma categoria — candidatos a consolidação
> - Contratos sem reajuste aplicado há mais de 18 meses (risco de reajuste
>   acumulado na renovação)
> - Contratos cujo valor não justifica o custo de gestão
>
> Ordene por urgência de ação e diga, para cada, qual é a próxima ação e o prazo.
>
> Lista: [colar — anonimizada]

**Este é o de maior retorno da lista** e o menos usado. Perder o prazo de aviso
prévio de uma renovação automática é o erro mais caro e mais comum da gestão de
contratos, e é um erro puramente de calendário.

---

## 6. Traduzir uma necessidade mal escrita em requisição

> Recebi esta solicitação de uma área interna. Ela está incompleta para virar
> uma requisição de compra.
>
> Produza:
> 1. A descrição técnica do que provavelmente está sendo pedido
> 2. As informações que faltam para cotar
> 3. As perguntas que devo fazer ao requisitante — no máximo cinco, em
>    linguagem que alguém de fora de Compras entenda
> 4. Se houver ambiguidade que possa gerar compra errada, sinalize
>
> Solicitação: [colar]

**Por que fecha a lista.** É onde o processo de compras mais perde tempo, e é a
tarefa mais invisível do comprador — a tradução entre quem precisa e quem
compra.

---

## O que separa isto de uma lista de cinquenta

Três coisas, e valem mais que qualquer prompt específico:

**Contexto é mais importante que redação.** O mesmo prompt com histórico do
fornecedor, volume e alternativas produz resultado incomparavelmente melhor que
sem. A maior parte da frustração com IA em Compras é falta de contexto, não
falta de prompt bom.

**Proibir a invenção precisa ser explícito.** "Nunca estime", "escreva não
informado", "não diga que estou forte se não estiver". Sem isso, você recebe uma
resposta confiante e parcialmente inventada — que é pior que nenhuma resposta,
porque parece pronta.

**A saída é insumo, não decisão.** Todos os prompts acima produzem material para
você decidir. Nenhum decide. Quem assina continua assinando.

---

*A [IAgentics Academy](/cursos) forma profissionais para aplicar IA com método —
incluindo a construção de bibliotecas de prompt e padrões de contexto para uso
consistente e seguro dentro da empresa.*
