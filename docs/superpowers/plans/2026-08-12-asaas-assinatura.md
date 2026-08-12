# Assinatura Asaas (R$ 39,90) + /planos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Plano único de assinatura mensal de R$ 39,90 cobrado pelo Asaas — página pública `/planos`, contratação em `/app/assinar` (fatura hospedada do Asaas), liberação/trava automática via webhook — mais o endurecimento do `trocarSenha`.

**Architecture:** A lógica de negócio vive em `lib/asaas/` (cliente HTTP injetável + orquestração + webhook), testada contra Postgres real com Asaas falso. As páginas são camadas finas sobre essa lógica, no padrão já estabelecido (Server Components + Server Actions + strings centralizadas). Nenhum dado de cartão passa pelo nosso servidor.

**Tech Stack:** Next.js 15 App Router, Drizzle ORM + node-postgres, Auth.js v5, vitest (integração, DB real), Playwright (e2e), API Asaas v3 via `fetch` puro.

**Spec:** `docs/superpowers/specs/2026-08-12-asaas-assinatura-design.md`

## Global Constraints

- pt-BR em toda string visível; **nunca** "PMEs". Strings da plataforma só em `lib/content-plataforma.ts` — nenhuma string visível em componente.
- Design system: violeta `#7607E8` só como preenchimento (nunca texto direto — usar tokens `text-accent-text`, `bg-accent`, `text-accent-on`); superfícies com radius 0; controles com `rounded-control` (pill); tokens `bg-bg`, `bg-surface`, `border-line`, `border-line-strong`, `text-fg`, `text-fg-muted`, `text-fg-subtle`.
- Env `ASAAS` é chave de **PRODUÇÃO** (cobrança real): nenhum teste automatizado chama a API real do Asaas; o valor nunca aparece em log, tela ou commit.
- CPF: nunca persistido no nosso banco, nunca logado.
- Valores exatos da assinatura: `value: 39.9`, `cycle: "MONTHLY"`, `billingType: "UNDEFINED"`, `description: "Assinatura IAgentics Academy"`, `nextDueDate` = hoje + 2 dias. Base da API: `https://api.asaas.com/v3`, autenticação pelo header `access_token`.
- Testes de integração (vitest) rodam contra o Postgres real de `DATABASE_URL` (o `.env.local` aponta para o embedded local, porta 54329 — suba com `npm run db:local` se `npm run test:unit` reclamar de conexão). Dados de teste sempre com prefixo próprio (`teste-<área>-${Date.now()}`), limpos no `afterAll`, **nunca** tocando na semente (curso `fundamentos-ia-copilot` e os 8 irmãos).
- e2e (`npm run test:e2e`) roda em browser real contra servidor local e **não pode disparar chamada real ao Asaas** — só é permitido submeter o formulário de assinatura com CPF inválido (a validação recusa antes de qualquer chamada de rede).
- Server Actions são endpoints POST invocáveis diretamente: toda validação de formulário tem que existir do lado do servidor (o `minLength`/`required` do HTML é só UX).
- Páginas novas que consultam banco/sessão precisam de `export const dynamic = "force-dynamic"` — o build do Railway não tem rede para o banco e o prerender quebraria o deploy (incidente real deste projeto).
- Commits frequentes, um por passo de commit indicado.

---

### Task 1: Status `pendente` (schema, migração, tipos, texto da conta)

**Files:**
- Modify: `lib/db/schema.ts:72` (check constraint de `subscriptions.status`)
- Create: `drizzle/0003_assinatura_pendente.sql` (via drizzle-kit `--custom`)
- Modify: `lib/plataforma/tipos.ts:31` (`StatusAssinatura`)
- Modify: `lib/content-plataforma.ts` (bloco `conta`: `statusPendente`)
- Modify: `app/app/conta/page.tsx:19-31` (branch do status `pendente`)
- Test: `lib/plataforma/autorizacao.test.ts`

**Interfaces:**
- Consumes: tabela `subscriptions` e `temAcesso`/`buscarAssinatura` de `lib/plataforma/dados.ts` (existentes).
- Produces: o valor `"pendente"` aceito pelo check `subscriptions_status_chk`; `StatusAssinatura = "manual" | "ativa" | "inadimplente" | "cancelada" | "pendente" | null`; `plataforma.conta.statusPendente`. Tasks 3 e 4 inserem/atualizam linhas com esse status.

- [ ] **Step 1: Write the failing test**

Em `lib/plataforma/autorizacao.test.ts`, adicionar um usuário com assinatura `pendente`. No bloco de declarações (junto de `let userDesativado`, ~linha 33):

```ts
// Ciclo Asaas: linha "pendente" (assinatura criada, fatura ainda não paga) —
// por construção NÃO dá acesso: pendente ∉ ('ativa','manual').
let userPendente: { id: string };
```

No `beforeAll` (depois do bloco do `userDesativado`):

```ts
[userPendente] = await db
  .insert(users)
  .values({ nome: "Teste pendente", email: `${prefixo}-pendente@teste.invalido`, senhaHash: "x" })
  .returning({ id: users.id });
await db.insert(subscriptions).values({ userId: userPendente.id, status: "pendente" });
```

E os testes (junto dos irmãos de `temAcesso`):

```ts
it("assinatura pendente não dá acesso", async () => {
  expect(await temAcesso(userPendente.id)).toBe(false);
});

it("buscarAssinatura devolve o status pendente", async () => {
  expect(await buscarAssinatura(userPendente.id)).toBe("pendente");
});
```

`buscarAssinatura` precisa entrar no import de `./dados` no topo do arquivo.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/plataforma/autorizacao.test.ts`
Expected: FAIL no `beforeAll` — violação do check `subscriptions_status_chk` (o banco ainda não aceita `'pendente'`).

- [ ] **Step 3: Schema + migração custom**

Em `lib/db/schema.ts`, trocar a linha do check:

```ts
check("subscriptions_status_chk", sql`${t.status} in ('manual','ativa','inadimplente','cancelada','pendente')`),
```

Gerar a migração vazia e preenchê-la:

Run: `npx drizzle-kit generate --custom --name=assinatura_pendente`

Isso cria `drizzle/0003_assinatura_pendente.sql` vazio e registra no `drizzle/meta/_journal.json`. Conteúdo do arquivo:

```sql
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_status_chk";--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_status_chk" CHECK ("status" in ('manual','ativa','inadimplente','cancelada','pendente'));
```

Aplicar no banco local:

Run: `npm run db:migrar`
Expected: log `alvo: 127.0.0.1:54329` (ou localhost — **NUNCA** um host railway) e `migração ok`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/plataforma/autorizacao.test.ts`
Expected: PASS (todos, incluindo os 2 novos).

- [ ] **Step 5: Tipo + texto da conta**

`lib/plataforma/tipos.ts`:

```ts
export type StatusAssinatura = "manual" | "ativa" | "inadimplente" | "cancelada" | "pendente" | null;
```

`lib/content-plataforma.ts`, no bloco `conta`, depois de `statusInadimplente`:

```ts
statusPendente: "Aguardando confirmação do pagamento",
```

`app/app/conta/page.tsx`, na cadeia de ifs do `textoAssinatura`, antes do `else` final:

```ts
} else if (status === "pendente") {
  textoAssinatura = t.statusPendente;
```

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add lib/db/schema.ts drizzle/ lib/plataforma/tipos.ts lib/plataforma/autorizacao.test.ts lib/content-plataforma.ts app/app/conta/page.tsx
git commit -m "feat: status 'pendente' de assinatura (migração 0003 + tipos + conta)"
```

---

### Task 2: Validação de CPF (`lib/asaas/cpf.ts`)

**Files:**
- Create: `lib/asaas/cpf.ts`
- Test: `lib/asaas/cpf.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `validarCpf(bruto: string): string | null` — devolve o CPF normalizado (só dígitos) quando válido, `null` quando inválido. Task 4 usa.

- [ ] **Step 1: Write the failing test**

`lib/asaas/cpf.test.ts` (teste puro, sem banco):

```ts
import { describe, expect, it } from "vitest";
import { validarCpf } from "./cpf";

describe("validarCpf", () => {
  it("aceita CPF válido com pontuação e devolve só dígitos", () => {
    expect(validarCpf("529.982.247-25")).toBe("52998224725");
  });
  it("aceita CPF válido sem pontuação", () => {
    expect(validarCpf("52998224725")).toBe("52998224725");
  });
  it("rejeita dígitos repetidos (passam na conta do DV, mas são inválidos)", () => {
    expect(validarCpf("111.111.111-11")).toBeNull();
  });
  it("rejeita tamanho errado", () => {
    expect(validarCpf("5299822472")).toBeNull();
    expect(validarCpf("")).toBeNull();
  });
  it("rejeita dígito verificador errado", () => {
    expect(validarCpf("52998224726")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/asaas/cpf.test.ts`
Expected: FAIL — módulo `./cpf` não existe.

- [ ] **Step 3: Write minimal implementation**

`lib/asaas/cpf.ts`:

```ts
/** Normaliza e valida CPF (11 dígitos + 2 verificadores oficiais).
 *  Devolve só os dígitos quando válido, null quando não — o CPF validado vai
 *  direto ao Asaas e NUNCA é persistido nem logado aqui (constraint do ciclo). */
export function validarCpf(bruto: string): string | null {
  const cpf = bruto.replace(/\D/g, "");
  if (cpf.length !== 11) return null;
  if (/^(\d)\1{10}$/.test(cpf)) return null; // 111.111.111-11 etc. passam no DV, mas são inválidos
  for (const pos of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < pos; i++) soma += Number(cpf[i]) * (pos + 1 - i);
    const dv = ((soma * 10) % 11) % 10;
    if (dv !== Number(cpf[pos])) return null;
  }
  return cpf;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/asaas/cpf.test.ts`
Expected: PASS (5 testes).

- [ ] **Step 5: Commit**

```bash
git add lib/asaas/cpf.ts lib/asaas/cpf.test.ts
git commit -m "feat: validação de CPF para a contratação Asaas"
```

---

### Task 3: Cliente HTTP do Asaas (`lib/asaas/cliente.ts`) + strings de contratação

**Files:**
- Create: `lib/asaas/cliente.ts`
- Modify: `lib/content-plataforma.ts` (bloco novo `assinar`)

**Interfaces:**
- Consumes: env `ASAAS`.
- Produces (Task 4 e o fake de teste implementam/consomem exatamente isto):

```ts
export type ClienteAsaas = {
  criarCliente(d: { name: string; email: string; cpfCnpj: string }): Promise<{ id: string }>;
  criarAssinatura(d: { customer: string; nextDueDate: string }): Promise<{ id: string }>;
  listarCobrancas(subscriptionId: string): Promise<Array<{ id: string; status: string; invoiceUrl: string; dueDate: string }>>;
};
export const clienteAsaas: ClienteAsaas;
```

E o bloco `plataforma.assinar` com as chaves `titulo`, `resumo`, `cpf`, `cpfAjuda`, `botao`, `cpfInvalido`, `jaAssinante`, `erroGenerico`.

Sem teste automatizado próprio: todo método é uma chamada de rede à API de produção (constraint global). A lógica que os usa é testada na Task 4 com um fake desta interface.

- [ ] **Step 1: Implementar o cliente**

`lib/asaas/cliente.ts`:

```ts
import "server-only"; // a chave de produção nunca pode vazar para bundle de client

const BASE = "https://api.asaas.com/v3";

async function chamar(caminho: string, init?: RequestInit): Promise<any> {
  const chave = process.env.ASAAS;
  if (!chave) throw new Error("env ASAAS ausente");
  const resposta = await fetch(`${BASE}${caminho}`, {
    ...init,
    headers: { "Content-Type": "application/json", access_token: chave, ...(init?.headers ?? {}) },
  });
  if (!resposta.ok) {
    // Corpo de erro do Asaas fica SÓ no log do servidor — a tela recebe sempre
    // a mensagem genérica (plataforma.assinar.erroGenerico), nunca isto.
    console.error("asaas", caminho, resposta.status, await resposta.text());
    throw new Error(`asaas ${resposta.status}`);
  }
  return resposta.json();
}

/** Contrato mínimo que a orquestração usa — um fake em teste implementa isto. */
export type ClienteAsaas = {
  criarCliente(d: { name: string; email: string; cpfCnpj: string }): Promise<{ id: string }>;
  criarAssinatura(d: { customer: string; nextDueDate: string }): Promise<{ id: string }>;
  listarCobrancas(subscriptionId: string): Promise<Array<{ id: string; status: string; invoiceUrl: string; dueDate: string }>>;
};

export const clienteAsaas: ClienteAsaas = {
  async criarCliente(d) {
    const r = await chamar("/customers", { method: "POST", body: JSON.stringify(d) });
    return { id: r.id };
  },
  async criarAssinatura(d) {
    // Valores travados pelo spec: R$ 39,90/mês, aluno escolhe Pix/cartão/boleto na fatura.
    const r = await chamar("/subscriptions", {
      method: "POST",
      body: JSON.stringify({
        customer: d.customer,
        nextDueDate: d.nextDueDate,
        billingType: "UNDEFINED",
        value: 39.9,
        cycle: "MONTHLY",
        description: "Assinatura IAgentics Academy",
      }),
    });
    return { id: r.id };
  },
  async listarCobrancas(subscriptionId) {
    const r = await chamar(`/subscriptions/${subscriptionId}/payments`);
    return (r.data ?? []).map((p: any) => ({ id: p.id, status: p.status, invoiceUrl: p.invoiceUrl, dueDate: p.dueDate }));
  },
};
```

- [ ] **Step 2: Bloco `assinar` no conteúdo**

Em `lib/content-plataforma.ts`, depois do bloco `conta` (antes do `} as const`):

```ts
assinar: {
  titulo: "Assinar a Academy",
  resumo:
    "Plano mensal de R$ 39,90 com acesso total ao acervo. O pagamento acontece na página segura do Asaas — Pix, cartão ou boleto.",
  cpf: "CPF",
  cpfAjuda: "Usado só para emitir a cobrança no Asaas. Não fica guardado aqui.",
  botao: "Ir para o pagamento",
  cpfInvalido: "CPF inválido. Confira os números e tente de novo.",
  jaAssinante: "Você já é assinante.",
  erroGenerico: "Não foi possível iniciar o pagamento. Tente novamente em instantes.",
},
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add lib/asaas/cliente.ts lib/content-plataforma.ts
git commit -m "feat: cliente HTTP do Asaas e strings de contratação"
```

---

### Task 4: Orquestração `iniciarAssinatura` (`lib/asaas/assinatura.ts`)

**Files:**
- Create: `lib/asaas/assinatura.ts`
- Test: `lib/asaas/assinatura.test.ts`

**Interfaces:**
- Consumes: `validarCpf` (Task 2); `ClienteAsaas`/`clienteAsaas` (Task 3); `plataforma.assinar` (Task 3); `contaAtiva`, `temAcesso` de `lib/plataforma/dados.ts`; `buscarUsuario` de `lib/plataforma/usuarios.ts`; tabela `subscriptions` com status `pendente` (Task 1).
- Produces: `iniciarAssinatura(userId: string, cpfBruto: string, cliente?: ClienteAsaas): Promise<ResultadoAssinar>` com `type ResultadoAssinar = { ok: true; url: string } | { ok: false; erro: string }`. Task 5 chama sem o 3º argumento (usa o cliente real).

- [ ] **Step 1: Write the failing test**

`lib/asaas/assinatura.test.ts` — DB real + Asaas falso:

```ts
import { eq, like } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { subscriptions, users } from "@/lib/db/schema";
import { plataforma } from "@/lib/content-plataforma";
import type { ClienteAsaas } from "./cliente";
import { iniciarAssinatura } from "./assinatura";

const prefixo = `teste-asaas-${Date.now()}`;
const CPF_VALIDO = "529.982.247-25";

/** Fake do contrato ClienteAsaas: registra chamadas, devolve IDs/URLs fixos.
 *  `falhar: true` simula a API fora do ar (toda chamada lança). */
function fakeAsaas(opts: { falhar?: boolean; cobrancas?: Array<{ id: string; status: string; invoiceUrl: string; dueDate: string }> } = {}) {
  const chamadas: string[] = [];
  const cliente: ClienteAsaas = {
    async criarCliente() {
      chamadas.push("criarCliente");
      if (opts.falhar) throw new Error("asaas 500");
      return { id: "cus_teste_1" };
    },
    async criarAssinatura() {
      chamadas.push("criarAssinatura");
      if (opts.falhar) throw new Error("asaas 500");
      return { id: "sub_teste_1" };
    },
    async listarCobrancas() {
      chamadas.push("listarCobrancas");
      if (opts.falhar) throw new Error("asaas 500");
      return opts.cobrancas ?? [{ id: "pay_teste_1", status: "PENDING", invoiceUrl: "https://asaas.example/i/pay_teste_1", dueDate: "2026-08-14" }];
    },
  };
  return { cliente, chamadas };
}

async function criarAluno(sufixo: string): Promise<string> {
  const [u] = await db
    .insert(users)
    .values({ nome: `Teste assinar ${sufixo}`, email: `${prefixo}-${sufixo}@teste.invalido`, senhaHash: "x" })
    .returning({ id: users.id });
  return u.id;
}

describe.skipIf(!process.env.DATABASE_URL)("iniciarAssinatura", () => {
  afterAll(async () => {
    await db.delete(users).where(like(users.email, `${prefixo}-%`)); // subscriptions caem por cascade
  });

  it("CPF inválido: recusa antes de qualquer chamada e não insere linha", async () => {
    const userId = await criarAluno("cpf");
    const { cliente, chamadas } = fakeAsaas();
    const r = await iniciarAssinatura(userId, "111.111.111-11", cliente);
    expect(r).toEqual({ ok: false, erro: plataforma.assinar.cpfInvalido });
    expect(chamadas).toEqual([]);
    expect(await db.select().from(subscriptions).where(eq(subscriptions.userId, userId))).toHaveLength(0);
  });

  it("fluxo feliz: cria cliente + assinatura, insere linha pendente com os IDs, devolve invoiceUrl", async () => {
    const userId = await criarAluno("feliz");
    const { cliente, chamadas } = fakeAsaas();
    const r = await iniciarAssinatura(userId, CPF_VALIDO, cliente);
    expect(r).toEqual({ ok: true, url: "https://asaas.example/i/pay_teste_1" });
    expect(chamadas).toEqual(["criarCliente", "criarAssinatura", "listarCobrancas"]);
    const { eq } = await import("drizzle-orm");
    const linhas = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
    expect(linhas).toHaveLength(1);
    expect(linhas[0]).toMatchObject({ status: "pendente", asaasCustomerId: "cus_teste_1", asaasSubscriptionId: "sub_teste_1" });
  });

  it("reuso: última linha pendente → volta a MESMA fatura aberta, sem criar nada novo", async () => {
    const userId = await criarAluno("reuso");
    await db.insert(subscriptions).values({ userId, status: "pendente", asaasCustomerId: "cus_teste_1", asaasSubscriptionId: "sub_teste_1" });
    const { cliente, chamadas } = fakeAsaas({ cobrancas: [{ id: "pay_aberta", status: "OVERDUE", invoiceUrl: "https://asaas.example/i/pay_aberta", dueDate: "2026-08-10" }] });
    const r = await iniciarAssinatura(userId, CPF_VALIDO, cliente);
    expect(r).toEqual({ ok: true, url: "https://asaas.example/i/pay_aberta" });
    expect(chamadas).toEqual(["listarCobrancas"]);
    expect(await db.select().from(subscriptions).where(eq(subscriptions.userId, userId))).toHaveLength(1); // nada novo
  });

  it("pendente morta no Asaas (sem cobrança aberta): cria assinatura nova reusando o customer", async () => {
    const userId = await criarAluno("morta");
    await db.insert(subscriptions).values({ userId, status: "pendente", asaasCustomerId: "cus_velho", asaasSubscriptionId: "sub_morta", createdAt: new Date("2020-01-01T00:00:00Z") });
    const { cliente, chamadas } = fakeAsaas({ cobrancas: [] });
    const r = await iniciarAssinatura(userId, CPF_VALIDO, cliente);
    // listarCobrancas da morta devolve [], então cai para criar nova (sem criarCliente: reusa cus_velho)
    expect(r.ok).toBe(false); // a lista final da nova assinatura também vem do fake vazio → erro genérico
    expect(chamadas).toEqual(["listarCobrancas", "criarAssinatura", "listarCobrancas"]);
  });

  it("já assinante (manual): recusa sem chamar o Asaas", async () => {
    const userId = await criarAluno("assinante");
    await db.insert(subscriptions).values({ userId, status: "manual" });
    const { cliente, chamadas } = fakeAsaas();
    const r = await iniciarAssinatura(userId, CPF_VALIDO, cliente);
    expect(r).toEqual({ ok: false, erro: plataforma.assinar.jaAssinante });
    expect(chamadas).toEqual([]);
  });

  it("falha da API: erro genérico e nenhuma linha inserida", async () => {
    const userId = await criarAluno("falha");
    const { cliente } = fakeAsaas({ falhar: true });
    const r = await iniciarAssinatura(userId, CPF_VALIDO, cliente);
    expect(r).toEqual({ ok: false, erro: plataforma.assinar.erroGenerico });
    expect(await db.select().from(subscriptions).where(eq(subscriptions.userId, userId))).toHaveLength(0);
  });
});
```

Remover a função `linhasDe` morta acima se sobrar — os testes usam `db.select` direto. (Ela está aqui só para você notar que NÃO deve existir; escreva o arquivo sem ela.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/asaas/assinatura.test.ts`
Expected: FAIL — módulo `./assinatura` não existe.

- [ ] **Step 3: Write minimal implementation**

`lib/asaas/assinatura.ts`:

```ts
import "server-only";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { contaAtiva, temAcesso } from "@/lib/plataforma/dados";
import { buscarUsuario } from "@/lib/plataforma/usuarios";
import { plataforma } from "@/lib/content-plataforma";
import { validarCpf } from "./cpf";
import { clienteAsaas, type ClienteAsaas } from "./cliente";

export type ResultadoAssinar = { ok: true; url: string } | { ok: false; erro: string };

/** Contratação: cria cliente + assinatura no Asaas e devolve a URL da fatura
 *  hospedada. O webhook (lib/asaas/webhook.ts) é quem ativa depois do pagamento.
 *  `cliente` é injetável — teste usa um fake; produção usa o real por padrão. */
export async function iniciarAssinatura(
  userId: string,
  cpfBruto: string,
  cliente: ClienteAsaas = clienteAsaas,
): Promise<ResultadoAssinar> {
  const t = plataforma.assinar;
  if (!(await contaAtiva(userId))) return { ok: false, erro: t.erroGenerico };
  if (await temAcesso(userId)) return { ok: false, erro: t.jaAssinante };
  const cpf = validarCpf(cpfBruto);
  if (!cpf) return { ok: false, erro: t.cpfInvalido };
  const usuario = await buscarUsuario(userId);
  if (!usuario) return { ok: false, erro: t.erroGenerico };

  try {
    // Reuso 1: já existe assinatura pendente no Asaas → volta pra MESMA fatura
    // em aberto em vez de criar uma duplicata (clique repetido no botão).
    const [ultima] = await db
      .select({ status: subscriptions.status, asaasSubscriptionId: subscriptions.asaasSubscriptionId })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    if (ultima?.status === "pendente" && ultima.asaasSubscriptionId) {
      const aberta = (await cliente.listarCobrancas(ultima.asaasSubscriptionId)).find(
        (c) => (c.status === "PENDING" || c.status === "OVERDUE") && c.invoiceUrl,
      );
      if (aberta) return { ok: true, url: aberta.invoiceUrl };
      // sem cobrança aberta = assinatura morta no Asaas; segue e cria nova
    }

    // Reuso 2: cliente Asaas já criado em tentativa/assinatura anterior.
    const [comCliente] = await db
      .select({ id: subscriptions.asaasCustomerId })
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), isNotNull(subscriptions.asaasCustomerId)))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    const customerId =
      comCliente?.id ?? (await cliente.criarCliente({ name: usuario.nome, email: usuario.email, cpfCnpj: cpf })).id;

    const nextDueDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const assinatura = await cliente.criarAssinatura({ customer: customerId, nextDueDate });

    // Linha nova, nunca update — o histórico de status é o mesmo padrão do
    // liberar/revogar do admin, e temAcesso lê sempre a linha mais recente.
    await db.insert(subscriptions).values({
      userId,
      status: "pendente",
      asaasCustomerId: customerId,
      asaasSubscriptionId: assinatura.id,
    });

    const [cobranca] = await cliente.listarCobrancas(assinatura.id);
    if (!cobranca?.invoiceUrl) return { ok: false, erro: t.erroGenerico };
    return { ok: true, url: cobranca.invoiceUrl };
  } catch (e) {
    console.error("iniciarAssinatura", e); // detalhe só no servidor; a tela vê o genérico
    return { ok: false, erro: t.erroGenerico };
  }
}
```

Nota sobre o caso "pendente morta": a linha `pendente` já inserida numa tentativa anterior faz o clique seguinte entrar pelo reuso e se auto-curar — se a fatura sumiu no Asaas, cria-se assinatura nova e uma NOVA linha `pendente` (histórico preservado).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/asaas/assinatura.test.ts`
Expected: PASS (6 testes).

- [ ] **Step 5: Suíte inteira de unidade/integração**

Run: `npm run test:unit`
Expected: PASS — nenhuma suíte existente quebrada.

- [ ] **Step 6: Commit**

```bash
git add lib/asaas/assinatura.ts lib/asaas/assinatura.test.ts
git commit -m "feat: orquestração da contratação Asaas (iniciarAssinatura)"
```

---

### Task 5: Webhook (`lib/asaas/webhook.ts` + rota)

**Files:**
- Create: `lib/asaas/webhook.ts`
- Create: `app/api/asaas/webhook/route.ts`
- Test: `lib/asaas/webhook.test.ts`

**Interfaces:**
- Consumes: tabela `subscriptions` com status `pendente` (Task 1); env `ASAAS_WEBHOOK_TOKEN`.
- Produces: `processarEventoAsaas(evento: EventoAsaas): Promise<void>` com `type EventoAsaas = { event?: string; payment?: { subscription?: string; dueDate?: string } }`; rota `POST /api/asaas/webhook`. Task 9 registra a URL no Asaas.

- [ ] **Step 1: Write the failing test**

`lib/asaas/webhook.test.ts`:

```ts
import { eq, like } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { subscriptions, users } from "@/lib/db/schema";
import { processarEventoAsaas } from "./webhook";
import { POST } from "@/app/api/asaas/webhook/route";

const prefixo = `teste-webhook-${Date.now()}`;

async function alunoComPendente(sufixo: string) {
  const [u] = await db
    .insert(users)
    .values({ nome: `Teste webhook ${sufixo}`, email: `${prefixo}-${sufixo}@teste.invalido`, senhaHash: "x" })
    .returning({ id: users.id });
  const [s] = await db
    .insert(subscriptions)
    .values({ userId: u.id, status: "pendente", asaasCustomerId: "cus_w", asaasSubscriptionId: `sub_${prefixo}_${sufixo}` })
    .returning({ id: subscriptions.id, asaasSubscriptionId: subscriptions.asaasSubscriptionId });
  return s;
}

async function statusDe(id: string) {
  const [l] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
  return l;
}

describe.skipIf(!process.env.DATABASE_URL)("processarEventoAsaas", () => {
  afterAll(async () => {
    await db.delete(users).where(like(users.email, `${prefixo}-%`));
  });

  it("PAYMENT_CONFIRMED ativa e grava current_period_end = vencimento + 1 mês", async () => {
    const s = await alunoComPendente("confirmado");
    await processarEventoAsaas({ event: "PAYMENT_CONFIRMED", payment: { subscription: s.asaasSubscriptionId!, dueDate: "2026-08-14" } });
    const l = await statusDe(s.id);
    expect(l.status).toBe("ativa");
    expect(l.currentPeriodEnd?.toISOString().slice(0, 10)).toBe("2026-09-14");
  });

  it("replay do mesmo evento é no-op (continua ativa, mesmo period end)", async () => {
    const s = await alunoComPendente("replay");
    const evento = { event: "PAYMENT_RECEIVED", payment: { subscription: s.asaasSubscriptionId!, dueDate: "2026-08-14" } };
    await processarEventoAsaas(evento);
    await processarEventoAsaas(evento);
    const l = await statusDe(s.id);
    expect(l.status).toBe("ativa");
    expect(l.currentPeriodEnd?.toISOString().slice(0, 10)).toBe("2026-09-14");
  });

  it("PAYMENT_OVERDUE trava (inadimplente)", async () => {
    const s = await alunoComPendente("vencido");
    await processarEventoAsaas({ event: "PAYMENT_OVERDUE", payment: { subscription: s.asaasSubscriptionId! } });
    expect((await statusDe(s.id)).status).toBe("inadimplente");
  });

  it("PAYMENT_REFUNDED cancela", async () => {
    const s = await alunoComPendente("estornado");
    await processarEventoAsaas({ event: "PAYMENT_REFUNDED", payment: { subscription: s.asaasSubscriptionId! } });
    expect((await statusDe(s.id)).status).toBe("cancelada");
  });

  it("assinatura desconhecida e evento sem subscription: no-op silencioso", async () => {
    await processarEventoAsaas({ event: "PAYMENT_CONFIRMED", payment: { subscription: "sub_que_nao_existe", dueDate: "2026-08-14" } });
    await processarEventoAsaas({ event: "PAYMENT_CONFIRMED", payment: {} });
    await processarEventoAsaas({ event: "PAYMENT_CONFIRMED" });
    // chegar aqui sem lançar É o teste
  });
});

describe("rota POST /api/asaas/webhook", () => {
  it("token errado ou ausente → 401; token certo com evento ignorável → 200", async () => {
    process.env.ASAAS_WEBHOOK_TOKEN = "token-de-teste";
    const corpo = JSON.stringify({ event: "PAYMENT_CREATED", payment: {} });

    const semToken = await POST(new Request("http://local/api/asaas/webhook", { method: "POST", body: corpo }));
    expect(semToken.status).toBe(401);

    const tokenErrado = await POST(
      new Request("http://local/api/asaas/webhook", { method: "POST", headers: { "asaas-access-token": "outro" }, body: corpo }),
    );
    expect(tokenErrado.status).toBe(401);

    const ok = await POST(
      new Request("http://local/api/asaas/webhook", { method: "POST", headers: { "asaas-access-token": "token-de-teste" }, body: corpo }),
    );
    expect(ok.status).toBe(200);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/asaas/webhook.test.ts`
Expected: FAIL — módulos não existem.

- [ ] **Step 3: Write minimal implementation**

`lib/asaas/webhook.ts`:

```ts
import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";

export type EventoAsaas = { event?: string; payment?: { subscription?: string; dueDate?: string } };

/** Transição de status da assinatura casada por asaas_subscription_id — nunca
 *  por e-mail. Idempotente: o UPDATE recalcula o mesmo estado a partir do mesmo
 *  evento, então reentrega do Asaas não muda nada. Evento sem subscription ou
 *  de assinatura desconhecida (cobrança avulsa criada no painel) é no-op — a
 *  rota responde 200 nesses casos para o Asaas não pausar a fila. */
export async function processarEventoAsaas(evento: EventoAsaas): Promise<void> {
  const idAssinatura = evento.payment?.subscription;
  if (!idAssinatura) return;
  const alvo = eq(subscriptions.asaasSubscriptionId, idAssinatura);

  const event = evento.event ?? "";
  if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
    // Acesso até 1 mês após o vencimento pago; meio-dia UTC evita o vencimento
    // "voltar um dia" ao formatar em fuso brasileiro (UTC-3).
    const vencimento = evento.payment?.dueDate ? new Date(`${evento.payment.dueDate}T12:00:00Z`) : new Date();
    const fim = new Date(vencimento);
    fim.setUTCMonth(fim.getUTCMonth() + 1);
    await db.update(subscriptions).set({ status: "ativa", currentPeriodEnd: fim }).where(alvo);
  } else if (event === "PAYMENT_OVERDUE") {
    await db.update(subscriptions).set({ status: "inadimplente" }).where(alvo);
  } else if (event === "PAYMENT_REFUNDED" || event === "PAYMENT_DELETED") {
    await db.update(subscriptions).set({ status: "cancelada" }).where(alvo);
  }
  // Demais eventos: no-op de propósito.
}
```

`app/api/asaas/webhook/route.ts`:

```ts
import { NextResponse } from "next/server";
import { processarEventoAsaas, type EventoAsaas } from "@/lib/asaas/webhook";

/** Webhook de cobranças do Asaas. Autentica pelo header asaas-access-token
 *  (valor combinado no cadastro do webhook — scripts/configurar-webhook.mjs). */
export async function POST(request: Request) {
  const token = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!token || request.headers.get("asaas-access-token") !== token) {
    return new NextResponse(null, { status: 401 });
  }

  let evento: EventoAsaas;
  try {
    evento = (await request.json()) as EventoAsaas;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  try {
    await processarEventoAsaas(evento);
  } catch (e) {
    console.error("webhook asaas", e);
    return new NextResponse(null, { status: 500 }); // 500 → o Asaas reentrega
  }
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/asaas/webhook.test.ts`
Expected: PASS (6 testes).

- [ ] **Step 5: Commit**

```bash
git add lib/asaas/webhook.ts app/api/asaas/webhook/route.ts lib/asaas/webhook.test.ts
git commit -m "feat: webhook Asaas com ativação/trava automática de assinatura"
```

---

### Task 6: Página `/app/assinar` (resumo + CPF + redirect à fatura)

**Files:**
- Create: `app/app/assinar/page.tsx`
- Create: `app/app/assinar/actions.ts`
- Create: `components/plataforma/FormAssinar.tsx`
- Test: `e2e/assinar.spec.ts`

**Interfaces:**
- Consumes: `iniciarAssinatura` (Task 4); `plataforma.assinar` (Task 3); `temAcesso` de `lib/plataforma/dados.ts`; `auth` de `@/auth`.
- Produces: rota `/app/assinar` (dentro do shell logado — o layout de `/app` já é `force-dynamic` e o middleware já exige sessão). Task 7 aponta CTAs para cá.

- [ ] **Step 1: Write the failing e2e test**

`e2e/assinar.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

const email = `e2e-assinar-${Date.now()}@teste.invalido`;
const senha = "Senha-e2e-123!";

/**
 * NUNCA submeter este formulário com CPF válido no e2e: a chave ASAAS do
 * .env.local é de PRODUÇÃO. CPF inválido é seguro — a server action recusa
 * na validação, antes de qualquer chamada de rede.
 */
test("assinar mostra resumo e campo CPF; CPF inválido é recusado no servidor", async ({ page }) => {
  await page.goto("/app/criar-conta");
  await page.getByLabel("Nome").fill("Aluno Assinar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/app$/);

  await page.goto("/app/assinar");
  await expect(page.getByRole("heading", { name: "Assinar a Academy" })).toBeVisible();
  await expect(page.getByText("R$ 39,90", { exact: false })).toBeVisible();

  await page.getByLabel("CPF").fill("111.111.111-11");
  await page.getByRole("button", { name: "Ir para o pagamento" }).click();
  await expect(page.getByText("CPF inválido. Confira os números e tente de novo.")).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test e2e/assinar.spec.ts`
Expected: FAIL — `/app/assinar` é 404.

- [ ] **Step 3: Action**

`app/app/assinar/actions.ts`:

```ts
"use server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { iniciarAssinatura } from "@/lib/asaas/assinatura";

export async function assinarAction(_: unknown, formData: FormData): Promise<{ erro: string } | never> {
  const sessao = await auth();
  if (!sessao?.user?.id) redirect("/app/entrar");
  const r = await iniciarAssinatura(sessao.user.id, String(formData.get("cpf") ?? ""));
  if (!r.ok) return { erro: r.erro };
  redirect(r.url); // fatura hospedada do Asaas (URL externa — redirect aceita absoluta)
}
```

- [ ] **Step 4: Form (client)**

`components/plataforma/FormAssinar.tsx`:

```tsx
"use client";
import { useActionState, useState } from "react";
import { assinarAction } from "@/app/app/assinar/actions";
import { plataforma } from "@/lib/content-plataforma";

const ESTADO_INICIAL: { erro: string | null } = { erro: null };

export function FormAssinar() {
  const t = plataforma.assinar;
  const [cpf, setCpf] = useState("");
  const [estado, acao, enviando] = useActionState(assinarAction, ESTADO_INICIAL);

  const campo =
    "w-full border border-line bg-surface px-4 py-3 text-fg placeholder:text-fg-subtle focus-visible:outline-2 focus-visible:outline-accent-text";

  return (
    <form action={acao} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {t.cpf}
        <input
          type="text"
          name="cpf"
          required
          inputMode="numeric"
          autoComplete="off"
          placeholder="000.000.000-00"
          value={cpf}
          onChange={(e) => setCpf(e.target.value)}
          className={campo}
        />
      </label>
      <p className="text-sm text-fg-muted">{t.cpfAjuda}</p>
      {estado?.erro ? (
        <p role="alert" className="text-sm text-fg">
          {estado.erro}
        </p>
      ) : null}
      <button
        disabled={enviando}
        className="rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        {t.botao}
      </button>
    </form>
  );
}
```

- [ ] **Step 5: Página**

`app/app/assinar/page.tsx`:

```tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { FormAssinar } from "@/components/plataforma/FormAssinar";
import { plataforma } from "@/lib/content-plataforma";
import { temAcesso } from "@/lib/plataforma/dados";

export default async function PaginaAssinar() {
  const sessao = await auth();
  // Middleware já barra /app sem sessão; defesa em profundidade, como nas irmãs.
  if (!sessao?.user?.id) redirect("/app/entrar");
  const t = plataforma.assinar;

  if (await temAcesso(sessao.user.id)) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <h1 className="text-3xl font-medium tracking-[-0.03em]">{t.titulo}</h1>
        <p className="text-fg">{t.jaAssinante}</p>
        <Link href="/app" className="text-accent-text underline-offset-4 hover:underline">
          {plataforma.shell.meusCursos}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-medium tracking-[-0.03em]">{t.titulo}</h1>
        <p className="text-fg-muted">{t.resumo}</p>
      </div>
      <FormAssinar />
    </div>
  );
}
```

- [ ] **Step 6: Run the e2e test**

Run: `npx playwright test e2e/assinar.spec.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add app/app/assinar components/plataforma/FormAssinar.tsx e2e/assinar.spec.ts
git commit -m "feat: página /app/assinar com contratação via fatura Asaas"
```

---

### Task 7: Página pública `/planos` + CTAs + `voltar` em criar-conta

**Files:**
- Create: `app/planos/page.tsx`
- Modify: `lib/content-plataforma.ts` (bloco novo `planos`; `painel.ctaAssinar` e `aula.bloqueadaCta` → `"Assinar agora"`)
- Modify: `app/app/criar-conta/page.tsx`, `components/plataforma/FormCriarConta.tsx`, `app/app/criar-conta/actions.ts` (suporte a `voltar`)
- Test: `e2e/planos.spec.ts`

**Interfaces:**
- Consumes: `buscarCatalogo` e `temAcesso` de `lib/plataforma/dados.ts`; `auth` de `@/auth`; `Nav`/`Footer` do site; rota `/app/assinar` (Task 6).
- Produces: rota pública `/planos`; `plataforma.planos.*`; criar-conta aceita `?voltar=` sanitizado (regex `/^\/(?!\/)/`, fallback `/app`). Depois do deploy, `cta_destino` do admin aponta para `/planos` (Task 9 — o fallback hardcoded `/academy#contato` de `destinoCta()` não muda).

- [ ] **Step 1: Write the failing e2e test**

`e2e/planos.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

const email = `e2e-planos-${Date.now()}@teste.invalido`;
const senha = "Senha-e2e-123!";

test("/planos abre sem login: preço, 9 capas e CTA para criar conta com voltar", async ({ page }) => {
  await page.goto("/planos");
  await expect(page.getByText("R$ 39,90")).toBeVisible();
  await expect(page.getByTestId("capa-plano")).toHaveCount(9);
  await expect(page.getByRole("link", { name: "Assinar agora" })).toHaveAttribute(
    "href",
    "/app/criar-conta?voltar=/app/assinar",
  );
});

test("criar conta a partir do CTA termina em /app/assinar (voltar respeitado)", async ({ page }) => {
  await page.goto("/planos");
  await page.getByRole("link", { name: "Assinar agora" }).click();
  await expect(page).toHaveURL(/\/app\/criar-conta\?voltar=/);
  await page.getByLabel("Nome").fill("Aluno Planos");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/app\/assinar$/);
  // Logado e sem acesso, /planos passa a apontar direto para a contratação.
  await page.goto("/planos");
  await expect(page.getByRole("link", { name: "Assinar agora" })).toHaveAttribute("href", "/app/assinar");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test e2e/planos.spec.ts`
Expected: FAIL — `/planos` é 404.

- [ ] **Step 3: Conteúdo**

Em `lib/content-plataforma.ts`:

1. No bloco `painel`, trocar `ctaAssinar: "Falar com a IAgentics",` por `ctaAssinar: "Assinar agora",` e apagar o comentário `/* Ciclo 2 troca o CTA acima pelo checkout. */` (o ciclo chegou).
2. No bloco `aula`, trocar `bloqueadaCta: "Falar com a IAgentics",` por `bloqueadaCta: "Assinar agora",`.
3. Bloco novo `planos` (antes de `assinar`):

```ts
planos: {
  eyebrow: "Assinatura",
  titulo: "Todo o acervo da Academy. Um plano só.",
  preco: "R$ 39,90",
  porMes: "/mês",
  beneficios: [
    "Acesso total a todas as formações do catálogo — e às que chegarem",
    "Aulas novas conforme saem da gravação",
    "Assista no seu ritmo, de qualquer dispositivo",
    "Cancele quando quiser, sem multa",
  ],
  cta: "Assinar agora",
  jaAssinante: "Você já é assinante.",
  irParaPlataforma: "Ir para a plataforma",
  cursosTitulo: "O que está dentro",
  descricaoMeta: "Assinatura do acervo IAgentics Academy: todas as formações por R$ 39,90 por mês.",
},
```

- [ ] **Step 4: `voltar` em criar-conta**

`app/app/criar-conta/page.tsx` — a página lê o querystring e repassa:

```tsx
import Link from "next/link";
import { Suspense } from "react";
import { FormCriarConta } from "@/components/plataforma/FormCriarConta";
import { plataforma } from "@/lib/content-plataforma";

export default async function PaginaCriarConta({ searchParams }: { searchParams: Promise<{ voltar?: string }> }) {
  const { voltar } = await searchParams;
  const t = plataforma.criarConta;
  return (
    <div className="mx-auto flex max-w-md flex-col gap-8">
      <h1 className="text-3xl font-medium tracking-[-0.03em]">{t.titulo}</h1>
      <Suspense>
        <FormCriarConta voltar={voltar ?? ""} />
      </Suspense>
      <p className="text-sm text-fg-muted">
        {t.jaTem}{" "}
        <Link href="/app/entrar" className="text-accent-text underline-offset-4 hover:underline">
          {t.entrar}
        </Link>
      </p>
    </div>
  );
}
```

`components/plataforma/FormCriarConta.tsx` — prop nova + hidden input (assinatura passa a ser `export function FormCriarConta({ voltar }: { voltar: string })`; dentro do `<form>`, primeiro filho):

```tsx
<input type="hidden" name="voltar" value={voltar} />
```

`app/app/criar-conta/actions.ts` — sanitizar e usar (mesmo padrão de `app/app/entrar/actions.ts:15-16`). Trocar a linha do `signIn`:

```ts
// "voltar" vem do querystring de quem navegou até aqui (ex.: CTA do /planos).
// Mesma sanitização de entrar/actions.ts: só caminho relativo interno
// (começa com "/" e não com "//"), senão cai no padrão /app.
const brutoVoltar = String(formData.get("voltar") || "/app");
const voltar = /^\/(?!\/)/.test(brutoVoltar) ? brutoVoltar : "/app";
// ... (validações existentes intocadas)
await signIn("credentials", { email, senha, redirectTo: voltar });
```

- [ ] **Step 5: Página `/planos`**

`app/planos/page.tsx`:

```tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { plataforma } from "@/lib/content-plataforma";
import { buscarCatalogo, temAcesso } from "@/lib/plataforma/dados";

export const metadata: Metadata = { title: "Planos", description: plataforma.planos.descricaoMeta };
// Consulta banco e sessão a cada request — o build do Railway não tem rede
// para o banco, então esta página NÃO pode ser prerenderizada (força dinâmica,
// mesmo incidente já documentado em app/app/layout.tsx).
export const dynamic = "force-dynamic";

export default async function PaginaPlanos() {
  const t = plataforma.planos;
  const sessao = await auth();
  const assinante = sessao?.user?.id ? await temAcesso(sessao.user.id) : false;
  const cursos = await buscarCatalogo();
  const destino = sessao?.user?.id ? "/app/assinar" : "/app/criar-conta?voltar=/app/assinar";

  return (
    <>
      <Nav />
      <main className="pt-16">
        <section className="mx-auto flex max-w-[1400px] flex-col gap-12 px-5 py-16 sm:px-8 lg:flex-row lg:items-start lg:gap-20 lg:py-24">
          <div className="flex flex-1 flex-col gap-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent-text">{t.eyebrow}</p>
            <h1 className="max-w-[16ch] text-4xl font-medium leading-tight tracking-[-0.03em] text-fg sm:text-5xl">
              {t.titulo}
            </h1>
            <p className="flex items-baseline gap-1">
              <span className="text-5xl font-medium tracking-[-0.03em] text-fg">{t.preco}</span>
              <span className="text-lg text-fg-muted">{t.porMes}</span>
            </p>
            <ul className="flex flex-col gap-3">
              {t.beneficios.map((b) => (
                <li key={b} className="flex items-start gap-3 text-fg">
                  <span aria-hidden className="mt-[9px] h-1.5 w-1.5 shrink-0 bg-accent" />
                  {b}
                </li>
              ))}
            </ul>
            {assinante ? (
              <div className="flex flex-col items-start gap-2">
                <p className="text-fg">{t.jaAssinante}</p>
                <Link href="/app" className="text-accent-text underline-offset-4 hover:underline">
                  {t.irParaPlataforma}
                </Link>
              </div>
            ) : (
              <Link
                href={destino}
                className="self-start rounded-control bg-accent px-8 py-4 font-medium text-accent-on transition-colors hover:bg-accent-hover"
              >
                {t.cta}
              </Link>
            )}
          </div>

          <div className="flex-1">
            <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.cursosTitulo}</p>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {cursos.map((curso) => (
                <li
                  key={curso.id}
                  data-testid="capa-plano"
                  className="relative aspect-[3/4] overflow-hidden border border-line"
                >
                  <Image
                    src={curso.capaUrl}
                    alt={curso.titulo}
                    fill
                    sizes="(min-width: 1024px) 220px, 33vw"
                    style={{ objectPosition: "center top" }}
                    className="object-cover"
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 6: Run tests**

Run: `npx playwright test e2e/planos.spec.ts e2e/aula.spec.ts e2e/curso.spec.ts e2e/painel.spec.ts`
Expected: PASS. Atenção: se alguma suíte existente asserta o texto antigo `"Falar com a IAgentics"` na trava, ela falha aqui — atualize a asserção para `"Assinar agora"` (a mudança de rótulo é intencional, mandada pelo spec).

- [ ] **Step 7: Verificar tipos e build**

Run: `npx tsc --noEmit && npm run build`
Expected: sem erros; o build NÃO pode tentar conectar no banco por causa do `/planos` (se falhar com erro de conexão, o `force-dynamic` do Step 5 está faltando/errado).

- [ ] **Step 8: Commit**

```bash
git add app/planos lib/content-plataforma.ts app/app/criar-conta components/plataforma/FormCriarConta.tsx e2e/planos.spec.ts
git commit -m "feat: página pública /planos + CTAs de assinatura + voltar no criar-conta"
```

---

### Task 8: `trocarSenha` exige senha atual

**Files:**
- Modify: `lib/plataforma/usuarios.ts` (função nova `trocarSenhaVerificando`)
- Modify: `app/app/conta/actions.ts:24-30` (`trocarSenha`)
- Modify: `components/plataforma/FormConta.tsx` (campo "Senha atual")
- Modify: `lib/content-plataforma.ts` (bloco `conta`: `senhaAtual`, `senhaAtualErrada`)
- Test: `lib/plataforma/usuarios.test.ts` (novo), `e2e/conta.spec.ts` (atualizar)

**Interfaces:**
- Consumes: `users` do schema; bcryptjs.
- Produces: `trocarSenhaVerificando(userId: string, atual: string, nova: string): Promise<{ ok: true } | { ok: false; motivo: "senha_atual_errada" }>`; a action `trocarSenha(atual: string, nova: string): Promise<{ ok: boolean; erro?: string }>` (assinatura MUDA — o único chamador é `FormConta`, atualizado junto).

- [ ] **Step 1: Write the failing test**

`lib/plataforma/usuarios.test.ts`:

```ts
import { eq, like } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { trocarSenhaVerificando, verificarCredenciais } from "./usuarios";

const prefixo = `teste-usuarios-${Date.now()}`;
const email = `${prefixo}-troca@teste.invalido`;
let userId: string;

describe.skipIf(!process.env.DATABASE_URL)("trocarSenhaVerificando", () => {
  beforeAll(async () => {
    const [u] = await db
      .insert(users)
      .values({ nome: "Teste troca", email, senhaHash: await bcrypt.hash("senha-antiga-1", 10) })
      .returning({ id: users.id });
    userId = u.id;
  });
  afterAll(async () => {
    await db.delete(users).where(like(users.email, `${prefixo}-%`));
  });

  it("senha atual errada: recusa e mantém a antiga funcionando", async () => {
    const r = await trocarSenhaVerificando(userId, "senha-errada-x", "senha-nova-123");
    expect(r).toEqual({ ok: false, motivo: "senha_atual_errada" });
    expect(await verificarCredenciais(email, "senha-antiga-1")).not.toBeNull();
  });

  it("senha atual correta: troca — a nova entra, a antiga morre", async () => {
    const r = await trocarSenhaVerificando(userId, "senha-antiga-1", "senha-nova-123");
    expect(r).toEqual({ ok: true });
    expect(await verificarCredenciais(email, "senha-nova-123")).not.toBeNull();
    expect(await verificarCredenciais(email, "senha-antiga-1")).toBeNull();
  });

  it("nova senha abaixo do piso: lança (mesma defesa em profundidade de criarUsuario)", async () => {
    await expect(trocarSenhaVerificando(userId, "senha-nova-123", "curta")).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/plataforma/usuarios.test.ts`
Expected: FAIL — `trocarSenhaVerificando` não existe.

- [ ] **Step 3: Implementação**

Em `lib/plataforma/usuarios.ts`, depois de `buscarUsuario`:

```ts
/** Troca de senha exigindo a atual: com conta paga (ciclo Asaas), um cookie de
 *  sessão roubado não pode virar takeover permanente — trocar a senha passa a
 *  provar posse da senha vigente, não só da sessão. */
export async function trocarSenhaVerificando(
  userId: string,
  atual: string,
  nova: string,
): Promise<{ ok: true } | { ok: false; motivo: "senha_atual_errada" }> {
  if (nova.length < 8) throw new Error("dados invalidos");
  const [u] = await db.select({ senhaHash: users.senhaHash }).from(users).where(eq(users.id, userId)).limit(1);
  if (!u || !(await bcrypt.compare(atual, u.senhaHash))) return { ok: false, motivo: "senha_atual_errada" };
  await db.update(users).set({ senhaHash: await bcrypt.hash(nova, 10) }).where(eq(users.id, userId));
  return { ok: true };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/plataforma/usuarios.test.ts`
Expected: PASS (3 testes).

- [ ] **Step 5: Action, conteúdo e formulário**

`lib/content-plataforma.ts`, bloco `conta`, depois de `novaSenha`:

```ts
senhaAtual: "Senha atual",
senhaAtualErrada: "Senha atual incorreta.",
```

`app/app/conta/actions.ts` — substituir `trocarSenha` inteira:

```ts
export async function trocarSenha(atual: string, nova: string): Promise<{ ok: boolean; erro?: string }> {
  const sessao = await auth(); if (!sessao?.user?.id) return { ok: false };
  if (!(await contaAtiva(sessao.user.id))) return { ok: false };
  if (nova.length < 8) return { ok: false };
  const r = await trocarSenhaVerificando(sessao.user.id, atual, nova);
  if (!r.ok) return { ok: false, erro: plataforma.conta.senhaAtualErrada };
  return { ok: true };
}
```

Imports novos no topo do arquivo: `import { trocarSenhaVerificando } from "@/lib/plataforma/usuarios";` e `import { plataforma } from "@/lib/content-plataforma";`. O import e o uso de `bcrypt` saem se nada mais usar (o `salvarNome` não usa — remover `import bcrypt from "bcryptjs";`).

`components/plataforma/FormConta.tsx` — no formulário de senha:

1. Estados novos junto de `novaSenha`:

```ts
const [senhaAtual, setSenhaAtual] = useState("");
const [erroSenha, setErroSenha] = useState<string | null>(null);
```

2. Handler `aoTrocarSenha` passa a:

```ts
async function aoTrocarSenha(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
  setTrocandoSenha(true);
  setSenhaTrocada(false);
  setErroSenha(null);
  const r = await trocarSenha(senhaAtual, novaSenha);
  setTrocandoSenha(false);
  if (r.ok) {
    setSenhaTrocada(true);
    setSenhaAtual("");
    setNovaSenha("");
  } else if (r.erro) {
    setErroSenha(r.erro);
  }
}
```

3. Campo "Senha atual" ANTES do campo `novaSenha` (mesma classe `campo`):

```tsx
<label className="flex flex-col gap-1.5 text-sm font-medium">
  {t.senhaAtual}
  <input
    type="password"
    name="senhaAtual"
    required
    autoComplete="current-password"
    value={senhaAtual}
    onChange={(e) => {
      setSenhaAtual(e.target.value);
      setSenhaTrocada(false);
      setErroSenha(null);
    }}
    className={campo}
  />
</label>
```

4. Mensagem de erro junto da de sucesso:

```tsx
{erroSenha ? (
  <p role="alert" className="text-sm text-fg">
    {erroSenha}
  </p>
) : null}
```

- [ ] **Step 6: Atualizar o e2e**

`e2e/conta.spec.ts` — substituir as 3 linhas finais do teste (fill nova senha → botão → mensagem) por:

```ts
// Senha atual errada: recusa com mensagem, sem trocar nada.
await page.getByLabel("Senha atual").fill("senha-completamente-errada");
await page.getByLabel("Nova senha").fill("Senha-nova-456!");
await page.getByRole("button", { name: "Trocar senha" }).click();
await expect(page.getByText("Senha atual incorreta.")).toBeVisible();

// Com a atual correta, troca.
await page.getByLabel("Senha atual").fill(senha);
await page.getByLabel("Nova senha").fill("Senha-nova-456!");
await page.getByRole("button", { name: "Trocar senha" }).click();
await expect(page.getByText("Senha atualizada.")).toBeVisible();
```

- [ ] **Step 7: Run tests**

Run: `npx playwright test e2e/conta.spec.ts && npm run test:unit`
Expected: PASS em tudo.

- [ ] **Step 8: Commit**

```bash
git add lib/plataforma/usuarios.ts lib/plataforma/usuarios.test.ts app/app/conta/actions.ts components/plataforma/FormConta.tsx lib/content-plataforma.ts e2e/conta.spec.ts
git commit -m "fix: trocar senha exige a senha atual (pré-requisito do ciclo pago)"
```

---

### Task 9: Script de registro do webhook (`scripts/configurar-webhook.mjs`)

**Files:**
- Create: `scripts/configurar-webhook.mjs`

**Interfaces:**
- Consumes: envs `ASAAS` e `ASAAS_WEBHOOK_TOKEN` (via ambiente ou `.env.local`); rota do webhook (Task 5).
- Produces: webhook registrado/atualizado no Asaas. Rodado manualmente na entrega (Task 10) — chama a API real, então NUNCA em teste automatizado.

- [ ] **Step 1: Escrever o script**

`scripts/configurar-webhook.mjs`:

```js
// Registra (ou atualiza) o webhook de cobranças no Asaas — rodar UMA vez por
// ambiente, manualmente: node scripts/configurar-webhook.mjs <url-base>
// Ex.: node scripts/configurar-webhook.mjs https://iagentics-production.up.railway.app
// CHAMA A API REAL (chave de produção). Idempotente: procura webhook com a
// mesma URL e atualiza em vez de duplicar.
import { existsSync, readFileSync } from "fs";

// Mesmo carregador de scripts/migrar.mjs: .env.local só preenche o que faltar.
if (existsSync(".env.local")) {
  for (const l of readFileSync(".env.local", "utf8").split("\n")) {
    const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2];
  }
}

const base = process.argv[2];
if (!base) { console.error("uso: node scripts/configurar-webhook.mjs <url-base-do-site>"); process.exit(1); }
const chave = process.env.ASAAS;
const token = process.env.ASAAS_WEBHOOK_TOKEN;
if (!chave || !token) { console.error("faltam ASAAS e/ou ASAAS_WEBHOOK_TOKEN no ambiente"); process.exit(1); }

const url = `${base.replace(/\/$/, "")}/api/asaas/webhook`;
const cabecalhos = { "Content-Type": "application/json", access_token: chave };
const corpo = {
  name: "Plataforma IAgentics Academy",
  url,
  email: process.env.ASAAS_WEBHOOK_EMAIL ?? "rgoalves@gmail.com", // avisado se o Asaas pausar a fila
  enabled: true,
  interrupted: false,
  apiVersion: 3,
  sendType: "SEQUENTIALLY", // ordem de entrega garantida — as transições de status dependem disso
  events: ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED", "PAYMENT_OVERDUE", "PAYMENT_REFUNDED", "PAYMENT_DELETED"],
  authToken: token,
};

const lista = await (await fetch("https://api.asaas.com/v3/webhooks", { headers: cabecalhos })).json();
const existente = (lista.data ?? []).find((w) => w.url === url);
const resposta = await fetch(`https://api.asaas.com/v3/webhooks${existente ? `/${existente.id}` : ""}`, {
  method: existente ? "PUT" : "POST",
  headers: cabecalhos,
  body: JSON.stringify(corpo),
});
if (!resposta.ok) { console.error("falhou:", resposta.status, await resposta.text()); process.exit(1); }
console.log(`webhook ${existente ? "atualizado" : "criado"}: ${url}`);
```

- [ ] **Step 2: Verificar sintaxe (sem executar — API real)**

Run: `node --check scripts/configurar-webhook.mjs`
Expected: sem saída (sintaxe ok). **NÃO** executar o script de verdade nesta task.

- [ ] **Step 3: Commit**

```bash
git add scripts/configurar-webhook.mjs
git commit -m "feat: script idempotente de registro do webhook Asaas"
```

---

### Task 10: Entrega em produção (manual — controlador + Rodrigo)

Sem subagente: executada pelo controlador da sessão com o Rodrigo, na ordem exata do spec. Pré-requisito: suíte inteira verde e branch integrada (superpowers:finishing-a-development-branch).

- [ ] Suíte completa local: `npm run test:unit && npm run test:e2e` (banco local ativo).
- [ ] Merge na `main` (menu do finishing-a-development-branch) e push.
- [ ] Migração em produção: `DATABASE_URL=<url pública do Postgres do Railway> npm run db:migrar` — conferir no log `alvo:` que é o host do Railway ANTES de prosseguir.
- [ ] Gerar token: `openssl rand -hex 32` → variável `ASAAS_WEBHOOK_TOKEN` no serviço do Railway; adicionar também `ASAAS` (copiar do `.env.local` — hoje só existe lá). Nunca imprimir os valores no chat.
- [ ] Deploy: `bash scripts/deploy-railway.sh` e aguardar SUCCESS.
- [ ] Registrar webhook: `node scripts/configurar-webhook.mjs https://iagentics-production.up.railway.app` (com `ASAAS_WEBHOOK_TOKEN` também no `.env.local` para o script achar).
- [ ] Smoke de produção (browser real): `/planos` pública com preço e 9 capas; `POST /api/asaas/webhook` sem token → 401.
- [ ] `/admin/configuracoes` (como admin): `cta_destino` → `/planos`.
- [ ] **Fogo real com o Rodrigo**: assinar com CPF real, pagar R$ 39,90 via Pix na fatura do Asaas, confirmar acesso liberado em segundos; estorno opcional depois pelo painel do Asaas (valida `PAYMENT_REFUNDED` → `cancelada`).
