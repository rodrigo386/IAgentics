---
titulo: "Os 7 passos do processo de compras — e o que a IA faz em cada um"
descricao: "Da requisição ao pedido no ERP: onde cada etapa do processo de compras trava na prática, e o que dá para delegar a uma IA em cada uma delas."
slug: "processo-de-compras-sete-passos-ia"
data: 2026-08-20
autor: "Rodrigo Costa"
categoria: "Sourcing e cotação"
produto: "nexo"
status: "publicado"
ordem: 2
---

Todo mundo que trabalha com Compras já viu o fluxograma. Requisição, aprovação,
cotação, negociação, pedido. Sete caixas, sete setas, uma página de PowerPoint.

O fluxograma é honesto sobre a sequência e desonesto sobre a experiência. Ele
não mostra que a caixa 2 é onde uma requisição fica cinco dias parada porque o
aprovador está de férias e ninguém configurou o substituto. Não mostra que a
caixa 3 é onde o comprador manda dezoito e-mails e recebe onze respostas. Não
mostra que a caixa 5 é onde alguém monta um comparativo no Excel às sete da
noite porque as propostas vieram em três formatos diferentes.

O processo de compras não trava por falta de desenho. Trava nos intervalos entre
as caixas — e é exatamente aí que uma IA tem o que fazer.

Abaixo, os sete passos, o que cada um é como disciplina, onde cada um quebra na
prática, e o que hoje é razoável delegar a uma máquina.

## 1. Abertura da requisição

**O que é.** Alguém fora de Compras precisa de alguma coisa e formaliza esse
pedido.

**Onde quebra.** O requisitante não fala a língua de Compras. Ele sabe que
precisa de "aquele filtro da bomba do setor 3", não do código do material, da
conta contábil ou do centro de custo. Então ou preenche errado, ou preenche pela
metade, ou desiste e liga para um comprador conhecido — o que abre a porta para
a compra fora do processo, o *maverick buying*.

Cada campo obrigatório que o requisitante não entende é um incentivo a
contornar o sistema.

**O que a IA faz.** Recebe a descrição em linguagem natural — "o filtro da bomba
do setor 3 furou, preciso de dois" — e traduz para a estrutura que Compras
precisa: material, quantidade, categoria, centro de custo. Depois confere se
falta alguma coisa **antes** de a requisição entrar na fila, em vez de a
requisição voltar dois dias depois com um "faltou o centro de custo".

A diferença não é digitar menos. É que o formulário deixa de ser um obstáculo
entre a necessidade e o registro dela.

## 2. Triagem e aprovação

**O que é.** A requisição é classificada e segue para quem tem alçada para
aprová-la.

**Onde quebra.** Aqui mora a maior parte do tempo morto do processo. Requisição
classificada na categoria errada vai para o aprovador errado, que devolve — ou
pior, aprova. Alçada mal resolvida gera dois extremos igualmente ruins: ou tudo
sobe para o diretor, e ele vira gargalo de tudo, ou nada sobe, e o controle é
ficção.

E há o problema silencioso: ninguém audita requisição. Se um pedido de R$ 4.900
aparece toda semana num limite de alçada de R$ 5.000, é improvável que alguém
note.

**O que a IA faz.** Classifica por categoria a partir do conteúdo, não do que o
requisitante escolheu no menu. Define a cadeia de aprovação por alçada. E audita
o próprio pedido: valor fora do padrão histórico, fracionamento suspeito,
duplicidade com uma requisição aberta na semana passada.

Esse último ponto é o que costuma pagar o projeto sozinho. Auditoria de 100% das
requisições é algo que nenhuma equipe humana faz — não por incompetência, por
volume.

## 3. Seleção de fornecedores e RFQ

**O que é.** Definir quem vai ser convidado a cotar e disparar a solicitação.

**Onde quebra.** O comprador convida quem ele conhece. Não por má-fé: por
economia de esforço. Buscar fornecedor novo custa tempo — cadastro, homologação,
risco de não responder. Então a lista de convidados de hoje é parecida com a de
três anos atrás, e a empresa nunca descobre o preço de mercado real.

A base cadastrada, enquanto isso, tem centenas de fornecedores que ninguém
lembra que existem.

**O que a IA faz.** Varre a base cadastrada por categoria e histórico — inclusive
fornecedores esquecidos — e busca candidatos novos fora dela. Depois dispara a
solicitação de cotação para a lista.

A decisão de quem entra continua sendo humana. O que muda é que ela passa a ser
tomada sobre uma lista construída por critério, não por memória.

## 4. Recebimento das propostas

**O que é.** O fornecedor responde com preço, prazo e condições.

**Onde quebra.** Neste ponto quase todo processo digital vira analógico de novo.
A proposta chega por e-mail, em PDF, em planilha, no corpo da mensagem, às vezes
em foto de papel timbrado. Alguém redigita tudo.

E quando existe um portal, ele costuma ter o defeito de exigir cadastro e senha.
Fornecedor pequeno não cria conta em portal para responder uma cotação de
R$ 2.000 — ele simplesmente não responde. A empresa acha que recebeu poucas
propostas por falta de interesse; recebeu poucas por atrito.

**O que a IA faz.** Aqui, sinceramente, o ganho maior não é de IA — é de
arquitetura: convite por link, sem conta e sem senha, com formulário e anexo.
Onde a IA entra é logo depois, no passo 5, lendo o que chegou.

Vale registrar isso com todas as letras porque é onde muito projeto de "IA em
Compras" se perde: parte do problema não é inteligência, é fricção. Colocar um
modelo de linguagem para ler PDF mal escaneado é resolver com IA um problema que
não deveria existir.

## 5. Análise comparativa e negociação

**O que é.** Comparar o que chegou e melhorar as condições.

**Onde quebra.** A comparação honesta é mais difícil do que parece. Um fornecedor
cota com frete incluso, outro não. Um dá 30 dias, outro 15 com desconto. Um
propõe marca equivalente. Colocar isso lado a lado exige normalizar tudo — e é
trabalho manual, chato, feito sob pressão de prazo. É onde entra erro de conta.

Na negociação, o problema é outro: o comprador negocia bem o contrato grande e
não negocia nada no contrato pequeno, porque não tem tempo. O resultado é uma
carteira com dois regimes.

**O que a IA faz.** Lê os anexos, extrai as condições e monta o mapa comparativo
já normalizado, com pontuação por critério. E sugere a próxima mensagem de
negociação — com o argumento disponível, o histórico daquele fornecedor e o
comparativo na mão.

A palavra importante é *sugere*. Quem decide a estratégia e assume o
relacionamento é o comprador. O que a máquina remove é a preparação, não o
julgamento.

## 6. Seleção e aprovação final

**O que é.** Escolher a proposta vencedora e registrar a decisão.

**Onde quebra.** A escolha é feita e a justificativa não é registrada. Seis meses
depois, na auditoria ou numa troca de time, ninguém sabe por que o segundo mais
barato ganhou. Pode ter sido prazo, qualidade, capacidade de entrega — todos
motivos legítimos — mas sem registro vira suspeita.

Compras é uma área que vive sob desconfiança estrutural. Trilha de decisão não é
burocracia: é o que protege o comprador.

**O que a IA faz.** Garante que a aprovação carregue nome, motivo e data, e que
isso fique no histórico junto com o mapa comparativo que embasou a escolha. Não
é a parte glamourosa do processo. É a que evita problema.

## 7. Pedido de compra no ERP

**O que é.** A ordem de compra nasce e vai para o sistema onde ela vira
compromisso financeiro.

**Onde quebra.** Redigitação. A RC, a cotação vencedora e as condições
negociadas existem em algum lugar, e alguém transcreve tudo de novo para o ERP.
Cada transcrição é uma chance de erro — e erro em OC vira divergência de nota
fiscal três semanas depois, quando o rastro já esfriou.

**O que a IA faz.** Consolida requisição, RFQ e proposta vencedora numa OC
pronta para o ERP. O documento nasce dos dados que já existiam, em vez de nascer
de alguém lendo uma tela e digitando em outra.

## O que não se automatiza

Vale terminar por aqui, porque o entusiasmo com IA em Compras costuma prometer
demais.

**A relação com o fornecedor não se automatiza.** A conversa difícil, o pedido de
prazo excepcional, a construção de confiança que faz alguém atender numa
emergência — isso é humano e continua humano.

**O critério não se automatiza.** A máquina calcula o comparativo; a decisão de
que qualidade vale 20% do peso e prazo vale 30% é da empresa.

**E a responsabilidade não se automatiza.** Quem assina continua assinando.

O que os sete passos acima mostram é outra coisa: a maior parte do tempo de um
comprador não é gasta em nenhuma dessas três. É gasta traduzindo pedido mal
escrito, perseguindo aprovação, redigitando proposta e montando planilha. É esse
tempo que volta.

---

*A IAgentics desenvolve agentes de IA para o processo de compras. O
[Nexo](/nexo) implementa os sete passos acima dentro do Desk Manager.*
