# Direito de acesso por curso — plano de implementação

> **Para quem for executar:** siga tarefa a tarefa, na ordem. Os passos usam
> caixa (`- [x]`) para acompanhamento. Spec:
> [2026-08-20-direito-de-acesso-por-curso-design.md](../specs/2026-08-20-direito-de-acesso-por-curso-design.md)

**Objetivo:** trocar o portão de acesso booleano por direito **por curso**,
preservando exatamente o comportamento atual, sem migração de banco.

**Arquitetura:** direito é derivado (nunca armazenado), calculado perguntando a
cada fonte. Nesta etapa existe uma fonte só — a assinatura. `ehAssinante` isola
essa fonte; `direitosDoAluno` e `podeAcessarCurso` a consultam. Na etapa 2, o
contrato B2B entra como segunda fonte nessas duas funções, e em nenhum outro
lugar.

**Stack:** Next.js 15 App Router, React 19, Drizzle + Postgres, vitest,
Playwright.

## Restrições globais

- **As 32 e2e não podem ser editadas.** Elas codificam o comportamento atual. Se
  alguma quebrar, é regressão — corrija o código, nunca o teste.
- **Nenhuma migração.** Se esta etapa criar arquivo em `drizzle/`, algo saiu do
  escopo.
- **Nenhuma mudança de texto, layout ou métrica.** Refatoração de
  comportamento-zero.
- **`podeGravarProgresso` continua delegando a `podeVerAula`.** O portão de
  escrita ser espelho exato do de leitura é invariante de segurança.
- Aula `gratuita` continua liberando antes de qualquer checagem de direito;
  curso não publicado continua invisível para todos.
- Strings visíveis, se houvesse alguma, viriam de `lib/content.ts` — não há
  nenhuma nesta etapa.
- Commits em pt-BR, padrão `feat:`/`fix:`/`refactor:`.

## Estrutura de arquivos

| Arquivo | Responsabilidade nesta etapa |
|---|---|
| `lib/plataforma/dados.ts` | Ganha `ehAssinante`, `direitosDoAluno`, `podeAcessarCurso`. Perde `temAcesso`. Portões de aula passam a consultar por curso. |
| `lib/plataforma/direitos.test.ts` | **Novo.** O invariante: assinante ⇒ todos os cursos publicados; qualquer outro estado ⇒ conjunto vazio. |
| `app/app/page.tsx` | Painel: obtém o `Set` e repassa aos trilhos. |
| `components/plataforma/CardCurso.tsx` | Prop passa a ser por curso (`liberado`). |
| `app/app/curso/[slug]/page.tsx` | Usa `podeAcessarCurso` com o curso da página. |
| `app/cursos/page.tsx`, `app/app/assinar/page.tsx`, `lib/asaas/assinatura.ts` | Trocam para `ehAssinante` (pergunta comercial). |

**Não mudam:** `lib/admin/alunos.ts`, `app/admin/alunos/[id]/page.tsx`,
`components/admin/AcoesRapidas.tsx`, `app/app/conta/page.tsx`,
`lib/admin/metricas.ts` — já usam `buscarAssinatura` ou variável local.

---

### Tarefa 1: as três funções novas

**Arquivos:**
- Modificar: `lib/plataforma/dados.ts` (acrescentar; não remover nada ainda)
- Criar: `lib/plataforma/direitos.test.ts`

**Interfaces produzidas** (as tarefas seguintes dependem destas assinaturas):
- `ehAssinante(userId: string): Promise<boolean>`
- `direitosDoAluno(userId: string): Promise<Set<string>>` — ids de curso
- `podeAcessarCurso(userId: string, courseId: string): Promise<boolean>`

- [x] **Passo 1: escrever o teste que falha**

Criar `lib/plataforma/direitos.test.ts`. O padrão do projeto é integração
contra o Postgres real, com dados isolados por prefixo — siga
`lib/plataforma/autorizacao.test.ts` ou `lib/asaas/cliente.test.ts` para o
arranjo de usuário e assinatura.

```ts
import { describe, it, expect } from "vitest";
import { direitosDoAluno, podeAcessarCurso, ehAssinante } from "@/lib/plataforma/dados";

describe("direito de acesso derivado da assinatura", () => {
  it("assinante ativo tem direito a TODOS os cursos publicados", async () => {
    const userId = await criarAlunoComAssinatura("ativa");
    const direitos = await direitosDoAluno(userId);
    const publicados = await idsDeCursosPublicados();
    expect([...direitos].sort()).toEqual([...publicados].sort());
  });

  it("acesso manual vale igual a ativa", async () => {
    const userId = await criarAlunoComAssinatura("manual");
    expect((await direitosDoAluno(userId)).size).toBeGreaterThan(0);
  });

  it("curso NÃO publicado nunca entra, mesmo para assinante", async () => {
    const userId = await criarAlunoComAssinatura("ativa");
    const oculto = await criarCurso({ publicado: false });
    expect((await direitosDoAluno(userId)).has(oculto)).toBe(false);
    expect(await podeAcessarCurso(userId, oculto)).toBe(false);
  });

  it("sem assinatura, conjunto vazio", async () => {
    const userId = await criarAluno();
    expect((await direitosDoAluno(userId)).size).toBe(0);
  });

  it.each(["cancelada", "inadimplente", "pendente"])(
    "status %s não dá direito",
    async (status) => {
      const userId = await criarAlunoComAssinatura(status);
      expect((await direitosDoAluno(userId)).size).toBe(0);
    },
  );

  it("conta desativada perde direito mesmo com assinatura válida", async () => {
    // Garantia atual de temAcesso (contaAtiva ANTES da assinatura).
    // Não pode se perder na refatoração.
    const userId = await criarAlunoComAssinatura("ativa");
    await desativarConta(userId);
    expect((await direitosDoAluno(userId)).size).toBe(0);
    expect(await ehAssinante(userId)).toBe(false);
  });

  it("só a linha MAIS RECENTE de subscriptions decide", async () => {
    const userId = await criarAlunoComAssinatura("ativa");
    await gravarAssinatura(userId, "cancelada");
    expect((await direitosDoAluno(userId)).size).toBe(0);
  });
});
```

- [x] **Passo 2: rodar e confirmar que falha**

`npx vitest run lib/plataforma/direitos.test.ts`
Esperado: falha em importar `direitosDoAluno` — a função não existe.

- [x] **Passo 3: implementar**

Em `lib/plataforma/dados.ts`, logo abaixo de `temAcesso` (que continua no lugar
por enquanto):

```ts
/**
 * A pergunta COMERCIAL: este aluno é assinante?
 *
 * É o comportamento literal do antigo `temAcesso`, com o nome da pergunta que
 * ele de fato responde. Quem pergunta isto quer saber sobre a relação
 * comercial (mostrar CTA de assinatura, contar no painel, barrar segunda
 * assinatura no Asaas) — NÃO sobre poder assistir a um curso específico.
 * A partir da etapa 2 as duas respostas deixam de coincidir.
 */
export async function ehAssinante(userId: string): Promise<boolean> {
  if (!(await contaAtiva(userId))) return false;
  const status = await buscarAssinatura(userId);
  return status === "ativa" || status === "manual";
}

/**
 * A pergunta de ACESSO, em lote: a que cursos este aluno tem direito?
 *
 * Direito é DERIVADO, nunca armazenado: é calculado perguntando a cada fonte.
 * Hoje existe uma fonte — a assinatura, que dá direito ao acervo publicado
 * inteiro. Na etapa 2 o contrato B2B entra AQUI (e em podeAcessarCurso), como
 * união: basta uma fonte conceder. Nunca "a última linha vence" — uma pessoa
 * pode ter assinatura própria E estar num grupo, e o fim do contrato do grupo
 * não pode derrubar o que ela paga sozinha.
 *
 * Em lote de propósito: o painel renderiza ~10 cards, e uma consulta por card
 * multiplicaria por 10 a pressão sobre o pool (armadilha 8 do CLAUDE.md). São
 * 3 consultas fixas, independentemente de quantos cursos existam.
 */
export async function direitosDoAluno(userId: string): Promise<Set<string>> {
  if (!(await ehAssinante(userId))) return new Set();
  const linhas = await db.select({ id: courses.id }).from(courses).where(eq(courses.publicado, true));
  return new Set(linhas.map((l) => l.id));
}

/** A pergunta de ACESSO, para um curso só. Confere `publicado` por conta
 *  própria de propósito: precisa estar correta mesmo chamada isoladamente,
 *  sem depender de a chamadora já ter filtrado. */
export async function podeAcessarCurso(userId: string, courseId: string): Promise<boolean> {
  if (!(await ehAssinante(userId))) return false;
  const [linha] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.publicado, true)))
    .limit(1);
  return Boolean(linha);
}
```

- [x] **Passo 4: rodar e confirmar que passa**

`npx vitest run lib/plataforma/direitos.test.ts` → todos verdes.

- [x] **Passo 5: commit**

```bash
git add lib/plataforma/dados.ts lib/plataforma/direitos.test.ts
git commit -m "feat: direito de acesso por curso, derivado da assinatura"
```

---

### Tarefa 2: portões de aula passam a perguntar por curso

**Arquivos:** modificar `lib/plataforma/dados.ts`

**Consome:** `podeAcessarCurso` (Tarefa 1)

- [x] **Passo 1: acrescentar `courseId` aos dois selects**

`buscarMidia` e `podeVerAula` já fazem o join `lessons → modules → courses`.
Acrescente a coluna ao select dos dois:

```ts
      courseId: courses.id,
```

- [x] **Passo 2: trocar a checagem**

Em `buscarMidia`:

```ts
  if (!linha.gratuita && !(await podeAcessarCurso(userId, linha.courseId))) return null;
```

Em `podeVerAula`:

```ts
  return linha.gratuita || (await podeAcessarCurso(userId, linha.courseId));
```

`podeGravarProgresso` **não muda** — delega a `podeVerAula` e herda a correção.

- [x] **Passo 3: rodar as suítes de acesso**

```
npx vitest run lib/plataforma/
```
Esperado: verde. Estes testes cobrem o portão de mídia, o de aula e o de
escrita — se algum falhar, é regressão real, não teste velho.

- [x] **Passo 4: commit**

```bash
git commit -am "refactor: portões de aula consultam direito por curso"
```

---

### Tarefa 3: chamadores comerciais trocam para `ehAssinante`

**Arquivos:** modificar `app/cursos/page.tsx`, `app/app/assinar/page.tsx`,
`lib/asaas/assinatura.ts`

Os três fazem a pergunta comercial. Nenhuma mudança de semântica — só passam a
chamar a função com o nome certo.

- [x] **Passo 1: `app/cursos/page.tsx`**

Trocar o import e a linha 37:

```ts
import { buscarCatalogo, ehAssinante } from "@/lib/plataforma/dados";
// ...
  const assinante = sessao?.user?.id ? await ehAssinante(sessao.user.id) : false;
```

- [x] **Passo 2: `app/app/assinar/page.tsx`**

```ts
import { ehAssinante } from "@/lib/plataforma/dados";
// ...
  if (await ehAssinante(sessao.user.id)) {
```

- [x] **Passo 3: `lib/asaas/assinatura.ts`** (linha ~51)

```ts
import { contaAtiva, ehAssinante } from "@/lib/plataforma/dados";
// ...
  if (await ehAssinante(userId)) return { ok: false, erro: t.jaAssinante };
```

- [x] **Passo 4: rodar e commitar**

```
npm run test:unit
git commit -am "refactor: chamadores comerciais usam ehAssinante"
```

---

### Tarefa 4: painel e CardCurso passam a decidir por curso

Esta é a única tarefa com mudança estrutural: hoje **um** booleano vale para
todos os cards.

**Arquivos:** modificar `app/app/page.tsx`, `components/plataforma/CardCurso.tsx`

**Consome:** `direitosDoAluno` (Tarefa 1)

- [x] **Passo 1: `CardCurso` recebe o booleano do próprio curso**

Renomear a prop de `temAcesso` para `liberado`. O rename é deliberado: força
cada chamador a ser atualizado conscientemente, e o compilador acusa quem
ficar para trás.

```tsx
export function CardCurso({ curso, pct, liberado }: { curso: Curso; pct: number; liberado: boolean }) {
```

e, no selo:

```tsx
        {!liberado ? (
```

- [x] **Passo 2: `Trilho` passa a receber o conjunto**

Em `app/app/page.tsx`, na assinatura do `Trilho`, trocar
`temAcesso: boolean` por `direitos: Set<string>`, e no map:

```tsx
            <CardCurso curso={curso} pct={info.get(curso.slug)?.pct ?? 0} liberado={direitos.has(curso.id)} />
```

- [x] **Passo 3: o painel obtém o conjunto**

No `Promise.all` existente, trocar `verificarAcesso(userId)` por
`direitosDoAluno(userId)`, renomeando a variável para `direitos`. Continua
dentro do mesmo `Promise.all` — nenhuma ida a mais ao banco em série.

Atualizar as quatro chamadas de `<Trilho ... direitos={direitos} />`.

**Atenção:** o banner "Assine para acessar" no topo do painel (linha ~190) é
pergunta COMERCIAL, não de acesso. Ele deve passar a usar `ehAssinante`, obtido
no mesmo `Promise.all`. Confundir os dois aqui faz o banner sumir para quem tem
acesso a um curso via contrato mas não é assinante — exatamente o bug que a
etapa 2 traria.

- [x] **Passo 4: rodar e2e do painel**

```
npx playwright test e2e/painel.spec.ts e2e/cursos.spec.ts
```
A spec do painel conta cards e verifica o selo e o banner — é ela que prova
que a mudança estrutural não alterou o que o aluno vê. **Sem editar a spec.**

- [x] **Passo 5: commit**

```bash
git commit -am "refactor: painel decide o cadeado por curso"
```

---

### Tarefa 5: página do curso

**Arquivos:** modificar `app/app/curso/[slug]/page.tsx`

- [x] **Passo 1: trocar a checagem**

`buscarCurso(slug)` já rodou antes do `Promise.all`, então `curso.id` está
disponível:

```ts
  const [concluidas, temAcesso, destino] = await Promise.all([
    buscarConcluidas(userId),
    podeAcessarCurso(userId, curso.id),
    destinoCta(),
  ]);
```

Renomear a variável local `temAcesso` para `liberado` e atualizar o uso na
linha ~123.

- [x] **Passo 2: rodar e commitar**

```
npx playwright test e2e/curso.spec.ts e2e/aula.spec.ts
git commit -am "refactor: página do curso consulta direito do próprio curso"
```

---

### Tarefa 6: remover `temAcesso` e fechar

- [x] **Passo 1: remover a função** de `lib/plataforma/dados.ts`.

- [x] **Passo 2: confirmar que ninguém ficou para trás**

```bash
grep -rn "temAcesso" app lib components e2e
```
Esperado: **nenhuma** ocorrência de chamada. Comentários históricos em
`lib/asaas/assinatura.ts` e `lib/admin/metricas.ts` mencionam o nome ao
explicar a semântica de "linha mais recente" — atualize o texto para citar
`ehAssinante`, para o comentário não apontar para função inexistente.

- [x] **Passo 3: suítes completas**

```
npm run test:unit    # esperado: 222 + os novos, todos verdes
npm run test:e2e     # esperado: 32 passando, NENHUMA editada
npx tsc --noEmit
```

- [x] **Passo 4: commit**

```bash
git commit -am "refactor: remover temAcesso — cada chamador declara sua pergunta"
```

---

### Tarefa 7: verificar em produção antes da etapa 2

- [x] **Passo 1:** build local, deploy pelo `scripts/deploy-railway.sh`.
- [x] **Passo 2:** conferir `BUILD_ID` local contra o do container por `ssh`
      (hash de chunk não serve — armadilha 9).
- [ ] **Passo 3:** com uma conta real **de assinante**, confirmar em produção:
      catálogo sem cadeado, aula paga abre, progresso grava.
- [ ] **Passo 4:** com uma conta **sem** assinatura: cadeado presente, aula
      gratuita abre, aula paga bloqueada.

Só depois disso começar a etapa 2.

## Auto-revisão do plano

- **Cobertura do spec:** D1 (derivado) → Tarefa 1; D2 (lote) → Tarefas 1 e 4;
  D3 (`ehAssinante` separada) → Tarefas 1, 3 e 4; D4 (sem migração) → nenhuma
  tarefa cria arquivo em `drizzle/`; D5 (gratuita intocada) → Tarefa 2 preserva
  a ordem das guardas. Prova 1 e 2 → Tarefa 1; prova 3 → Tarefas 4, 5 e 6;
  prova 4 → Tarefa 7.
- **Consistência de tipos:** `direitosDoAluno` devolve `Set<string>` de **ids**
  de curso (não slugs) — `Trilho` usa `curso.id`, e `CardCurso` recebe booleano
  já resolvido. `info` continua indexado por **slug**, como hoje; os dois
  coexistem sem se cruzar.
- **Sem placeholder:** os arranjos do teste da Tarefa 1 (`criarAlunoComAssinatura`
  e afins) são os helpers do padrão de teste do projeto e devem ser escritos
  seguindo `lib/plataforma/autorizacao.test.ts`. É a única parte do plano que
  não traz código literal, por depender do arranjo existente.
