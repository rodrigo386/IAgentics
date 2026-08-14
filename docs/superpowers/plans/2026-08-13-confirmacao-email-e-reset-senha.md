# Confirmação de E-mail + Esqueci Minha Senha — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Confirmação de e-mail no cadastro com bloqueio total de login (atrás de interruptor por env) e fluxo "esqueci minha senha" por link de uso único, com válvulas de suporte no admin.

**Architecture:** Uma tabela `auth_tokens` guarda SHA-256 de segredos de uso único para os dois fluxos. Uma camada `lib/plataforma/email.ts` fala com a API do Resend (ou escreve em arquivo na costura de teste). O bloqueio liga quando `RESEND_API_KEY` existe; sem ela o cadastro nasce confirmado (comportamento atual). Páginas novas em `/app/*`; válvulas na ficha do aluno em `/admin/alunos/[id]`.

**Tech Stack:** Next.js 15 App Router, Drizzle + Postgres, Auth.js (Credentials), bcryptjs, vitest, Playwright.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-13-confirmacao-email-e-reset-senha-design.md` — em conflito, o spec governa.
- Strings visíveis SEMPRE em `lib/content-plataforma.ts` (pt-BR; nunca "PMEs").
- Migração via arquivo SQL manual em `drizzle/` (`0005_confirmacao_email.sql`) aplicada por `npm run db:migrar` — NUNCA `drizzle-kit generate` (snapshots defasados).
- Token: segredo 32 bytes `crypto.randomBytes` → base64url na URL; banco guarda SÓ `sha256` hex. Validade: confirmação 7 dias, reset 60 minutos. Uso único. Emitir invalida anteriores do mesmo tipo. Folga de 60s entre emissões do mesmo tipo.
- Interruptor: canal ativo ⇔ `EMAIL_CAIXA_TESTE` OU `RESEND_API_KEY` presente. Canal inativo ⇒ cadastro nasce confirmado e loga direto (zero regressão).
- Respostas públicas NUNCA revelam se o e-mail existe. Logs sem token/link.
- Invariante de segurança: `verificarCredenciais` nega usuário com `email_confirmado_em` null — sempre, independente do interruptor.
- `EMAIL_CAIXA_TESTE` nunca vai para o Railway.
- Suíte e2e principal roda SEM `RESEND_API_KEY` (specs atuais intocados); o fluxo bloqueante testa em config Playwright separada (porta 3100).
- Entrega em produção: migração 0005 ANTES do deploy via `railway ssh` (pré-requisito: Rodrigo rodar `npx @railway/cli@latest login`).

---

### Task 1: Migração 0005 + schema Drizzle

**Files:**
- Create: `drizzle/0005_confirmacao_email.sql`
- Modify: `lib/db/schema.ts` (users + nova tabela `authTokens`)

**Interfaces:**
- Produces: coluna `users.email_confirmado_em` (`users.emailConfirmadoEm` no Drizzle, `timestamp with time zone`, nullable); tabela `authTokens` com colunas `id, userId, tipo, tokenHash, expiraEm, usadoEm, criadoEm`.

- [ ] **Step 1: Escrever a migração**

```sql
-- drizzle/0005_confirmacao_email.sql
ALTER TABLE "users" ADD COLUMN "email_confirmado_em" timestamp with time zone;--> statement-breakpoint
-- Backfill: toda conta existente é considerada confirmada — ninguém ativo é
-- trancado para fora quando o bloqueio ligar.
UPDATE "users" SET "email_confirmado_em" = now();--> statement-breakpoint
CREATE TABLE "auth_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "tipo" text NOT NULL,
  "token_hash" text NOT NULL,
  "expira_em" timestamp with time zone NOT NULL,
  "usado_em" timestamp with time zone,
  "criado_em" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "auth_tokens_token_hash_unique" UNIQUE("token_hash"),
  CONSTRAINT "auth_tokens_tipo_chk" CHECK ("tipo" in ('confirmacao','reset'))
);--> statement-breakpoint
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_tokens_user_tipo_idx" ON "auth_tokens" ("user_id","tipo");
```

- [ ] **Step 2: Atualizar o schema Drizzle**

Em `lib/db/schema.ts`, adicionar ao `users` (depois de `createdAt`):

```ts
  emailConfirmadoEm: timestamp("email_confirmado_em", { withTimezone: true }),
```

E ao fim do arquivo (antes de `certificates` ou depois — ordem não importa):

```ts
/** Tokens de uso único dos fluxos de e-mail (confirmação de cadastro e reset
 *  de senha). O banco guarda só o SHA-256 do segredo; o segredo vive apenas na
 *  URL enviada por e-mail. Ver lib/plataforma/tokens.ts. */
export const authTokens = pgTable("auth_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tipo: text("tipo").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiraEm: timestamp("expira_em", { withTimezone: true }).notNull(),
  usadoEm: timestamp("usado_em", { withTimezone: true }),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("auth_tokens_user_tipo_idx").on(t.userId, t.tipo),
  check("auth_tokens_tipo_chk", sql`${t.tipo} in ('confirmacao','reset')`),
]);
```

- [ ] **Step 3: Aplicar no banco local**

Run: `npm run db:local >/dev/null 2>&1; npm run db:migrar`
Expected: `migração ok` (alvo 127.0.0.1:54329)

- [ ] **Step 4: Verificar coluna e tabela**

Run: `node -e "const pg=require('pg');require('dotenv').config({path:'.env.local'});const c=new pg.Client({connectionString:process.env.DATABASE_URL});c.connect().then(async()=>{const r=await c.query(\"select count(*) filter (where email_confirmado_em is not null) as confirmados, count(*) as total from users\");console.log(r.rows[0]);const t=await c.query(\"select count(*) from auth_tokens\");console.log('auth_tokens ok', t.rows[0]);await c.end();})"`
Expected: `confirmados` igual a `total`; `auth_tokens ok { count: '0' }`

- [ ] **Step 5: Commit**

```bash
git add drizzle/0005_confirmacao_email.sql lib/db/schema.ts
git commit -m "feat: migração 0005 — email_confirmado_em + tabela auth_tokens"
```

---

### Task 2: lib/plataforma/tokens.ts (TDD)

**Files:**
- Create: `lib/plataforma/tokens.ts`
- Test: `lib/plataforma/tokens.test.ts`

**Interfaces:**
- Consumes: `authTokens`, `users` de `@/lib/db/schema`; `db` de `@/lib/db`.
- Produces:
  - `type TipoToken = "confirmacao" | "reset"`
  - `emitirToken(userId: string, tipo: TipoToken): Promise<{ ok: true; segredo: string } | { ok: false; motivo: "aguarde" }>`
  - `consumirToken(segredo: string, tipo: TipoToken): Promise<{ ok: true; userId: string } | { ok: false }>`

Os testes seguem o padrão dos testes de banco existentes (ver `lib/plataforma/autorizacao.test.ts`: usam o Postgres local da `DATABASE_URL`, criam usuário próprio e limpam no fim).

- [ ] **Step 1: Escrever os testes que falham**

```ts
// lib/plataforma/tokens.test.ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { authTokens, users } from "@/lib/db/schema";
import { consumirToken, emitirToken } from "./tokens";

let userId: string;

beforeAll(async () => {
  const [u] = await db
    .insert(users)
    .values({ nome: "Tokens Teste", email: `tokens-${Date.now()}@teste.invalido`, senhaHash: "x" })
    .returning({ id: users.id });
  userId = u.id;
});

afterAll(async () => {
  await db.delete(users).where(eq(users.id, userId)); // cascade limpa os tokens
});

describe("emitirToken / consumirToken", () => {
  it("emite e consome uma única vez", async () => {
    const r = await emitirToken(userId, "reset");
    if (!r.ok) throw new Error("emissão deveria passar");
    expect(r.segredo.length).toBeGreaterThanOrEqual(40); // 32 bytes base64url ~43
    const v1 = await consumirToken(r.segredo, "reset");
    expect(v1).toEqual({ ok: true, userId });
    const v2 = await consumirToken(r.segredo, "reset");
    expect(v2.ok).toBe(false); // uso único
  });

  it("não vaza o segredo no banco (guarda só o hash)", async () => {
    // limpa a folga de 60s da emissão anterior
    await db.delete(authTokens).where(eq(authTokens.userId, userId));
    const r = await emitirToken(userId, "reset");
    if (!r.ok) throw new Error("emissão deveria passar");
    const linhas = await db.select().from(authTokens).where(eq(authTokens.userId, userId));
    expect(linhas.some((l) => l.tokenHash === r.segredo)).toBe(false);
    expect(linhas[0].tokenHash).toMatch(/^[0-9a-f]{64}$/); // sha256 hex
  });

  it("tipo errado não consome", async () => {
    await db.delete(authTokens).where(eq(authTokens.userId, userId));
    const r = await emitirToken(userId, "confirmacao");
    if (!r.ok) throw new Error("emissão deveria passar");
    expect((await consumirToken(r.segredo, "reset")).ok).toBe(false);
    expect((await consumirToken(r.segredo, "confirmacao")).ok).toBe(true);
  });

  it("segunda emissão dentro de 60s pede para aguardar", async () => {
    await db.delete(authTokens).where(eq(authTokens.userId, userId));
    expect((await emitirToken(userId, "reset")).ok).toBe(true);
    expect(await emitirToken(userId, "reset")).toEqual({ ok: false, motivo: "aguarde" });
  });

  it("emissão nova invalida o link anterior do mesmo tipo", async () => {
    await db.delete(authTokens).where(eq(authTokens.userId, userId));
    const antigo = await emitirToken(userId, "reset");
    if (!antigo.ok) throw new Error("emissão deveria passar");
    // simula a folga vencida para poder emitir de novo
    await db.update(authTokens).set({ criadoEm: new Date(Date.now() - 61_000) }).where(eq(authTokens.userId, userId));
    const novo = await emitirToken(userId, "reset");
    if (!novo.ok) throw new Error("emissão deveria passar");
    expect((await consumirToken(antigo.segredo, "reset")).ok).toBe(false);
    expect((await consumirToken(novo.segredo, "reset")).ok).toBe(true);
  });

  it("token expirado não consome", async () => {
    await db.delete(authTokens).where(eq(authTokens.userId, userId));
    const r = await emitirToken(userId, "reset");
    if (!r.ok) throw new Error("emissão deveria passar");
    await db.update(authTokens).set({ expiraEm: new Date(Date.now() - 1000) }).where(eq(authTokens.userId, userId));
    expect((await consumirToken(r.segredo, "reset")).ok).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run lib/plataforma/tokens.test.ts`
Expected: FAIL (módulo `./tokens` não existe)

- [ ] **Step 3: Implementar**

```ts
// lib/plataforma/tokens.ts
import "server-only";
import { createHash, randomBytes } from "crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { authTokens } from "@/lib/db/schema";

export type TipoToken = "confirmacao" | "reset";

/** Validade por tipo (spec): confirmação 7 dias, reset 60 minutos. */
const VALIDADE_MS: Record<TipoToken, number> = {
  confirmacao: 7 * 24 * 60 * 60 * 1000,
  reset: 60 * 60 * 1000,
};

/** Folga mínima entre emissões do mesmo tipo para o mesmo usuário. */
const FOLGA_MS = 60_000;

function hash(segredo: string): string {
  return createHash("sha256").update(segredo).digest("hex");
}

/** Emite um token novo: invalida os anteriores do mesmo tipo (um link vivo por
 *  vez) e respeita a folga de 60s. O segredo NUNCA é gravado — só o SHA-256. */
export async function emitirToken(
  userId: string,
  tipo: TipoToken,
): Promise<{ ok: true; segredo: string } | { ok: false; motivo: "aguarde" }> {
  const [ultimo] = await db
    .select({ criadoEm: authTokens.criadoEm })
    .from(authTokens)
    .where(and(eq(authTokens.userId, userId), eq(authTokens.tipo, tipo)))
    .orderBy(desc(authTokens.criadoEm))
    .limit(1);
  if (ultimo && Date.now() - ultimo.criadoEm.getTime() < FOLGA_MS) {
    return { ok: false, motivo: "aguarde" };
  }

  const segredo = randomBytes(32).toString("base64url");
  await db.delete(authTokens).where(and(eq(authTokens.userId, userId), eq(authTokens.tipo, tipo)));
  await db.insert(authTokens).values({
    userId,
    tipo,
    tokenHash: hash(segredo),
    expiraEm: new Date(Date.now() + VALIDADE_MS[tipo]),
  });
  return { ok: true, segredo };
}

/** Valida e queima em um passo: o UPDATE condicional só preenche usado_em se o
 *  token ainda está virgem e no prazo — corrida de dois cliques no mesmo link
 *  consome uma vez só. Resposta binária, sem distinguir expirado de usado. */
export async function consumirToken(
  segredo: string,
  tipo: TipoToken,
): Promise<{ ok: true; userId: string } | { ok: false }> {
  const agora = new Date();
  const [linha] = await db
    .update(authTokens)
    .set({ usadoEm: agora })
    .where(
      and(
        eq(authTokens.tokenHash, hash(segredo)),
        eq(authTokens.tipo, tipo),
        isNull(authTokens.usadoEm),
      ),
    )
    .returning({ userId: authTokens.userId, expiraEm: authTokens.expiraEm });
  if (!linha) return { ok: false };
  if (linha.expiraEm.getTime() < agora.getTime()) return { ok: false };
  return { ok: true, userId: linha.userId };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run lib/plataforma/tokens.test.ts`
Expected: 6 passed

- [ ] **Step 5: Commit**

```bash
git add lib/plataforma/tokens.ts lib/plataforma/tokens.test.ts
git commit -m "feat: tokens de uso único (confirmação/reset) com hash sha256 e folga de 60s"
```

---

### Task 3: lib/plataforma/email.ts + templates + strings

**Files:**
- Create: `lib/plataforma/email.ts`
- Modify: `lib/content-plataforma.ts` (novo bloco `emails` no objeto `plataforma`)
- Test: `lib/plataforma/email.test.ts`

**Interfaces:**
- Produces:
  - `emailTransacionalAtivo(): boolean` — true se `EMAIL_CAIXA_TESTE` ou `RESEND_API_KEY` presentes.
  - `enviarEmail(msg: { para: string; assunto: string; texto: string; html: string }): Promise<{ ok: boolean }>`
  - `emailDeConfirmacao(nome: string, url: string): { assunto: string; texto: string; html: string }`
  - `emailDeReset(nome: string, url: string): { assunto: string; texto: string; html: string }`
  - `urlBase(): string` — `process.env.AUTH_URL` sem barra final, fallback `http://localhost:3000`.

- [ ] **Step 1: Strings no content-plataforma**

Adicionar ao objeto `plataforma` em `lib/content-plataforma.ts` (nível do bloco `aula`):

```ts
  /* E-mails transacionais (lib/plataforma/email.ts). Texto puro + HTML simples
     da marca; link também em texto puro por entregabilidade. */
  emails: {
    confirmacao: {
      assunto: "Confirme seu e-mail — IAgentics Academy",
      saudacao: (nome: string) => `Olá, ${nome}.`,
      corpo: "Confirme seu e-mail para entrar na IAgentics Academy. O link vale por 7 dias.",
      botao: "Confirmar e-mail",
      ignorar: "Se você não criou esta conta, ignore esta mensagem.",
    },
    reset: {
      assunto: "Redefinir sua senha — IAgentics Academy",
      saudacao: (nome: string) => `Olá, ${nome}.`,
      corpo: "Recebemos um pedido para redefinir sua senha. O link vale por 60 minutos e funciona uma única vez.",
      botao: "Redefinir senha",
      ignorar: "Se você não pediu a redefinição, ignore esta mensagem — sua senha continua a mesma.",
    },
    rodape: "IAgentics Academy · iagentics.com.br",
  },
```

- [ ] **Step 2: Teste que falha**

```ts
// lib/plataforma/email.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { emailDeConfirmacao, emailDeReset, emailTransacionalAtivo, enviarEmail, urlBase } from "./email";

const ENVS = ["EMAIL_CAIXA_TESTE", "RESEND_API_KEY", "AUTH_URL"] as const;
const originais = Object.fromEntries(ENVS.map((k) => [k, process.env[k]]));
afterEach(() => {
  for (const k of ENVS) {
    if (originais[k] === undefined) delete process.env[k];
    else process.env[k] = originais[k];
  }
});

describe("camada de e-mail", () => {
  it("interruptor: inativo sem envs, ativo com caixa OU chave", () => {
    delete process.env.EMAIL_CAIXA_TESTE;
    delete process.env.RESEND_API_KEY;
    expect(emailTransacionalAtivo()).toBe(false);
    process.env.EMAIL_CAIXA_TESTE = "/tmp/x";
    expect(emailTransacionalAtivo()).toBe(true);
    delete process.env.EMAIL_CAIXA_TESTE;
    process.env.RESEND_API_KEY = "re_x";
    expect(emailTransacionalAtivo()).toBe(true);
  });

  it("caixa de teste escreve a mensagem em arquivo (uma linha JSON)", async () => {
    const arquivo = join(mkdtempSync(join(tmpdir(), "caixa-")), "emails.jsonl");
    process.env.EMAIL_CAIXA_TESTE = arquivo;
    const r = await enviarEmail({ para: "a@b.c", assunto: "Oi", texto: "corpo", html: "<p>corpo</p>" });
    expect(r.ok).toBe(true);
    const linha = JSON.parse(readFileSync(arquivo, "utf8").trim().split("\n").at(-1)!);
    expect(linha.para).toBe("a@b.c");
    expect(linha.texto).toContain("corpo");
  });

  it("templates carregam o link no texto e no html", () => {
    const c = emailDeConfirmacao("Rodrigo", "https://x/tok");
    expect(c.texto).toContain("https://x/tok");
    expect(c.html).toContain("https://x/tok");
    const s = emailDeReset("Rodrigo", "https://x/tok2");
    expect(s.texto).toContain("https://x/tok2");
    expect(s.assunto).toContain("senha");
  });

  it("urlBase tira a barra final e tem fallback local", () => {
    process.env.AUTH_URL = "https://iagentics.com.br/";
    expect(urlBase()).toBe("https://iagentics.com.br");
    delete process.env.AUTH_URL;
    expect(urlBase()).toBe("http://localhost:3000");
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run lib/plataforma/email.test.ts`
Expected: FAIL (módulo não existe)

- [ ] **Step 4: Implementar**

```ts
// lib/plataforma/email.ts
import "server-only";
import { appendFileSync } from "fs";
import { plataforma } from "@/lib/content-plataforma";

/** Canal transacional ativo? A caixa de teste (e2e) tem precedência sobre a
 *  API real — com ela setada, NADA sai para a rede. */
export function emailTransacionalAtivo(): boolean {
  return Boolean(process.env.EMAIL_CAIXA_TESTE || process.env.RESEND_API_KEY);
}

export function urlBase(): string {
  return (process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export async function enviarEmail(msg: {
  para: string;
  assunto: string;
  texto: string;
  html: string;
}): Promise<{ ok: boolean }> {
  const caixa = process.env.EMAIL_CAIXA_TESTE;
  if (caixa) {
    appendFileSync(caixa, JSON.stringify({ ...msg, em: new Date().toISOString() }) + "\n");
    return { ok: true };
  }
  const chave = process.env.RESEND_API_KEY;
  if (!chave) return { ok: false };
  try {
    const resposta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        from: process.env.EMAIL_DE ?? "IAgentics Academy <nao-responda@iagentics.com.br>",
        to: [msg.para],
        subject: msg.assunto,
        text: msg.texto,
        html: msg.html,
      }),
    });
    if (!resposta.ok) {
      console.error("[email] Resend recusou", resposta.status);
      return { ok: false };
    }
    return { ok: true };
  } catch (erro) {
    console.error("[email] falha no envio", erro instanceof Error ? erro.message : erro);
    return { ok: false };
  }
}

/** HTML mínimo da marca: fundo claro, wordmark em texto, botão violeta e o
 *  link repetido em texto puro. Sem imagens externas (entregabilidade). */
function moldura(conteudo: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f8f8f8;font-family:Arial,Helvetica,sans-serif;color:#131723">
<div style="max-width:520px;margin:0 auto;padding:32px 20px">
<p style="font-size:14px;letter-spacing:.12em;text-transform:uppercase;margin:0 0 24px"><strong>IAgentics</strong> Academy</p>
${conteudo}
<p style="font-size:12px;color:#5a6070;margin-top:32px">${plataforma.emails.rodape}</p>
</div></body></html>`;
}

function botao(url: string, rotulo: string): string {
  return `<p style="margin:24px 0"><a href="${url}" style="background:#7607e8;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:999px;display:inline-block;font-weight:bold">${rotulo}</a></p>
<p style="font-size:12px;color:#5a6070;word-break:break-all">Ou copie e cole: ${url}</p>`;
}

export function emailDeConfirmacao(nome: string, url: string) {
  const t = plataforma.emails.confirmacao;
  return {
    assunto: t.assunto,
    texto: `${t.saudacao(nome)}\n\n${t.corpo}\n\n${url}\n\n${t.ignorar}\n\n${plataforma.emails.rodape}`,
    html: moldura(`<p>${t.saudacao(nome)}</p><p>${t.corpo}</p>${botao(url, t.botao)}<p style="font-size:12px;color:#5a6070">${t.ignorar}</p>`),
  };
}

export function emailDeReset(nome: string, url: string) {
  const t = plataforma.emails.reset;
  return {
    assunto: t.assunto,
    texto: `${t.saudacao(nome)}\n\n${t.corpo}\n\n${url}\n\n${t.ignorar}\n\n${plataforma.emails.rodape}`,
    html: moldura(`<p>${t.saudacao(nome)}</p><p>${t.corpo}</p>${botao(url, t.botao)}<p style="font-size:12px;color:#5a6070">${t.ignorar}</p>`),
  };
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run lib/plataforma/email.test.ts`
Expected: 4 passed

- [ ] **Step 6: Commit**

```bash
git add lib/plataforma/email.ts lib/plataforma/email.test.ts lib/content-plataforma.ts
git commit -m "feat: camada de e-mail transacional (Resend + caixa de teste) com templates da marca"
```

---

### Task 4: Fluxo de confirmação — cadastro, login bloqueado, página do link e reenvio

**Files:**
- Modify: `lib/plataforma/usuarios.ts` (`criarUsuario` retorna id e aceita confirmação pendente; `verificarCredenciais` nega não confirmado; nova `credenciaisValidasMasNaoConfirmadas`; nova `emitirEEnviarConfirmacao`; nova `reenviarConfirmacaoPorEmail`)
- Modify: `app/app/criar-conta/actions.ts` (bifurca no interruptor)
- Create: `app/app/confirmar-email/page.tsx` (tela "enviamos o link" + reenvio)
- Create: `app/app/confirmar-email/[token]/page.tsx` (consome e redireciona)
- Create: `app/app/confirmar-email/actions.ts` (`reenviarConfirmacaoAction`)
- Create: `components/plataforma/FormReenviarConfirmacao.tsx`
- Modify: `components/plataforma/FormEntrar.tsx` (avisos `confirmado=1` / não confirmado + reenvio)
- Modify: `app/app/entrar/actions.ts` (distingue "não confirmado" após AuthError)
- Modify: `lib/content-plataforma.ts` (bloco `confirmacao` + strings novas em `entrar`)
- Test: `lib/plataforma/usuarios-confirmacao.test.ts`

**Interfaces:**
- Consumes: `emitirToken`, `consumirToken` (Task 2); `enviarEmail`, `emailDeConfirmacao`, `emailTransacionalAtivo`, `urlBase` (Task 3).
- Produces:
  - `criarUsuario(d): Promise<{ ok: true; id: string; confirmacaoPendente: boolean } | { ok: false; motivo: "email_existe" }>` — cria com `emailConfirmadoEm: null` quando `emailTransacionalAtivo()`, senão `new Date()`.
  - `credenciaisValidasMasNaoConfirmadas(email: string, senha: string): Promise<boolean>`
  - `emitirEEnviarConfirmacao(userId: string, nome: string, email: string): Promise<void>` — emite token e envia o e-mail com link `${urlBase()}/app/confirmar-email/${segredo}`; engole folga de 60s (log).
  - `reenviarConfirmacaoPorEmail(email: string): Promise<void>` — busca por e-mail; se existe e não confirmado, chama `emitirEEnviarConfirmacao`; SEMPRE resolve sem revelar nada.
  - `confirmarEmailPorToken(segredo: string): Promise<boolean>` — consome token `confirmacao` e grava `emailConfirmadoEm`.
  - Action `reenviarConfirmacaoAction(_: unknown, formData: FormData): Promise<{ mensagem: string }>` — sempre a mensagem neutra.
  - Strings novas: `plataforma.confirmacao.{titulo, enviamos: (email) => string, reenviar, reenviado, linkInvalidoTitulo, linkInvalidoTexto, confirmadoAviso}` e `plataforma.entrar.{naoConfirmado, esqueciSenha}`.

- [ ] **Step 1: Testes que falham (regras de usuários)**

```ts
// lib/plataforma/usuarios-confirmacao.test.ts
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  confirmarEmailPorToken,
  credenciaisValidasMasNaoConfirmadas,
  criarUsuario,
  verificarCredenciais,
} from "./usuarios";
import { emitirToken } from "./tokens";

const emails: string[] = [];
function novoEmail() {
  const e = `conf-${Date.now()}-${emails.length}@teste.invalido`;
  emails.push(e);
  return e;
}

afterEach(() => {
  delete process.env.EMAIL_CAIXA_TESTE;
});
afterAll(async () => {
  for (const e of emails) await db.delete(users).where(eq(sql`lower(${users.email})`, e));
});

describe("confirmação no cadastro", () => {
  it("canal inativo: conta nasce confirmada e loga", async () => {
    const email = novoEmail();
    const r = await criarUsuario({ nome: "Sem Canal", email, senha: "senha-boa-123" });
    if (!r.ok) throw new Error("deveria criar");
    expect(r.confirmacaoPendente).toBe(false);
    expect(await verificarCredenciais(email, "senha-boa-123")).not.toBeNull();
  });

  it("canal ativo: conta nasce pendente, login negado, reenvio detecta", async () => {
    process.env.EMAIL_CAIXA_TESTE = "/dev/null";
    const email = novoEmail();
    const r = await criarUsuario({ nome: "Com Canal", email, senha: "senha-boa-123" });
    if (!r.ok) throw new Error("deveria criar");
    expect(r.confirmacaoPendente).toBe(true);
    expect(await verificarCredenciais(email, "senha-boa-123")).toBeNull();
    expect(await credenciaisValidasMasNaoConfirmadas(email, "senha-boa-123")).toBe(true);
    expect(await credenciaisValidasMasNaoConfirmadas(email, "senha-errada")).toBe(false);
  });

  it("confirmar por token libera o login", async () => {
    process.env.EMAIL_CAIXA_TESTE = "/dev/null";
    const email = novoEmail();
    const r = await criarUsuario({ nome: "Confirma", email, senha: "senha-boa-123" });
    if (!r.ok) throw new Error("deveria criar");
    const t = await emitirToken(r.id, "confirmacao");
    if (!t.ok) throw new Error("token deveria sair");
    expect(await confirmarEmailPorToken(t.segredo)).toBe(true);
    expect(await verificarCredenciais(email, "senha-boa-123")).not.toBeNull();
    expect(await confirmarEmailPorToken(t.segredo)).toBe(false); // uso único
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run lib/plataforma/usuarios-confirmacao.test.ts`
Expected: FAIL (exports não existem / assinatura antiga)

- [ ] **Step 3: Implementar em lib/plataforma/usuarios.ts**

Alterações (mantendo todo o resto do arquivo):

```ts
// imports novos no topo:
import { emitirToken, consumirToken } from "@/lib/plataforma/tokens";
import { emailDeConfirmacao, emailTransacionalAtivo, enviarEmail, urlBase } from "@/lib/plataforma/email";

// criarUsuario: passa a retornar id + confirmacaoPendente
export async function criarUsuario(d: { nome: string; email: string; senha: string }):
  Promise<{ ok: true; id: string; confirmacaoPendente: boolean } | { ok: false; motivo: "email_existe" }> {
  if (d.nome.trim().length < 2 || d.senha.length < 8) throw new Error("dados invalidos");
  const senhaHash = await bcrypt.hash(d.senha, 10);
  // Bloqueio total é decisão de produto, mas só faz sentido com canal de e-mail:
  // sem RESEND_API_KEY (nem caixa de teste) a conta nasce confirmada — o
  // comportamento de sempre, zero regressão até a chave existir.
  const confirmacaoPendente = emailTransacionalAtivo();
  try {
    const [linha] = await db
      .insert(users)
      .values({
        nome: d.nome.trim(),
        email: d.email.trim().toLowerCase(),
        senhaHash,
        emailConfirmadoEm: confirmacaoPendente ? null : new Date(),
      })
      .returning({ id: users.id });
    return { ok: true, id: linha.id, confirmacaoPendente };
  } catch (e: any) {
    const codigoPg = e?.code ?? e?.cause?.code;
    if (codigoPg === "23505") return { ok: false, motivo: "email_existe" };
    throw e;
  }
}

// verificarCredenciais: INVARIANTE — não confirmado nunca loga (checagem após
// a senha, para não mudar o perfil de tempo entre existente/inexistente):
//   if (!senhaOk) return null;
//   if (!u.emailConfirmadoEm) return null;   // <— linha nova
//   return u.ativo ? u : null;

/** Para a página de login distinguir "senha errada" de "falta confirmar":
 *  só roda DEPOIS de um AuthError (caminho raro), custo extra de bcrypt ok. */
export async function credenciaisValidasMasNaoConfirmadas(email: string, senha: string): Promise<boolean> {
  const [u] = await db.select().from(users)
    .where(eq(sql`lower(${users.email})`, email.trim().toLowerCase())).limit(1);
  if (!u || u.emailConfirmadoEm) return false;
  return bcrypt.compare(senha, u.senhaHash);
}

/** Emite e envia o link de confirmação. Folga de 60s vira log, não erro —
 *  quem chama nunca precisa tratar. Nunca loga o token. */
export async function emitirEEnviarConfirmacao(userId: string, nome: string, email: string): Promise<void> {
  const t = await emitirToken(userId, "confirmacao");
  if (!t.ok) {
    console.info("[confirmacao] reenvio dentro da folga de 60s", { userId });
    return;
  }
  const msg = emailDeConfirmacao(nome, `${urlBase()}/app/confirmar-email/${t.segredo}`);
  const r = await enviarEmail({ para: email, ...msg });
  if (!r.ok) console.error("[confirmacao] envio falhou", { userId });
}

/** Caminho público de reenvio: resposta é sempre a mesma para quem chama. */
export async function reenviarConfirmacaoPorEmail(email: string): Promise<void> {
  const [u] = await db.select({ id: users.id, nome: users.nome, email: users.email, emailConfirmadoEm: users.emailConfirmadoEm })
    .from(users).where(eq(sql`lower(${users.email})`, email.trim().toLowerCase())).limit(1);
  if (!u || u.emailConfirmadoEm) return;
  await emitirEEnviarConfirmacao(u.id, u.nome, u.email);
}

/** Consome o token de confirmação e marca o e-mail como confirmado. */
export async function confirmarEmailPorToken(segredo: string): Promise<boolean> {
  const r = await consumirToken(segredo, "confirmacao");
  if (!r.ok) return false;
  await db.update(users).set({ emailConfirmadoEm: new Date() }).where(eq(users.id, r.userId));
  return true;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run lib/plataforma/usuarios-confirmacao.test.ts lib/plataforma/autorizacao.test.ts`
Expected: todos passam (o autorizacao.test.ts existente segue verde — contas de teste dele nascem confirmadas porque as envs não estão setadas no vitest)

- [ ] **Step 5: Strings novas**

Em `lib/content-plataforma.ts`, adicionar bloco `confirmacao` (nível do `aula`) e duas strings em `entrar`:

```ts
  confirmacao: {
    titulo: "Confirme seu e-mail",
    enviamos: (email: string) => `Enviamos um link de confirmação para ${email}. Abra o e-mail e clique no link para entrar.`,
    reenviar: "Reenviar link",
    reenviado: "Se existir uma conta com este e-mail, enviamos um novo link.",
    linkInvalidoTitulo: "Link inválido ou vencido",
    linkInvalidoTexto: "Peça um novo link de confirmação informando seu e-mail.",
    confirmadoAviso: "E-mail confirmado — entre com sua senha.",
  },
```

E dentro de `entrar`:

```ts
    naoConfirmado: "Confirme seu e-mail antes de entrar. Não recebeu o link?",
    esqueciSenha: "Esqueci minha senha",
```

- [ ] **Step 6: Action de cadastro bifurca**

Em `app/app/criar-conta/actions.ts`, depois do `criarUsuario` ok:

```ts
  if (resultado.confirmacaoPendente) {
    await emitirEEnviarConfirmacao(resultado.id, nome, email);
    redirect(`/app/confirmar-email?para=${encodeURIComponent(email.trim().toLowerCase())}`);
  }
  // canal inativo: segue o signIn de hoje
```

(imports: `redirect` de `next/navigation`, `emitirEEnviarConfirmacao` de usuarios. O `redirect` lança — fica FORA do try/catch do signIn.)

- [ ] **Step 7: Páginas e formulário de reenvio**

```tsx
// app/app/confirmar-email/page.tsx
import { plataforma } from "@/lib/content-plataforma";
import { FormReenviarConfirmacao } from "@/components/plataforma/FormReenviarConfirmacao";

export const dynamic = "force-dynamic";

export default async function ConfirmarEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ para?: string; erro?: string }>;
}) {
  const { para, erro } = await searchParams;
  const t = plataforma.confirmacao;
  return (
    <main className="mx-auto w-full max-w-md px-5 py-16">
      <h1 className="text-3xl font-medium tracking-[-0.02em] text-fg">
        {erro ? t.linkInvalidoTitulo : t.titulo}
      </h1>
      <p className="mt-4 leading-relaxed text-fg-muted">
        {erro ? t.linkInvalidoTexto : para ? t.enviamos(para) : t.linkInvalidoTexto}
      </p>
      <div className="mt-8">
        <FormReenviarConfirmacao emailInicial={para ?? ""} />
      </div>
    </main>
  );
}
```

```tsx
// app/app/confirmar-email/[token]/page.tsx
import { redirect } from "next/navigation";
import { confirmarEmailPorToken } from "@/lib/plataforma/usuarios";

export const dynamic = "force-dynamic";

/** Consome o token e leva ao login. Sem UI própria: sucesso vira aviso verde
 *  no login; falha cai na tela de reenvio com estado de erro. */
export default async function ConfirmarPorTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const ok = await confirmarEmailPorToken(token);
  redirect(ok ? "/app/entrar?confirmado=1" : "/app/confirmar-email?erro=1");
}
```

```ts
// app/app/confirmar-email/actions.ts
"use server";
import { plataforma } from "@/lib/content-plataforma";
import { reenviarConfirmacaoPorEmail } from "@/lib/plataforma/usuarios";

export async function reenviarConfirmacaoAction(
  _: unknown,
  formData: FormData,
): Promise<{ mensagem: string }> {
  const email = String(formData.get("email") ?? "");
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) await reenviarConfirmacaoPorEmail(email);
  return { mensagem: plataforma.confirmacao.reenviado }; // neutra, sempre
}
```

```tsx
// components/plataforma/FormReenviarConfirmacao.tsx
"use client";
import { useActionState } from "react";
import { reenviarConfirmacaoAction } from "@/app/app/confirmar-email/actions";
import { plataforma } from "@/lib/content-plataforma";

// text-base (16px): abaixo disso o iOS dá zoom automático ao focar o campo.
const campo = "w-full border border-line bg-surface px-4 py-3 text-base text-fg placeholder:text-fg-subtle focus-visible:outline-2 focus-visible:outline-accent-text";

export function FormReenviarConfirmacao({ emailInicial }: { emailInicial: string }) {
  const t = plataforma.confirmacao;
  const [estado, acao, enviando] = useActionState(reenviarConfirmacaoAction, null as { mensagem: string } | null);
  return (
    <form action={acao} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        E-mail
        <input type="email" name="email" required defaultValue={emailInicial} autoComplete="email" className={campo} />
      </label>
      {estado ? <p role="status" className="text-sm text-accent-text">{estado.mensagem}</p> : null}
      <button disabled={enviando} className="rounded-control border border-line-strong px-6 py-3 font-medium transition-colors hover:border-fg disabled:opacity-60">
        {t.reenviar}
      </button>
    </form>
  );
}
```

- [ ] **Step 8: Login distingue "não confirmado" e mostra avisos**

Em `app/app/entrar/actions.ts`, no catch do `AuthError`:

```ts
  } catch (e) {
    if (e instanceof AuthError) {
      // Distingue "senha errada" de "falta confirmar" SÓ depois da falha —
      // caminho raro, custo extra de bcrypt aceitável.
      if (await credenciaisValidasMasNaoConfirmadas(email, senha)) {
        return { erro: null, naoConfirmado: true, email: email.trim().toLowerCase() };
      }
      return { erro: plataforma.entrar.erroCredenciais, naoConfirmado: false, email: null };
    }
    throw e;
  }
```

(o tipo do estado do form vira `{ erro: string | null; naoConfirmado?: boolean; email?: string | null }` — ajustar `ESTADO_INICIAL` no FormEntrar.)

Em `components/plataforma/FormEntrar.tsx`:
- ler `busca.get("confirmado") === "1"` e mostrar `<p role="status" className="border border-line bg-surface px-4 py-3 text-sm text-accent-text">{plataforma.confirmacao.confirmadoAviso}</p>` no topo (padrão do aviso `sessaoExpirada` existente);
- quando `estado?.naoConfirmado`, no lugar do erro genérico mostrar `plataforma.entrar.naoConfirmado` + `<FormReenviarConfirmacao emailInicial={estado.email ?? email} />`;
- adicionar embaixo do botão Entrar: `<a href="/app/recuperar-senha" className="text-sm text-fg-muted hover:text-fg">{plataforma.entrar.esqueciSenha}</a>` (o destino nasce na Task 5; o link pode entrar já aqui).

- [ ] **Step 9: Build + suíte**

Run: `rm -rf .next && npm run build && npm run test:unit`
Expected: build verde; unit todos passam

- [ ] **Step 10: Commit**

```bash
git add lib/plataforma/usuarios.ts lib/plataforma/usuarios-confirmacao.test.ts app/app/criar-conta/actions.ts app/app/confirmar-email components/plataforma/FormReenviarConfirmacao.tsx components/plataforma/FormEntrar.tsx app/app/entrar/actions.ts lib/content-plataforma.ts
git commit -m "feat: confirmação de e-mail com bloqueio total atrás do interruptor do canal"
```

---

### Task 5: Fluxo esqueci minha senha

**Files:**
- Modify: `lib/plataforma/usuarios.ts` (`pedirResetPorEmail`, `redefinirSenhaComToken`)
- Create: `app/app/recuperar-senha/page.tsx` + `app/app/recuperar-senha/actions.ts`
- Create: `app/app/redefinir-senha/[token]/page.tsx` + `app/app/redefinir-senha/[token]/actions.ts`
- Create: `components/plataforma/FormRecuperarSenha.tsx` + `components/plataforma/FormRedefinirSenha.tsx`
- Modify: `components/plataforma/FormEntrar.tsx` (aviso `redefinida=1`)
- Modify: `lib/content-plataforma.ts` (bloco `recuperarSenha`)
- Test: `lib/plataforma/usuarios-reset.test.ts`

**Interfaces:**
- Consumes: Tasks 2-4 (`emitirToken`, `consumirToken`, `enviarEmail`, `emailDeReset`, `urlBase`).
- Produces:
  - `pedirResetPorEmail(email: string): Promise<void>` — neutro; se a conta existe, token `reset` + e-mail com link `${urlBase()}/app/redefinir-senha/${segredo}`.
  - `redefinirSenhaComToken(segredo: string, novaSenha: string): Promise<boolean>` — consome token, grava hash novo e, se `emailConfirmadoEm` null, confirma também (posse provada).
  - Strings `plataforma.recuperarSenha.{titulo, texto, botao, enviado, novaTitulo, novaTexto, novaSenha, botaoSalvar, linkInvalidoTitulo, linkInvalidoTexto, pedirNovo, redefinidaAviso, senhaCurta}`.

- [ ] **Step 1: Testes que falham**

```ts
// lib/plataforma/usuarios-reset.test.ts
import { afterAll, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { criarUsuario, redefinirSenhaComToken, verificarCredenciais } from "./usuarios";
import { emitirToken } from "./tokens";

const email = `reset-${Date.now()}@teste.invalido`;
afterAll(async () => {
  await db.delete(users).where(eq(sql`lower(${users.email})`, email));
});

describe("redefinirSenhaComToken", () => {
  it("troca a senha, queima o token e confirma o e-mail pendente", async () => {
    process.env.EMAIL_CAIXA_TESTE = "/dev/null"; // conta nasce pendente
    const r = await criarUsuario({ nome: "Reset Teste", email, senha: "senha-antiga-1" });
    delete process.env.EMAIL_CAIXA_TESTE;
    if (!r.ok) throw new Error("deveria criar");

    const t = await emitirToken(r.id, "reset");
    if (!t.ok) throw new Error("token deveria sair");
    expect(await redefinirSenhaComToken(t.segredo, "senha-nova-123")).toBe(true);

    // senha nova entra; antiga não; e-mail ficou confirmado (posse provada)
    expect(await verificarCredenciais(email, "senha-nova-123")).not.toBeNull();
    expect(await verificarCredenciais(email, "senha-antiga-1")).toBeNull();
    // token queimado
    expect(await redefinirSenhaComToken(t.segredo, "outra-senha-99")).toBe(false);
  });

  it("senha curta é recusada sem queimar o token", async () => {
    const [u] = await db.select({ id: users.id }).from(users).where(eq(sql`lower(${users.email})`, email)).limit(1);
    // limpa folga para emitir de novo
    const { authTokens } = await import("@/lib/db/schema");
    await db.delete(authTokens).where(eq(authTokens.userId, u.id));
    const t = await emitirToken(u.id, "reset");
    if (!t.ok) throw new Error("token deveria sair");
    await expect(redefinirSenhaComToken(t.segredo, "curta")).rejects.toThrow();
    expect(await redefinirSenhaComToken(t.segredo, "senha-valida-77")).toBe(true);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run lib/plataforma/usuarios-reset.test.ts`
Expected: FAIL (exports não existem)

- [ ] **Step 3: Implementar em usuarios.ts**

```ts
/** Caminho público do "esqueci minha senha": resposta neutra sempre. */
export async function pedirResetPorEmail(email: string): Promise<void> {
  const [u] = await db.select({ id: users.id, nome: users.nome, email: users.email })
    .from(users).where(eq(sql`lower(${users.email})`, email.trim().toLowerCase())).limit(1);
  if (!u) return;
  const t = await emitirToken(u.id, "reset");
  if (!t.ok) {
    console.info("[reset] pedido dentro da folga de 60s", { userId: u.id });
    return;
  }
  const msg = emailDeReset(u.nome, `${urlBase()}/app/redefinir-senha/${t.segredo}`);
  const r = await enviarEmail({ para: u.email, ...msg });
  if (!r.ok) console.error("[reset] envio falhou", { userId: u.id });
}

/** Redefine a senha com o token. VALIDA ANTES de consumir: senha curta não
 *  pode queimar o link. Reset concluído também confirma o e-mail (posse). */
export async function redefinirSenhaComToken(segredo: string, novaSenha: string): Promise<boolean> {
  if (novaSenha.length < 8) throw new Error("dados invalidos");
  const senhaHash = await bcrypt.hash(novaSenha, 10);
  const r = await consumirToken(segredo, "reset");
  if (!r.ok) return false;
  await db.update(users)
    .set({ senhaHash, emailConfirmadoEm: sql`coalesce(${users.emailConfirmadoEm}, now())` })
    .where(eq(users.id, r.userId));
  return true;
}
```

(import novo: `emailDeReset` junto aos da Task 4.)

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run lib/plataforma/usuarios-reset.test.ts`
Expected: 2 passed

- [ ] **Step 5: Strings**

Bloco novo em `lib/content-plataforma.ts`:

```ts
  recuperarSenha: {
    titulo: "Esqueci minha senha",
    texto: "Informe seu e-mail. Se houver uma conta, enviaremos o link de redefinição.",
    botao: "Enviar link",
    enviado: "Se existir uma conta com este e-mail, enviamos o link de redefinição.",
    novaTitulo: "Escolha a nova senha",
    novaTexto: "O link é de uso único. Salve a senha nova para entrar.",
    novaSenha: "Nova senha",
    botaoSalvar: "Salvar nova senha",
    linkInvalidoTitulo: "Link inválido ou vencido",
    linkInvalidoTexto: "Links de redefinição valem por 60 minutos e funcionam uma vez.",
    pedirNovo: "Pedir um novo link",
    redefinidaAviso: "Senha redefinida — entre com a nova senha.",
    senhaCurta: "A senha precisa de pelo menos 8 caracteres.",
  },
```

- [ ] **Step 6: Páginas e forms**

```ts
// app/app/recuperar-senha/actions.ts
"use server";
import { plataforma } from "@/lib/content-plataforma";
import { pedirResetPorEmail } from "@/lib/plataforma/usuarios";

export async function pedirResetAction(_: unknown, formData: FormData): Promise<{ mensagem: string }> {
  const email = String(formData.get("email") ?? "");
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) await pedirResetPorEmail(email);
  return { mensagem: plataforma.recuperarSenha.enviado };
}
```

```tsx
// app/app/recuperar-senha/page.tsx
import { plataforma } from "@/lib/content-plataforma";
import { FormRecuperarSenha } from "@/components/plataforma/FormRecuperarSenha";

export default function RecuperarSenhaPage() {
  const t = plataforma.recuperarSenha;
  return (
    <main className="mx-auto w-full max-w-md px-5 py-16">
      <h1 className="text-3xl font-medium tracking-[-0.02em] text-fg">{t.titulo}</h1>
      <p className="mt-4 leading-relaxed text-fg-muted">{t.texto}</p>
      <div className="mt-8"><FormRecuperarSenha /></div>
    </main>
  );
}
```

```tsx
// components/plataforma/FormRecuperarSenha.tsx
"use client";
import { useActionState } from "react";
import { pedirResetAction } from "@/app/app/recuperar-senha/actions";
import { plataforma } from "@/lib/content-plataforma";

// text-base (16px): abaixo disso o iOS dá zoom automático ao focar o campo.
const campo = "w-full border border-line bg-surface px-4 py-3 text-base text-fg placeholder:text-fg-subtle focus-visible:outline-2 focus-visible:outline-accent-text";

export function FormRecuperarSenha() {
  const t = plataforma.recuperarSenha;
  const [estado, acao, enviando] = useActionState(pedirResetAction, null as { mensagem: string } | null);
  return (
    <form action={acao} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        E-mail
        <input type="email" name="email" required autoComplete="email" className={campo} />
      </label>
      {estado ? <p role="status" className="text-sm text-accent-text">{estado.mensagem}</p> : null}
      <button disabled={enviando} className="rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-colors hover:bg-accent-hover disabled:opacity-60">
        {t.botao}
      </button>
    </form>
  );
}
```

```ts
// app/app/redefinir-senha/[token]/actions.ts
"use server";
import { redirect } from "next/navigation";
import { plataforma } from "@/lib/content-plataforma";
import { redefinirSenhaComToken } from "@/lib/plataforma/usuarios";

export async function redefinirSenhaAction(
  token: string,
  _: unknown,
  formData: FormData,
): Promise<{ erro: string }> {
  const senha = String(formData.get("senha") ?? "");
  if (senha.length < 8) return { erro: plataforma.recuperarSenha.senhaCurta };
  const ok = await redefinirSenhaComToken(token, senha);
  if (!ok) redirect("/app/recuperar-senha?erro=1");
  redirect("/app/entrar?redefinida=1");
}
```

```tsx
// app/app/redefinir-senha/[token]/page.tsx
import { plataforma } from "@/lib/content-plataforma";
import { FormRedefinirSenha } from "@/components/plataforma/FormRedefinirSenha";

export const dynamic = "force-dynamic";

/** O token só é validado no SUBMIT (consumirToken é o juiz; pré-checar aqui
 *  duplicaria a lógica e abriria janela para o link vencer entre as duas). */
export default async function RedefinirSenhaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const t = plataforma.recuperarSenha;
  return (
    <main className="mx-auto w-full max-w-md px-5 py-16">
      <h1 className="text-3xl font-medium tracking-[-0.02em] text-fg">{t.novaTitulo}</h1>
      <p className="mt-4 leading-relaxed text-fg-muted">{t.novaTexto}</p>
      <div className="mt-8"><FormRedefinirSenha token={token} /></div>
    </main>
  );
}
```

```tsx
// components/plataforma/FormRedefinirSenha.tsx
"use client";
import { useActionState } from "react";
import { redefinirSenhaAction } from "@/app/app/redefinir-senha/[token]/actions";
import { plataforma } from "@/lib/content-plataforma";

// text-base (16px): abaixo disso o iOS dá zoom automático ao focar o campo.
const campo = "w-full border border-line bg-surface px-4 py-3 text-base text-fg placeholder:text-fg-subtle focus-visible:outline-2 focus-visible:outline-accent-text";

export function FormRedefinirSenha({ token }: { token: string }) {
  const t = plataforma.recuperarSenha;
  const acaoComToken = redefinirSenhaAction.bind(null, token);
  const [estado, acao, enviando] = useActionState(acaoComToken, { erro: "" });
  return (
    <form action={acao} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {t.novaSenha}
        <input type="password" name="senha" required minLength={8} autoComplete="new-password" className={campo} />
      </label>
      {estado.erro ? <p role="alert" className="text-sm text-fg">{estado.erro}</p> : null}
      <button disabled={enviando} className="rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-colors hover:bg-accent-hover disabled:opacity-60">
        {t.botaoSalvar}
      </button>
    </form>
  );
}
```

Na página `app/app/recuperar-senha/page.tsx`, quando `searchParams` tiver `erro=1`, trocar título/texto por `linkInvalidoTitulo`/`linkInvalidoTexto` (mesmo padrão da página de confirmação — transformar em async e ler `searchParams`).

Em `components/plataforma/FormEntrar.tsx`: aviso verde também para `busca.get("redefinida") === "1"` com `plataforma.recuperarSenha.redefinidaAviso`.

- [ ] **Step 7: Build + suíte**

Run: `rm -rf .next && npm run build && npm run test:unit`
Expected: verde

- [ ] **Step 8: Commit**

```bash
git add lib/plataforma/usuarios.ts lib/plataforma/usuarios-reset.test.ts app/app/recuperar-senha app/app/redefinir-senha components/plataforma/FormRecuperarSenha.tsx components/plataforma/FormRedefinirSenha.tsx components/plataforma/FormEntrar.tsx lib/content-plataforma.ts
git commit -m "feat: esqueci minha senha — reset por link de uso único"
```

---

### Task 6: Válvulas de suporte no admin

**Files:**
- Modify: `app/admin/alunos/[id]/page.tsx` (badge de estado + as duas ações no card "Ações")
- Modify: `app/admin/alunos/[id]/actions.ts` — se não existir, criar; seguir o padrão das actions admin existentes (`exigirAdmin()` primeiro)
- Modify: `components/admin/AcoesAluno.tsx` (dois botões novos; o de link mostra a URL gerada)
- Modify: `lib/content-admin.ts` (strings)
- Test: e2e cobre na Task 7 (lógica de servidor já coberta por Tasks 2/4/5)

**Interfaces:**
- Consumes: `emitirToken` (Task 2), `urlBase` (Task 3).
- Produces (actions admin, ambas com `exigirAdmin()`):
  - `confirmarEmailManualAction(alunoId: string)` → `db.update(users).set({ emailConfirmadoEm: sql\`coalesce(email_confirmado_em, now())\` })` e devolve `{ ok: true }`.
  - `gerarLinkResetAction(alunoId: string)` → `emitirToken(alunoId, "reset")`; devolve `{ ok: true, url }` com `${urlBase()}/app/redefinir-senha/${segredo}` ou `{ ok: false, erro: "aguarde 60s" }` na folga.
- Strings em `lib/content-admin.ts` (bloco do aluno): `emailConfirmado: "E-mail confirmado"`, `emailNaoConfirmado: "E-mail não confirmado"`, `confirmarEmail: "Marcar e-mail como confirmado"`, `emailConfirmadoOk: "E-mail confirmado na mão."`, `gerarLinkReset: "Gerar link de redefinição"`, `linkResetAjuda: "Copie e envie ao aluno por outro canal. Vale 60 minutos, uso único."`, `aguardeReenvio: "Aguarde 60 segundos entre links."`.

- [ ] **Step 1:** Ler `app/admin/alunos/[id]/page.tsx` e `components/admin/AcoesAluno.tsx` para casar com o padrão real (props, dispatch, classes).
- [ ] **Step 2:** Badge na ficha: junto dos dados da conta, linha `E-mail confirmado: sim/não` (mono uppercase, mesmo estilo dos metadados existentes), lendo `users.emailConfirmadoEm` na query da página.
- [ ] **Step 3:** Botão "Marcar e-mail como confirmado" (só aparece quando NÃO confirmado) com mensagem de sucesso; botão "Gerar link de redefinição" que, no sucesso, renderiza a URL em `<code className="block select-all break-all border border-line bg-surface px-3 py-2 text-xs">` + texto de ajuda.
- [ ] **Step 4:** Build + unit: `rm -rf .next && npm run build && npm run test:unit` — verde.
- [ ] **Step 5: Commit**

```bash
git add app/admin/alunos components/admin/AcoesAluno.tsx lib/content-admin.ts
git commit -m "feat: válvulas de suporte — confirmar e-mail na mão e gerar link de reset"
```

---

### Task 7: e2e dos dois fluxos (config separada) + suíte completa

**Files:**
- Create: `playwright.email.config.ts`
- Create: `e2e-email/confirmacao-reset.spec.ts`
- Modify: `package.json` (script `test:e2e:email`)

**Interfaces:**
- Consumes: tudo das Tasks 1-6.
- Produces: script `npm run test:e2e:email` verde + suíte principal intacta.

- [ ] **Step 1: Config separada (porta 3100, envs do interruptor)**

```ts
// playwright.email.config.ts
// Suíte separada da principal DE PROPÓSITO: ligar RESEND_API_KEY no webServer
// compartilhado ativaria o bloqueio de cadastro para TODOS os specs atuais.
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e-email",
  timeout: 60_000,
  workers: 1,
  use: { baseURL: "http://localhost:3100", channel: "chrome" },
  webServer: {
    command: "npm run start -- --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      RESEND_API_KEY: "fake-e2e",
      EMAIL_CAIXA_TESTE: "/tmp/iagentics-e2e-emails.jsonl",
      AUTH_URL: "http://localhost:3100",
    },
  },
});
```

- [ ] **Step 2: Script no package.json**

```json
"test:e2e:email": "rm -f /tmp/iagentics-e2e-emails.jsonl && playwright test -c playwright.email.config.ts"
```

- [ ] **Step 3: Spec dos dois fluxos**

```ts
// e2e-email/confirmacao-reset.spec.ts
import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";

const CAIXA = "/tmp/iagentics-e2e-emails.jsonl";
const email = `e2e-email-${Date.now()}@teste.invalido`;
const senha = "Senha-email-123!";
const senhaNova = "Senha-nova-456!";

/** Último e-mail enviado para um destinatário; extrai a primeira URL do texto. */
function ultimoLinkPara(para: string): string {
  const linhas = readFileSync(CAIXA, "utf8").trim().split("\n").map((l) => JSON.parse(l));
  const msg = linhas.filter((m) => m.para === para).at(-1);
  if (!msg) throw new Error(`nenhum e-mail para ${para}`);
  const url = msg.texto.match(/https?:\/\/\S+/)?.[0];
  if (!url) throw new Error("e-mail sem link");
  return url;
}

test("cadastro bloqueia até confirmar; link do e-mail libera o login", async ({ page }) => {
  await page.goto("/app/criar-conta");
  await page.getByLabel("Nome").fill("Aluno Confirmação");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Criar conta" }).click();

  // Cai na tela "confirme seu e-mail" — sem sessão.
  await expect(page).toHaveURL(/\/app\/confirmar-email/);
  await expect(page.getByText(email)).toBeVisible();

  // Login antes de confirmar: recusado com a mensagem própria + reenvio.
  await page.goto("/app/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Confirme seu e-mail antes de entrar", { exact: false })).toBeVisible();

  // Abre o link do e-mail (caixa de teste) → aviso verde no login → entra.
  await page.goto(ultimoLinkPara(email));
  await expect(page).toHaveURL(/\/app\/entrar\?confirmado=1/);
  await expect(page.getByText("E-mail confirmado", { exact: false })).toBeVisible();
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.getByRole("button", { name: "Sair" }).click();
});

test("esqueci minha senha: link redefine, senha antiga morre, link não repete", async ({ page }) => {
  await page.goto("/app/entrar");
  await page.getByRole("link", { name: "Esqueci minha senha" }).click();
  await expect(page).toHaveURL(/\/app\/recuperar-senha/);
  await page.getByLabel("E-mail").fill(email);
  await page.getByRole("button", { name: "Enviar link" }).click();
  await expect(page.getByText("Se existir uma conta", { exact: false })).toBeVisible();

  await page.goto(ultimoLinkPara(email));
  await page.getByLabel("Nova senha").fill(senhaNova);
  await page.getByRole("button", { name: "Salvar nova senha" }).click();
  await expect(page).toHaveURL(/\/app\/entrar\?redefinida=1/);

  // Senha antiga não entra mais; a nova entra.
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("E-mail ou senha incorretos")).toBeVisible();
  await page.getByLabel("Senha").fill(senhaNova);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/app$/);
});

test("reenvio e reset são neutros para e-mail inexistente", async ({ page }) => {
  await page.goto("/app/recuperar-senha");
  await page.getByLabel("E-mail").fill("nao-existe@teste.invalido");
  await page.getByRole("button", { name: "Enviar link" }).click();
  await expect(page.getByText("Se existir uma conta", { exact: false })).toBeVisible();
});
```

- [ ] **Step 4: Build + rodar a suíte nova**

Run: `rm -rf .next && npm run build && npm run test:e2e:email`
Expected: 3 passed

- [ ] **Step 5: Suíte principal intacta + unit**

Run: `npm run test:e2e && npm run test:unit`
Expected: e2e principal 24 passed (sem envs, cadastro auto-confirma); unit todos verdes

- [ ] **Step 6: Commit**

```bash
git add playwright.email.config.ts e2e-email package.json
git commit -m "test: e2e dos fluxos de confirmação e reset em config separada (porta 3100)"
```

---

## Entrega (fora das tasks — coordenador)

1. **Pré-requisito Rodrigo**: `npx @railway/cli@latest login`.
2. Migração em produção ANTES do deploy: `npx @railway/cli@latest ssh --service IAgentics -- node scripts/migrar.mjs` (conferir no log `alvo: postgres.railway.internal`).
3. Conferir env `AUTH_URL=https://iagentics.com.br` no Railway (base dos links).
4. Deploy normal (`scripts/deploy-railway.sh`) + smoke: `/app/recuperar-senha` 200; cadastro sem chave continua entrando direto.
5. Quando a `RESEND_API_KEY` chegar: setar no Railway (+ `EMAIL_DE` opcional) — o bloqueio liga sozinho.
