---
titulo: "Spend analysis em 30 dias: um roteiro semana a semana"
tituloSeo: "Spend analysis em 30 dias: roteiro semanal | IAgentics"
descricao: "Roteiro de spend analysis em quatro semanas: extrair, limpar, classificar e analisar o gasto até a primeira leitura confiável de Compras."
slug: "spend-analysis-em-30-dias"
data: 2026-10-09
autor: "Rodrigo Costa"
categoria: "Spend e tail spend"
produto: "spend-lab"
status: "agendado"
publicarEm: 2026-10-10
faq:
  - pergunta: "O que é spend analysis?"
    resposta: "Spend analysis é o processo de reunir todo o gasto da empresa com fornecedores, limpar e padronizar esses dados, classificar cada compra por categoria e analisar o resultado para encontrar oportunidades de consolidação, negociação e conformidade."
  - pergunta: "Dá para fazer spend analysis em 30 dias?"
    resposta: "Dá para fazer o primeiro ciclo em 30 dias quando o escopo é controlado: um período de 12 meses, as fontes principais de gasto e uma taxonomia simples. O resultado é uma primeira leitura confiável, que depois vira rotina com atualização periódica."
  - pergunta: "Preciso de um software específico para começar?"
    resposta: "Para o primeiro ciclo, uma extração do ERP, uma planilha ou banco de dados e uma regra clara de classificação bastam. Ferramenta dedicada faz sentido quando a análise vira rotina e o volume de linhas torna a revisão manual inviável."
  - pergunta: "Como saber se a análise de gastos é confiável?"
    resposta: "Três testes ajudam: o total da base bate com o total contábil do período, dentro de uma diferença explicada; os fornecedores duplicados foram unificados; e a parcela do valor classificada por categoria é alta, com o restante identificado como pendente e não escondido em 'outros'."
---

Toda área de Compras já ouviu a pergunta "quanto a gente gasta com isso?" e
percebeu que a resposta dependia de quem fosse buscar o número. O ERP diz uma
coisa, a planilha do comprador diz outra, a contabilidade fecha um terceiro
valor. Spend analysis existe para acabar com essa conversa.

O problema é que o assunto costuma ser apresentado como projeto grande: meses
de consultoria, ferramenta cara, taxonomia com quatro níveis. Muita empresa
desiste antes de começar. Este texto propõe um caminho mais curto: um roteiro
de quatro semanas para sair do zero até a primeira análise de gastos em que
você confia o suficiente para levar a uma reunião de diretoria.

## O que é spend analysis

**Spend analysis é o processo de reunir todo o gasto com fornecedores, limpar
e padronizar os dados, classificar cada compra por categoria e analisar o
resultado para encontrar oportunidades.**

As quatro etapas desta definição viram as quatro semanas do roteiro. A ordem
importa: classificar antes de limpar gera categoria errada, e analisar antes de
classificar gera conclusão errada.

## Antes da semana 1: decida o escopo

Trinta dias só funcionam com escopo fechado. Antes de abrir qualquer planilha,
responda por escrito a três perguntas:

- **Qual período?** Doze meses fechados é o padrão. Cobre a sazonalidade e é
  curto o bastante para o cadastro de fornecedores não ter mudado demais.
- **Quais fontes?** Comece pelas que concentram o valor: notas fiscais de
  entrada, pedidos de compra do ERP e, se existir, a fatura do cartão
  corporativo. Reembolsos e fundo fixo podem ficar para o segundo ciclo, desde
  que você registre que ficaram de fora.
- **Qual pergunta de negócio?** "Onde estão as três maiores oportunidades de
  consolidação?" é uma boa pergunta para o primeiro ciclo. "Tudo sobre o nosso
  gasto" leva a um projeto que nunca termina.

Defina também um dono. Spend analysis sem responsável vira arquivo esquecido
numa pasta compartilhada.

## Semana 1: extrair e consolidar

O objetivo da primeira semana é ter uma base única, com todas as fontes no
mesmo formato, e saber se o total dela bate com o total da contabilidade.

**Extraia os campos mínimos** de cada fonte: data, fornecedor (razão social e
CNPJ), descrição do item, quantidade, valor, centro de custo, comprador ou
requisitante e, quando houver, o código do material e o NCM. Campo que não
existe numa fonte fica vazio; campo inventado depois contamina a análise.

**Empilhe tudo numa tabela só**, com uma coluna que diga de qual fonte veio
cada linha. Essa coluna parece detalhe e resolve metade das dúvidas da semana
4.

**Reconcilie com o contábil.** Some o valor da base e compare com o total de
compras que a contabilidade reconhece no período. Uma diferença sempre vai
existir. Ela precisa ter explicação: lançamentos fora do ERP, impostos tratados
de forma diferente, devoluções. Diferença sem explicação é sinal de fonte
faltando ou de linha duplicada.

## Semana 2: limpar fornecedores e padronizar

Aqui mora a etapa menos visível e mais decisiva. A mesma empresa aparece no
cadastro como "ACME LTDA", "Acme Ltda.", "ACME COMERCIO" e com três códigos
diferentes, porque foi cadastrada por três filiais em três anos.

**Unifique fornecedores pelo CNPJ raiz** (os oito primeiros dígitos), que
agrupa matriz e filiais. Onde o CNPJ faltar, compare nome normalizado (sem
acento, sem pontuação, sem "LTDA", "S.A." e "ME") e revise os casos duvidosos
à mão. Guarde uma tabela de correspondência entre o código original e o
fornecedor unificado: ela é o início do seu master data de fornecedores.

**Padronize unidades e moedas.** Caixa com 12, pacote com 100 e unidade
avulsa precisam ser convertidos para a mesma base antes de qualquer comparação
de preço.

**Marque linhas que não são gasto com fornecedor**: transferências entre
empresas do grupo, impostos lançados como compra, estornos. Elas saem da
análise com uma etiqueta, e nunca apagadas, para que a reconciliação da semana
1 continue fechando.

## Semana 3: classificar por categoria

Com a base limpa, cada linha recebe uma categoria. Duas decisões definem a
qualidade do resultado.

**Use uma taxonomia curta.** Para o primeiro ciclo, dois níveis bastam: um
nível de família (por exemplo, "Manutenção industrial") e um de categoria
("Rolamentos", "Lubrificantes", "Serviços de usinagem"). Padrões como o UNSPSC
servem de referência, e a taxonomia final deve refletir como a sua empresa
negocia: categoria boa é aquela que tem um comprador responsável.

**Classifique pelo valor, de cima para baixo.** Ordene os fornecedores pelo
gasto e comece pelos maiores. Um fornecedor de usinagem que vende só usinagem
classifica centenas de linhas de uma vez. Os distribuidores que vendem de tudo
exigem classificação linha a linha, pela descrição do item.

É nessa classificação linha a linha que a IA mudou o custo do trabalho. Um
modelo de linguagem lê descrições livres ("ROL 6205 2RS SKF", "rolamento
rígido de esferas 6205") e propõe a categoria com bem menos esforço do que a
leitura humana de milhares de linhas. A proposta precisa de revisão: separe uma
amostra por categoria, confira e ajuste a regra quando o erro se repetir.

**Meça a cobertura** em duas métricas: a parcela do valor classificada e a
parcela das linhas classificadas. A primeira importa mais para a decisão. O que
sobrar vai para uma categoria explícita, "a classificar", e nunca para
"outros", que é onde dado ruim se esconde.

## Semana 4: analisar e escolher três oportunidades

Com o gasto consolidado, limpo e classificado, as perguntas que antes levavam
semanas passam a levar minutos. Concentre a última semana em quatro leituras:

1. **Curva ABC por fornecedor e por categoria.** Mostra onde está o valor e
   onde está a cauda. Para entender a cauda, veja o
   [guia de tail spend](/artigos/tail-spend-guia-em-portugues).
2. **Fornecedores por categoria.** Categoria com dezenas de fornecedores para
   o mesmo tipo de item é candidata natural a consolidação.
3. **Variação de preço do mesmo item.** O mesmo material comprado por preços
   muito diferentes no mesmo período aponta falta de contrato ou de catálogo.
4. **Gasto sem pedido ou fora de contrato.** Indica onde o processo está sendo
   contornado, o chamado maverick buying.

Termine o mês com três oportunidades, cada uma com o valor da categoria, o
problema observado e o próximo passo proposto. Três oportunidades bem
documentadas movem mais a diretoria do que vinte gráficos.

## Exemplo: a primeira análise de uma metalúrgica

*Exemplo ilustrativo, com empresa e números fictícios.*

A Metalúrgica Alfa, indústria de médio porte com três plantas, decidiu fazer
seu primeiro ciclo de spend analysis com doze meses de notas fiscais de entrada
e pedidos do ERP.

**Semana 1.** A base consolidada ficou com 24.000 linhas e R$ 60,0 milhões. A
contabilidade reconhecia R$ 61,2 milhões de compras no período. A diferença de
R$ 1,2 milhão (2%) foi explicada: eram gastos de cartão corporativo e
reembolsos, lançados fora do ERP, que ficaram registrados como fora do escopo
do primeiro ciclo.

**Semana 2.** O cadastro tinha 1.400 códigos de fornecedor. Depois da
unificação por CNPJ raiz e nome, sobraram 1.120 fornecedores: 280 códigos eram
duplicados.

**Semana 3.** Com a taxonomia de dois níveis e classificação assistida por IA,
revisada por amostragem, o time chegou a 96% do valor e 88% das linhas
classificados. Os 4% restantes do valor (R$ 2,4 milhões) ficaram identificados
como "a classificar".

**Semana 4.** A categoria de EPI somava R$ 1,8 milhão, distribuído entre 37
fornecedores. A mesma luva de proteção aparecia comprada por preços entre
R$ 9,00 e R$ 14,00 o par, dependendo da planta. A Metalúrgica Alfa levou à
diretoria três oportunidades: consolidar EPI, criar catálogo para os itens de
manutenção mais recorrentes e revisar o gasto sem pedido de uma das plantas.

Nenhuma economia foi prometida nessa reunião. O que a diretoria recebeu foi um
número em que todos confiavam e três frentes priorizadas para o trimestre.

## Os erros que derrubam o primeiro ciclo

- **Querer todas as fontes de uma vez.** Fonte pequena e bagunçada consome a
  semana de quem deveria estar limpando as fontes grandes.
- **Pular a reconciliação.** Sem ela, a primeira pessoa que questionar o total
  derruba a credibilidade da análise inteira.
- **Taxonomia longa demais.** Quatro níveis de categoria no primeiro ciclo
  significam muita linha mal classificada no último nível.
- **Tratar a análise como evento.** O valor aparece quando a base é atualizada
  com frequência definida, mensal ou trimestral, e a comparação entre períodos
  mostra se as ações funcionaram.

## Onde isso se encaixa numa estratégia de IA

A classificação assistida por IA da semana 3 costuma ser o primeiro contato de
muitos times de Compras com IA aplicada a dados reais. Quando a empresa quer
ir além do piloto, entra a pergunta de método: quais dados estão prontos, quais
ferramentas estão em uso, quais casos de uso priorizar e com que governança.

O [IA Spend Lab](/spend-lab) é a solução da IAgentics Academy que combina
aprendizagem, consultoria, diagnóstico de maturidade e formação aplicada para
usar IA com propriedade, governança e resultados. O programa trabalha, entre
outros temas, o diagnóstico de maturidade, a priorização de casos de uso e a
estruturação de dados e prompts para uso consistente da IA.

<!-- faq -->

Se a sua área de Compras quer fazer o primeiro ciclo de spend analysis e não
sabe por onde começar, a IAgentics pode ajudar a desenhar o escopo e o método.
[Vamos conversar](/#contato)
