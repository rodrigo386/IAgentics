# Contrato B2B — plano de implementação

> **Para quem for executar:** tarefa a tarefa, na ordem. Spec:
> [2026-08-20-contrato-b2b-design.md](../specs/2026-08-20-contrato-b2b-design.md)

**Objetivo:** vender acesso a uma empresa, para N pessoas, a cursos específicos,
cobrado fora do Asaas. Ao fim, o produto é vendável pelo `/admin`.

**Arquitetura:** o contrato entra como **segunda fonte** em `direitosDoAluno` e
`podeAcessarCurso` (etapa 1) — e em nenhum outro lugar. Membro é chaveado por
e-mail, com `userId` preenchido no vínculo. Vigência é derivada, não agendada.

## Restrições globais

- **União, nunca substituição.** Contrato não pode derrubar assinatura própria.
- **E-mail sempre minúsculo** na gravação e na comparação (`users` tem
  `uniqueIndex` sobre `lower(email)`).
- **Importação é tudo-ou-nada**, numa transação.
- **Ações de admin: form HTML nativo + route handler 303** (armadilha 6). Nunca
  server action com resposta descartada.
- **Filtros de listagem em `<a>` nativo**, não `<Link>` (armadilha 7).
- **Toda string visível em `lib/content-admin.ts`.**
- Migração exige entrada no `drizzle/meta/_journal.json` — `migrate()` ignora
  `.sql` fora do journal **em silêncio** (armadilha do CLAUDE.md).
- As e2e da etapa 1 continuam passando **sem edição**.

---

### Tarefa 1: schema e migração

**Arquivos:** modificar `lib/db/schema.ts`; gerar `drizzle/0007_*.sql`

- [ ] **Passo 1: as quatro tabelas**

```ts
export const empresas = pgTable("empresas", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  cnpj: text("cnpj"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contratos = pgTable("contratos", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  /* Guardado aqui já na etapa 2 para a etapa 4 somar ao MRR sem nova migração. */
  valor: numeric("valor", { precision: 10, scale: 2 }).notNull(),
  vagas: integer("vagas").notNull(),
  inicioEm: timestamp("inicio_em", { withTimezone: true }).notNull().defaultNow(),
  /* NULO = não expira. A decisão foi "depende do contrato". */
  fimEm: timestamp("fim_em", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("contratos_empresa_idx").on(t.empresaId),
  check("contratos_vagas_chk", sql`${t.vagas} > 0`),
  check("contratos_periodo_chk", sql`${t.fimEm} is null or ${t.fimEm} > ${t.inicioEm}`),
]);

export const contratoCursos = pgTable("contrato_cursos", {
  contratoId: uuid("contrato_id").notNull().references(() => contratos.id, { onDelete: "cascade" }),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.contratoId, t.courseId] })]);

export const contratoMembros = pgTable("contrato_membros", {
  id: uuid("id").primaryKey().defaultRandom(),
  contratoId: uuid("contrato_id").notNull().references(() => contratos.id, { onDelete: "cascade" }),
  /* Chave de vínculo. SEMPRE minúsculo — ver o check e a nota do spec. */
  email: text("email").notNull(),
  /* Nulo enquanto a pessoa não tem conta: é o que permite pré-autorizar. */
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  /* Remoção LÓGICA: libera a vaga, preserva o histórico (etapa 3 relata isso). */
  removidoEm: timestamp("removido_em", { withTimezone: true }),
}, (t) => [
  index("contrato_membros_contrato_idx").on(t.contratoId),
  index("contrato_membros_email_idx").on(t.email),
  index("contrato_membros_user_idx").on(t.userId),
  /* O banco recusa caixa alta: a falha silenciosa de "pré-autorizado mas nunca
     recebe acesso" some na origem, em vez de depender de disciplina no código. */
  check("contrato_membros_email_minusculo_chk", sql`${t.email} = lower(${t.email})`),
  /* Mesmo e-mail não entra duas vezes ATIVO no mesmo contrato; removidos podem
     repetir, porque readmissão gera linha nova. */
  uniqueIndex("contrato_membros_ativo_unico")
    .on(t.contratoId, t.email)
    .where(sql`${t.removidoEm} is null`),
]);
```

- [ ] **Passo 2: gerar e aplicar local**

```bash
npm run db:gerar
npm run db:migrar
```
Conferir que a entrada nova existe em `drizzle/meta/_journal.json` — sem ela,
`migrate()` ignora o `.sql` em silêncio.

- [ ] **Passo 3: commit**

```bash
git add lib/db/schema.ts drizzle/
git commit -m "feat: schema de empresa, contrato, cursos e membros"
```

---

### Tarefa 2: o contrato como segunda fonte de direito

**Arquivos:** modificar `lib/plataforma/dados.ts`, `lib/plataforma/autorizacao.test.ts`

**Consome:** `direitosDoAluno`, `podeAcessarCurso`, `ehAssinante` (etapa 1)

- [ ] **Passo 1: testes que falham**

No `autorizacao.test.ts`, arranjo novo: uma empresa, um contrato vigente com um
curso, um contrato **vencido**, e usuários — só-contrato, contrato+assinatura,
membro removido.

Asserções obrigatórias:

```ts
it("contrato vigente dá direito EXATAMENTE aos cursos do contrato", ...)
it("contrato vencido (fimEm no passado) não dá direito nenhum", ...)
it("contrato sem fimEm não expira", ...)
it("curso despublicado não sai, mesmo dentro do contrato", ...)
it("membro removido perde o direito", ...)
/* A prova que originou a etapa 1 inteira: */
it("fim do contrato NÃO derruba a assinatura própria do aluno", async () => {
  // aluno com assinatura ativa E membro de contrato vencido
  // continua com direito a TODOS os cursos publicados
});
it("assinante + contrato = união, sem duplicar", ...)
```

- [ ] **Passo 2: rodar e confirmar falha.**

- [ ] **Passo 3: implementar a fonte**

```ts
/** Vigente: começou e (não tem fim OU o fim ainda não chegou). Derivado — não
 *  existe job de vencimento; no instante em que fimEm passa, o curso some do
 *  conjunto. Nada para sincronizar, nada para falhar em silêncio. */
function contratoVigente() {
  return and(
    lte(contratos.inicioEm, sql`now()`),
    or(isNull(contratos.fimEm), gt(contratos.fimEm, sql`now()`)),
  );
}

/** Cursos a que o aluno tem direito por contrato B2B. Só curso PUBLICADO —
 *  contrato não ressuscita curso despublicado. */
async function cursosPorContrato(userId: string): Promise<string[]> {
  const linhas = await db
    .select({ id: contratoCursos.courseId })
    .from(contratoMembros)
    .innerJoin(contratos, eq(contratos.id, contratoMembros.contratoId))
    .innerJoin(contratoCursos, eq(contratoCursos.contratoId, contratos.id))
    .innerJoin(courses, eq(courses.id, contratoCursos.courseId))
    .where(and(
      eq(contratoMembros.userId, userId),
      isNull(contratoMembros.removidoEm),
      eq(courses.publicado, true),
      contratoVigente(),
    ));
  return linhas.map((l) => l.id);
}
```

E a união nas duas funções da etapa 1:

```ts
export async function direitosDoAluno(userId: string): Promise<Set<string>> {
  if (!(await contaAtiva(userId))) return new Set();
  const direitos = new Set<string>();
  if (await ehAssinante(userId)) {
    const publicados = await db.select({ id: courses.id }).from(courses).where(eq(courses.publicado, true));
    for (const c of publicados) direitos.add(c.id);
  }
  for (const id of await cursosPorContrato(userId)) direitos.add(id);
  return direitos;
}

export async function podeAcessarCurso(userId: string, courseId: string): Promise<boolean> {
  return (await direitosDoAluno(userId)).has(courseId);
}
```

**Atenção:** `contaAtiva` sobe para o topo de `direitosDoAluno` — antes vinha
dentro de `ehAssinante`. Sem isso, conta desativada com contrato vigente
manteria acesso, reabrindo o buraco do I1 por outra porta. O teste do I1 tem
que continuar verde.

`podeAcessarCurso` passa a delegar a `direitosDoAluno` para haver **um único
lugar** onde a união é calculada — duas implementações da mesma regra divergem.

- [ ] **Passo 4:** rodar `npx vitest run lib/plataforma/`, commit.

---

### Tarefa 3: vínculo por e-mail

**Arquivos:** criar `lib/plataforma/vinculo.ts`; modificar a action de criar conta

- [ ] **Passo 1: teste que falha** — pré-autorizar e-mail sem conta, criar a
      conta **com caixa mista** ("Maria@Empresa.com"), e verificar que o direito
      apareceu.

- [ ] **Passo 2: implementar**

```ts
/** Liga membros pré-autorizados a uma conta recém-criada (ou recém-descoberta).
 *  Idempotente: rodar duas vezes não muda nada. */
export async function vincularMembroPorEmail(userId: string, email: string): Promise<number> {
  const alvo = email.trim().toLowerCase();
  const r = await db
    .update(contratoMembros)
    .set({ userId })
    .where(and(
      eq(contratoMembros.email, alvo),
      isNull(contratoMembros.userId),
      isNull(contratoMembros.removidoEm),
    ))
    .returning({ id: contratoMembros.id });
  return r.length;
}
```

- [ ] **Passo 3: chamar no cadastro.** Depois de `criarUsuario` retornar `ok`,
      na action de criar conta. **Não** dentro de `criarUsuario`: aquela função é
      usada por script e teste, e efeito colateral escondido nela surpreende.

- [ ] **Passo 4:** rodar e commitar.

---

### Tarefa 4: camada de admin dos contratos

**Arquivos:** criar `lib/admin/contratos.ts` e `lib/admin/contratos.test.ts`

Funções: criar/editar empresa e contrato, definir cursos, importar lista,
remover/readmitir membro, listar com vagas usadas.

- [ ] **Passo 1: testes que falham**, cobrindo:
  - importação recusa a lista **inteira** se estourar as vagas
  - importação normaliza caixa e ignora duplicata dentro da própria lista
  - e-mail inválido é recusado com a lista identificada
  - quem já tem conta é vinculado **no ato da importação**
  - remoção lógica libera vaga; readmissão gera linha nova
  - contagem de vagas ignora removidos

- [ ] **Passo 2: implementar**, com a importação numa **transação** (tudo ou
      nada). A pré-visualização é uma função pura separada da gravação: recebe o
      texto colado e devolve `{ novos, jaTemConta, jaNoContrato, invalidos }`,
      sem tocar no banco — assim a tela mostra o resumo antes de gravar e o
      mesmo cálculo é testável sem arranjo.

- [ ] **Passo 3:** rodar e commitar.

---

### Tarefa 5: telas do /admin

**Arquivos:** criar `app/admin/empresas/page.tsx`,
`app/admin/empresas/[id]/page.tsx`, `app/admin/empresas/[id]/acoes/route.ts`;
modificar `lib/content-admin.ts` e a sidebar

- [ ] **Passo 1: strings** em `lib/content-admin.ts`.
- [ ] **Passo 2: lista** de empresas/contratos com vagas usadas/total e
      situação de vigência.
- [ ] **Passo 3: ficha do contrato** — dados, cursos, membros, área de
      importação com pré-visualização.
- [ ] **Passo 4: route handler 303** para as ações (importar, remover,
      readmitir, salvar). `exigirAdmin` em todas, feedback por chave de
      querystring validada — mesmo padrão de
      `app/admin/alunos/[id]/acoes/route.ts`.
- [ ] **Passo 5: sidebar** ganha "Empresas", com `prefetch={false}`
      (armadilha 8).
- [ ] **Passo 6:** commit.

---

### Tarefa 6: e2e

**Arquivos:** criar `e2e/contratos.spec.ts`

- [ ] Fluxo completo pela UI: criar empresa → contrato com 2 vagas e 1 curso →
      importar 2 e-mails → criar conta com um deles → o aluno vê **só** aquele
      curso liberado, e os outros com cadeado → remover o membro → acesso cai.
- [ ] Importar 3 e-mails em contrato de 2 vagas → recusa, nada gravado.
- [ ] **As e2e da etapa 1 continuam sem edição.**

---

### Tarefa 7: deploy com migração

- [ ] **Passo 1:** build local, suítes completas.
- [ ] **Passo 2: aplicar o SQL inline em produção por `ssh`** — o container roda
      o artefato antigo até o upload terminar, e o `migrar.mjs` de lá é no-op
      para a migração nova (armadilha do CLAUDE.md). Aplicar statement a
      statement, mais a linha manual em `__drizzle_migrations`. Comando legível,
      sem base64 ofuscado.
- [ ] **Passo 3:** deploy, conferir `BUILD_ID` local contra container.
- [ ] **Passo 4:** criar uma empresa de verdade no `/admin` de produção e
      confirmar o fluxo com uma conta real.

## Auto-revisão

- **Cobertura do spec:** modelo de dados → T1; união e vigência derivada → T2;
  vínculo por e-mail e caixa → T3; vagas, tudo-ou-nada e remoção lógica → T4;
  superfície do admin → T5; provas 1 a 7 → T2, T4 e T6.
- **Consistência:** `cursosPorContrato` devolve `string[]` e é privada;
  `direitosDoAluno` é o único lugar que faz a união; `podeAcessarCurso` delega a
  ela. `contaAtiva` sobe para o topo de `direitosDoAluno` — anotado na T2 porque
  é onde o I1 poderia se perder.
- **Risco maior:** a T2 mexe em função que já está em produção servindo aluno
  pagante. O teste "fim do contrato não derruba assinatura própria" é o que
  guarda isso.
