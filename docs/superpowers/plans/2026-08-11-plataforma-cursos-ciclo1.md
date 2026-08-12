# Plataforma de cursos — Ciclo 1 (núcleo do aluno) — Plano de implementação · v2 (Railway)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Área `/app` no site IAgentics onde um aluno logado com assinatura (liberada manualmente no banco) assiste cursos em vídeo com progresso persistido — banco no Railway, deploy no Railway, código no GitHub.

**Architecture:** Next.js 15 App Router no repo existente. Postgres do Railway acessado SOMENTE pelo servidor (Drizzle + node-postgres); o navegador nunca toca o banco. Auth.js v5 (Credentials, e-mail+senha com bcryptjs, sessão JWT em cookie). Autorização centralizada na camada de dados: toda função recebe `userId` e `temAcesso` decide mídia paga. Vídeo por aula em `lesson_media` (defesa em profundidade + troca de provedor). Spec: `docs/superpowers/specs/2026-08-11-plataforma-cursos-design.md` (com a REVISÃO Railway no topo).

**Tech Stack:** Next 15.5 / React 19 / Tailwind v4 · `drizzle-orm` + `pg` + `drizzle-kit` · `next-auth@5` (beta) + `bcryptjs` · Vitest (unidade e integração) · Playwright (e2e, canal Chrome).

**Nota de estado (v1→v2):** a Task 1 da v1 já rodou: assets em `public/plataforma/`, scripts npm e Playwright/Vitest instalados. Sobras a remover na Task 2: pacotes `@supabase/*` e as variáveis supabase do `.env.local`. O projeto Supabase externo fica órfão (não é código).

## Global Constraints

- Todo texto visível em pt-BR e centralizado em `lib/content-plataforma.ts`. Nunca "PMEs" — sempre "empresa".
- Design system do site: apenas tokens semânticos (`bg-bg`, `text-fg`, `text-fg-muted`, `bg-accent`, `text-accent-text`, `border-line`...). Superfícies raio 0, controles `rounded-control` (pílula). Tailwind v4: NÃO existe `bg-[--token]`.
- `prefers-reduced-motion` é vinculante.
- Capas: `aspect-[3/4]`, `object-cover`, `objectPosition: "center top"`.
- YouTube sempre via `https://www.youtube-nocookie.com` com `rel=0`.
- `DATABASE_URL` e `AUTH_SECRET` só em `.env.local` (gitignorado) e nas variáveis do Railway — NUNCA em código ou chat.
- O banco só é acessado por código servidor (`lib/db`, `lib/plataforma/dados.ts`, actions, route handlers). Nenhum componente client importa `lib/db` (o `server-only` garante em build).
- `subscriptions` não tem caminho de escrita na aplicação no Ciclo 1 — liberação manual via SQL no Railway.
- Nunca `npm run build` com `next dev` de pé. Derrubar servidor por porta: `lsof -tiTCP:3000 -sTCP:LISTEN | xargs kill`.
- Commit ao fim de cada task. Erros de login nunca revelam se o e-mail existe.

---

### Task 2: Drizzle, schema, migração e conexão

**Files:**
- Create: `lib/db/schema.ts`, `lib/db/index.ts`, `drizzle.config.ts`, `scripts/migrar.mjs`
- Create: `drizzle/` (SQL gerado pelo drizzle-kit, commitado)
- Modify: `package.json` (deps novas, remoção de @supabase/*, scripts)
- Modify: `.env.local` (tirar supabase; conferir DATABASE_URL colada pelo Rodrigo; gerar AUTH_SECRET)
- Test: `scripts/schema.test.mjs`

**Interfaces:**
- Produces: `db` (Drizzle/node-postgres) + tabelas `users`, `courses`, `modules`, `lessons`, `lesson_media`, `subscriptions`, `lesson_progress` no Postgres do Railway; script `npm run db:migrar`.

- [ ] **Step 0: Postgres local de desenvolvimento** (decisão do Rodrigo: seguir sem o Railway por ora; a URL chega depois)

Sem Postgres nem Docker na máquina. Usar `embedded-postgres` (binários oficiais do PostgreSQL baixados pelo npm; nada de instalação de sistema):

```bash
npm i -D embedded-postgres
mkdir -p .dev && printf '.dev/\n' >> .gitignore
```

`scripts/db-local.mjs` (start/stop; dados em `.dev/postgres-data`, porta 54329):

```js
import EmbeddedPostgres from "embedded-postgres";
const pg = new EmbeddedPostgres({
  databaseDir: ".dev/postgres-data",
  user: "postgres", password: "local-dev", port: 54329, persistent: true,
});
const cmd = process.argv[2];
if (cmd === "start") {
  const fs = await import("fs");
  if (!fs.existsSync(".dev/postgres-data/PG_VERSION")) await pg.initialise();
  await pg.start();
  try { await pg.createDatabase("plataforma"); } catch { /* já existe */ }
  console.log("postgres local em 127.0.0.1:54329/plataforma");
} else if (cmd === "stop") { await pg.stop(); console.log("parado"); }
else { console.error("uso: node scripts/db-local.mjs start|stop"); process.exit(1); }
```

Scripts npm: `"db:local": "node scripts/db-local.mjs start"`, `"db:local:stop": "node scripts/db-local.mjs stop"`.
`.env.local`: `DATABASE_URL=postgresql://postgres:local-dev@127.0.0.1:54329/plataforma`.
QUANDO a URL do Railway chegar: trocar a linha no `.env.local` (ou manter a local para dev e usar a do Railway só em produção/Task 9) e rodar `npm run db:migrar && node scripts/semente.mjs` contra ela.

- [ ] **Step 1: Limpeza da v1 + deps**

```bash
npm rm @supabase/supabase-js @supabase/ssr
npm i drizzle-orm pg bcryptjs next-auth@beta
npm i -D drizzle-kit @types/pg @types/bcryptjs
```

`.env.local`: apagar linhas `NEXT_PUBLIC_SUPABASE_*` e `SUPABASE_SERVICE_ROLE_KEY`; manter a `DATABASE_URL` que o Rodrigo colou; acrescentar `AUTH_SECRET=<openssl rand -base64 32>`.
Scripts em `package.json`: trocar `"test:rls"` por `"test:integracao": "vitest run lib/plataforma/autorizacao.test.ts"`, adicionar `"db:migrar": "node scripts/migrar.mjs"` e `"db:gerar": "drizzle-kit generate"`.

- [ ] **Step 2: Teste de fumaça do schema (falha primeiro)** — `scripts/schema.test.mjs`:

```js
import { readFileSync } from "fs";
import pg from "pg";
for (const l of readFileSync(".env.local", "utf8").split("\n")) {
  const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2];
}
const cli = new pg.Client({ connectionString: process.env.DATABASE_URL });
await cli.connect();
const { rows } = await cli.query(
  `select table_name from information_schema.tables where table_schema='public' order by 1`);
const nomes = rows.map(r => r.table_name);
const esperadas = ["courses","lesson_media","lesson_progress","lessons","modules","subscriptions","users"];
const faltam = esperadas.filter(t => !nomes.includes(t));
// constraint de status também é contrato:
const { rows: chk } = await cli.query(
  `select 1 from information_schema.check_constraints where constraint_schema='public' and check_clause like '%manual%'`);
await cli.end();
if (faltam.length || chk.length === 0) {
  console.error("faltam tabelas:", faltam, "| check de status:", chk.length);
  process.exit(1);
}
console.log("schema ok:", nomes.join(", "));
```

Rodar `node scripts/schema.test.mjs` → FALHA (tabelas não existem).

- [ ] **Step 3: Schema Drizzle** — `lib/db/schema.ts` (colunas exatamente as do spec; `users` substitui profiles/auth.users):

```ts
import { boolean, check, index, integer, numeric, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull().default(""),
  email: text("email").notNull(),
  senhaHash: text("senha_hash").notNull(),
  role: text("role").notNull().default("aluno"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("users_email_unico").on(sql`lower(${t.email})`),
  check("users_role_chk", sql`${t.role} in ('aluno','admin')`),
]);

export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  titulo: text("titulo").notNull(),
  descricao: text("descricao").notNull().default(""),
  capaUrl: text("capa_url").notNull().default(""),
  nivel: text("nivel").notNull().default("Iniciante"),
  cargaHoras: numeric("carga_horas").notNull().default("0"),
  publicado: boolean("publicado").notNull().default(false),
  ordem: integer("ordem").notNull().default(0),
});

export const modules = pgTable("modules", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  titulo: text("titulo").notNull(),
  ordem: integer("ordem").notNull().default(0),
});

export const lessons = pgTable("lessons", {
  id: uuid("id").primaryKey().defaultRandom(),
  moduleId: uuid("module_id").notNull().references(() => modules.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  titulo: text("titulo").notNull(),
  descricao: text("descricao").notNull().default(""),
  duracaoSeg: integer("duracao_seg").notNull().default(0),
  ordem: integer("ordem").notNull().default(0),
  gratuita: boolean("gratuita").notNull().default(false),
}, (t) => [uniqueIndex("lessons_modulo_slug").on(t.moduleId, t.slug)]);

/** Separada de lessons DE PROPÓSITO: com YouTube não listado o ID é o acesso.
 *  A camada de dados só entrega esta linha depois de decidir autorização. */
export const lessonMedia = pgTable("lesson_media", {
  lessonId: uuid("lesson_id").primaryKey().references(() => lessons.id, { onDelete: "cascade" }),
  videoProvider: text("video_provider").notNull().default("youtube"),
  videoId: text("video_id").notNull(),
}, (t) => [check("media_provider_chk", sql`${t.videoProvider} in ('youtube','panda','mux')`)]);

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  asaasCustomerId: text("asaas_customer_id"),
  asaasSubscriptionId: text("asaas_subscription_id"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("subscriptions_user_idx").on(t.userId),
  check("subscriptions_status_chk", sql`${t.status} in ('manual','ativa','inadimplente','cancelada')`),
]);

export const lessonProgress = pgTable("lesson_progress", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lessonId: uuid("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  concluida: boolean("concluida").notNull().default(false),
  segundosAssistidos: integer("segundos_assistidos").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.userId, t.lessonId] })]);
```

- [ ] **Step 4: Conexão e migrador**

```ts
// lib/db/index.ts
import "server-only"; // build falha se um componente client importar isto
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
export const db = drizzle(pool, { schema });
```

```ts
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

```js
// scripts/migrar.mjs — aplica ./drizzle no banco da DATABASE_URL
import { readFileSync } from "fs";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
for (const l of readFileSync(".env.local", "utf8").split("\n")) {
  const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2];
}
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
await pool.end();
console.log("migração ok");
```

`npx drizzle-kit generate` (carregando `.env.local` no ambiente: `set -a; source .env.local; set +a` antes, ou `dotenv`-inline) → commit da pasta `drizzle/`. `npm run db:migrar`.

- [ ] **Step 5: Verde**

`node scripts/schema.test.mjs` → "schema ok: ...". `npx tsc --noEmit` limpo.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "plataforma: schema drizzle no postgres do railway"
```

---

### Task 3: Semente — curso demo completo + 8 cascas

**Files:**
- Create: `scripts/semente.mjs`

**Interfaces:**
- Consumes: schema da Task 2.
- Produces: curso `fundamentos-ia-copilot` publicado (3 módulos / 8 aulas, 1ª `gratuita`, mídia stand-in `youtube:M7lc1UVf-VE`) + 8 cursos `publicado=false`. Script idempotente (`on conflict do nothing` por slug).

- [ ] **Step 1: Escrever `scripts/semente.mjs`**

Mesmo carregador de `.env.local` da Task 2; conexão `pg.Client`. Conteúdo EXATO (títulos, descrições, capas, durações, slugs) da v1 deste plano — copiar da tabela abaixo. Inserções com `insert ... on conflict (slug) do nothing` para courses e `on conflict do nothing` nos filhos (a semente pode rodar duas vezes sem duplicar).

Curso demo `fundamentos-ia-copilot` — "Fundamentos de IA com Copilot", "Domine o Microsoft Copilot para acelerar tarefas do dia a dia com IA generativa.", capa `/plataforma/cursos/copilot-course.png`, nivel Iniciante, carga 6, publicado true, ordem 1. Módulos/aulas:

| módulo (ordem) | aula slug | título | duração | ordem | gratuita |
|---|---|---|---|---|---|
| Começando com o Copilot (1) | boas-vindas | Boas-vindas e panorama do curso | 420 | 1 | **true** |
| ″ | o-que-e-copilot | O que é o Copilot e onde ele vive | 780 | 2 | false |
| ″ | primeiro-prompt | Seu primeiro prompt bem escrito | 900 | 3 | false |
| Copilot no dia a dia (2) | copilot-word | Documentos com o Copilot no Word | 960 | 1 | false |
| ″ | copilot-excel | Análise com o Copilot no Excel | 1080 | 2 | false |
| ″ | copilot-outlook-teams | E-mail e reuniões: Outlook e Teams | 840 | 3 | false |
| Boas práticas e próximos passos (3) | limites-privacidade | Limites, revisão humana e privacidade | 720 | 1 | false |
| ″ | plano-de-pratica | Seu plano de prática de 30 dias | 540 | 2 | false |

Descrições das aulas: copiar da v1 (git show `5ee8a27:docs/superpowers/plans/2026-08-11-plataforma-cursos-ciclo1.md`, seção Task 3). Toda aula recebe `lesson_media (lesson_id, 'youtube', 'M7lc1UVf-VE')` — stand-in até os vídeos não listados de vocês existirem.

Cascas (`publicado=false`, ordem 2-9): fundamentos-ia-negocios, imersao-assistentes-ia, imersao-analise-dados-ia, lean-thinking, transformacao-digital, design-thinking-ia, spend-management-ia, neurociencia-produtividade — títulos/descrições/capas da mesma seção da v1.

- [ ] **Step 2: Rodar e verificar**

`node scripts/semente.mjs` e depois, no mesmo script ou via psql-query, imprimir contagens: courses=9, lessons=8, lesson_media=8, publicados=1. Rodar DUAS vezes → contagens iguais (idempotência).

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "plataforma: semente idempotente com curso demo e 8 cascas"
```

---

### Task 4: Auth.js (entrar, criar conta, sair), middleware e shell

**Files:**
- Create: `auth.config.ts`, `auth.ts`, `app/api/auth/[...nextauth]/route.ts`, `middleware.ts`
- Create: `lib/plataforma/usuarios.ts` (cadastro + verificação de senha)
- Create: `lib/content-plataforma.ts`
- Create: `app/app/layout.tsx`, `components/plataforma/ShellHeader.tsx`
- Create: `app/app/entrar/page.tsx`, `components/plataforma/FormEntrar.tsx`
- Create: `app/app/criar-conta/page.tsx`, `components/plataforma/FormCriarConta.tsx`, `app/app/criar-conta/actions.ts`
- Create: `app/app/page.tsx` (placeholder, Task 5 substitui)
- Test: `e2e/auth.spec.ts`, `playwright.config.ts`

**Interfaces:**
- Consumes: `db` + `users` da Task 2.
- Produces: `auth()` (sessão com `session.user.id` e `session.user.role`), `signIn`/`signOut` server-side; `criarUsuario({ nome, email, senha }): Promise<{ ok: true } | { ok: false; motivo: "email_existe" }>`; middleware que protege `/app/*` com `?voltar=` e `&sessao=expirada`; strings `plataforma.*`.

- [ ] **Step 1: e2e primeiro** — `playwright.config.ts` e `e2e/auth.spec.ts` EXATAMENTE como na v1 do plano (git show `5ee8a27:...`, Task 4 Step 1): mesmos labels ("Nome", "E-mail", "Senha"), mesmos botões ("Criar conta", "Entrar", "Sair"), mesma asserção do erro neutro "E-mail ou senha incorretos". Rodar contra build → FALHA (rotas não existem).

- [ ] **Step 2: Config Auth.js em duas partes** (o middleware roda no edge e não pode puxar `pg`/`bcryptjs`; sessão JWT valida cookie sem banco):

```ts
// auth.config.ts — importável no edge: SEM providers com Node deps
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: { signIn: "/app/entrar" },
  session: { strategy: "jwt" },
  providers: [], // preenchidos em auth.ts (lado Node)
  callbacks: {
    jwt({ token, user }) {
      if (user) { token.id = (user as any).id; token.role = (user as any).role; }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      (session.user as any).role = token.role as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
```

```ts
// auth.ts — lado Node completo
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { verificarCredenciais } from "@/lib/plataforma/usuarios";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, senha: {} },
      async authorize(cred) {
        const u = await verificarCredenciais(String(cred?.email ?? ""), String(cred?.senha ?? ""));
        return u ? { id: u.id, name: u.nome, email: u.email, role: u.role } as any : null;
      },
    }),
  ],
});
```

```ts
// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth";
export const { GET, POST } = handlers;
```

```ts
// tipos-auth.d.ts (raiz) — o TS não conhece user.id/role na sessão sem isto
import type { DefaultSession } from "next-auth";
declare module "next-auth" {
  interface Session {
    user: { id: string; role: string } & DefaultSession["user"];
  }
}
```

```ts
// middleware.ts — só authConfig (edge-safe)
import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);
const PUBLICAS = ["/app/entrar", "/app/criar-conta", "/api/auth"];

export default auth((req) => {
  const rota = req.nextUrl.pathname;
  const ehPublica = PUBLICAS.some((p) => rota.startsWith(p));
  if (!req.auth && !ehPublica) {
    const destino = req.nextUrl.clone();
    destino.pathname = "/app/entrar";
    const tinhaSessao = req.cookies.getAll().some((c) => c.name.includes("authjs"));
    destino.search = `?voltar=${encodeURIComponent(rota)}${tinhaSessao ? "&sessao=expirada" : ""}`;
    return NextResponse.redirect(destino);
  }
  if (req.auth && (rota.startsWith("/app/entrar") || rota.startsWith("/app/criar-conta"))) {
    const destino = req.nextUrl.clone();
    destino.pathname = "/app"; destino.search = "";
    return NextResponse.redirect(destino);
  }
  return NextResponse.next();
});
export const config = { matcher: ["/app/:path*"] };
```

- [ ] **Step 3: Usuários** — `lib/plataforma/usuarios.ts`:

```ts
import "server-only";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function criarUsuario(d: { nome: string; email: string; senha: string }):
  Promise<{ ok: true } | { ok: false; motivo: "email_existe" }> {
  const senhaHash = await bcrypt.hash(d.senha, 10);
  try {
    await db.insert(users).values({ nome: d.nome.trim(), email: d.email.trim().toLowerCase(), senhaHash });
    return { ok: true };
  } catch (e: any) {
    if (e?.code === "23505") return { ok: false, motivo: "email_existe" }; // unique lower(email)
    throw e;
  }
}

export async function verificarCredenciais(email: string, senha: string) {
  const [u] = await db.select().from(users)
    .where(eq(sql`lower(${users.email})`, email.trim().toLowerCase())).limit(1);
  if (!u) { await bcrypt.compare(senha, "$2a$10$invalidoinvalidoinvalidoinvalidoinvalido12345678901234"); return null; } // tempo constante
  return (await bcrypt.compare(senha, u.senhaHash)) ? u : null;
}
```

- [ ] **Step 4: Strings** — `lib/content-plataforma.ts` igual à v1 (git show `5ee8a27:...`, Task 4 Step 3) com UMA mudança: remover `linkMagico` e `linkMagicoEnviado` (Ciclo 2) — o bloco `entrar` fica com titulo/email/senha/botao/semConta/criarConta/erroCredenciais/sessaoExpirada.

- [ ] **Step 5: Shell** — `app/app/layout.tsx` e `ShellHeader.tsx` como na v1, trocando a leitura de sessão: `const sessao = await auth()` (import de `@/auth`), `user = sessao?.user`. Botão Sair: `<form action={sairAction}>` com server action:

```ts
// em app/app/layout.tsx ou arquivo actions próprio
"use server";
import { signOut } from "@/auth";
export async function sairAction() { await signOut({ redirectTo: "/app/entrar" }); }
```

Placeholder do painel usa a string do content: `<h1>{plataforma.shell.meusCursos}</h1>` (constraint global: nada de string solta).

- [ ] **Step 6: Formulários**

`FormEntrar.tsx` (client): campos controlados; submit chama server action `entrarAction` (arquivo `app/app/entrar/actions.ts`):

```ts
"use server";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { plataforma } from "@/lib/content-plataforma";

export async function entrarAction(_: unknown, formData: FormData):
  Promise<{ erro: string } | never> {
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      senha: String(formData.get("senha") ?? ""),
      redirectTo: String(formData.get("voltar") || "/app"),
    });
    return undefined as never; // signIn redireciona (lança NEXT_REDIRECT)
  } catch (e) {
    if (e instanceof AuthError) return { erro: plataforma.entrar.erroCredenciais };
    throw e; // NEXT_REDIRECT e afins seguem o fluxo
  }
}
```

No client, `useActionState(entrarAction, ...)`; aviso `sessaoExpirada` quando `?sessao=expirada`; input hidden `voltar` vindo de `useSearchParams`. `FormCriarConta` idem com `criarContaAction` (`app/app/criar-conta/actions.ts`): valida nome ≥ 2 e senha ≥ 8 (mensagens no content), chama `criarUsuario`, `email_existe` → `plataforma.criarConta.emailExiste`; sucesso → `signIn("credentials", { email, senha, redirectTo: "/app" })`. Estilo dos campos igual v1 (borda `border-line`, fundo `bg-surface`, foco `outline-accent-text`).

- [ ] **Step 7: Build + e2e verde** (derrubar porta 3000 antes do build). 3 testes passando.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "plataforma: auth.js com credenciais, middleware e shell"
```

---

### Task 5: Camada de dados com autorização (o coração), progresso puro e painel

**Files:**
- Create: `lib/plataforma/tipos.ts`, `lib/plataforma/progresso.ts`, `lib/plataforma/dados.ts`
- Create: `lib/plataforma/progresso.test.ts`, `lib/plataforma/autorizacao.test.ts`, `vitest.config.ts`
- Create: `components/plataforma/CardCurso.tsx`
- Modify: `app/app/page.tsx` (painel real)
- Test: `e2e/painel.spec.ts`

**Interfaces:**
- Consumes: `db`/schema, `auth()`.
- Produces (exatas — Tasks 6-8 dependem):

```ts
// tipos.ts — iguais à v1:
export type Aula = { id: string; slug: string; titulo: string; descricao: string; duracaoSeg: number; ordem: number; gratuita: boolean };
export type Modulo = { id: string; titulo: string; ordem: number; aulas: Aula[] };
export type Curso = { id: string; slug: string; titulo: string; descricao: string; capaUrl: string; nivel: string; cargaHoras: number; ordem: number };
export type CursoComIndice = Curso & { modulos: Modulo[] };
export type StatusAssinatura = "manual" | "ativa" | "inadimplente" | "cancelada" | null;

// progresso.ts — MESMAS funções e testes da v1 (copiar de git show 5ee8a27, Task 5 Steps 1-2):
export function derivarProgresso(aulaIds: string[], concluidas: Set<string>): { feitas: number; total: number; pct: number };
export function proximaAula(modulos: Modulo[], concluidas: Set<string>): Aula | null;

// dados.ts — TODA função de leitura sensível recebe userId EXPLÍCITO:
export async function temAcesso(userId: string): Promise<boolean>;            // subscriptions status in ('ativa','manual')
export async function buscarCatalogo(): Promise<Curso[]>;                     // WHERE publicado, ordem asc
export async function buscarCurso(slug: string): Promise<CursoComIndice | null>; // null se não publicado
export async function buscarConcluidas(userId: string): Promise<Set<string>>;
export async function buscarAssinatura(userId: string): Promise<StatusAssinatura>;
export async function buscarMidia(userId: string, lessonId: string):
  Promise<{ provider: string; videoId: string } | null>;
// buscarMidia é O portão: retorna null a menos que (aula gratuita E curso
// publicado) OU temAcesso(userId). Nunca lança para "sem acesso".
export async function gravarProgresso(userId: string, lessonId: string,
  campos: { concluida?: boolean; segundosAssistidos?: number }): Promise<void>; // upsert
```

- [ ] **Step 1: Unidade (progresso) vermelho→verde** — copiar `vitest.config.ts` (include `lib/**/*.test.ts`, `environment: "node"`) e os testes/implementação de progresso da v1, sem alteração.

- [ ] **Step 2: Integração de autorização (falha primeiro)** — `lib/plataforma/autorizacao.test.ts`, vitest contra o Postgres REAL (roda quando `DATABASE_URL` existe; `describe.skipIf(!process.env.DATABASE_URL)`; carregar `.env.local` no `vitest.config.ts` via `loadEnv`-manual igual aos scripts). Cobertura mínima:

```ts
import { beforeAll, afterAll, describe, expect, it } from "vitest";
// setup: cria (via db direto) usuário SEM assinatura, usuário COM assinatura
// 'manual', curso publicado com aula gratuita+paga (com mídia), curso oculto —
// slugs prefixados `teste-aut-${Date.now()}`; afterAll remove tudo.

describe("autorização da camada de dados", () => {
  it("mídia de aula gratuita sai para usuário sem assinatura");
  it("mídia de aula paga NÃO sai para usuário sem assinatura (null)");
  it("mídia de aula paga sai para assinante manual");
  it("mídia de curso não publicado não sai nem para assinante");
  it("buscarCurso de não publicado retorna null");
  it("buscarCatalogo não lista não publicado");
  it("gravarProgresso não aceita lessonId inexistente (FK erro)");
  it("buscarConcluidas de A não vê progresso de B");
});
```

Cada `it` com corpo real chamando as funções de `dados.ts` com os IDs do setup. Rodar → FALHA (dados.ts não existe).

- [ ] **Step 3: Implementar `dados.ts`** até integração verde. Consultas Drizzle com `with`/joins; mapeamento camelCase já vem do schema. `buscarMidia`:

```ts
export async function buscarMidia(userId: string, lessonId: string) {
  const [linha] = await db
    .select({ provider: lessonMedia.videoProvider, videoId: lessonMedia.videoId,
              gratuita: lessons.gratuita, publicado: courses.publicado })
    .from(lessonMedia)
    .innerJoin(lessons, eq(lessons.id, lessonMedia.lessonId))
    .innerJoin(modules, eq(modules.id, lessons.moduleId))
    .innerJoin(courses, eq(courses.id, modules.courseId))
    .where(eq(lessonMedia.lessonId, lessonId)).limit(1);
  if (!linha || !linha.publicado) return null;
  if (!linha.gratuita && !(await temAcesso(userId))) return null;
  return { provider: linha.provider, videoId: linha.videoId };
}
```

- [ ] **Step 4: Painel real** — `app/app/page.tsx`: `const sessao = await auth()` (middleware garante user); dados via funções acima com `sessao.user.id`. Layout, cards e "Continue de onde parou" EXATAMENTE como a v1 Task 5 Step 4 descreve (bloco continuar com capa+curso+aula+barra `bg-accent` sobre trilho `bg-line`; grade de `CardCurso` 3:4 com `next/image` `fill`, `sizes="(min-width: 1024px) 360px, 100vw"`, `objectPosition: "center top"`; sem assinatura → selo `plataforma.painel.seloAssine`, card continua levando ao curso). `CardCurso` props `{ curso: Curso; pct: number; temAcesso: boolean }`.

- [ ] **Step 5: e2e** — `e2e/painel.spec.ts` da v1: painel mostra "Fundamentos de IA com Copilot", não mostra "Imersão de Assistentes de IA para Negócios". Verde contra build.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "plataforma: camada de dados com autorização testada, progresso e painel"
```

---

### Task 6: Página do curso

Igual à v1 (git show `5ee8a27:...`, Task 6) com uma troca mecânica: dados via `buscarCurso(slug)` + `buscarConcluidas(sessao.user.id)` + `temAcesso(sessao.user.id)`. `IndiceCurso` com props `{ cursoSlug: string; modulos: Modulo[]; concluidas: string[]; aulaAtualId?: string }`. e2e `e2e/curso.spec.ts` idêntico (título, "8 aulas", etiqueta "Grátis", "Começar o curso" → `/app/curso/fundamentos-ia-copilot/boas-vindas`, slug inexistente → 404). Commit: `plataforma: página do curso com índice e continuar`.

---

### Task 7: Player, progresso e trava de assinatura

**Files:**
- Create: `app/app/curso/[slug]/[aula]/page.tsx`, `app/app/curso/[slug]/[aula]/actions.ts`, `components/plataforma/PlayerAula.tsx`
- Test: `e2e/aula.spec.ts`

**Interfaces:**
- Consumes: `buscarCurso`, `buscarMidia`, `buscarConcluidas`, `gravarProgresso`, `proximaAula`, `IndiceCurso`.
- Produces: `PlayerAula` props `{ videoId: string; lessonId: string; jaConcluida: boolean; hrefProxima: string | null }`; server actions `concluirAula(lessonId)` e `baterProgresso(lessonId, segundos)`.

- [ ] **Step 1: e2e primeiro** — `e2e/aula.spec.ts` da v1, inalterado nos dois cenários (gratuita toca e conclui; paga mostra cartão "Esta aula faz parte da assinatura", nunca 404).

- [ ] **Step 2: Server actions** — `app/app/curso/[slug]/[aula]/actions.ts`:

```ts
"use server";
import { auth } from "@/auth";
import { gravarProgresso } from "@/lib/plataforma/dados";

export async function concluirAula(lessonId: string) {
  const sessao = await auth();
  if (!sessao?.user?.id) return;
  await gravarProgresso(sessao.user.id, lessonId, { concluida: true });
}

export async function baterProgresso(lessonId: string, segundos: number) {
  const sessao = await auth();
  if (!sessao?.user?.id) return;
  await gravarProgresso(sessao.user.id, lessonId, { segundosAssistidos: Math.max(0, Math.floor(segundos)) });
}
```

- [ ] **Step 3: Página e player** — página como na v1 (duas colunas, cartão de trava em fundo ink com CTA para `/academy#contato`, `<details>` no mobile). `PlayerAula` igual ao da v1 Task 7 Step 3, trocando só a gravação: em vez de supabase client, chama `concluirAula(lessonId)` e `baterProgresso(lessonId, s)` importadas das actions (o componente é client; actions importadas funcionam como funções async). O restante — IFrame API, `youtube-nocookie`, `ended`→concluir, batida 15s só quando muda, falha→recarregar — idêntico.

- [ ] **Step 4: e2e verde; rodar `npm run test:integracao` de novo** (o portão continua fechado). Commit: `plataforma: player com progresso automático e trava de assinatura`.

---

### Task 8: Conta

Como a v1 Task 8, com mecânica nova: página lê `auth()` + `buscarAssinatura(userId)`; `FormConta` (client) usa server actions `app/app/conta/actions.ts`:

```ts
"use server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function salvarNome(nome: string) {
  const sessao = await auth(); if (!sessao?.user?.id) return { ok: false };
  await db.update(users).set({ nome: nome.trim() }).where(eq(users.id, sessao.user.id));
  return { ok: true };
}
export async function trocarSenha(nova: string) {
  const sessao = await auth(); if (!sessao?.user?.id || nova.length < 8) return { ok: false };
  await db.update(users).set({ senhaHash: await bcrypt.hash(nova, 10) }).where(eq(users.id, sessao.user.id));
  return { ok: true };
}
```

Status por extenso com `plataforma.conta.status*` (`Intl.DateTimeFormat("pt-BR")` para `ativa`). e2e `e2e/conta.spec.ts` da v1 (e-mail visível, "Sem assinatura", troca de nome persiste). Commit: `plataforma: conta com nome, senha e status da assinatura`.

---

### Task 9: GitHub, deploy no Railway, ligação com o site e varredura final

**Files:**
- Modify: `lib/content.ts` (`academy.platform.appHref` → `"/app"`)
- Create: `.env.example` (nomes das variáveis, sem valores)

**Interfaces:** plataforma pública a partir do `/academy`, rodando no Railway.

- [ ] **Step 1: Ligar o botão** — `appHref: "/app" as string | null`.

- [ ] **Step 2: Varredura local completa**

```bash
npx tsc --noEmit && npm run test:unit && npm run test:integracao
lsof -tiTCP:3000 -sTCP:LISTEN | xargs kill; npm run build; npm run start &
npm run test:e2e
```

Rotas antigas 200; `scrollWidth` 390 em viewport 390 nas telas novas (script Puppeteer); tema claro E escuro com captura; reduced-motion sem animação nova.

- [ ] **Step 3: GitHub** — remote `origin` já aponta para `https://github.com/rodrigo386/IAgentics.git`; push de `main` e `plataforma-ciclo-1` (credencial: passo manual do Rodrigo se ainda não feito).

- [ ] **Step 4: Deploy no Railway** (passos do Rodrigo com nosso apoio, documentados no relatório da task): criar serviço a partir do repo GitHub no MESMO projeto Railway do Postgres; variáveis `DATABASE_URL` (referência interna ao Postgres do projeto: `${{Postgres.DATABASE_URL}}`), `AUTH_SECRET` (novo `openssl rand -base64 32`, NÃO o de dev), `AUTH_TRUST_HOST=true`; build padrão Next (railpack detecta). Rodar migração+semente no banco de produção: `npm run db:migrar && node scripts/semente.mjs` com a `DATABASE_URL` pública no ambiente do comando (uma vez). Smoke test na URL gerada: `/`, `/academy`, `/app/entrar` 200; criar conta real; conferir trava da aula paga.

- [ ] **Step 5: Commit final**

```bash
git add -A && git commit -m "plataforma: ciclo 1 no ar no railway — botão Acessar plataforma ativo"
git push origin main plataforma-ciclo-1
```

---

## Fora deste plano (não fazer)

Checkout/Asaas, e-mails/link mágico (Resend), admin, certificado, cupons — Ciclos 2 e 3. Migração de vídeo Panda/Mux: troca de dados em `lesson_media`. Domínio próprio no Railway: quando o Rodrigo quiser.
