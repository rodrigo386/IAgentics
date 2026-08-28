# Roadmap — IAgentics Academy

> **ENCERRADO EM 2026-08-28.** A IAgentics fechou parceria com o Pecege e a
> plataforma de ensino própria foi desligada: rotas `/app`, `/admin` e
> `/certificados` removidas, 14 tabelas dropadas (migração `0008`), `/cursos`
> convertida em aviso de "em breve". A educação online passa a ser construída
> em conjunto com o Pecege, em plataforma separada.
>
> **O documento fica no repositório de propósito.** Ele não descreve mais o
> que vamos construir, mas descreve **por que decidimos o que decidimos** — os
> cinco vazamentos do funil, o raciocínio de MRR versus receita única, o que
> foi descartado e sob que condição voltaria. Se a plataforma conjunta pedir
> essas mesmas escolhas, isto aqui poupa a discussão inteira.
>
> Só a Onda 1.2 (recuperação de inadimplência) chegou a ser construída, e foi
> removida junto com o resto.

Levantamento feito em 2026-08-23, cruzando o que a plataforma entrega hoje
(`app/app/`, `lib/plataforma/`, `lib/admin/`) com o que o mercado de área de
membros e de LMS corporativo considera obrigatório.

Complementa [PLANO-SEO.md](PLANO-SEO.md) e [PLANO-CONTEUDO.md](PLANO-CONTEUDO.md),
que cuidam da aquisição pelo site. Este cuida do produto que recebe essa visita.

## Sobre benchmarking

**Este documento não traz números de participação de mercado nem preço de
concorrente, e isso é deliberado** — mesma regra do plano de conteúdo. Dado de
mercado confiável vem de relatório pago; qualquer número aqui seria inventado, e
roadmap decidido em cima de número fabricado é pior que roadmap decidido sem
número nenhum.

O que este levantamento traz é o que dá para observar direto nos comparativos
públicos das plataformas: **qual feature toda concorrente tem, qual só as
maduras têm, e onde não tem ninguém.** A última categoria é a que interessa.

## As decisões que geraram este roadmap

Tomadas pelo Rodrigo em 2026-08-23. Elas explicam tanto o que entrou quanto o
que ficou de fora — sem elas o documento parece arbitrário.

| Decisão | Escolha | Consequência |
|---|---|---|
| Motor de receita nos próximos 6 meses | **Assinatura individual** (muitos, pequenos) | O jogo é churn, não compliance. Tudo que serve ao comprador corporativo desce de prioridade |
| Certificado | **Comprova conclusão**, como hoje | Sem quiz, sem nota, sem tentativas |
| IA dentro do produto | **Tutor de Compras por curso** | Vira a Onda 3 inteira, e depende de transcrição |
| Operação | **Só o Rodrigo, com pouco tempo** | Corta tudo que exige curadoria diária. O que entra precisa disparar sozinho |
| Aula-amostra | **Totalmente aberta**, sem pedir e-mail | Zero fricção, e a página passa a ter vídeo indexável |
| Acesso ao tutor | **Só assinante, ilimitado** | Com a base atual, o custo por token é irrelevante perto do valor de retenção |

## O estado atual, sem autoengano

A Academy hoje é uma área de membros competente:

- catálogo curso → módulo → aula, vídeo YouTube não listado com player próprio
  (`components/plataforma/PlayerAula.tsx`)
- progresso por aula com retomada, painel em trilhos
- certificado com página pública de verificação
- assinatura Asaas + contratos B2B com vagas e cursos por contrato
- admin com CRUD de conteúdo, alunos, empresas e métricas
- confirmação de e-mail e reset de senha

O que ela **não** é: um LMS corporativo. E, com a decisão de motor sendo
assinatura individual, ela não precisa ser.

## O benchmark é duplo

A Academy compete em dois mercados ao mesmo tempo, e eles pedem coisas opostas.

**Área de membros brasileira** — Hotmart Sparkle, Kiwify Members, Memberkit.
Interface tipo Netflix (já temos), app mobile, gamificação, comunidade,
comentários por aula, materiais para download. O diferencial deles é
**engajamento**.

**LMS corporativo** — Docebo, Twygo, TalentLMS. Avaliação com nota, trilha com
pré-requisito, relatório nominal para o RH, registro auditável, SCORM/xAPI,
carga horária comprovada, WCAG. O diferencial deles é **prova de que a empresa
treinou**.

O consenso dos guias de compra de 2026 sobre o mínimo obrigatório: múltiplos
formatos de conteúdo (não só vídeo), avaliações, trilhas personalizadas,
analytics de conclusão e mobile — mais de 75% dos alunos consomem parte do
treinamento no celular.

**A conclusão estratégica:** não vamos ganhar do Docebo em features de LMS, e
não precisamos. O caminho para ficar acima deles é profundidade de domínio
(Compras) mais IA aplicada de verdade dentro da experiência — o único terreno
onde uma consultoria de IA tem vantagem estrutural sobre uma edtech genérica.
Nenhuma área de membros brasileira tem um tutor ancorado no conteúdo.

## Os cinco vazamentos do funil hoje

Mapeados no código em 2026-08-23. Estão em ordem de custo, não de esforço.

1. **O visitante não consegue provar nada.** `lessons.gratuita` existe no
   modelo, mas só aparece dentro de `/app` logado. Para descobrir se o produto
   presta, a pessoa precisa criar conta — num funil de assinatura individual,
   provar antes de pagar É o funil.
2. **A confirmação de e-mail bloqueia o login** desde 2026-08-22. Correto do
   ponto de vista de segurança, mas é uma porta nova no caminho de todo cadastro
   e ninguém está medindo quantos não passam por ela.
3. **A inadimplência é tratada e ninguém é avisado.** `lib/asaas/webhook.ts:41`
   recebe `PAYMENT_OVERDUE`, marca o aluno como inadimplente, e o assunto morre
   ali. Sem e-mail, sem faixa no painel. Isso é churn **involuntário** — o
   cliente não decidiu sair, o cartão dele falhou.
4. **Só existem dois e-mails no sistema** (`lib/plataforma/email.ts`):
   confirmação e reset. O canal transacional nasceu ontem carregando só
   burocracia.
5. **Não existe agendador.** Nada de cron no Railway, nada no `package.json`.
   Nenhuma comunicação pode ser disparada por tempo decorrido.

---

# As quatro ondas

Ordem aprovada em 2026-08-23: vazamento → hábito → tutor → profundidade.

O raciocínio da ordem: não adianta encher um balde furado com uma feature cara.
Cada assinante conquistado depois da Onda 1 vale mais do que os conquistados
antes dela.

## Onda 1 · Parar de vazar

O melhor retorno do roadmap, e nada aqui é tecnicamente difícil.

### 1.1 Aula-amostra pública em `/cursos`

Vídeo tocando sem login, sem pedir e-mail. A trava de acesso já sabe distinguir
aula gratuita de aula paga (`lib/plataforma/dados.ts:264`) — falta a vitrine
pública, não a autorização.

Ganho secundário: a página passa a ter vídeo indexável, então esta entrega
também trabalha para o plano de SEO. Precisa de `VideoObject` no JSON-LD, saindo
de `lib/seo.ts` como todo o resto.

### 1.2 Recuperação de inadimplência

E-mail no `PAYMENT_OVERDUE` com link de pagamento, mais uma faixa no painel do
aluno enquanto o status for `inadimplente`. O webhook já identifica o evento; é
comunicação que falta, não detecção.

Justificativa: churn involuntário é o único churn que se recupera sem convencer
ninguém de nada.

### 1.3 E-mails por evento

Sem depender de agendador — todos disparam de uma ação que já acontece:

- boas-vindas, logo após a confirmação do e-mail
- assinatura ativada (hoje o aluno paga e o sistema fica em silêncio)
- certificado emitido, com o link público — é o e-mail que a pessoa encaminha
  para o chefe, então ele trabalha como aquisição

### 1.4 Funil instrumentado no admin

Visitante → conta criada → e-mail confirmado → assinante → primeira aula
assistida → ativo nos últimos 30 dias.

Sem isso, o efeito do bloqueio por confirmação (vazamento 2) é invisível: o
painel mostraria menos assinantes sem dizer que a causa foi e-mail em spam.

## Onda 2 · Hábito

Retenção que não consome tempo do Rodrigo, porque tudo dispara sozinho.

- **2.1 Agendador** — cron no Railway. Infra que destrava o resto da onda.
  Primeira entrega obrigatoriamente, as outras dependem dela.
- **2.2 E-mail de retomada** — parou há 7 dias, recebe "você parou em *[aula]*"
  com link direto. `lessonProgress.updatedAt` já guarda o último toque.
- **2.3 E-mail de curso novo publicado** — dispara na virada de
  `courses.publicado`.
- **2.4 Sequência de dias e marcos**, automáticos e privados. **Sem ranking**:
  com a base atual, ranking desmotiva quem está em último e não motiva ninguém.
- **2.5 PWA instalável** com retomada — o consumo é majoritariamente no celular
  e hoje não há nada além de layout responsivo.

## Onda 3 · O diferencial

A ordem interna aqui não é negociável: sem transcrição o tutor alucina, porque
não teria o que citar.

- **3.1 Transcrição das aulas**, gerada no admin e salva no banco. Entrega
  legendas de brinde — acessibilidade que hoje não existe.
- **3.2 Tutor de Compras por curso** — responde dúvidas ancorado nas
  transcrições e nos artigos de `content/artigos/`, citando aula e minuto.
  Só assinante, ilimitado.
- **3.3 Busca dentro da aula** pela transcrição.

O tutor não é só retenção: é a demonstração viva da tese que a IAgentics vende.
Um comprador que conversa com um agente de IA sobre tail spend dentro da escola
já entendeu o produto de consultoria sem ninguém ter apresentado.

## Onda 4 · Profundidade

- **4.1 Materiais por aula** — PDF, planilha, biblioteca de prompts. Numa escola
  de Compras, o material aplicável é metade do valor entregue.
- **4.2 Anotações do aluno**
- **4.3 Busca no catálogo**

---

## O que fica de fora, de propósito

Registrado com o motivo, para não voltar à pauta por esquecimento.

| Fora | Por quê | Volta quando |
|---|---|---|
| **Quiz e avaliação com nota** | O certificado comprova conclusão por decisão de 2026-08-23. Em B2C, prova reduz taxa de conclusão | Um contrato B2B exigir registro de aprendizado |
| **Comunidade e fórum** | Exige moderação diária que não existe. É a feature que mais aparece nos comparativos e a que mais morre vazia | Houver alguém para moderar |
| **Área do gestor B2B** (etapa 3) | Já desenhada e adiada em 2026-08-22. Com o motor sendo assinatura individual, desceu mais um degrau | Um cliente com contrato pedir |
| **SCORM / xAPI** | Só importa para integrar ao LMS de um cliente grande | Aparecer na mesa de negociação |
| **App nativo** | PWA resolve o problema real (2.5) por uma fração do custo | Nunca, provavelmente |
| **Ranking social e gamificação competitiva** | Base pequena demais; o efeito é negativo | A base justificar |

## Fontes do benchmarking

Comparativos públicos consultados em 2026-08-23:

- [Corporate LMS Features: The 2026 Buyer's Guide](https://www.atrixware.com/blog/wp/corporate-lms-features-the-2026-buyers-guide-to-must-have-capabilities/)
- [17 Best Corporate Learning Management Systems (LMS) 2026 — Whatfix](https://whatfix.com/blog/corporate-learning-management-systems/)
- [Learning Management System Features: What Your LMS Must Have in 2026 — Eubrics](https://www.eubrics.com/blogs/lms-features-2026)
- [Essential LMS Features — D2L](https://www.d2l.com/blog/lms-features/)
- [Hotmart ou Kiwify: qual escolher em 2026 — EngagED](https://engaged.com.br/blog/hotmart-ou-kiwify-qual-escolher/)
- [MemberKit: análise completa 2026 — bit4learn](https://bit4learn.com/pt/lms/memberkit/)
- [Comparativo Hotmart, Kiwify, Eduzz e Braip — Synchro Hub](https://www.synchrohub.com.br/blog/comparativo-hotmart-kiwify-eduzz-braip-plataformas/)
