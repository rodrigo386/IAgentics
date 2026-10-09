---
titulo: "Como começar com IA em Compras: onde colocar o primeiro agente"
descricao: "Uma análise de RFP que levava 8 horas por semana passou a levar 22 minutos. O que mudou não foi a tecnologia — foi escolher a etapa onde havia conciliação demais e decisão de menos."
slug: "como-comecar-com-ia-em-compras"
data: 2026-05-29
autor: "Rodrigo Costa"
categoria: "IA e agentes em Compras"
produto: "nexo"
status: "publicado"
titulo_linkedin: "8 horas viram 22 minutos. O que muda em Compras quando o agente entra na cadeia certa"
---

Em uma reunião com um Diretor de Compras no início de maio, ele abriu a
planilha que o time fechava toda quarta-feira. Análise de RFP de embalagem
flexível. Quatro fornecedores, cada um com sua planilha, sua spec, sua maneira
de listar preço.

Perguntei quanto tempo aquilo gastava.

> "8 horas. Toda semana."

Construímos juntos um assistente no Copilot da empresa. Levou de 8 a 16 horas de
setup, contando o tempo do time dele em treinamento. Resultado: o RFP da semana
seguinte saiu em **22 minutos**, com tabela limpa, ranking ponderado e uma
cláusula contratual que ninguém tinha visto até então.

Nas conversas que estamos tendo com clientes nas últimas semanas, esse tipo de
história aparece toda semana. Não como exceção — como padrão. E quase sempre com
a mesma pergunta no final: *"por que demoramos tanto pra fazer isso?"*.

A resposta não é tecnologia. A tecnologia está disponível há pelo menos 18
meses. A resposta é que **o agente raramente entra na cadeia certa.**

## Por que essas 8 horas existem em primeiro lugar

Vale entender de onde vem o tempo gasto antes de cortar. As 8 horas semanais que
aquele time passava em RFP não eram 8 horas de análise. Eram 8 horas de
**conciliação**.

Cada fornecedor mandava preço em formato diferente. Um em planilha, outro em
PDF, outro em apresentação. As specs vinham listadas em ordens diferentes. As
condições comerciais ficavam espalhadas em e-mails de follow-up.

A pessoa que abria o Excel não estava decidindo. **Estava traduzindo.** E
traduzir quatro propostas de formato heterogêneo para um formato comum demora
justamente isso: um dia útil de trabalho concentrado, semana após semana.

Quando o agente entra, ele não tira a decisão de quem decide. **Ele tira a
tradução.**

## O que aconteceu nos 22 minutos

A anatomia da implantação foi simples e vale documentar. Três passos de preparo:

1. Um agente salvo no Copilot, configurado com instruções específicas para
   análise de RFP.
2. Como contexto: a planilha histórica de fornecedores da empresa, os termos
   comerciais padrão e a política de aprovação.
3. O prompt que o time usaria toda semana, padronizado.

No dia da execução, o time fez três movimentos: subiu os PDFs das propostas no
chat do agente, rodou o prompt, revisou a saída.

Vinte e dois minutos depois, o time tinha tabela comparativa por dimensão,
ranking ponderado por custo total ajustado a risco, e três perguntas-chave
preparadas para os dois finalistas.

As sete horas e meia que sobraram naquela semana foram para a negociação real
com os finalistas. Não para escrever planilha.

## A conta que quase ninguém faz

O número que chama atenção é o 8 horas → 22 minutos. O número que decide o
investimento é outro, e sai dos mesmos dados.

| | |
|---|---|
| Setup, incluindo treinamento do time | 8 a 16 horas, uma vez |
| Economia por semana | ~7,5 horas |
| **Payback** | **entre 1 e 3 semanas** |

Vale dizer com todas as letras porque é incomum: **o custo de setup está
declarado**. A maior parte dos casos de IA publicados mostra o "depois" e omite
quanto custou chegar lá — e é justamente o "quanto custou" que um comitê de
orçamento pergunta primeiro.

Um piloto que se paga em três semanas não precisa de retórica. Precisa de ter
sido medido.

E o passo seguinte é o que separa piloto de plataforma: o que o time vai fazer
com as 7,5 horas que voltaram. Se a resposta for "mais RFPs por semana", o
ganho é de produtividade e para por aí. Se for "negociar de verdade com os
finalistas" — que foi o que aconteceu aqui —, o ganho é de resultado. Essa
distinção é o assunto de
[o que responder quando o CFO pergunta o ROI](/artigos/roi-de-ia-em-compras-o-que-responder-ao-cfo).

## O critério: mais conciliação do que decisão

O que torna essa história replicável não é o RFP. É o filtro que ela revela.

**Procure as tarefas em que o time gasta mais tempo traduzindo do que
decidindo.** É nelas que um agente rende, porque a tradução é trabalho de forma
— e forma é exatamente o que uma máquina faz bem. Decisão envolve critério,
contexto e responsabilidade, e continua onde estava.

Aplicado ao processo de compras, o filtro acende em pontos previsíveis:
requisição mal escrita que alguém traduz para código de material, propostas em
formatos diferentes que alguém normaliza, gasto disperso que alguém classifica
por categoria na mão. É o mesmo padrão que percorre
[os sete passos do processo de compras](/artigos/processo-de-compras-sete-passos-ia).

E vale notar onde o filtro **não** acende: escolher o fornecedor, definir o peso
de cada critério, decidir se vale pagar mais por prazo. Agente que entra aí não
está removendo tradução — está tomando decisão sem mandato, que é
[outra conversa](/artigos/agente-de-ia-em-compras-nao-e-agentic-commerce).

## Uma sequência para quem vai começar

Para a empresa que está em "queremos começar com IA em Compras, mas não sabemos
por onde":

**1. Defina o dono.** Não é o time de TI. Não é o consultor externo. É alguém de
dentro de Compras, com mandato claro. Estamos chamando essa função de **Líder de
Agentes de IA em Compras**. Pode acumular com o cargo atual, mas precisa existir
nominalmente — função sem nome não tem responsável.

**2. Mapeie 3 a 5 processos repetitivos.** O critério é o da seção anterior:
tarefas semanais com mais conciliação do que decisão. RFP é candidato natural.
Análise de spend, classificação de fornecedores e RFI são outros.

**3. Escolha o ambiente certo.** Se a empresa já paga Microsoft Enterprise,
comece pelo Copilot Studio. Os dados ficam no tenant do cliente, o IAM já está
configurado, as políticas de Conditional Access já existem. Não precisa subir
conector novo nem convencer o TI global a abrir firewall. A pergunta não é qual
ferramenta é melhor — é qual já está aprovada.

**4. Construa um agente por vez.** A tentação é fazer tudo de uma vez. O que
vemos funcionar é o oposto: um agente pequeno, um processo, um time, quatro
semanas. Mede. Ajusta. Replica.

**5. Documente o aprendizado.** Cada agente que entra em produção gera um
post-mortem de uma página: o que funcionou, o que precisou ser refeito, qual foi
o tempo real economizado. Sem isso, o segundo agente repete os erros do
primeiro — e o terceiro também.

## Por que este momento é diferente

Em maio de 2025, conversávamos com clientes sobre **se** a IA entraria no
processo. Em maio de 2026, a conversa é sobre **como**.

Vale revisitar o ponto inicial. O que mudou para o time daquele Diretor de
Compras não foi a tecnologia — ela já estava disponível. O que mudou foi a
escolha de onde colocar o agente: na etapa onde havia conciliação demais e
decisão de menos.

Onde no seu processo isso acontece hoje?

---

Se quiser começar pelos prompts, publicamos uma
[biblioteca de prompts para quem trabalha com Compras](/artigos/prompts-para-compras) —
com o aviso sobre dado sigiloso que precede o uso de qualquer um deles.

**Como podemos ajudar:** são 90 minutos para auditar onde no seu processo de
Compras o agente certo encurta o trabalho. Saímos da reunião com os três
processos-candidatos priorizados, a definição do ambiente (Microsoft, Google
Workspace ou outro) e o desenho do primeiro agente, com estimativa de tempo de
implantação e ROI esperado. [Fale com a gente](/#contato).
