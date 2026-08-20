# Direito de acesso por curso — spec

Etapa 1 de 4 da venda B2B em grupo (decomposição em
[Contexto](#contexto-por-que-esta-etapa-existe-sozinha)).

**Objetivo:** trocar o portão de acesso booleano (`temAcesso(userId)`, que vale
para o acervo inteiro) por direito **por curso**, preservando exatamente o
comportamento atual e sem tocar no schema.

**Não-objetivo:** nada de B2B. Nenhuma empresa, contrato, vaga, gestor ou
relatório entra nesta etapa.

## Contexto: por que esta etapa existe sozinha

O pedido original é vender acesso em grupo para clientes B2B, cobrado fora do
Asaas. Na conversa de levantamento (2026-08-20) o Rodrigo definiu:

- ele cria o grupo e a carga inicial de e-mails; **o gestor do cliente mantém
  as vagas** no dia a dia
- vigência **opcional** — alguns contratos com prazo, outros sem
- o gestor vê progresso **nome a nome**
- **o contrato dá acesso a cursos específicos**, não ao acervo inteiro
- o valor do contrato entra nas métricas junto com o Asaas

A última decisão de escopo é a que obriga esta etapa. Hoje o acesso é
tudo-ou-nada, e **12 arquivos** tocam a área de acesso/assinatura — dos quais
**6 chamam `temAcesso` diretamente** (os outros já usam `buscarAssinatura` ou
uma variável local, e são comerciais por natureza: não mudam). O caminho pago em
produção passa por esses 6. Misturar essa refatoração com schema novo, telas novas e
papel de usuário novo é somar o maior risco ao maior volume.

O trabalho foi quebrado em quatro:

| | Entrega | Depende de |
|---|---|---|
| **1** | **Direito de acesso por curso** (este spec) | — |
| 2 | Contrato B2B: empresa, contrato, vagas, membros, importação | 1 |
| 3 | Área do gestor: papel novo, gestão de vagas, relatório nome a nome | 2 |
| 4 | Receita B2B somada ao MRR no painel | 2 |

Com 1 e 2 prontas o produto já é vendável — o Rodrigo administra as vagas pelo
`/admin`. 3 e 4 melhoram a operação, não destravam a venda.

## O problema, em duas partes

### Parte 1: duas perguntas com uma resposta só

Hoje `temAcesso(userId)` responde a duas perguntas diferentes:

| Pergunta | Quem faz hoje |
|---|---|
| **"É assinante?"** — status comercial | `/app/conta`, `lib/admin/metricas.ts`, `lib/admin/alunos.ts`, `app/admin/alunos/[id]`, `components/admin/AcoesRapidas.tsx`, `lib/asaas/assinatura.ts`, `/app/assinar`, `/cursos` |
| **"Pode assistir a este curso?"** — acesso | `buscarMidia`, `podeVerAula`, portão de escrita de progresso, `/app` (painel), `components/plataforma/CardCurso.tsx`, `/app/curso/[slug]` |

Enquanto acesso é tudo-ou-nada as duas respostas coincidem. Quando um contrato
liberar Fundamentos e não liberar os outros, deixam de coincidir — e todo
chamador que confundiu as duas vira bug.

### Parte 2: a linha mais recente não pode decidir acesso

`subscriptions` é histórico append-only, e `temAcesso` deriva **da linha mais
recente por `createdAt`** (documentado em `lib/plataforma/dados.ts`).

Se uma pessoa tiver assinatura individual paga **e** entrar num grupo B2B, as
duas fontes escrevem na mesma tabela. Quando o contrato do grupo vencer e o
sistema gravar `cancelada`, essa linha passa a ser a mais recente — e **mata a
assinatura paga da pessoa**, que não tem nada a ver com o grupo.

Portanto acesso tem que ser **união de fontes** ("alguma fonte me dá direito a
este curso?"), nunca "qual foi a última linha". Esta etapa já estabelece essa
forma, mesmo com uma fonte só.

## Decisões de projeto

### D1. Direito é derivado, não armazenado

**Não existe tabela de direitos.** O direito é calculado perguntando a cada
fonte no momento da consulta.

Alternativa rejeitada: materializar direitos numa tabela e mantê-la
sincronizada. É a origem clássica de divergência nesse tipo de sistema —
assinatura cancela, contrato vence, membro sai do grupo, e a tabela segue
afirmando o contrário até alguém rodar uma varredura. Derivado não diverge.

Custo aceito: uma consulta por página que precise do conjunto. Mitigado por D2.

### D2. O lote é a operação primária

```ts
direitosDoAluno(userId): Promise<Set<string>>   // ids de curso permitidos
podeAcessarCurso(userId, courseId): Promise<boolean>
ehAssinante(userId): Promise<boolean>           // status COMERCIAL
```

`direitosDoAluno` resolve em **uma** consulta. O painel do aluno renderiza dez
cards; uma checagem por card seriam dez consultas por página, e o pool do
Postgres está em 20 justamente porque o painel já dispara ~16 em paralelo
(armadilha 8 do CLAUDE.md). `podeAcessarCurso` é conveniência para checagem
pontual (portão de mídia, de aula, de escrita), onde só um curso interessa.

### D3. `ehAssinante` é função separada, com o mesmo comportamento de hoje

Os chamadores comerciais passam a usar `ehAssinante`/`buscarAssinatura`.
Semântica idêntica à atual: `contaAtiva && status ∈ {ativa, manual}`.

Separar agora — e não na etapa 2 — é o que impede que a etapa 2 precise
reauditar os 12 chamadores sob pressão de feature nova.

### D4. Sem migração

O direito sai de `subscriptions`, que já existe:

> se o status mais recente é `ativa` ou `manual` **e** a conta está ativa,
> o aluno tem direito a **todos os cursos publicados**; senão, a nenhum.

É byte a byte o comportamento de hoje. A etapa mais arriscada não toca no
schema, e um problema se reverte revertendo código — sem desfazer migração em
produção com aluno pagante no meio. As tabelas de empresa e contrato entram na
etapa 2.

### D5. Aula gratuita não muda

`gratuita` continua liberando a aula antes de qualquer checagem de direito, e
curso não publicado continua invisível para todo mundo. A ordem das guardas em
`buscarMidia` e `podeVerAula` é preservada.

## Superfície de mudança

**Camada de dados (`lib/plataforma/dados.ts`)**
- acrescenta `direitosDoAluno`, `podeAcessarCurso`, `ehAssinante`
- `buscarMidia` e `podeVerAula` passam a consultar `podeAcessarCurso` — as duas
  já fazem o join `lessons → modules → courses`, então já têm o `courseId` em
  mãos, sem consulta adicional
- **`podeGravarProgresso` não muda:** ele delega a `podeVerAula`, de propósito
  (o comentário no código explica por quê), e herda a correção sozinho. O
  portão de escrita continuar sendo espelho exato do portão de leitura é
  invariante de segurança — nesta etapa ele se preserva por construção
- `temAcesso` sai; cada chamador migra para a função da pergunta que ele faz

**Aluno**
- `app/app/page.tsx`: hoje passa **um** booleano para todos os trilhos; passa a
  obter o `Set` e repassá-lo
- `components/plataforma/CardCurso.tsx`: recebe o booleano do **seu** curso, não
  o global
- `app/app/curso/[slug]/page.tsx`: usa `podeAcessarCurso` com o curso da página

**Comercial — só troca de nome, sem mudança de semântica**
- `app/app/conta/page.tsx`, `app/app/assinar/page.tsx`, `app/cursos/page.tsx`,
  `lib/admin/alunos.ts`, `app/admin/alunos/[id]/page.tsx`,
  `components/admin/AcoesRapidas.tsx`, `lib/asaas/assinatura.ts`
- `lib/admin/metricas.ts` continua lendo `subscriptions` direto (MRR, cortesia,
  novos assinantes). **Nada de métrica muda nesta etapa.**

## Como se prova que ninguém perdeu acesso

1. **Invariante, em teste unitário:** para usuário com `ativa` ou `manual` e
   conta ativa, `direitosDoAluno` devolve exatamente o conjunto dos cursos
   **publicados**; para qualquer outro estado, conjunto vazio. Curso não
   publicado nunca entra, mesmo para assinante.
2. **Conta desativada perde direito** mesmo com assinatura válida no histórico —
   é a garantia atual de `temAcesso` (`contaAtiva` antes da assinatura) e não
   pode se perder na refatoração.
3. **As 32 e2e passam sem alteração.** Elas já codificam o comportamento atual:
   aluno sem acesso vê a trava, aluno liberado assiste, aula gratuita abre para
   todos, progresso só grava para quem pode ver. **Se alguma precisar ser
   editada, é regressão — não teste desatualizado.** Esta é a asserção mais
   importante do spec.
4. **Verificação em produção** com uma conta real de assinante antes de começar
   a etapa 2.

## Riscos

| Risco | Mitigação |
|---|---|
| Assinante pagante perde acesso | Invariante em teste + e2e intocadas + verificação em produção antes de seguir |
| Chamador migrado para a função errada (comercial vs acesso) | A tabela da Parte 1 é a lista fechada; `temAcesso` é removida, então nenhum chamador fica no modelo antigo por esquecimento — o compilador acusa |
| Consulta a mais no painel | `direitosDoAluno` é uma consulta só, obtida junto das demais no `Promise.all` que o painel já faz |
| Refatoração "aproveitar para melhorar" | Fora de escopo: esta etapa não muda comportamento, texto, layout nem métrica |

## Fora de escopo

Empresa, contrato, vagas, gestor, importação de lista, relatório de progresso,
receita B2B no painel, atualização da política de privacidade. Tudo isso são as
etapas 2 a 4.
