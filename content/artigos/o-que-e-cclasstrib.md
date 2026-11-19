---
titulo: "O que é cClassTrib e por que Compras precisa conferir"
tituloSeo: "O que é cClassTrib: guia para Compras | IAgentics"
descricao: "cClassTrib é o código que diz como o IBS e a CBS incidem em cada item da nota. Veja como ler, exemplos reais e o que conferir na nota de entrada."
slug: "o-que-e-cclasstrib"
data: 2026-11-19
autor: "Rodrigo Costa"
categoria: "Sourcing e cotação"
produto: "nexo"
status: "publicado"
ordem: 2
faq:
  - pergunta: "O que é cClassTrib?"
    resposta: "É o código de classificação tributária do IBS e da CBS, com seis dígitos, informado em cada item da nota fiscal eletrônica. Ele diz qual tratamento o item recebe: tributação integral, alíquota reduzida, isenção, suspensão, diferimento e outros, com o fundamento legal de cada um."
  - pergunta: "Qual a diferença entre CST e cClassTrib?"
    resposta: "O CST (código de situação tributária) de IBS e CBS tem três dígitos e diz a situação geral, como 000 (tributação integral) ou 200 (alíquota reduzida). O cClassTrib detalha o caso dentro dessa situação, e os três primeiros dígitos dele repetem o CST: 200003 é um caso de alíquota reduzida, o da cesta básica."
  - pergunta: "Onde consultar a tabela de cClassTrib?"
    resposta: "A tabela oficial é publicada pelo governo e muda com frequência. A calculadora da Receita Federal, publicada no GitHub com código aberto, traz a tabela vigente com os NCMs e NBSs vinculados a cada classificação."
  - pergunta: "O que acontece se o fornecedor usar o cClassTrib errado?"
    resposta: "O imposto da nota sai errado, para mais ou para menos, e o crédito de quem compra fica em risco. A calculadora da Receita recusa, por exemplo, item cujo NCM não está vinculado ao cClassTrib informado. Na nota de entrada, conferir o cClassTrib é conferir o crédito."
---

Toda nota fiscal emitida no novo sistema carrega, em cada item, um código de
seis dígitos que decide quanto IBS e CBS aquele item paga: o **cClassTrib**,
código de classificação tributária. Para quem vende, é obrigação de emissão.
Para quem compra, é onde mora o crédito: se o código estiver errado, o imposto
da nota está errado, e o crédito que a sua empresa espera recuperar também.

## Como ler um cClassTrib

O código tem duas partes. **Os três primeiros dígitos são o CST**, o código de
situação tributária do IBS e da CBS, que diz a situação geral do item. Os três
últimos detalham o caso dentro dessa situação. Na tabela da
[calculadora oficial da Receita Federal](https://github.com/ReceitaFederal/calculadora-rtc-regime-regular),
todas as classificações vigentes seguem essa regra.

Alguns CSTs que aparecem com frequência em compras de empresa:

| CST | Situação |
|---|---|
| 000 | Tributação integral |
| 200 | Alíquota reduzida |
| 410 | Imunidade e não incidência |
| 550 | Suspensão |
| 620 | Tributação monofásica |

## Exemplos reais da tabela

Cinco classificações da tabela usada pela calculadora da Receita, com a
redução que cada uma aplica sobre a alíquota de IBS e CBS:

| cClassTrib | O que cobre | Redução |
|---|---|---|
| 000001 | Situações tributadas integralmente pelo IBS e pela CBS | nenhuma |
| 200052 | Prestação de serviços de profissões intelectuais | 30% |
| 200028 | Fornecimento dos serviços de educação (Anexo II) | 60% |
| 200035 | Produtos de higiene pessoal e limpeza (Anexo VIII) | 60% |
| 200003 | Produtos destinados à alimentação humana (Anexo I) | 100% |

A redução muda o preço que importa. Com a CBS de 11,3% e o IBS de 18,7%
estimados para 2033, um item de base R$ 1.000,00 paga R$ 300,00 de IBS e CBS
sem redução, R$ 210,00 com 30% e R$ 120,00 com 60%. Esses valores foram
calculados na própria calculadora da Receita, rodando com as alíquotas
estimadas.

## Por que Compras precisa conferir

Cada classificação vale só para os itens vinculados a ela. A calculadora da
Receita recusa a nota quando o NCM do item não está ligado ao cClassTrib
informado, com o erro "NCM não vinculada à Classificação Tributária"
([exemplos da Receita](https://github.com/ReceitaFederal/calculadora-rtc-regime-regular/blob/main/docs/exemplos.md)).
Na prática, isso dá três conferências na nota de entrada:

1. **O cClassTrib combina com o item?** Um sabonete com classificação de
   tributação integral está pagando imposto a mais, e o fornecedor pode estar
   cobrando isso no preço.
2. **A redução aplicada é a da classificação?** Redução errada, para mais
   ou para menos, deixa o imposto da nota errado, e o crédito da sua empresa
   passa a depender de uma correção do fornecedor.
3. **O código ainda é vigente?** A tabela muda. Só entre outubro e dezembro de
   2025 a calculadora da Receita registrou três atualizações da tabela de
   classificação, conforme o
   [histórico do repositório](https://github.com/ReceitaFederal/calculadora-rtc-regime-regular/tree/main/flyway/sql/manutencao).

Para ver a classificação e a redução de um item, use a
[consulta de NCM na Reforma Tributária](/consulta-ncm-cclasstrib), feita com a
tabela da calculadora da Receita.

## O que pedir ao fornecedor

Na homologação ou na próxima cotação, peça ao fornecedor a classificação de
cada item que ele vende para você: NCM (ou NBS, no serviço), CST e cClassTrib.
Com essa lista, o cadastro de materiais ganha a coluna que vai dizer quanto de
crédito esperar de cada compra, e o [mapa de cotação](/artigos/o-que-e-mapa-de-cotacao)
passa a comparar o custo líquido.

Se o fornecedor for do Simples Nacional, a conta do crédito muda: veja
[como comparar cotações com fornecedor do Simples](/artigos/fornecedor-do-simples-na-reforma-tributaria)
e faça a conta com as suas cotações na
[calculadora de custo líquido](/reforma-tributaria-compras).

<!-- faq -->
