# Área de administrador — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Área `/admin` (métricas completas, gerenciamento de alunos, CRUD de conteúdo e configurações) para usuários `role='admin'`, sobre a plataforma do Ciclo 1.

**Architecture:** Mesmo app Next 15, server-first: pages RSC + server actions; gate em três camadas (middleware → layout 404 → `exigirAdmin()` em toda action/handler, revalidando role/ativo NO BANCO); regras de negócio em `lib/admin/*` (nunca na UI); gráficos SVG server-rendered sem biblioteca; filtros por searchParams. Spec: `docs/superpowers/specs/2026-08-12-admin-plataforma-design.md`.

**Tech Stack:** Next 15.5 / React 19 / Tailwind v4 · Drizzle + pg (Postgres local embutido porta 54329; Railway depois) · Auth.js v5 · Vitest · Playwright (canal Chrome). ZERO dependência nova.

## Global Constraints

- Todo texto visível em pt-BR, centralizado em `lib/content-admin.ts` (novo). Nunca "PMEs".
- Tokens semânticos apenas; superfícies raio 0; controles `rounded-control`. Tailwind v4: não existe `bg-[--token]`.
- Não-admin em `/admin/*` recebe **404** (`notFound()`), nunca 403.
- `exigirAdmin()` abre TODA server action e route handler do admin — e revalida `role`/`ativo` no banco, nunca só no JWT.
- Assinatura NUNCA sofre UPDATE: liberar = inserir linha `manual`; revogar = inserir `cancelada` (o `temAcesso` do aluno decide pela linha mais recente).
- Rebaixar/desativar/excluir **a si mesmo é recusado na função** de `lib/admin/`, não só escondido na UI.
- Banco só por código servidor (`import "server-only"` em todo `lib/admin/*` com acesso a dados).
- Postgres local já roda na 54329 — nunca rodar `npm run db:local` (fica travado em foreground).
- Nunca `npm run build` com dev/start de pé: derrubar por porta `lsof -tiTCP:3000 -sTCP:LISTEN | xargs kill`; ao fim de cada task deixar `npm run start` de pé.
- Commit ao fim de cada task, no branch de trabalho do ciclo.
- Padrões prontos no repo para seguir (ler antes de criar): forms → `components/plataforma/FormConta.tsx`; actions com auth → `app/app/conta/actions.ts`; testes de integração → `lib/plataforma/autorizacao.test.ts`; e2e → `e2e/conta.spec.ts`; scripts de banco → `scripts/semente.mjs`.

---

### Task 1: Fundação — migração, primeiro admin, gate e shell

**Files:**
- Modify: `lib/db/schema.ts` (campo `ativo` em users; tabela `settings`)
- Create: `drizzle/0001_*.sql` (gerado), `scripts/promover-admin.mjs`
- Create: `lib/admin/sessao.ts`, `lib/content-admin.ts`
- Create: `app/admin/layout.tsx`, `app/admin/page.tsx` (placeholder), `components/admin/ShellAdmin.tsx`
- Modify: `middleware.ts` (matcher + `/admin`), `lib/plataforma/usuarios.ts` (login recusa desativado)
- Test: `lib/admin/fundacao.test.ts`, `e2e/admin-gate.spec.ts`

**Interfaces:**
- Consumes: `db`/schema, `auth()` de `@/auth`, padrão de carregador `.env.local` de `scripts/migrar.mjs`.
- Produces (Tasks 2-5 dependem):

```ts
// lib/db/schema.ts (acréscimos)
users.ativo: boolean("ativo").notNull().default(true)
export const settings = pgTable("settings", {
  chave: text("chave").primaryKey(),
  valor: text("valor").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// lib/admin/sessao.ts
export async function ehAdminAtivo(userId: string): Promise<boolean>; // consulta o banco
export async function exigirAdmin(): Promise<{ id: string; nome: string; email: string }>; // notFound() se falhar
```

- [ ] **Step 1: Teste de fundação (falha primeiro)** — `lib/admin/fundacao.test.ts` (mesmo esqueleto de `lib/plataforma/autorizacao.test.ts`: `describe.skipIf(!process.env.DATABASE_URL)`, dados com prefixo `teste-adm-${Date.now()}`, `afterAll` limpa):

```ts
import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, settings } from "@/lib/db/schema";
import { ehAdminAtivo } from "./sessao";
import { criarUsuario, verificarCredenciais } from "@/lib/plataforma/usuarios";

const prefixo = `teste-adm-${Date.now()}`;
const senha = "Senha-adm-123!";

describe.skipIf(!process.env.DATABASE_URL)("fundação do admin", () => {
  afterAll(async () => {
    const { like } = await import("drizzle-orm");
    await db.delete(users).where(like(users.email, `${prefixo}%`));
  });

  it("aluno comum não é admin ativo", async () => {
    await criarUsuario({ nome: "Aluno", email: `${prefixo}-a@t.invalido`, senha });
    const [u] = await db.select().from(users).where(eq(users.email, `${prefixo}-a@t.invalido`));
    expect(await ehAdminAtivo(u.id)).toBe(false);
  });

  it("admin ativo passa; admin desativado não", async () => {
    await criarUsuario({ nome: "Chefe", email: `${prefixo}-b@t.invalido`, senha });
    const [u] = await db.select().from(users).where(eq(users.email, `${prefixo}-b@t.invalido`));
    await db.update(users).set({ role: "admin" }).where(eq(users.id, u.id));
    expect(await ehAdminAtivo(u.id)).toBe(true);
    await db.update(users).set({ ativo: false }).where(eq(users.id, u.id));
    expect(await ehAdminAtivo(u.id)).toBe(false);
  });

  it("conta desativada não loga (mensagem neutra vem da action, aqui é null)", async () => {
    await criarUsuario({ nome: "Fora", email: `${prefixo}-c@t.invalido`, senha });
    await db.update(users).set({ ativo: false }).where(eq(users.email, `${prefixo}-c@t.invalido`));
    expect(await verificarCredenciais(`${prefixo}-c@t.invalido`, senha)).toBeNull();
  });

  it("settings aceita upsert por chave", async () => {
    await db.insert(settings).values({ chave: "teste_adm_chave", valor: "x" })
      .onConflictDoUpdate({ target: settings.chave, set: { valor: "y" } });
    await db.insert(settings).values({ chave: "teste_adm_chave", valor: "z" })
      .onConflictDoUpdate({ target: settings.chave, set: { valor: "z" } });
    const [linha] = await db.select().from(settings).where(eq(settings.chave, "teste_adm_chave"));
    expect(linha.valor).toBe("z");
    await db.delete(settings).where(eq(settings.chave, "teste_adm_chave"));
  });

  it("uuid inexistente não é admin", async () => {
    expect(await ehAdminAtivo("00000000-0000-0000-0000-000000000000")).toBe(false);
  });
});
```

Rodar: `npx vitest run lib/admin/fundacao.test.ts` → FALHA (coluna/módulo inexistentes).

- [ ] **Step 2: Schema + migração** — acrescentar ao `lib/db/schema.ts` o campo e a tabela do bloco Interfaces (mesmo estilo do arquivo). Gerar e aplicar:

```bash
set -a; source .env.local; set +a
npx drizzle-kit generate
npm run db:migrar
```

Commitar o SQL gerado em `drizzle/`.

- [ ] **Step 3: `lib/admin/sessao.ts`**

```ts
import "server-only";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

/** Consulta o banco — nunca o JWT, que fica defasado após rebaixar/desativar. */
export async function ehAdminAtivo(userId: string): Promise<boolean> {
  const [u] = await db.select({ id: users.id }).from(users)
    .where(and(eq(users.id, userId), eq(users.role, "admin"), eq(users.ativo, true)))
    .limit(1);
  return !!u;
}

/**
 * O portão do admin. TODA page (via layout), action e handler abre com isto.
 * Falha vira 404 — para quem não é admin, a área não existe (403 confirmaria).
 */
export async function exigirAdmin(): Promise<{ id: string; nome: string; email: string }> {
  const sessao = await auth();
  const id = sessao?.user?.id;
  if (!id || !(await ehAdminAtivo(id))) notFound();
  return { id, nome: sessao.user.name ?? "", email: sessao.user.email ?? "" };
}
```

- [ ] **Step 4: Login recusa desativado** — em `lib/plataforma/usuarios.ts`, `verificarCredenciais`: após o `bcrypt.compare` bem-sucedido, `return u.ativo ? u : null;` (a comparação roda sempre — o tempo não muda entre ativo e desativado).

- [ ] **Step 5: Middleware** — `middleware.ts`: `export const config = { matcher: ["/app/:path*", "/admin/:path*"] };`. Nada mais muda: `/admin/*` não está em `PUBLICAS`, então sem sessão já redireciona para `/app/entrar?voltar=...`. O role NÃO é checado aqui (edge, sem banco) — camadas 2 e 3 fazem isso.

- [ ] **Step 6: Strings + shell** — `lib/content-admin.ts` nasce com o bloco shell:

```ts
/** Fonte única de texto do /admin, irmã de content-plataforma.ts. */
export const admin = {
  nome: "Administração",
  shell: {
    metricas: "Métricas",
    alunos: "Alunos",
    conteudo: "Conteúdo",
    configuracoes: "Configurações",
    verComoAluno: "Ver como aluno",
  },
} as const;
```

`app/admin/layout.tsx`: `await exigirAdmin()` na primeira linha; `robots: { index: false }`; renderiza `ShellAdmin` (nav lateral com os 4 links + "Ver como aluno" → `/app`; em telas < lg a nav vira linha horizontal rolável no topo). `ShellAdmin` segue o visual de `components/plataforma/ShellHeader.tsx` (tokens, logo Academy). `app/admin/page.tsx` placeholder: `<h1>{admin.shell.metricas}</h1>` (Task 3 substitui).

- [ ] **Step 7: `scripts/promover-admin.mjs`**

```js
import { existsSync, readFileSync } from "node:fs";
import pg from "pg";

if (existsSync(".env.local")) {
  for (const l of readFileSync(".env.local", "utf8").split("\n")) {
    const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2];
  }
}
const email = (process.argv[2] ?? "").trim().toLowerCase();
if (!email.includes("@")) { console.error("uso: node scripts/promover-admin.mjs email@dominio"); process.exit(1); }
console.log("alvo:", new URL(process.env.DATABASE_URL).host, "| e-mail:", email);
const cli = new pg.Client({ connectionString: process.env.DATABASE_URL });
await cli.connect();
const r = await cli.query(
  "update users set role = 'admin' where lower(email) = $1 returning id, nome", [email]);
await cli.end();
if (r.rowCount === 0) { console.error("nenhum usuário com esse e-mail"); process.exit(1); }
console.log(`promovido: ${r.rows[0].nome || "(sem nome)"} (${r.rows[0].id})`);
```

- [ ] **Step 8: e2e do gate (falha antes, passa depois)** — `e2e/admin-gate.spec.ts`:

```ts
import { execSync } from "node:child_process";
import { test, expect } from "@playwright/test";

const email = `e2e-admgate-${Date.now()}@teste.invalido`;
const senha = "Senha-e2e-123!";

async function criarConta(page, em: string) {
  await page.goto("/app/criar-conta");
  await page.getByLabel("Nome").fill("Gate E2E");
  await page.getByLabel("E-mail").fill(em);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/app$/);
}

test("aluno comum recebe 404 no /admin", async ({ page }) => {
  await criarConta(page, email);
  const resposta = await page.goto("/admin");
  expect(resposta!.status()).toBe(404);
});

test("promovido por script, entra e vê a shell", async ({ page }) => {
  const em = `e2e-admgate2-${Date.now()}@teste.invalido`;
  await criarConta(page, em);
  execSync(`node scripts/promover-admin.mjs ${em}`, { stdio: "pipe" });
  await page.goto("/admin");
  await expect(page.getByRole("link", { name: "Alunos" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ver como aluno" })).toBeVisible();
});

test("sem sessão, /admin manda para o login", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/app\/entrar\?voltar=%2Fadmin/);
});
```

- [ ] **Step 9: Verde completo** — `npx vitest run lib/admin/fundacao.test.ts` ok; `npx tsc --noEmit` ok; derrubar 3000, build, start, `npx playwright test e2e/admin-gate.spec.ts` 3/3 + suíte antiga sem regressão (`npm run test:e2e`).

- [ ] **Step 10: Commit** — `git add -A && git commit -m "admin: fundação — migração, promover-admin, exigirAdmin e shell com gate 404"`

---

### Task 2: Alunos — lista, detalhe e as cinco ações

**Files:**
- Create: `lib/admin/alunos.ts`, `app/admin/alunos/page.tsx`, `app/admin/alunos/[id]/page.tsx`, `app/admin/alunos/[id]/actions.ts`, `components/admin/AcoesAluno.tsx`
- Modify: `lib/content-admin.ts` (bloco `alunos`)
- Test: `lib/admin/alunos.test.ts`, `e2e/admin-alunos.spec.ts`

**Interfaces:**
- Consumes: `exigirAdmin`, `db`/schema, `StatusAssinatura` e `buscarAssinatura` de `lib/plataforma/dados.ts`, textos de status de `lib/content-plataforma.ts` (`plataforma.conta.status*`).
- Produces:

```ts
// lib/admin/alunos.ts  (import "server-only")
export type AlunoLinha = { id: string; nome: string; email: string; role: string; ativo: boolean;
  status: StatusAssinatura; criadoEm: Date; ultimoAcesso: Date | null };
export type AlunoDetalhe = AlunoLinha & {
  historico: { status: string; criadoEm: Date }[];              // todas as linhas, mais recente primeiro
  progresso: { slug: string; titulo: string; feitas: number; total: number; pct: number;
               aulas: { titulo: string; concluidaEm: Date }[] }[] };
export type ResultadoAcao = { ok: true } | { ok: false;
  motivo: "auto" | "nao_encontrado" | "ja_tem_acesso" | "ja_sem_acesso" | "email_nao_confere" | "curso_publicado" };

export async function listarAlunos(o: { q?: string; pagina?: number }):
  Promise<{ linhas: AlunoLinha[]; total: number; porPagina: number }>;   // porPagina = 50
export async function buscarAluno(id: string): Promise<AlunoDetalhe | null>;
export async function liberarAcesso(executorId: string, alunoId: string): Promise<ResultadoAcao>;
export async function revogarAcesso(executorId: string, alunoId: string): Promise<ResultadoAcao>;
export async function definirRole(executorId: string, alunoId: string, role: "aluno" | "admin"): Promise<ResultadoAcao>;
export async function definirAtivo(executorId: string, alunoId: string, ativo: boolean): Promise<ResultadoAcao>;
export async function excluirAluno(executorId: string, alunoId: string, emailConfirmacao: string): Promise<ResultadoAcao>;
```

- [ ] **Step 1: Teste das regras (falha primeiro)** — `lib/admin/alunos.test.ts`, mesmo esqueleto de prefixo/afterAll. Cobertura mínima, cada `it` com corpo real:

```ts
it("liberarAcesso insere linha manual e status do aluno vira manual")
it("liberar quando já tem acesso → { ok: false, motivo: 'ja_tem_acesso' } e NÃO insere segunda linha")
it("revogarAcesso insere linha cancelada (nunca UPDATE: as duas linhas existem) e temAcesso vira false")
it("revogar quem não tem acesso → 'ja_sem_acesso'")
it("definirRole em si mesmo → 'auto' e o role não muda")
it("definirAtivo(false) em si mesmo → 'auto'")
it("excluirAluno com e-mail divergente → 'email_nao_confere' e o usuário continua existindo")
it("excluirAluno com e-mail certo apaga usuário, progresso e assinaturas (cascade)")
it("excluir a si mesmo → 'auto' mesmo com e-mail certo")
it("listarAlunos: busca por trecho do e-mail acha; paginação limita a 50; total correto")
it("buscarAluno: histórico vem completo (2 linhas após liberar+revogar) e mais recente primeiro")
```

Asserções contra o banco (select direto), como em `autorizacao.test.ts`. Rodar → FALHA.

- [ ] **Step 2: Implementar `lib/admin/alunos.ts`** até o teste ficar verde. Notas de implementação:
  - `listarAlunos`: uma query com `leftJoin` lateral não é necessária — busque a página de users (`ilike` em nome OU e-mail quando `q`), depois, para os 50 ids, o status atual (mesma subconsulta `DISTINCT ON (user_id) ... ORDER BY user_id, created_at DESC` via `sql`) e o `max(updated_at)` de `lesson_progress` agrupado por user. Três queries por página, não N+1.
  - `liberarAcesso`/`revogarAcesso` derivam o status atual com a MESMA leitura de `buscarAssinatura` (linha mais recente) antes de decidir.
  - `excluirAluno` compara `emailConfirmacao.trim().toLowerCase()` com o e-mail do banco.
- [ ] **Step 3: Strings** — bloco `alunos` em `content-admin.ts`: título, busca (placeholder "Buscar por nome ou e-mail"), cabeçalhos da tabela, selos ("Admin", "Desativada"), nomes/rotulos das ações, confirmação de exclusão ("Digite o e-mail do aluno para confirmar", "O e-mail digitado não confere"), mensagens de sucesso ("Acesso liberado." / "Acesso revogado." / "Salvo." / "Conta desativada." / "Conta reativada." / "Conta excluída."), erro "Você não pode fazer isso com a própria conta.", paginação ("Anterior"/"Próxima"), vazio ("Nenhum aluno encontrado.").
- [ ] **Step 4: Páginas e actions** — lista com busca `?q=` (form GET), paginação `?pagina=`; detalhe com os três blocos do spec (status por extenso reutilizando `plataforma.conta.status*`); `AcoesAluno` client component com `useActionState` por ação (padrão de `FormConta.tsx`); exclusão dentro de `<details>` com campo de e-mail. Actions em `[id]/actions.ts`: cada uma abre com `const executor = await exigirAdmin();`, chama a função correspondente, mapeia `motivo` → mensagem do content, `revalidatePath("/admin/alunos")` e `revalidatePath(caminho do detalhe)`.
- [ ] **Step 5: e2e (falha antes)** — `e2e/admin-alunos.spec.ts`: admin promovido por script; cria-se também um aluno comum; admin busca o aluno pelo e-mail, abre o detalhe, clica "Liberar acesso"; **troca para o contexto do aluno** (novo `browser.newContext()`), loga e abre a aula paga `/app/curso/fundamentos-ia-copilot/o-que-e-copilot` → iframe do player visível (a prova de que a liberação funciona de ponta a ponta). Depois o admin revoga; o aluno recarrega → cartão de trava de volta.
- [ ] **Step 6: Verde completo + commit** — vitest alunos + fundacao, tsc, build, e2e novo + suíte inteira. `git commit -m "admin: alunos — lista, detalhe, liberar/revogar, role, ativo e exclusão com confirmação"`

---

### Task 3: Métricas — dashboard, funil e CSV

**Files:**
- Create: `lib/admin/metricas.ts`, `components/admin/GraficoBarras.tsx`, `app/admin/metricas-csv/route.ts`
- Modify: `app/admin/page.tsx` (dashboard real), `lib/content-admin.ts` (bloco `metricas`)
- Test: `lib/admin/metricas.test.ts`, `e2e/admin-metricas.spec.ts`

**Interfaces:**
- Consumes: `exigirAdmin`, `db`/schema.
- Produces:

```ts
// lib/admin/metricas.ts  (import "server-only")
export type Periodo = "7" | "30" | "90" | "tudo";
export function inicioDoPeriodo(p: Periodo, agora: Date): Date | null;    // null = sem corte
export type PontoSemana = { semana: string; valor: number };              // segunda-feira, "aaaa-mm-dd"
export async function resumo(p: Periodo): Promise<{ alunosTotais: number; novos: number;
  assinaturasAtivas: number; alunosAtivos: number; aulasConcluidas: number }>;
export async function seriesSemanais(p: Periodo): Promise<{ cadastros: PontoSemana[]; atividade: PontoSemana[] }>;
export async function conclusaoPorCurso(): Promise<{ slug: string; titulo: string;
  comecaram: number; concluiram: number; pct: number }[]>;                // só publicados
export async function funilDoCurso(slug: string): Promise<{ modulo: string; aula: string;
  ordemGlobal: number; concluiram: number }[] | null>;                    // null = curso não existe/oculto
export async function gerarCsv(bloco: "cadastros" | "atividade" | "conclusao" | "funil",
  p: Periodo, cursoSlug?: string): Promise<string | null>;               // null = bloco/curso inválido
```

- [ ] **Step 1: Teste (falha primeiro)** — `lib/admin/metricas.test.ts`. Semeia um cenário CONHECIDO com prefixo (2 alunos novos há 3 dias, 1 antigo há 60 dias com data explícita; progresso: aluno A concluiu aulas 1-2, aluno B só a 1, no curso demo) e assevera números exatos:

```ts
it("inicioDoPeriodo: '7' corta 7 dias atrás; 'tudo' retorna null")
it("resumo('7'): novos=2 (o de 60 dias fora), alunosAtivos e aulasConcluidas contam só o período")
it("resumo('tudo') inclui o antigo")
it("assinaturasAtivas usa o status ATUAL: aluno com manual+cancelada não conta")
it("seriesSemanais agrupa por segunda-feira e o total das barras soma os cadastros do período")
it("conclusaoPorCurso: comecaram=2, concluiram=0, pct=0 no cenário; curso oculto não aparece")
it("funilDoCurso: aula 1 → 2, aula 2 → 1, demais → 0, na ordem global")
it("funilDoCurso de slug inexistente → null")
it("gerarCsv('cadastros'): primeira linha de cabeçalho, separador ';', começa com BOM \\uFEFF")
it("gerarCsv de bloco inválido → null")
```

ATENÇÃO na limpeza: este teste insere `lesson_progress` no curso demo real — o `afterAll` apaga por `user_id` dos alunos prefixados (cascade do delete de users já resolve). Rodar → FALHA.

- [ ] **Step 2: Implementar `metricas.ts`**. Notas:
  - Semana com `date_trunc('week', ...)` do Postgres (`sql<string>`) — segunda-feira por padrão; formatar `aaaa-mm-dd`.
  - `assinaturasAtivas`: `select count(*) from (select distinct on (user_id) status from subscriptions order by user_id, created_at desc) s where status in ('ativa','manual')` via `sql`.
  - `alunosAtivos`: `count(distinct user_id)` em `lesson_progress` com `updated_at >= corte`.
  - `conclusaoPorCurso`: total de aulas por curso publicado; `comecaram` = alunos com ≥1 progresso em aula do curso; `concluiram` = alunos cujo count de concluídas = total.
  - CSV: `﻿` + linhas `join(";")`, valores com `;` ou quebra → aspas duplas.
- [ ] **Step 3: `GraficoBarras.tsx`** — Server Component puro: props `{ pontos: PontoSemana[]; rotulo: string }`; SVG `viewBox` fixo, altura das barras proporcional ao máximo, `<title>{semana}: {valor}</title>` por barra, eixo com 0 e máximo; abaixo do SVG uma `<table className="sr-only">` com os pares semana/valor. Sem dado → parágrafo `admin.metricas.semDados`, sem SVG.
- [ ] **Step 4: Dashboard** — `app/admin/page.tsx`: lê `searchParams` (`periodo` default "30", `curso` default o primeiro publicado); filtro de período como 4 `<Link>` (o ativo em pílula cheia); cartões; os dois gráficos; tabela de conclusão; funil como lista com barra horizontal (`div` com width %); cada bloco com botão "Exportar CSV" → `/admin/metricas-csv?bloco=...&periodo=...&curso=...`.
- [ ] **Step 5: Route handler CSV** — `app/admin/metricas-csv/route.ts`:

```ts
import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin/sessao";
import { gerarCsv, type Periodo } from "@/lib/admin/metricas";

export async function GET(request: Request) {
  await exigirAdmin();
  const url = new URL(request.url);
  const bloco = url.searchParams.get("bloco") as Parameters<typeof gerarCsv>[0];
  const periodo = (url.searchParams.get("periodo") ?? "30") as Periodo;
  const curso = url.searchParams.get("curso") ?? undefined;
  const csv = await gerarCsv(bloco, periodo, curso);
  if (csv === null) return new NextResponse(null, { status: 404 });
  return new NextResponse(csv, { headers: {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="metricas-${bloco}-${periodo}.csv"`,
  }});
}
```

- [ ] **Step 6: e2e** — `e2e/admin-metricas.spec.ts`: admin abre `/admin`, vê os 5 cartões e troca o período por link (URL muda para `?periodo=7`); baixa um CSV (`page.waitForEvent("download")`) e confere o nome do arquivo; aluno comum recebe 404 no handler (`request.get("/admin/metricas-csv?bloco=cadastros")` com contexto de aluno → 404).
- [ ] **Step 7: Verde completo + commit** — `git commit -m "admin: métricas — dashboard com séries, funil por aula e export CSV"`

---

### Task 4: Conteúdo — CRUD de cursos, módulos e aulas

**Files:**
- Create: `lib/admin/conteudo.ts`, `app/admin/conteudo/page.tsx`, `app/admin/conteudo/actions.ts` (criar curso), `app/admin/conteudo/[slug]/page.tsx`, `app/admin/conteudo/[slug]/actions.ts`, `components/admin/FormCurso.tsx`, `components/admin/EditorAula.tsx`
- Modify: `lib/content-admin.ts` (bloco `conteudo`)
- Test: `lib/admin/conteudo.test.ts`, `e2e/admin-conteudo.spec.ts`

**Interfaces:**
- Consumes: `exigirAdmin`, `db`/schema.
- Produces:

```ts
// lib/admin/conteudo.ts  (import "server-only")
export function gerarSlug(titulo: string): string;  // pura: minúsculas, sem acento, hífens, sem duplos
export type CursoAdminLinha = { id: string; slug: string; titulo: string; publicado: boolean;
  ordem: number; totalAulas: number; aulasSemVideo: number };
export type Impacto = { aulas: number; alunosComProgresso: number };

export async function listarCursosAdmin(): Promise<CursoAdminLinha[]>;
export async function buscarCursoAdmin(slug: string): Promise<null | (Curso & { modulos: (Modulo & {
  aulas: (Aula & { midia: { provider: string; videoId: string } | null })[] })[] })>;
export async function criarCurso(titulo: string): Promise<{ ok: true; slug: string } | { ok: false; motivo: "slug_existe" }>;
export async function salvarCurso(id: string, campos: { titulo: string; slug: string; descricao: string;
  capaUrl: string; nivel: string; cargaHoras: number; ordem: number }): Promise<{ ok: true } | { ok: false; motivo: "slug_existe" }>;
export async function definirPublicado(id: string, publicado: boolean): Promise<{ ok: true; aviso: "aulas_sem_video" | "alunos_ativos" | null }>;
export async function contarImpacto(nivel: "curso" | "modulo" | "aula", id: string): Promise<Impacto>;
export async function excluirCurso(id: string): Promise<ResultadoAcao>;  // 'curso_publicado' se publicado
export async function criarModulo(courseId: string, titulo: string): Promise<void>;
export async function salvarModulo(id: string, titulo: string): Promise<void>;
export async function moverModulo(id: string, direcao: -1 | 1): Promise<void>;   // troca ordem com o vizinho; extremo = no-op
export async function excluirModulo(id: string): Promise<void>;
export async function criarAula(moduleId: string, titulo: string): Promise<{ ok: true; slug: string } | { ok: false; motivo: "slug_existe" }>;
export async function salvarAula(id: string, campos: { titulo: string; slug: string; descricao: string;
  duracaoSeg: number; gratuita: boolean }): Promise<{ ok: true } | { ok: false; motivo: "slug_existe" }>;
export async function moverAula(id: string, direcao: -1 | 1): Promise<void>;
export async function excluirAula(id: string): Promise<void>;
export async function salvarMidia(lessonId: string, provider: "youtube" | "panda" | "mux", videoId: string): Promise<void>;
// videoId vazio → delete da linha lesson_media (aula volta a "sem vídeo")
```

(`Curso`/`Modulo`/`Aula` de `lib/plataforma/tipos.ts`; `ResultadoAcao` de `lib/admin/alunos.ts`.)

- [ ] **Step 1: Teste (falha primeiro)** — `lib/admin/conteudo.test.ts` (prefixo/afterAll; unidade para `gerarSlug`, integração para o resto):

```ts
it("gerarSlug: 'Formação de IA & Métodos!' → 'formacao-de-ia-metodos'")
it("gerarSlug não produz hífens duplos nem nas pontas")
it("criarCurso nasce publicado=false e ordem = max+1; slug colidente → 'slug_existe'")
it("salvarCurso com slug de outro curso → 'slug_existe' e nada muda")
it("moverModulo troca ordem com o vizinho; no extremo é no-op")
it("moverAula idem, dentro do módulo")
it("salvarMidia cria linha; chamada de novo atualiza; videoId vazio remove a linha")
it("contarImpacto de curso soma aulas e alunos distintos com progresso nelas")
it("excluirCurso publicado → 'curso_publicado'; despublicado apaga em cascata")
it("definirPublicado(true) com aula sem vídeo → { ok: true, aviso: 'aulas_sem_video' }")
it("definirPublicado(false) com aluno com progresso → aviso 'alunos_ativos'")
```

- [ ] **Step 2: Implementar `conteudo.ts`** até verde. `gerarSlug`: `normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")`. `mover*`: transação — lê o vizinho pela ordem, troca os dois valores.
- [ ] **Step 3: Strings** — bloco `conteudo`: títulos, selos ("Publicado"/"Oculto"/"sem vídeo"), rótulos de campos, botões (↑ "Subir", ↓ "Descer", "Publicar", "Ocultar", "Novo curso", "Novo módulo", "Nova aula", "Salvar", "Excluir"), avisos (`avisoAulasSemVideo`: "Publicado. Atenção: {n} aulas ainda sem vídeo — o aluno verá 'em produção'."; `avisoAlunosAtivos`; confirmação de exclusão com números: (n: aulas, m: alunos) => \`Isto apaga ${n} aulas e o progresso de ${m} alunos. Digite EXCLUIR para confirmar.\`), erro `slugExiste`: "Já existe conteúdo com esse endereço (slug).".
- [ ] **Step 4: Páginas e actions** — lista com selos e aviso de aulas sem vídeo; página do curso com `FormCurso` (campos + salvar), Publicar/Ocultar mostrando o `aviso` retornado, módulos ordenados com ↑/↓, aulas em `<details>` com `EditorAula` (campos + bloco mídia: `<select>` provider + input videoId). Exclusões com `contarImpacto` na confirmação (campo "Digite EXCLUIR"). Actions todas com `exigirAdmin()` + `revalidatePath` (inclusive `/app` e `/app/curso/[slug]` quando publicar/despublicar/salvar — o aluno vê a mudança sem esperar cache).
- [ ] **Step 5: e2e** — `e2e/admin-conteudo.spec.ts`: admin abre um curso oculto da semente ("Fundamentos de IA aplicado aos Negócios"), cria um módulo, cria uma aula, cola um `video_id`, publica (aviso de aulas sem vídeo aparece se houver), e **no contexto do aluno** o curso agora aparece no painel `/app`. Reverter no fim (despublicar) para não poluir os outros specs.
- [ ] **Step 6: Verde completo + commit** — `git commit -m "admin: conteúdo — crud de cursos, módulos, aulas e mídia com avisos de impacto"`

---

### Task 5: Configurações, integração no /app e varredura final

**Files:**
- Create: `lib/admin/configuracoes.ts`, `app/admin/configuracoes/page.tsx`, `app/admin/configuracoes/actions.ts`
- Modify: `lib/content-admin.ts` (bloco `configuracoes`), `app/app/layout.tsx` (faixa de aviso), `app/app/page.tsx` + `app/app/curso/[slug]/page.tsx` + `app/app/curso/[slug]/[aula]/page.tsx` (CTA das travas vem de settings)
- Test: `lib/admin/configuracoes.test.ts`, `e2e/admin-config.spec.ts`

**Interfaces:**
- Consumes: `exigirAdmin`, `settings` do schema.
- Produces:

```ts
// lib/admin/configuracoes.ts  (import "server-only")
export type ChaveConfig = "cta_destino" | "aviso_topo" | "email_contato";
export async function lerConfiguracao(chave: ChaveConfig): Promise<string>;      // "" se ausente
export async function lerTodas(): Promise<Record<ChaveConfig, string>>;
export async function salvarConfiguracoes(valores: Partial<Record<ChaveConfig, string>>): Promise<void>; // upsert
export async function destinoCta(): Promise<string>;  // cta_destino || "/academy#contato"
```

- [ ] **Step 1: Teste (falha primeiro)** — `lib/admin/configuracoes.test.ts`: `lerConfiguracao` de chave ausente → `""`; `salvarConfiguracoes` upserta e `lerTodas` devolve; `destinoCta` com chave vazia → `/academy#contato`, com valor → o valor; limpeza apaga as chaves usadas (usar valores reais das chaves — o teste roda no banco de dev; restaurar o valor anterior no afterAll).
- [ ] **Step 2: Implementar + strings** — bloco `configuracoes` no content: título, rótulos ("Destino do botão de venda (URL)", "Aviso no topo da área do aluno (vazio = sem aviso)", "E-mail de contato"), "Salvar", "Salvo.", erro `urlInvalida`: "Informe uma URL válida (comece com / ou https://)". Validação na action: `cta_destino` deve casar `/^(\/|https?:\/\/)/` ou ser vazio.
- [ ] **Step 3: Página + action** — formulário único com os 3 campos (padrão `FormConta`), action com `exigirAdmin()` + validação + `salvarConfiguracoes` + `revalidatePath("/app")` e `revalidatePath("/admin/configuracoes")`.
- [ ] **Step 4: Integração no /app** — `app/app/layout.tsx`: `const aviso = await lerConfiguracao("aviso_topo")` e, se não-vazio, faixa `bg-surface border-b border-line` com o texto acima do `<main>`. Os três pontos de CTA de trava (painel, curso, aula) trocam o href fixo `/academy#contato` por `await destinoCta()`. NENHUMA outra mudança no lado do aluno.
- [ ] **Step 5: e2e** — `e2e/admin-config.spec.ts`: admin salva `aviso_topo` = "Manutenção programada teste-e2e" → contexto do aluno vê a faixa no `/app`; admin limpa o campo → faixa some; salva `cta_destino` inválido ("abc") → mensagem de erro, valor não salvo. Restaurar valores ao final.
- [ ] **Step 6: Varredura final do ciclo**

```bash
npx tsc --noEmit && npm run test:unit && npm run test:integracao
npx vitest run lib/admin/
lsof -tiTCP:3000 -sTCP:LISTEN | xargs kill; npm run build; npm run start &
npm run test:e2e
```

Checagens de qualidade (Playwright): `scrollWidth == 390` em viewport 390×844 nas telas novas (`/admin`, `/admin/alunos`, detalhe de aluno, `/admin/conteudo`, curso do admin, `/admin/configuracoes` — logado como admin); captura claro/escuro de cada uma em `.superpowers/sdd/<workspace>/shots/`; rotas do site institucional seguem 200.

- [ ] **Step 7: Commit final + push** — `git add -A && git commit -m "admin: configurações, aviso no /app e cta das travas vindo de settings"` e push do branch.

---

## Fora deste plano (não fazer)

Upload de capa · audit log · e-mails ao aluno · receita nas métricas · checkout Asaas · correções parked do ciclo 1 (lote M) — só se uma colidir diretamente com arquivo em edição, e aí documentar no relatório.
