# Contrato B2B — spec

Etapa 2 de 4 da venda em grupo. Depende da etapa 1
([direito de acesso por curso](2026-08-20-direito-de-acesso-por-curso-design.md)),
que está em produção.

**Objetivo:** vender acesso a uma empresa, para N pessoas, a cursos específicos,
cobrado fora do Asaas. Ao fim desta etapa **o produto é vendável**: o Rodrigo
fecha o contrato, importa a lista e a equipe estuda.

**Não-objetivo:** área do gestor (etapa 3) e receita B2B nas métricas (etapa 4).
Nesta etapa quem administra tudo é o `/admin`.

## A descoberta que definiu a arquitetura

O plano original previa "importar a lista e convidar por e-mail". **Não existe
canal de e-mail em produção:** `emailTransacionalAtivo()` depende de
`RESEND_API_KEY` (ou da caixa de teste), e nenhuma das duas está no Railway — a
chave é pendência aberta, à espera de verificação de domínio no Resend.

O efeito disso já está no código, deliberadamente: `criarUsuario` só exige
confirmação quando há canal, então **em produção a conta nasce confirmada**.
Criar contas funciona; avisar a pessoa e entregar senha a ela, não.

Duas saídas foram descartadas: gerar links de definição de senha (o token de
reset dura 60 min, exigiria um tipo novo de vida longa, e uma lista de links de
acesso circulando por planilha e WhatsApp é material sensível espalhado); e
esperar a chave (travaria a venda numa pendência de terceiro).

**A escolha (Rodrigo, 2026-08-20): pré-autorizar o e-mail, não criar a conta.**

> A importação registra **e-mails autorizados** num contrato. A pessoa entra em
> `/app/criar-conta` com o e-mail corporativo e define a própria senha; no
> cadastro, o sistema vê que aquele e-mail pertence a um contrato vigente e faz
> o vínculo. Quem já tem conta é vinculado no ato da importação.

Zero dependência de e-mail, nada sensível circulando, e o aviso à equipe fica
com o RH do cliente — que é quem já faz isso hoje. Quando a `RESEND_API_KEY`
existir, o convite por e-mail vira melhoria opcional, não pré-requisito.

## Modelo de dados

Quatro tabelas novas. **Esta é a primeira migração da venda B2B** — a etapa 1
não teve nenhuma, de propósito.

**`empresas`** — `id`, `nome`, `cnpj` (opcional), `createdAt`.

**`contratos`** — `id`, `empresaId`, `valor` (numeric — guardado aqui para a
etapa 4 poder somar ao MRR sem nova migração), `vagas` (int), `inicioEm`,
`fimEm` (**nullable**: nulo = não expira, conforme a decisão "depende do
contrato"), `createdAt`.

**`contrato_cursos`** — `contratoId`, `courseId`. É o que torna o contrato
específico por curso; sem esta tabela, a etapa 1 não teria razão de existir.

**`contrato_membros`** — `contratoId`, `email` (**sempre minúsculo**), `userId`
(**nullable** — preenchido no vínculo), `createdAt`, `removidoEm` (nullable).

### Por que membro é chaveado por e-mail, e não por usuário

É o que permite pré-autorizar alguém que ainda não tem conta. `userId` nasce
nulo e é preenchido quando a pessoa se cadastra (ou no ato da importação, se a
conta já existir).

**Cuidado de implementação:** `users` tem `uniqueIndex` sobre `lower(email)`. A
coluna de membro guarda minúsculo e toda comparação é feita minúscula — senão
"Maria@Empresa.com" na planilha do cliente não casa com "maria@empresa.com" da
conta, e a pessoa fica pré-autorizada sem nunca receber acesso.

### Remoção é lógica, nunca física

`removidoEm` em vez de `DELETE`: preserva o histórico de quem esteve no
contrato (a etapa 3 vai relatar isso ao gestor) e libera a vaga. Uma pessoa
removida e readmitida reencontra o próprio progresso, porque o progresso está
preso ao `userId`, não à participação.

## Como o direito passa a ser calculado

A etapa 1 deixou o encaixe pronto: o contrato entra como **segunda fonte** em
`direitosDoAluno` e `podeAcessarCurso`, **e em nenhum outro lugar do sistema**.

```
direitosDoAluno(userId) =
    (assinante ? todos os cursos publicados : ∅)
  ∪ (cursos dos contratos VIGENTES onde o usuário é membro ativo)
```

**União, nunca "a linha mais recente"** — é a armadilha identificada na etapa 1:
uma pessoa pode ter assinatura própria E estar num grupo, e o fim do contrato do
grupo não pode derrubar o que ela paga sozinha.

Um contrato é **vigente** quando `inicioEm <= agora` e (`fimEm` é nulo ou
`fimEm >= agora`). Vencimento é **derivado, não agendado**: não existe job
noturno cortando acesso. No instante em que `fimEm` passa, a consulta para de
devolver aqueles cursos. Nada a sincronizar, nada para falhar em silêncio.

O curso continua precisando estar **publicado** — contrato não ressuscita curso
despublicado.

## Saída do grupo e fim do contrato

Decisão do Rodrigo: **perde acesso, mantém progresso e certificado.**

- Acesso cessa no ato (é derivado — nada a limpar).
- Progresso fica: `lesson_progress` é do `userId` e não se apaga.
- **Certificado emitido continua válido para sempre.** A URL pública permanece,
  como já é hoje. Certificado é reconhecimento de algo que a pessoa fez;
  revogá-lo quebraria links já compartilhados no LinkedIn e no currículo dela.

## Vagas

`vagas` limita **membros ativos** (`removidoEm IS NULL`). A importação recusa a
lista inteira se ela estourar o limite — recusar tudo, e não importar até
encher, para o Rodrigo não descobrir pela metade que faltou vaga.

Uma pessoa pode estar em mais de um contrato (dois empregadores, ou dois
contratos da mesma empresa): ocupa uma vaga em cada, e o direito é a união.
Assinatura própria não isenta de ocupar vaga — a empresa pagou por aquela
pessoa.

## Superfície no /admin

- Lista de empresas e contratos, com vagas usadas/total e situação de vigência.
- Criar/editar empresa e contrato (valor, vagas, início, fim opcional, cursos).
- Importar lista de e-mails (colar ou CSV), com pré-visualização antes de gravar:
  quantos são novos, quantos já têm conta, quantos já estavam no contrato,
  quantos e-mails são inválidos.
- Remover membro (lógico) e readmitir.

**Ações de admin usam form HTML nativo + route handler 303**, nunca server
action com resposta descartada — armadilha 6 do CLAUDE.md. Filtros de listagem
usam `<a>` nativo, não `<Link>` — armadilha 7.

## Como se prova que funciona

1. **Direito é união:** aluno com assinatura própria E contrato de um curso não
   perde nada quando o contrato vence; e aluno só com contrato tem direito
   exatamente aos cursos daquele contrato — nem mais, nem menos.
2. **Vigência corta sozinha:** contrato com `fimEm` no passado não dá direito
   nenhum, sem job nenhum ter rodado.
3. **Curso despublicado não sai**, mesmo dentro do contrato.
4. **Vínculo por e-mail:** pré-autorizar e-mail sem conta e depois criar a conta
   com aquele e-mail (em qualquer caixa alta/baixa) resulta em acesso.
5. **Vaga é respeitada:** importação que estoura o limite é recusada inteira.
6. **Remoção corta o acesso e preserva progresso e certificado.**
7. **As e2e da etapa 1 continuam passando sem edição** — assinante individual
   não pode ter sido afetado por nada disto.

## Riscos

| Risco | Mitigação |
|---|---|
| Contrato derrubar assinatura própria de alguém | União explícita, com teste dedicado (prova 1). É a armadilha que originou a etapa 1 |
| E-mail com caixa diferente não casar | Minúsculo na gravação e na comparação, com teste usando caixa mista |
| Importação parcial deixar o contrato num estado ambíguo | Recusa tudo ou grava tudo, numa transação |
| Vazamento de dado pessoal | Nesta etapa só o `/admin` vê a lista. O gestor do cliente é etapa 3, e é lá que entram o aviso ao funcionário e a atualização da política de privacidade |

## Fora de escopo

Área do gestor, relatório nome a nome, receita nas métricas, convite por e-mail,
autoatendimento de compra. Etapas 3 e 4.
