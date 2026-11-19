---
titulo: "Base de cálculo do IBS e da CBS na nota fiscal: o que entra e o que sai"
tituloSeo: "Base de cálculo do IBS e da CBS na NF-e | IAgentics"
descricao: "Frete, seguro, desconto, ICMS e Imposto Seletivo: o que entra na base do IBS e da CBS, pela LC 214, com o exemplo da calculadora da Receita Federal."
slug: "base-de-calculo-ibs-cbs-nota-fiscal"
data: 2026-11-19
autor: "Rodrigo Costa"
categoria: "Sourcing e cotação"
produto: "nexo"
status: "publicado"
ordem: 3
faq:
  - pergunta: "Qual é a base de cálculo do IBS e da CBS?"
    resposta: "É o valor da operação, que compreende o valor integral cobrado pelo fornecedor a qualquer título, incluindo frete cobrado na operação, seguros, taxas, juros, multas, encargos e descontos condicionais (LC 214/2025, art. 12)."
  - pergunta: "O ICMS entra na base do IBS e da CBS?"
    resposta: "Não. De 2026 a 2032, o ICMS, o ISS, o PIS e a Cofins que incidem na operação ficam fora da base do IBS e da CBS (LC 214, art. 12, § 2º, V). O IPI e os descontos incondicionais também ficam fora."
  - pergunta: "O desconto reduz a base do IBS e da CBS?"
    resposta: "O desconto incondicional, sim: ele sai da base. O desconto concedido sob condição, como o de pagamento antecipado, continua dentro da base (LC 214, art. 12)."
  - pergunta: "O Imposto Seletivo entra na base do IBS e da CBS?"
    resposta: "Entra. Nos exemplos da calculadora oficial da Receita, a base do IBS e da CBS de um item com Imposto Seletivo é a base do Imposto Seletivo somada ao próprio imposto."
---

O IBS e a CBS são cobrados "por fora": a alíquota incide sobre uma base que
não inclui os próprios tributos. Saber o que entra nessa base é o primeiro
passo para conferir uma nota de fornecedor, e para comparar duas cotações que
trazem frete, desconto e impostos de jeitos diferentes.

## A regra da LC 214

A [Lei Complementar 214/2025, art. 12](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm),
diz que a base de cálculo é o valor da operação, e que esse valor
"compreende o valor integral cobrado pelo fornecedor a qualquer título".

| Entra na base | Sai da base |
|---|---|
| Valor dos produtos ou serviços | O próprio IBS e a própria CBS |
| Frete cobrado como parte da operação | IPI |
| Seguros e taxas | Descontos incondicionais |
| Juros, multas, acréscimos e encargos | ICMS, ISS, PIS e Cofins, de 2026 a 2032 |
| Descontos concedidos sob condição | |
| Imposto Seletivo, quando houver | |

A exclusão do ICMS, do ISS, do PIS e da Cofins vale enquanto eles existem, de
2026 a 2032 (art. 12, § 2º, V). O Imposto Seletivo entra na base, como mostram
os [exemplos da calculadora da Receita](https://github.com/ReceitaFederal/calculadora-rtc-regime-regular/blob/main/docs/exemplos.md).

## O exemplo da Receita Federal

A calculadora oficial da Receita traz um exemplo de nota fiscal de mercadoria
em 2027 que mostra a regra inteira. Os valores da nota:

| Campo da nota | Valor |
|---|---|
| Produtos | R$ 1.000,00 |
| Frete | R$ 50,00 |
| Seguro | R$ 20,00 |
| Outras despesas | R$ 10,00 |
| Desconto | R$ 50,00 |
| Imposto Seletivo | R$ 30,00 |
| ICMS | R$ 180,00 |
| Fundo de Combate à Pobreza (FCP) | R$ 10,00 |
| PIS e Cofins | R$ 55,50 |

A conta, passo a passo:

1. Produtos, frete, seguro e outras despesas, menos o desconto:
   1.000 + 50 + 20 + 10 - 50 = **R$ 1.030,00**.
2. Sai o ICMS e o FCP: 1.030 - 180 - 10 = **R$ 840,00**. Essa é a base do
   Imposto Seletivo.
3. Entra o Imposto Seletivo: 840 + 30 = **R$ 870,00**, a base do IBS e da CBS.

O PIS e a Cofins não entram na conta porque deixam de existir em 2027: a
calculadora da Receita avisa que esses campos "não compõem as bases para o ano
2027". Com a CBS de 11,2% e o IBS de 0,1% de 2027 (a referência de 11,3% do
[TCU](https://portal.tcu.gov.br/imprensa/noticias/tcu-calcula-aliquota-de-referencia-de-113-para-novo-tributo-sobre-consumo),
menos 0,1 ponto, mais o IBS dos arts. 344 e 347 da LC 214), a nota teria
R$ 97,44 de CBS e R$ 0,87 de IBS.

## O que isso muda na conferência da nota

- **Frete dentro ou fora da nota muda a base.** Frete cobrado pelo fornecedor
  na operação entra na base; frete contratado à parte, com transportadora, vira
  outra operação, com a nota dela.
- **Desconto com condição não reduz o imposto.** Desconto por pagamento
  antecipado, por exemplo, continua na base. Na negociação, prefira desconto
  incondicional, destacado na nota.
- **ICMS fora da base até 2032.** Se a nota de um fornecedor calcula IBS e CBS
  sobre o valor com ICMS, o imposto está a mais, e o crédito da sua empresa
  depende de uma correção.

Para comparar cotações pelo que sobra depois do crédito, use a
[calculadora de custo líquido da Reforma Tributária](/reforma-tributaria-compras);
para conferir a classificação de cada item, veja
[o que é cClassTrib](/artigos/o-que-e-cclasstrib).

<!-- faq -->
