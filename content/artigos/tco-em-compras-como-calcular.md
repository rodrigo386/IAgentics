---
titulo: "TCO em compras: como calcular o custo total de propriedade"
tituloSeo: "TCO em compras: como calcular, com exemplo | IAgentics"
descricao: "TCO em compras: o que entra no custo total de propriedade, a fórmula e um cálculo passo a passo comparando dois fornecedores."
slug: "tco-em-compras-como-calcular"
data: 2026-10-09
autor: "Rodrigo Costa"
categoria: "Sourcing e cotação"
produto: "nexo"
status: "rascunho"
faq:
  - pergunta: "O que é TCO em compras?"
    resposta: "TCO (Total Cost of Ownership, ou custo total de propriedade) é a soma de tudo o que a empresa gasta com um item durante o tempo em que o usa: o preço de compra, o frete, a instalação, a operação, a manutenção, as falhas e o descarte, menos o que ela recupera no fim. Em Compras, serve para comparar fornecedores pelo custo real da escolha, além do preço da proposta."
  - pergunta: "Qual é a fórmula do TCO?"
    resposta: "Na forma mais simples: TCO = custo de aquisição + custos de operação e manutenção no horizonte de uso + custos de risco e qualidade + custo de fim de vida - valor residual. Quando o horizonte é longo, os custos de cada ano podem ser trazidos a valor presente com a taxa de desconto que o Financeiro usa."
  - pergunta: "Quando vale a pena calcular o TCO?"
    resposta: "Quando o custo depois da compra pesa: equipamentos, máquinas, veículos, software, serviços com contrato longo e materiais cuja qualidade afeta a produção. Para itens baratos, de consumo rápido e sem diferença de uso entre fornecedores, o mapa de cotação com preço, prazo e condições costuma bastar."
  - pergunta: "Qual a diferença entre TCO e mapa de cotação?"
    resposta: "O mapa de cotação põe lado a lado o que cada fornecedor ofereceu: preço, prazo, frete, impostos e condição de pagamento. O TCO estende essa conta para depois da entrega, somando operação, manutenção, falhas e descarte. Um bom mapa é a primeira linha de uma análise de TCO."
---

O fornecedor mais barato na proposta pode sair caro em três anos. A energia que
o equipamento consome, o contrato de manutenção, as peças que quebram, a linha
parada esperando técnico: nada disso aparece no preço unitário, e tudo isso sai
do mesmo orçamento.

**TCO (Total Cost of Ownership), ou custo total de propriedade, é a soma de tudo
o que a empresa gasta com um item enquanto o usa, menos o que recupera ao se
desfazer dele.** Em Compras, é a ferramenta para comparar fornecedores pelo
custo da decisão inteira, e o argumento para defender, diante do aprovador, uma
proposta que não tem o menor preço.

Este texto mostra o que entra na conta, a fórmula e um cálculo completo
comparando dois fornecedores, com uma tabela que você pode copiar para a sua
planilha.

## O que entra no TCO

Os componentes se agrupam em quatro blocos. Nem todos se aplicam a toda compra;
o trabalho é saber quais pesam na sua.

**1. Custo de aquisição.** Tudo o que acontece até o item estar pronto para uso:

- Preço da proposta, com impostos na mesma base para todos os fornecedores.
- Frete e seguro (CIF ou FOB faz diferença aqui).
- Instalação, comissionamento e adequação do local.
- Treinamento de quem vai operar.
- Custo financeiro da condição de pagamento: pagar à vista ou em 90 dias muda o
  custo do dinheiro.

**2. Custo de operação e manutenção.** O que se paga para manter o item
funcionando durante o horizonte de uso:

- Energia, combustível ou insumos consumidos pelo item.
- Contrato de manutenção preventiva.
- Peças de reposição e consumíveis.
- Mão de obra interna dedicada à operação.
- Licenças, assinaturas e suporte, no caso de software.

**3. Custo de risco e qualidade.** O que custa quando algo dá errado:

- Paradas não planejadas e a produção perdida durante elas.
- Retrabalho, refugo e devolução por defeito.
- Atraso de entrega e o custo de cobrir a falta (estoque de segurança maior,
  compra emergencial).
- Dependência de um fornecedor único para peça ou serviço.

**4. Fim de vida.** O que acontece quando o item sai de uso:

- Descarte, desmontagem e destinação ambiental.
- Valor residual ou de revenda, que entra na conta subtraindo.

Na maioria dos equipamentos, o preço de compra é uma parte menor do custo total
do que parece na hora da cotação. A proporção exata varia muito por categoria
(num compressor de ar, a [Atlas Copco estima](https://www.atlascopco.com/en-uk/compressors/greenproduction/compressor-operating-cost-tco)
o preço de compra em cerca de 20% do custo do ciclo de vida, e a energia em
cerca de 80%),
e por isso o cálculo precisa ser feito item a item, com os números da sua
operação.

## A fórmula do TCO

Na forma que cabe numa planilha:

> **TCO = Aquisição + (Operação e manutenção no horizonte) + Risco e qualidade + Fim de vida - Valor residual**

Três decisões vêm antes de qualquer número:

1. **O horizonte.** O período em que você vai usar o item: a vida útil esperada
   do equipamento, a duração do contrato de serviço ou o ciclo de troca que a
   empresa pratica. Todos os fornecedores são comparados no mesmo horizonte.
2. **A base.** Valores com ou sem impostos, com ou sem crédito tributário, mas
   iguais para todos. É o mesmo cuidado que o mapa de cotação exige, estendido
   para os anos seguintes.
3. **O valor do dinheiro no tempo.** Para horizontes curtos, somar os valores
   nominais resolve. Para horizontes longos, ou quando um fornecedor concentra
   custo no começo e outro no fim, traga cada ano a valor presente:

> **TCO = Aquisição + Σ (Custo do ano t ÷ (1 + i)^t) - Valor residual ÷ (1 + i)^n**

Onde *i* é a taxa de desconto que o Financeiro usa para avaliar investimentos e
*n* é o último ano do horizonte. Peça essa taxa ao Financeiro em vez de
escolher uma: assim o seu TCO fala a mesma língua do business case.

## Exemplo ilustrativo: dois compressores, cinco anos

*Exemplo ilustrativo, com empresa e números fictícios, montado para mostrar o
método. Não representa preços de mercado.*

A Embalagens Horizonte, uma indústria fictícia, precisa substituir o compressor
de ar que alimenta a linha de produção. A requisição passou pela cotação e
sobraram dois fornecedores tecnicamente aprovados. No [mapa de
cotação](/artigos/o-que-e-mapa-de-cotacao), a decisão parece fácil:

- **Fornecedor A:** R$ 180.000, com frete, instalação e treinamento inclusos.
- **Fornecedor B:** R$ 152.000, com frete, instalação e treinamento cobrados à
  parte.

O B é R$ 28.000 mais barato na proposta. O comprador decide calcular o TCO em
cinco anos, que é o ciclo de troca que a empresa pratica para esse tipo de
equipamento. Para manter as contas simples, o exemplo usa valores nominais, sem
desconto a valor presente.

### Passo 1: fechar o custo de aquisição

O B cobra R$ 9.000 de frete e instalação e R$ 4.000 de treinamento. A aquisição
dele sobe para R$ 165.000. A vantagem de R$ 28.000 cai para R$ 15.000 antes de o
equipamento ser ligado.

### Passo 2: levantar os custos de operação

Aqui entram dados que não vêm na proposta, e por isso o comprador precisa de
quem conhece a operação:

- **Energia.** Pela ficha técnica de cada modelo e pelas horas de uso da linha,
  a Manutenção estima R$ 30.000 por ano para o A e R$ 36.000 por ano para o B.
  Em cinco anos: R$ 150.000 contra R$ 180.000.
- **Manutenção preventiva.** O contrato do A custa R$ 6.000 por ano; o do B,
  R$ 9.000. Em cinco anos: R$ 30.000 contra R$ 45.000.
- **Peças e consumíveis.** Pela lista de peças de desgaste de cada fabricante,
  R$ 12.000 para o A e R$ 20.000 para o B no período.

### Passo 3: estimar o risco

A empresa calcula quanto custa cada hora de linha parada. Com o histórico de
falhas que cada fornecedor apresentou nas referências pedidas na cotação, a
estimativa de produção perdida em cinco anos fica em R$ 8.000 para o A e
R$ 24.000 para o B. É o componente mais incerto da conta, e por isso o critério
usado para estimá-lo fica escrito junto da tabela.

### Passo 4: fim de vida

Ao fim dos cinco anos, a revenda do A é estimada em R$ 30.000 e a do B em
R$ 15.000. O valor residual entra subtraindo.

### A tabela do cálculo

| Componente (5 anos, exemplo ilustrativo) | Fornecedor A | Fornecedor B |
|---|---:|---:|
| Preço da proposta | R$ 180.000 | R$ 152.000 |
| Frete e instalação | incluso | R$ 9.000 |
| Treinamento | incluso | R$ 4.000 |
| **Subtotal: aquisição** | **R$ 180.000** | **R$ 165.000** |
| Energia (5 × R$ 30.000 / 5 × R$ 36.000) | R$ 150.000 | R$ 180.000 |
| Manutenção preventiva (5 × R$ 6.000 / 5 × R$ 9.000) | R$ 30.000 | R$ 45.000 |
| Peças e consumíveis | R$ 12.000 | R$ 20.000 |
| Paradas não planejadas (produção perdida) | R$ 8.000 | R$ 24.000 |
| **Subtotal: operação, manutenção e risco** | **R$ 200.000** | **R$ 269.000** |
| Valor residual (subtrai) | -R$ 30.000 | -R$ 15.000 |
| **TCO em 5 anos** | **R$ 350.000** | **R$ 419.000** |

Conferindo as contas do A: 180.000 + 200.000 - 30.000 = 350.000. Do B:
165.000 + 269.000 - 15.000 = 419.000.

O fornecedor que era R$ 28.000 mais caro na proposta custa R$ 69.000 a menos em
cinco anos. Para usar como calculadora, copie a tabela, troque os componentes
que não se aplicam à sua compra e preencha as duas colunas com os seus números.

### Passo 5: testar a decisão

Antes de levar o resultado ao aprovador, vale perguntar qual componente decide a
escolha. Aqui, a energia responde por R$ 30.000 da diferença. Se a estimativa de
consumo do B estivesse errada e ele gastasse o mesmo que o A, o A ainda sairia
R$ 39.000 mais barato. A decisão sobrevive ao componente mais incerto, e é isso
que dá segurança para escolher a proposta mais cara.

Se a conclusão mudasse com um ajuste pequeno em um único componente, a resposta
honesta seria outra: os dois fornecedores empatam, e o desempate vem de prazo,
histórico ou relacionamento.

## Onde o cálculo de TCO costuma dar errado

- **Horizontes diferentes por fornecedor.** Comparar três anos de um com cinco
  de outro inverte o resultado sem ninguém perceber.
- **Dado interno inventado.** Consumo de energia, custo da hora parada e taxa de
  falha precisam vir da Manutenção, da Produção ou do Financeiro. Um número
  chutado na planilha vira argumento frágil na primeira pergunta do aprovador.
- **Promessa do fornecedor tratada como fato.** Consumo e intervalo de
  manutenção informados pelo fabricante são um ponto de partida; o histórico de
  quem já usa o equipamento é melhor.
- **TCO para tudo.** Calcular custo total de propriedade de caneta e papel
  consome horas que não mudam nenhuma decisão. Reserve o método para as compras
  em que o custo depois da entrega pesa.
- **Conta sem registro.** O TCO justifica a escolha só se ficar anexado ao
  processo, com as premissas escritas. Seis meses depois, a auditoria vai
  perguntar por que o fornecedor mais caro ganhou.

## Onde a IA entra

A parte trabalhosa do TCO é juntar as peças: ler cada proposta, achar o que
está incluso e o que é cobrado à parte, colocar tudo na mesma base. É o mesmo
trabalho de normalização do mapa de cotação. No [Nexo](/nexo), a IA lê os
anexos das propostas e monta o mapa comparativo, pontuando cada fornecedor por
preço, prazo e condições, e o Spend Analysis consolida o gasto por fornecedor,
categoria e período, que é de onde sai o histórico de compras para
as estimativas.

As premissas internas continuam com quem conhece a operação: o custo da hora
parada, a vida útil esperada, a taxa de desconto. E a decisão continua com o
comprador, que assina a escolha e o motivo dela.

<!-- faq -->

Se as suas cotações ainda chegam por e-mail e PDF e a comparação para no preço
da proposta, a IAgentics pode mostrar como o Nexo organiza esse processo dentro
da plataforma que a sua empresa já usa. [Vamos conversar](/#contato)
