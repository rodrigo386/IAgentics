# Catálogo de cursos com checkout Asaas — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Página escondida `/preview/catalogo` onde a pessoa monta um carrinho de cursos com desconto progressivo e paga uma cobrança real do Asaas (preço de teste R$ 5), com as vendas registradas no /admin.

**Architecture:** Regra de preço e validação são funções puras em `lib/catalogo/`. O checkout é um Route Handler DENTRO da prévia (`/preview/catalogo/checkout`), que fixa modo `teste` e preço de teste pelo próprio caminho, grava a venda (tabela nova `vendas`, sem CPF) e cria cliente + cobrança no Asaas. O webhook `/api/asaas/webhook` muda o status. A prévia inteira fica atrás do Basic Auth do middleware. O cliente HTTP do Asaas só chama a URL de `ASAAS_URL_BASE` — sem ela, nada sai — e o e2e aponta para um Asaas falso local.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind v4, Drizzle + Postgres, vitest (integração contra Postgres real), Playwright.

**Spec:** `docs/superpowers/specs/2026-09-22-catalogo-cursos-checkout-design.md`

## Global Constraints

- Desconto do curso na posição `i` (0-based): `min(5 * i, 25)`%. Base real R$ 200 (`20000` centavos); base da prévia `PRECO_TESTE_CENTAVOS = 500`.
- Valores sempre em **centavos inteiros**; preço do item por `Math.round`; total = soma dos itens.
- O navegador manda só slugs. O servidor recalcula o preço e descarta slug duplicado ou inexistente.
- **CPF nunca é gravado no banco nem aparece em log.** Vai só para o Asaas. Todo log de erro do Asaas passa por `redigirCpfs`.
- **Teste automatizado nunca chama o Asaas real.** `ASAAS_URL_BASE` não tem valor padrão.
- Toda string visível em `lib/content.ts` (site) ou `lib/content-admin.ts` (painel). Nunca hardcodar copy em componente.
- `/preview/catalogo` e tudo abaixo dele: atrás do Basic Auth (`ADMIN_USUARIO`/`ADMIN_SENHA`), `robots: noindex`, fora do sitemap. `/api/asaas/webhook` fica FORA do Basic Auth e autentica por `asaas-access-token` = `ASAAS_WEBHOOK_TOKEN`.
- Pagamento à vista: `POST /payments` com `billingType: "UNDEFINED"`, vencimento em 3 dias (data de São Paulo).
- Consentimento obrigatório, conferido no servidor: `consentimento === true`.
- Status da venda: `pendente` | `pago` | `cancelado` | `estornado` | `falhou`. Modo: `teste` | `real`.
- Visual: tokens e classes existentes (`bg-bg`, `bg-surface`, `border-line`, `text-fg`, `text-fg-muted`, `bg-accent`, `text-accent-on`, `hover:bg-accent-hover`, `text-accent-text`, `rounded-control`), motion só em CSS, ícones de `@phosphor-icons/react`. Seguir `docs/DESIGN.md`.
- Comentários em pt-BR explicando o PORQUÊ, na densidade do código vizinho. Commits `feat:`/`fix:` em pt-BR terminando com `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.
- Armadilhas do CLAUDE.md valem: nunca `next build` com `next dev` de pé; `npm run test:e2e` não builda (rodar `npx next build` antes); banco local de pé (`npm run db:local`) para vitest e e2e.

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `lib/catalogo/preco.ts` (+ test) | Regra de desconto, `calcularCarrinho`, `formatarReais`, `PRECO_TESTE_CENTAVOS` |
| `lib/catalogo/cpf.ts` (+ test) | `validarCpf` |
| `lib/catalogo/pedido.ts` (+ test) | `validarPedido`, `vencimentoEm` |
| `lib/catalogo/eventos.ts` (+ test) | `transicaoDoEvento` — evento do Asaas → mudança de status (pura) |
| `lib/catalogo/vendas.ts` (+ test) | Acesso à tabela `vendas` (server-only) |
| `lib/db/schema.ts`, `drizzle/0011_vendas.sql`, journal | Tabela `vendas` |
| `lib/asaas/cliente.ts` (+ test) | HTTP do Asaas: `criarCliente`, `criarCobranca`, `redigirCpfs` |
| `e2e/asaas-falso.mjs`, `playwright.config.ts` | Asaas falso para o e2e |
| `app/preview/catalogo/checkout/route.ts` | Checkout (modo teste) |
| `app/api/asaas/webhook/route.ts` | Webhook |
| `middleware.ts` | Basic Auth cobre `/preview/catalogo` |
| `lib/content.ts` (`catalogo`, `privacidade`) | Textos |
| `components/catalogo/Catalogo.tsx` | Catálogo + carrinho + formulário (client) |
| `app/preview/catalogo/page.tsx`, `app/preview/catalogo/pedido/[id]/page.tsx` | Páginas |
| `lib/admin/csv.ts`, `lib/admin/dados.ts`, `app/admin/acoes.ts`, `app/admin/page.tsx`, `app/admin/vendas.csv/route.ts`, `lib/content-admin.ts` | Vendas no painel |
| `e2e/catalogo.spec.ts` | Fluxo completo |
| `CLAUDE.md` | Registro |

---

### Task 1: Regra de preço, CPF e validação do pedido (funções puras)

**Files:**
- Create: `lib/catalogo/preco.ts`, `lib/catalogo/preco.test.ts`
- Create: `lib/catalogo/cpf.ts`, `lib/catalogo/cpf.test.ts`
- Create: `lib/catalogo/pedido.ts`, `lib/catalogo/pedido.test.ts`

**Interfaces:**
- Produces:
  - `PRECO_TESTE_CENTAVOS: 500`, `DESCONTO_MAXIMO_PCT: 25`
  - `descontoDaPosicao(i: number): number`
  - `type ItemCarrinho = { slug: string; descontoPct: number; precoCentavos: number }`
  - `type Carrinho = { itens: ItemCarrinho[]; totalCentavos: number; cheioCentavos: number; proximo: { descontoPct: number; precoCentavos: number } | null }`
  - `calcularCarrinho(slugs: readonly string[], validos: readonly string[], precoBaseCentavos: number): Carrinho`
  - `formatarReais(centavos: number): string`
  - `validarCpf(bruto: string): string | null`
  - `type DadosPedido = { nome: string; email: string; telefone: string; cpf: string; slugs: string[] }`
  - `type ValidacaoPedido = { ok: true; dados: DadosPedido } | { ok: false; motivo: "nome" | "email" | "telefone" | "cpf" | "cursos" | "consentimento" }`
  - `validarPedido(entrada: unknown, validos: readonly string[]): ValidacaoPedido`
  - `vencimentoEm(dias: number, agora?: Date): string` (YYYY-MM-DD no fuso de São Paulo)

- [ ] **Step 1: Testes de preço**

`lib/catalogo/preco.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { calcularCarrinho, descontoDaPosicao, formatarReais, PRECO_TESTE_CENTAVOS } from "./preco";

const VALIDOS = ["a", "b", "c", "d", "e", "f", "g", "h"];
const BASE = 20000;

describe("desconto progressivo", () => {
  it("cresce 5% por posição e para em 25%", () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(descontoDaPosicao)).toEqual([0, 5, 10, 15, 20, 25, 25, 25]);
  });

  it("com base R$ 200, a tabela é 200, 190, 180, 170, 160, 150, 150", () => {
    const c = calcularCarrinho(VALIDOS.slice(0, 7), VALIDOS, BASE);
    expect(c.itens.map((i) => i.precoCentavos)).toEqual([20000, 19000, 18000, 17000, 16000, 15000, 15000]);
    expect(c.totalCentavos).toBe(120000);
    expect(c.cheioCentavos).toBe(140000);
  });

  it("cinco cursos saem por R$ 900", () => {
    expect(calcularCarrinho(VALIDOS.slice(0, 5), VALIDOS, BASE).totalCentavos).toBe(90000);
  });

  it("preço de teste: R$ 5,00 no primeiro, R$ 3,75 no teto", () => {
    const c = calcularCarrinho(VALIDOS.slice(0, 6), VALIDOS, PRECO_TESTE_CENTAVOS);
    expect(c.itens[0].precoCentavos).toBe(500);
    expect(c.itens[1].precoCentavos).toBe(475);
    expect(c.itens[5].precoCentavos).toBe(375);
  });
});

describe("o servidor não confia na lista que chega", () => {
  it("descarta slug duplicado e inexistente, mantendo a ordem de chegada", () => {
    const c = calcularCarrinho(["b", "b", "x", "a"], VALIDOS, BASE);
    expect(c.itens.map((i) => i.slug)).toEqual(["b", "a"]);
    expect(c.totalCentavos).toBe(39000);
  });

  it("carrinho vazio custa zero e oferece o primeiro curso a preço cheio", () => {
    const c = calcularCarrinho([], VALIDOS, BASE);
    expect(c.totalCentavos).toBe(0);
    expect(c.proximo).toEqual({ descontoPct: 0, precoCentavos: 20000 });
  });
});

describe("gatilho do próximo curso", () => {
  it("diz quanto sai o próximo", () => {
    expect(calcularCarrinho(["a"], ["a", "b", "c"], BASE).proximo).toEqual({ descontoPct: 5, precoCentavos: 19000 });
  });

  it("some quando o catálogo inteiro já está no carrinho", () => {
    expect(calcularCarrinho(["a", "b"], ["a", "b"], BASE).proximo).toBeNull();
  });
});

describe("formatarReais", () => {
  it("formata em real brasileiro", () => {
    // Intl separa "R$" do número com espaço não quebrável.
    expect(formatarReais(19000).replace(/\s/g, " ")).toBe("R$ 190,00");
    expect(formatarReais(375).replace(/\s/g, " ")).toBe("R$ 3,75");
  });
});
```

- [ ] **Step 2: Testes de CPF e pedido**

`lib/catalogo/cpf.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { validarCpf } from "./cpf";

describe("validarCpf", () => {
  it("aceita CPF válido, pontuado ou não, e devolve só os dígitos", () => {
    expect(validarCpf("529.982.247-25")).toBe("52998224725");
    expect(validarCpf("52998224725")).toBe("52998224725");
  });
  it("recusa dígito verificador errado, tamanho errado e sequência repetida", () => {
    expect(validarCpf("529.982.247-24")).toBeNull();
    expect(validarCpf("5299822472")).toBeNull();
    expect(validarCpf("111.111.111-11")).toBeNull();
  });
});
```

`lib/catalogo/pedido.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { validarPedido, vencimentoEm } from "./pedido";

const VALIDOS = ["a", "b"];
const valido = {
  nome: "  Rodrigo Costa ",
  email: " Rodrigo@Empresa.COM.br ",
  telefone: "(11) 98888-7777",
  cpf: "529.982.247-25",
  slugs: ["a", "b"],
  consentimento: true,
};

describe("validarPedido", () => {
  it("aceita e normaliza", () => {
    expect(validarPedido(valido, VALIDOS)).toEqual({
      ok: true,
      dados: { nome: "Rodrigo Costa", email: "rodrigo@empresa.com.br", telefone: "11988887777", cpf: "52998224725", slugs: ["a", "b"] },
    });
  });

  /* O consentimento é a base legal do compartilhamento com o Pecege; só o
     booleano true vale, conferido aqui e não no checkbox. */
  it("recusa sem consentimento", () => {
    expect(validarPedido({ ...valido, consentimento: "true" }, VALIDOS)).toEqual({ ok: false, motivo: "consentimento" });
    expect(validarPedido({ ...valido, consentimento: undefined }, VALIDOS)).toEqual({ ok: false, motivo: "consentimento" });
  });

  it("recusa cada campo inválido com o motivo certo", () => {
    expect(validarPedido({ ...valido, nome: "R" }, VALIDOS)).toEqual({ ok: false, motivo: "nome" });
    expect(validarPedido({ ...valido, email: "sem-arroba" }, VALIDOS)).toEqual({ ok: false, motivo: "email" });
    expect(validarPedido({ ...valido, telefone: "1234" }, VALIDOS)).toEqual({ ok: false, motivo: "telefone" });
    expect(validarPedido({ ...valido, cpf: "529.982.247-24" }, VALIDOS)).toEqual({ ok: false, motivo: "cpf" });
  });

  it("recusa carrinho vazio ou só com cursos inexistentes, e limpa duplicados", () => {
    expect(validarPedido({ ...valido, slugs: [] }, VALIDOS)).toEqual({ ok: false, motivo: "cursos" });
    expect(validarPedido({ ...valido, slugs: ["x"] }, VALIDOS)).toEqual({ ok: false, motivo: "cursos" });
    expect(validarPedido({ ...valido, slugs: "a" }, VALIDOS)).toEqual({ ok: false, motivo: "cursos" });
    const r = validarPedido({ ...valido, slugs: ["b", "b", "x"] }, VALIDOS);
    expect(r.ok && r.dados.slugs).toEqual(["b"]);
  });
});

describe("vencimentoEm", () => {
  it("conta a partir da data de São Paulo, não da UTC", () => {
    // 23h de 30/09 em São Paulo já é 01/10 em UTC.
    expect(vencimentoEm(3, new Date("2026-10-01T02:00:00Z"))).toBe("2026-10-03");
    expect(vencimentoEm(3, new Date("2026-09-22T15:00:00Z"))).toBe("2026-09-25");
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run lib/catalogo`
Expected: FAIL — módulos `./preco`, `./cpf`, `./pedido` não existem.

- [ ] **Step 4: Implementar**

`lib/catalogo/preco.ts`:

```ts
/**
 * Regra de preço do catálogo (2026-09-22, decisão do Rodrigo).
 *
 * Cada curso novo no carrinho sai 5% mais barato que o anterior, até 25%:
 * com base R$ 200, a sequência é 200, 190, 180, 170, 160, 150, 150…
 *
 * Função pura e sem "server-only" de propósito: o carrinho no navegador e o
 * checkout no servidor chamam a MESMA função. O que a pessoa vê é o que se
 * cobra — mas quem decide o valor cobrado é sempre o servidor, que recebe só
 * os slugs e recalcula tudo aqui.
 */

/** Base da PRÉVIA (/preview/catalogo). Constante no código, não variável de
 *  ambiente: não pode existir configuração que faça a página pública cobrar
 *  R$ 5. R$ 5,00 é também o mínimo de uma cobrança no Asaas, e o teto de 25%
 *  leva o item a R$ 3,75 — o TOTAL nunca fica abaixo de R$ 5. */
export const PRECO_TESTE_CENTAVOS = 500;

export const DESCONTO_POR_CURSO_PCT = 5;
export const DESCONTO_MAXIMO_PCT = 25;

export function descontoDaPosicao(i: number): number {
  return Math.min(i * DESCONTO_POR_CURSO_PCT, DESCONTO_MAXIMO_PCT);
}

function precoNaPosicao(i: number, base: number): number {
  return Math.round((base * (100 - descontoDaPosicao(i))) / 100);
}

export type ItemCarrinho = { slug: string; descontoPct: number; precoCentavos: number };

export type Carrinho = {
  itens: ItemCarrinho[];
  totalCentavos: number;
  /** Quanto custaria sem desconto — a diferença é a economia mostrada. */
  cheioCentavos: number;
  /** O gatilho "adicione mais um e ele sai por R$ X". Null quando não há mais
   *  curso para adicionar. */
  proximo: { descontoPct: number; precoCentavos: number } | null;
};

export function calcularCarrinho(
  slugs: readonly string[],
  validos: readonly string[],
  precoBaseCentavos: number,
): Carrinho {
  const conhecidos = new Set(validos);
  const vistos = new Set<string>();
  const limpos: string[] = [];
  for (const slug of slugs) {
    if (conhecidos.has(slug) && !vistos.has(slug)) {
      vistos.add(slug);
      limpos.push(slug);
    }
  }

  const itens = limpos.map((slug, i) => ({
    slug,
    descontoPct: descontoDaPosicao(i),
    precoCentavos: precoNaPosicao(i, precoBaseCentavos),
  }));

  const n = itens.length;
  return {
    itens,
    totalCentavos: itens.reduce((soma, item) => soma + item.precoCentavos, 0),
    cheioCentavos: n * precoBaseCentavos,
    proximo: n < conhecidos.size ? { descontoPct: descontoDaPosicao(n), precoCentavos: precoNaPosicao(n, precoBaseCentavos) } : null,
  };
}

const REAIS = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatarReais(centavos: number): string {
  return REAIS.format(centavos / 100);
}
```

`lib/catalogo/cpf.ts` (recuperado de `git show cda119b^:lib/asaas/cpf.ts`):

```ts
/** Normaliza e valida CPF (11 dígitos + 2 verificadores oficiais).
 *  Devolve só os dígitos quando válido, null quando não. O CPF validado vai
 *  direto ao Asaas e NUNCA é persistido nem logado aqui. */
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

`lib/catalogo/pedido.ts`:

```ts
import { validarCpf } from "./cpf";

/**
 * Validação do pedido do catálogo, separada da rota para ser testável sem
 * subir HTTP nem banco — mesmo desenho de lib/lista-espera.ts.
 */

export type DadosPedido = { nome: string; email: string; telefone: string; cpf: string; slugs: string[] };

export type ValidacaoPedido =
  | { ok: true; dados: DadosPedido }
  | { ok: false; motivo: "nome" | "email" | "telefone" | "cpf" | "cursos" | "consentimento" };

/* Permissivo de propósito, como na lista de espera: barrar um e-mail válido
   custa uma venda; aceitar um digitado errado custa um e-mail que não chega. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarPedido(entrada: unknown, validos: readonly string[]): ValidacaoPedido {
  const { nome, email, telefone, cpf, slugs, consentimento } = (entrada ?? {}) as Record<string, unknown>;

  if (typeof nome !== "string" || nome.trim().length < 2) return { ok: false, motivo: "nome" };
  if (typeof email !== "string" || !EMAIL.test(email.trim())) return { ok: false, motivo: "email" };

  // DDD + número: 10 dígitos (fixo) ou 11 (celular).
  const fone = typeof telefone === "string" ? telefone.replace(/\D/g, "") : "";
  if (fone.length < 10 || fone.length > 11) return { ok: false, motivo: "telefone" };

  const cpfLimpo = typeof cpf === "string" ? validarCpf(cpf) : null;
  if (!cpfLimpo) return { ok: false, motivo: "cpf" };

  if (!Array.isArray(slugs)) return { ok: false, motivo: "cursos" };
  const conhecidos = new Set(validos);
  const limpos = [...new Set(slugs.filter((s): s is string => typeof s === "string" && conhecidos.has(s)))];
  if (limpos.length === 0) return { ok: false, motivo: "cursos" };

  /* Conferido NO SERVIDOR: é a base legal do compartilhamento com o Pecege, e
     qualquer um posta direto na rota sem passar pelo checkbox. */
  if (consentimento !== true) return { ok: false, motivo: "consentimento" };

  return {
    ok: true,
    dados: { nome: nome.trim(), email: email.trim().toLowerCase(), telefone: fone, cpf: cpfLimpo, slugs: limpos },
  };
}

/** Data de vencimento da cobrança, em YYYY-MM-DD, contada a partir do "hoje" de
 *  São Paulo. O container roda em UTC: depois das 21h, a data UTC já é amanhã,
 *  e o vencimento encurtaria um dia sem ninguém ver. */
export function vencimentoEm(dias: number, agora: Date = new Date()): string {
  const hoje = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(agora);
  const data = new Date(`${hoje}T12:00:00Z`);
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run lib/catalogo`
Expected: PASS (todos os testes dos três arquivos).

- [ ] **Step 6: Commit**

```bash
git add lib/catalogo
git commit -m "feat: regra de desconto progressivo, CPF e validação do pedido do catálogo"
```

---

### Task 2: Tabela `vendas` e acesso a dados

**Files:**
- Modify: `lib/db/schema.ts` (acrescentar ao fim; atualizar o comentário do topo, que diz "Sobrou UMA tabela")
- Create: `drizzle/0011_vendas.sql`
- Modify: `drizzle/meta/_journal.json` (entrada idx 11)
- Create: `lib/catalogo/eventos.ts`, `lib/catalogo/eventos.test.ts`
- Create: `lib/catalogo/vendas.ts`, `lib/catalogo/vendas.test.ts`

**Interfaces:**
- Consumes: nada das outras tasks.
- Produces:
  - `vendas` (tabela Drizzle), `type ItemVenda = { slug: string; nome: string; descontoPct: number; precoCentavos: number }`, `type StatusVenda`, `type ModoVenda`
  - `transicaoDoEvento(event: string): { para: StatusVenda; de: StatusVenda[] } | null`
  - `criarVenda(d: { nome: string; email: string; telefone: string; itens: ItemVenda[]; totalCentavos: number; modo: ModoVenda }): Promise<string>` (devolve o id)
  - `anexarCobranca(id: string, c: { clienteId: string; cobrancaId: string; urlFatura: string }): Promise<void>`
  - `marcarFalha(id: string): Promise<void>`
  - `buscarVenda(id: string): Promise<Venda | null>` (`Venda = typeof vendas.$inferSelect`)
  - `type EventoAsaas = { event?: string; payment?: { id?: string; externalReference?: string | null } }`
  - `aplicarEventoAsaas(evento: EventoAsaas): Promise<"atualizado" | "sem-efeito" | "ignorado">`
  - `marcarAcessoLiberado(id: string): Promise<boolean>`

- [ ] **Step 1: Schema**

Em `lib/db/schema.ts`, trocar o import por:

```ts
import { check, date, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
```

Atualizar o comentário do topo (hoje diz "Sobrou UMA tabela") para listar as quatro tabelas, e acrescentar ao fim:

```ts
export type ItemVenda = { slug: string; nome: string; descontoPct: number; precoCentavos: number };
export type StatusVenda = "pendente" | "pago" | "cancelado" | "estornado" | "falhou";
export type ModoVenda = "teste" | "real";

/**
 * Vendas do catálogo de cursos (2026-09-22).
 *
 * A IAgentics vende e recebe pelo Asaas; o acesso é liberado pelo Pecege na
 * Solution, a partir desta lista no /admin (sem aviso automático, decisão do
 * Rodrigo). `acesso_liberado_em` é quem diz que ninguém pagou e ficou sem curso.
 *
 * SEM CPF, em nenhuma coluna: o Asaas exige o CPF para cobrar e é ele quem o
 * guarda. Aqui fica o suficiente para saber quem liberar.
 *
 * `itens` congela nome e preço no momento da compra: se o catálogo mudar
 * depois, a venda continua dizendo o que foi vendido e por quanto.
 *
 * `modo` separa as compras da prévia (preço de teste, dinheiro real) das
 * vendas de verdade — o painel nunca soma uma com a outra.
 */
export const vendas = pgTable(
  "vendas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    criadaEm: timestamp("criada_em", { withTimezone: true }).notNull().defaultNow(),
    nome: text("nome").notNull(),
    email: text("email").notNull(),
    telefone: text("telefone").notNull(),
    itens: jsonb("itens").$type<ItemVenda[]>().notNull(),
    totalCentavos: integer("total_centavos").notNull(),
    modo: text("modo").$type<ModoVenda>().notNull(),
    status: text("status").$type<StatusVenda>().notNull().default("pendente"),
    asaasClienteId: text("asaas_cliente_id"),
    asaasCobrancaId: text("asaas_cobranca_id"),
    urlFatura: text("url_fatura"),
    consentimentoEm: timestamp("consentimento_em", { withTimezone: true }).notNull().defaultNow(),
    pagoEm: timestamp("pago_em", { withTimezone: true }),
    acessoLiberadoEm: timestamp("acesso_liberado_em", { withTimezone: true }),
  },
  (t) => [
    check("vendas_modo_valido", sql`${t.modo} in ('teste', 'real')`),
    check("vendas_status_valido", sql`${t.status} in ('pendente', 'pago', 'cancelado', 'estornado', 'falhou')`),
  ],
);
```

- [ ] **Step 2: Migração escrita à mão**

O `drizzle-kit generate` deste projeto falha por versão (`Host version 0.25.12 does not match binary 0.28.1`); a migração é escrita à mão.

`drizzle/0011_vendas.sql`:

```sql
CREATE TABLE IF NOT EXISTS "vendas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"criada_em" timestamp with time zone DEFAULT now() NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"telefone" text NOT NULL,
	"itens" jsonb NOT NULL,
	"total_centavos" integer NOT NULL,
	"modo" text NOT NULL,
	"status" text DEFAULT 'pendente' NOT NULL,
	"asaas_cliente_id" text,
	"asaas_cobranca_id" text,
	"url_fatura" text,
	"consentimento_em" timestamp with time zone DEFAULT now() NOT NULL,
	"pago_em" timestamp with time zone,
	"acesso_liberado_em" timestamp with time zone,
	CONSTRAINT "vendas_modo_valido" CHECK ("vendas"."modo" in ('teste', 'real')),
	CONSTRAINT "vendas_status_valido" CHECK ("vendas"."status" in ('pendente', 'pago', 'cancelado', 'estornado', 'falhou'))
);
```

Em `drizzle/meta/_journal.json`, acrescentar ao array `entries` (o `when` é o valor de `node -e 'console.log(Date.now())'` no momento, que tem de ser maior que 1788998913363):

```json
    {
      "idx": 11,
      "version": "7",
      "when": <Date.now()>,
      "tag": "0011_vendas",
      "breakpoints": true
    }
```

Run: `npm run db:local && npm run db:migrar`
Expected: `alvo: localhost:54329` (ou equivalente local) e `migração ok`. Conferir: `psql` não é necessário — o teste do Step 5 falha se a tabela não existir.

- [ ] **Step 3: Transição de status (pura) — teste e implementação**

`lib/catalogo/eventos.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { transicaoDoEvento } from "./eventos";

describe("transicaoDoEvento", () => {
  it("pagamento confirmado ou recebido vira pago, inclusive boleto pago depois de vencido", () => {
    for (const e of ["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"]) {
      expect(transicaoDoEvento(e)).toEqual({ para: "pago", de: ["pendente", "cancelado"] });
    }
  });
  it("estorno só vale para o que foi pago", () => {
    expect(transicaoDoEvento("PAYMENT_REFUNDED")).toEqual({ para: "estornado", de: ["pago"] });
  });
  it("vencida ou apagada cancela só o que ainda estava pendente", () => {
    for (const e of ["PAYMENT_OVERDUE", "PAYMENT_DELETED"]) {
      expect(transicaoDoEvento(e)).toEqual({ para: "cancelado", de: ["pendente"] });
    }
  });
  it("qualquer outro evento não mexe em nada", () => {
    expect(transicaoDoEvento("PAYMENT_CREATED")).toBeNull();
    expect(transicaoDoEvento("")).toBeNull();
  });
});
```

`lib/catalogo/eventos.ts`:

```ts
import type { StatusVenda } from "@/lib/db/schema";

/**
 * Evento do Asaas → mudança de status da venda.
 *
 * `de` é a lista de status a partir dos quais a mudança vale, e é ela que faz
 * o webhook idempotente e à prova de ordem: o Asaas reentrega evento e não
 * garante a ordem. Um PAYMENT_OVERDUE atrasado não pode cancelar uma venda já
 * paga, e um PAYMENT_RECEIVED repetido não muda nada.
 *
 * `cancelado` está na origem de `pago` de propósito: boleto vencido que a
 * pessoa paga mesmo assim é dinheiro recebido.
 */
export function transicaoDoEvento(event: string): { para: StatusVenda; de: StatusVenda[] } | null {
  switch (event) {
    case "PAYMENT_RECEIVED":
    case "PAYMENT_CONFIRMED":
      return { para: "pago", de: ["pendente", "cancelado"] };
    case "PAYMENT_REFUNDED":
      return { para: "estornado", de: ["pago"] };
    case "PAYMENT_OVERDUE":
    case "PAYMENT_DELETED":
      return { para: "cancelado", de: ["pendente"] };
    default:
      return null;
  }
}
```

Run: `npx vitest run lib/catalogo/eventos.test.ts` → PASS.

- [ ] **Step 4: Teste de integração do acesso a dados**

`lib/catalogo/vendas.test.ts` (roda contra o Postgres local, como as outras suítes; isola por e-mail com prefixo e limpa no fim):

```ts
import { afterAll, describe, expect, it } from "vitest";
import { like } from "drizzle-orm";
import { db } from "@/lib/db";
import { vendas } from "@/lib/db/schema";
import { aplicarEventoAsaas, anexarCobranca, buscarVenda, criarVenda, marcarAcessoLiberado, marcarFalha } from "./vendas";

const PREFIXO = "vitest-vendas-";

function nova() {
  return criarVenda({
    nome: "Teste Vendas",
    email: `${PREFIXO}${Date.now()}-${Math.random()}@teste.invalido`,
    telefone: "11988887777",
    itens: [{ slug: "a", nome: "Curso A", descontoPct: 0, precoCentavos: 500 }],
    totalCentavos: 500,
    modo: "teste",
  });
}

afterAll(async () => {
  await db.delete(vendas).where(like(vendas.email, `${PREFIXO}%`));
});

describe("vendas", () => {
  it("nasce pendente, com consentimento registrado, e guarda os dados da cobrança", async () => {
    const id = await nova();
    await anexarCobranca(id, { clienteId: "cus_1", cobrancaId: "pay_1", urlFatura: "https://fatura" });
    const v = await buscarVenda(id);
    expect(v?.status).toBe("pendente");
    expect(v?.consentimentoEm).toBeInstanceOf(Date);
    expect(v?.asaasCobrancaId).toBe("pay_1");
    expect(v?.urlFatura).toBe("https://fatura");
  });

  it("buscarVenda devolve null para id que não é uuid, sem consultar", async () => {
    expect(await buscarVenda("nao-e-uuid")).toBeNull();
  });

  it("webhook: pago registra pago_em uma vez só, e evento repetido não tem efeito", async () => {
    const id = await nova();
    const evento = { event: "PAYMENT_RECEIVED", payment: { id: "pay_x", externalReference: id } };
    expect(await aplicarEventoAsaas(evento)).toBe("atualizado");
    const primeiro = (await buscarVenda(id))!.pagoEm;
    expect(await aplicarEventoAsaas(evento)).toBe("sem-efeito");
    expect((await buscarVenda(id))!.pagoEm).toEqual(primeiro);
    expect((await buscarVenda(id))!.status).toBe("pago");
  });

  it("webhook: vencimento atrasado não cancela venda paga", async () => {
    const id = await nova();
    await aplicarEventoAsaas({ event: "PAYMENT_CONFIRMED", payment: { externalReference: id } });
    expect(await aplicarEventoAsaas({ event: "PAYMENT_OVERDUE", payment: { externalReference: id } })).toBe("sem-efeito");
    expect((await buscarVenda(id))!.status).toBe("pago");
  });

  it("webhook: referência desconhecida, ausente ou evento irrelevante é ignorado", async () => {
    expect(await aplicarEventoAsaas({ event: "PAYMENT_RECEIVED", payment: { externalReference: "00000000-0000-4000-8000-000000000000" } })).toBe("sem-efeito");
    expect(await aplicarEventoAsaas({ event: "PAYMENT_RECEIVED", payment: { externalReference: "lixo" } })).toBe("ignorado");
    expect(await aplicarEventoAsaas({ event: "PAYMENT_RECEIVED" })).toBe("ignorado");
    expect(await aplicarEventoAsaas({ event: "PAYMENT_CREATED", payment: { externalReference: await nova() } })).toBe("ignorado");
  });

  it("acesso liberado só vale para venda paga, e uma vez", async () => {
    const id = await nova();
    expect(await marcarAcessoLiberado(id)).toBe(false);
    await aplicarEventoAsaas({ event: "PAYMENT_RECEIVED", payment: { externalReference: id } });
    expect(await marcarAcessoLiberado(id)).toBe(true);
    expect(await marcarAcessoLiberado(id)).toBe(false);
  });

  it("marcarFalha só atinge venda pendente", async () => {
    const id = await nova();
    await marcarFalha(id);
    expect((await buscarVenda(id))!.status).toBe("falhou");
  });
});
```

Run: `npx vitest run lib/catalogo/vendas.test.ts`
Expected: FAIL — `./vendas` não existe.

- [ ] **Step 5: Implementar `lib/catalogo/vendas.ts`**

```ts
import "server-only";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { vendas, type ItemVenda, type ModoVenda } from "@/lib/db/schema";
import { transicaoDoEvento } from "./eventos";

export type Venda = typeof vendas.$inferSelect;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function criarVenda(d: {
  nome: string;
  email: string;
  telefone: string;
  itens: ItemVenda[];
  totalCentavos: number;
  modo: ModoVenda;
}): Promise<string> {
  const [linha] = await db.insert(vendas).values(d).returning({ id: vendas.id });
  return linha.id;
}

export async function anexarCobranca(id: string, c: { clienteId: string; cobrancaId: string; urlFatura: string }) {
  await db
    .update(vendas)
    .set({ asaasClienteId: c.clienteId, asaasCobrancaId: c.cobrancaId, urlFatura: c.urlFatura })
    .where(eq(vendas.id, id));
}

export async function marcarFalha(id: string) {
  await db.update(vendas).set({ status: "falhou" }).where(and(eq(vendas.id, id), eq(vendas.status, "pendente")));
}

/** O id vem da URL do pedido: o que não é uuid nem chega ao banco (o Postgres
 *  recusaria o cast com erro 500). */
export async function buscarVenda(id: string): Promise<Venda | null> {
  if (!UUID.test(id)) return null;
  const [linha] = await db.select().from(vendas).where(eq(vendas.id, id));
  return linha ?? null;
}

export type EventoAsaas = { event?: string; payment?: { id?: string; externalReference?: string | null } };

/**
 * Aplica um evento do webhook. A venda é achada por `externalReference`, que o
 * checkout preenche com o id da venda ao criar a cobrança.
 *
 * "ignorado": evento que não interessa ou sem referência válida (cobrança
 * criada à mão no painel do Asaas, por exemplo). "sem-efeito": a venda não
 * existe ou já estava no estado — reentrega do Asaas cai aqui. Em nenhum caso
 * a rota responde erro: erro repetido faz o Asaas pausar a fila inteira.
 */
export async function aplicarEventoAsaas(evento: EventoAsaas): Promise<"atualizado" | "sem-efeito" | "ignorado"> {
  const transicao = transicaoDoEvento(evento.event ?? "");
  const referencia = evento.payment?.externalReference ?? "";
  if (!transicao || !UUID.test(referencia)) return "ignorado";

  const linhas = await db
    .update(vendas)
    .set({
      status: transicao.para,
      // coalesce: reentrega não reescreve a data do primeiro pagamento.
      ...(transicao.para === "pago" ? { pagoEm: sql`coalesce(${vendas.pagoEm}, now())` } : {}),
    })
    .where(and(eq(vendas.id, referencia), inArray(vendas.status, transicao.de)))
    .returning({ id: vendas.id });

  return linhas.length > 0 ? "atualizado" : "sem-efeito";
}

/** Botão do /admin. Só vale para venda paga e ainda não liberada — clicar duas
 *  vezes não reescreve a data. */
export async function marcarAcessoLiberado(id: string): Promise<boolean> {
  if (!UUID.test(id)) return false;
  const linhas = await db
    .update(vendas)
    .set({ acessoLiberadoEm: sql`now()` })
    .where(and(eq(vendas.id, id), eq(vendas.status, "pago"), isNull(vendas.acessoLiberadoEm)))
    .returning({ id: vendas.id });
  return linhas.length > 0;
}
```

- [ ] **Step 6: Rodar a suíte inteira**

Run: `npm run test:unit`
Expected: PASS, todos (82 anteriores + os novos).

- [ ] **Step 7: Commit**

```bash
git add lib/db/schema.ts drizzle/0011_vendas.sql drizzle/meta/_journal.json lib/catalogo/eventos.ts lib/catalogo/eventos.test.ts lib/catalogo/vendas.ts lib/catalogo/vendas.test.ts
git commit -m "feat: tabela de vendas do catálogo e transições de status do webhook"
```

---

### Task 3: Cliente do Asaas e Asaas falso para o e2e

**Files:**
- Create: `lib/asaas/cliente.ts`, `lib/asaas/cliente.test.ts`
- Create: `e2e/asaas-falso.mjs`
- Modify: `playwright.config.ts`

**Interfaces:**
- Produces:
  - `redigirCpfs(texto: string): string`
  - `criarCliente(d: { nome: string; email: string; cpf: string; telefone: string }): Promise<{ id: string }>`
  - `criarCobranca(d: { clienteId: string; valorCentavos: number; vencimento: string; descricao: string; referencia: string; urlRetorno: string }): Promise<{ id: string; urlFatura: string }>`
  - Asaas falso em `http://127.0.0.1:4010`: `POST /customers`, `POST /payments` (devolve `invoiceUrl` = `http://127.0.0.1:4010/fatura/<id>`), `GET /fatura/<id>` (HTML com "Fatura falsa"), `GET /__estado` (JSON `{ clientes, cobrancas }` com os corpos recebidos).

- [ ] **Step 1: Teste**

`lib/asaas/cliente.test.ts`:

```ts
import { afterEach, describe, expect, it } from "vitest";
import { criarCliente, redigirCpfs } from "./cliente";

describe("redigirCpfs", () => {
  it("mascara CPF cru e pontuado", () => {
    expect(redigirCpfs('{"cpfCnpj":"52998224725"}')).toBe('{"cpfCnpj":"[cpf-redigido]"}');
    expect(redigirCpfs("CPF 529.982.247-25 inválido")).toBe("CPF [cpf-redigido] inválido");
  });
});

describe("falha fechada", () => {
  const original = process.env.ASAAS_URL_BASE;
  afterEach(() => {
    if (original === undefined) delete process.env.ASAAS_URL_BASE;
    else process.env.ASAAS_URL_BASE = original;
  });

  /* A garantia que protege a chave de produção do .env.local: sem a URL base
     explícita, NENHUMA chamada sai — nem para o Asaas real. */
  it("sem ASAAS_URL_BASE, recusa antes de qualquer requisição", async () => {
    delete process.env.ASAAS_URL_BASE;
    await expect(criarCliente({ nome: "X", email: "x@x.com", cpf: "52998224725", telefone: "11988887777" })).rejects.toThrow(
      "ASAAS_URL_BASE ausente",
    );
  });
});
```

Run: `npx vitest run lib/asaas` → FAIL (módulo não existe).

- [ ] **Step 2: Implementar `lib/asaas/cliente.ts`**

Base: `git show cda119b^:lib/asaas/cliente.ts` (o cliente da plataforma antiga). Diferenças: URL base por variável, sem valor padrão; só as duas chamadas que o catálogo usa.

```ts
import "server-only"; // a chave de produção nunca pode vazar para bundle de client

/**
 * Cliente HTTP do Asaas, para o catálogo de cursos (2026-09-22).
 *
 * A URL base vem de ASAAS_URL_BASE e NÃO tem valor padrão. O .env.local tem a
 * chave de PRODUÇÃO (`ASAAS`), e o `next start` do e2e carrega esse arquivo:
 * com um padrão apontando para api.asaas.com, qualquer teste que esquecesse o
 * Asaas falso criaria cobrança real. Sem a variável, nada sai — falha fechada.
 * Produção define https://api.asaas.com/v3; o e2e, o Asaas falso local.
 */

/** Mascara CPF antes de logar: 11 dígitos crus E o formato pontuado. O Asaas
 *  ecoa o CPF em mensagem de erro, e ele não pode chegar ao log. */
export function redigirCpfs(texto: string): string {
  return texto.replace(/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g, "[cpf-redigido]").replace(/\d{11}/g, "[cpf-redigido]");
}

async function chamar(caminho: string, corpo: unknown): Promise<any> {
  const base = process.env.ASAAS_URL_BASE;
  if (!base) throw new Error("ASAAS_URL_BASE ausente");
  const chave = process.env.ASAAS;
  if (!chave) throw new Error("env ASAAS ausente");

  const resposta = await fetch(`${base.replace(/\/$/, "")}${caminho}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", access_token: chave },
    body: JSON.stringify(corpo),
    // Um Asaas pendurado não pode prender o checkout de quem está pagando.
    signal: AbortSignal.timeout(15_000),
  });
  if (!resposta.ok) {
    // O corpo do erro fica SÓ no log, redigido; a tela recebe mensagem genérica.
    console.error("[asaas]", caminho, resposta.status, redigirCpfs(await resposta.text()));
    throw new Error(`asaas ${resposta.status}`);
  }
  return resposta.json();
}

export async function criarCliente(d: { nome: string; email: string; cpf: string; telefone: string }): Promise<{ id: string }> {
  const r = await chamar("/customers", { name: d.nome, email: d.email, cpfCnpj: d.cpf, mobilePhone: d.telefone });
  return { id: r.id };
}

/** Cobrança avulsa, à vista. `UNDEFINED` deixa o comprador escolher Pix,
 *  boleto ou cartão na fatura. `externalReference` é o id da venda — é por ele
 *  que o webhook acha a linha. */
export async function criarCobranca(d: {
  clienteId: string;
  valorCentavos: number;
  vencimento: string;
  descricao: string;
  referencia: string;
  urlRetorno: string;
}): Promise<{ id: string; urlFatura: string }> {
  const r = await chamar("/payments", {
    customer: d.clienteId,
    billingType: "UNDEFINED",
    value: d.valorCentavos / 100,
    dueDate: d.vencimento,
    description: d.descricao.slice(0, 500),
    externalReference: d.referencia,
    callback: { successUrl: d.urlRetorno, autoRedirect: false },
  });
  return { id: r.id, urlFatura: r.invoiceUrl };
}
```

Run: `npx vitest run lib/asaas` → PASS.

- [ ] **Step 3: Asaas falso**

`e2e/asaas-falso.mjs`:

```js
/**
 * Asaas falso para o e2e (2026-09-22). O `next start` do Playwright sobe com
 * ASAAS_URL_BASE apontando para cá — nenhum teste chega perto da API real,
 * cuja chave de produção está no .env.local.
 *
 * Guarda em memória o corpo de cada chamada; o spec lê em GET /__estado para
 * conferir o valor cobrado e a referência da venda.
 */
import http from "node:http";

const PORTA = 4010;
const clientes = [];
const cobrancas = [];

function json(res, status, corpo) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(corpo));
}

function lerCorpo(req) {
  return new Promise((resolve) => {
    let dados = "";
    req.on("data", (p) => (dados += p));
    req.on("end", () => resolve(dados ? JSON.parse(dados) : {}));
  });
}

http
  .createServer(async (req, res) => {
    if (req.method === "GET" && req.url === "/__estado") return json(res, 200, { clientes, cobrancas });

    if (req.method === "GET" && req.url?.startsWith("/fatura/")) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end("<!doctype html><title>Fatura falsa</title><h1>Fatura falsa</h1>");
    }

    if (req.method === "POST" && !req.headers["access_token"]) return json(res, 401, { errors: [{ code: "sem_chave" }] });

    if (req.method === "POST" && req.url === "/customers") {
      const corpo = await lerCorpo(req);
      clientes.push(corpo);
      return json(res, 200, { id: `cus_falso_${clientes.length}` });
    }

    if (req.method === "POST" && req.url === "/payments") {
      const corpo = await lerCorpo(req);
      const id = `pay_falso_${cobrancas.length + 1}`;
      cobrancas.push({ id, ...corpo });
      return json(res, 200, { id, invoiceUrl: `http://127.0.0.1:${PORTA}/fatura/${id}` });
    }

    json(res, 404, { errors: [{ code: "nao_encontrado" }] });
  })
  .listen(PORTA, "127.0.0.1");
```

- [ ] **Step 4: Playwright sobe o falso e aponta o Next para ele**

`playwright.config.ts` — trocar a linha `webServer` por:

```ts
  /* Dois servidores: o Asaas falso e o site. ASAAS_URL_BASE vai só no env do
     `next start` que o Playwright sobe — o .env.local não a define, e o
     cliente do Asaas não tem valor padrão, então um servidor subido à mão sem
     ela faz o checkout FALHAR em vez de cobrar de verdade. Ao reaproveitar um
     servidor já de pé (reuseExistingServer), suba-o com
     `ASAAS_URL_BASE=http://127.0.0.1:4010 npm run start`. */
  webServer: [
    { command: "node e2e/asaas-falso.mjs", url: "http://127.0.0.1:4010/__estado", reuseExistingServer: true, timeout: 10_000 },
    {
      command: "npm run start",
      url: "http://localhost:3000",
      reuseExistingServer: true,
      timeout: 120_000,
      env: { ASAAS_URL_BASE: "http://127.0.0.1:4010" },
    },
  ],
```

Conferir que o falso responde: `node e2e/asaas-falso.mjs & sleep 1; curl -s http://127.0.0.1:4010/__estado; kill %1`
Expected: `{"clientes":[],"cobrancas":[]}`.

- [ ] **Step 5: Commit**

```bash
git add lib/asaas e2e/asaas-falso.mjs playwright.config.ts
git commit -m "feat: cliente do Asaas com falha fechada e Asaas falso para o e2e"
```

---

### Task 4: Checkout, webhook e Basic Auth da prévia

**Files:**
- Create: `app/preview/catalogo/checkout/route.ts`
- Create: `app/api/asaas/webhook/route.ts`
- Modify: `middleware.ts`
- Modify: `lib/content.ts` (acrescentar só `catalogo.cursos` e `catalogo.precoBaseCentavos` agora; o resto dos textos vem na Task 5)

**Interfaces:**
- Consumes: Task 1 (`calcularCarrinho`, `PRECO_TESTE_CENTAVOS`, `validarPedido`, `vencimentoEm`, `formatarReais`), Task 2 (`criarVenda`, `anexarCobranca`, `marcarFalha`, `aplicarEventoAsaas`), Task 3 (`criarCliente`, `criarCobranca`, `redigirCpfs`).
- Produces:
  - `POST /preview/catalogo/checkout` — corpo `{ nome, email, telefone, cpf, slugs, consentimento }`. Respostas: `200 { url }`, `400 { error: "invalid_json" }`, `422 { error: <motivo> }`, `502 { error: "falha" }`.
  - `POST /api/asaas/webhook` — `401` sem token certo; `200 { ok: true }` caso contrário (500 só em falha de banco, para o Asaas reentregar).
  - `catalogo.cursos: readonly { slug: string; nome: string; horas: string; frase: string; capa: string }[]` e `catalogo.precoBaseCentavos: 20000` em `lib/content.ts`.

- [ ] **Step 1: Cursos no content**

Em `lib/content.ts`, depois do objeto `cursos`, acrescentar (os demais textos entram na Task 5, no mesmo objeto):

```ts
/**
 * Catálogo de cursos com checkout (2026-09-22) — hoje só na prévia
 * /preview/catalogo, atrás de senha.
 *
 * A lista é PROVISÓRIA: os cursos OnDemand da Academy. A definitiva é a do
 * Pecege, com o que a Solution vai entregar de fato; quando chegar, troca aqui
 * e mais nada. O `slug` é o que viaja no carrinho e fica gravado na venda —
 * não renomeie um slug de curso que já foi vendido.
 */
export const catalogo = {
  precoBaseCentavos: 20000,
  cursos: [
    {
      slug: "fundamentos-ia-negocios",
      nome: "Fundamentos de IA aplicado aos Negócios",
      horas: "8 horas",
      frase: "Base sólida em Inteligência Artificial com foco em aplicações reais no mundo corporativo.",
      capa: "/academy/fundamentos-ia-negocios.jpg",
    },
    {
      slug: "fundamentos-ia-copilot",
      nome: "Fundamentos de IA com Copilot",
      horas: "6 horas",
      frase: "Domine o Microsoft Copilot para acelerar tarefas do dia a dia com IA generativa.",
      capa: "/academy/copilot-course.jpg",
    },
  ],
} as const;
```

(Nome, horas e frase copiados verbatim de `academy.courses.items` no mesmo arquivo.)

- [ ] **Step 2: Rota de checkout**

`app/preview/catalogo/checkout/route.ts`:

```ts
import { NextResponse } from "next/server";
import { catalogo, site } from "@/lib/content";
import { calcularCarrinho, PRECO_TESTE_CENTAVOS } from "@/lib/catalogo/preco";
import { validarPedido, vencimentoEm } from "@/lib/catalogo/pedido";
import { anexarCobranca, criarVenda, marcarFalha } from "@/lib/catalogo/vendas";
import { criarCliente, criarCobranca, redigirCpfs } from "@/lib/asaas/cliente";

/**
 * Checkout da PRÉVIA do catálogo.
 *
 * Mora dentro de /preview/catalogo de propósito: é o CAMINHO que fixa o modo
 * "teste" e o preço de R$ 5 — nada do que o navegador manda escolhe isso — e
 * o Basic Auth do middleware cobre esta rota junto com a página. Na
 * publicação, /cursos ganha a sua rota com o preço real.
 *
 * Ordem: grava a venda ANTES de falar com o Asaas. Se o Asaas falhar, a venda
 * fica "falhou" e o painel mostra a tentativa; o contrário (cobrança criada
 * sem venda gravada) seria dinheiro sem dono.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const validos = catalogo.cursos.map((c) => c.slug);
  const validacao = validarPedido(payload, validos);
  if (!validacao.ok) return NextResponse.json({ error: validacao.motivo }, { status: 422 });
  const { nome, email, telefone, cpf, slugs } = validacao.dados;

  const carrinho = calcularCarrinho(slugs, validos, PRECO_TESTE_CENTAVOS);
  const itens = carrinho.itens.map((item) => ({
    ...item,
    nome: catalogo.cursos.find((c) => c.slug === item.slug)!.nome,
  }));

  let id: string;
  try {
    id = await criarVenda({ nome, email, telefone, itens, totalCentavos: carrinho.totalCentavos, modo: "teste" });
  } catch (erro) {
    console.error("[checkout] falha ao gravar a venda", erro instanceof Error ? erro.message : erro);
    return NextResponse.json({ error: "falha" }, { status: 502 });
  }

  try {
    const cliente = await criarCliente({ nome, email, cpf, telefone });
    const cobranca = await criarCobranca({
      clienteId: cliente.id,
      valorCentavos: carrinho.totalCentavos,
      vencimento: vencimentoEm(3),
      descricao: `IAgentics · ${itens.map((i) => i.nome).join(", ")}`,
      referencia: id,
      urlRetorno: `${site.url}/preview/catalogo/pedido/${id}`,
    });
    await anexarCobranca(id, { clienteId: cliente.id, cobrancaId: cobranca.id, urlFatura: cobranca.urlFatura });
    return NextResponse.json({ url: cobranca.urlFatura });
  } catch (erro) {
    await marcarFalha(id).catch(() => {});
    console.error("[checkout] falha no Asaas", redigirCpfs(erro instanceof Error ? erro.message : String(erro)));
    return NextResponse.json({ error: "falha" }, { status: 502 });
  }
}
```

- [ ] **Step 3: Webhook**

`app/api/asaas/webhook/route.ts`:

```ts
import { NextResponse } from "next/server";
import { aplicarEventoAsaas, type EventoAsaas } from "@/lib/catalogo/vendas";

/**
 * Webhook de cobranças do Asaas (2026-09-22).
 *
 * MESMO caminho do webhook da plataforma antiga, que continua registrado na
 * conta do Asaas: voltar aqui evita recadastrar. Fica FORA do Basic Auth (o
 * Asaas não tem a senha) e se autentica pelo header asaas-access-token.
 *
 * Responde 200 para tudo que não é falha nossa — evento irrelevante, venda
 * desconhecida, reentrega. O Asaas pausa a fila da conta depois de erros
 * seguidos, e fila pausada é pagamento confirmado que nunca chega aqui.
 */
export async function POST(request: Request) {
  const token = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!token || request.headers.get("asaas-access-token") !== token) {
    return NextResponse.json({ error: "nao_autorizado" }, { status: 401 });
  }

  let evento: EventoAsaas;
  try {
    evento = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  try {
    const resultado = await aplicarEventoAsaas(evento);
    if (resultado === "sem-efeito" && evento.payment?.externalReference) {
      console.info("[asaas-webhook] sem efeito", evento.event, evento.payment.id ?? "");
    }
  } catch (erro) {
    // Banco fora: 500 faz o Asaas reentregar mais tarde, que é o que queremos.
    console.error("[asaas-webhook] falha ao aplicar", erro instanceof Error ? erro.message : erro);
    return NextResponse.json({ error: "falha" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Middleware**

Em `middleware.ts`:

1. Logo no início de `middleware()`, depois de `const { pathname } = req.nextUrl;`:

```ts
  /* /preview/catalogo cobra de verdade (preço de teste, dinheiro real): sem
     senha, quem achasse o link compraria curso por R$ 5. Mesma trava do
     /admin, e ANTES da negociação de markdown — senão um Accept: text/markdown
     reescreveria a página para /api/markdown por fora da senha. */
  const protegida = pathname.startsWith("/admin") || pathname.startsWith("/preview/catalogo");
```

2. Na condição do markdown, trocar `!pathname.startsWith("/admin") &&` por `!protegida &&`.
3. Trocar `if (!pathname.startsWith("/admin")) return NextResponse.next();` por `if (!protegida) return NextResponse.next();`.
4. No `matcher`, acrescentar depois de `"/admin",`:

```ts
    "/preview/catalogo",
    "/preview/catalogo/:path*",
```

5. Atualizar o comentário do topo do arquivo e o do matcher para mencionar a prévia do catálogo.

- [ ] **Step 5: Build e conferência manual rápida**

Derrubar servidores velhos (armadilha 4 do CLAUDE.md): `pkill -f "next start"; pkill -f next-server; lsof -ti:3000 | xargs kill 2>/dev/null`

Run: `npx next build`
Expected: build ok.

Run (servidor + falso): `node e2e/asaas-falso.mjs & ASAAS_URL_BASE=http://127.0.0.1:4010 npm run start &` e, depois de subir:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST localhost:3000/preview/catalogo/checkout   # 401
curl -s -o /dev/null -w "%{http_code}\n" -X POST localhost:3000/api/asaas/webhook -d '{}'    # 401
```

Os testes completos (com credencial e token) ficam no e2e da Task 7. Derrubar os dois processos no fim.

- [ ] **Step 6: Commit**

```bash
git add app/preview/catalogo/checkout app/api/asaas middleware.ts lib/content.ts
git commit -m "feat: checkout da prévia do catálogo, webhook do Asaas e senha na prévia"
```

---

### Task 5: Página do catálogo, carrinho e página do pedido

**Files:**
- Modify: `lib/content.ts` (completar o objeto `catalogo`)
- Create: `components/catalogo/Catalogo.tsx`
- Create: `app/preview/catalogo/page.tsx`
- Create: `app/preview/catalogo/pedido/[id]/page.tsx`

**Interfaces:**
- Consumes: Task 1 (`calcularCarrinho`, `formatarReais`, `PRECO_TESTE_CENTAVOS`), Task 2 (`buscarVenda`), Task 4 (`catalogo.cursos`, rota de checkout).
- Produces: textos `catalogo.*` usados pelo e2e da Task 7 — os nomes exatos dos botões abaixo são contrato do spec: "Adicionar", "Remover", "Finalizar compra", "Ir para o pagamento".

- [ ] **Step 1: Textos**

Completar o objeto `catalogo` em `lib/content.ts` (manter `precoBaseCentavos` e `cursos` da Task 4):

```ts
  meta: {
    titulo: "Catálogo de cursos (prévia)",
    descricao: "Prévia de teste do catálogo de formações online da IAgentics na Solution.",
  },
  eyebrow: "Formações online · IAgentics e Pecege",
  titulo: "Monte sua trilha de IA",
  lead: (preco: string) =>
    `Cada curso custa ${preco}. A partir do segundo, cada curso novo sai 5% mais barato que o anterior, até 25% de desconto.`,
  /* Na tela, não só no código: quem abre a prévia precisa saber que a
     cobrança é real, só que pequena. */
  avisoTeste: "Prévia de teste: preços reduzidos, cobrança real pelo Asaas.",
  card: {
    adicionar: "Adicionar",
    remover: "Remover",
    entraPor: (preco: string) => `Entra por ${preco}`,
  },
  carrinho: {
    titulo: "Seu carrinho",
    vazio: "Escolha um curso para começar. O segundo já sai com 5% de desconto.",
    desconto: (pct: number) => `${pct}% off`,
    total: "Total",
    economia: (valor: string) => `Você economiza ${valor}`,
    proximo: (preco: string, pct: number) => `Adicione mais um e ele sai por ${preco} (${pct}% off).`,
    teto: "Você chegou ao desconto máximo de 25%.",
    finalizar: "Finalizar compra",
  },
  checkout: {
    titulo: "Seus dados",
    nome: "Nome completo",
    email: "E-mail",
    cpf: "CPF",
    telefone: "Celular com DDD",
    notaCpf: "O CPF é exigido pelo Asaas para emitir a cobrança. Ele vai direto para o Asaas e não fica guardado no nosso site.",
    consentimento:
      "Autorizo que meus dados sejam compartilhados com o Pecege, responsável pela plataforma Solution, para liberar meu acesso aos cursos.",
    pagar: "Ir para o pagamento",
    enviando: "Gerando a cobrança…",
    voltar: "Voltar ao carrinho",
    privacidade: "Ver política de privacidade",
    erros: {
      nome: "Escreva seu nome completo.",
      email: "Confira o e-mail digitado.",
      telefone: "Informe o celular com DDD.",
      cpf: "Confira o CPF digitado.",
      cursos: "Seu carrinho está vazio.",
      consentimento: "Marque a autorização para continuar.",
      geral: "Não foi possível gerar a cobrança agora. Tente de novo em instantes.",
    } as Record<string, string>,
  },
  pedido: {
    titulo: "Pedido recebido",
    status: {
      pendente: "Aguardando pagamento",
      pago: "Pagamento confirmado",
      cancelado: "Cobrança cancelada",
      estornado: "Pagamento estornado",
      falhou: "Não foi possível gerar a cobrança",
    } as Record<string, string>,
    proximos: "O Pecege libera seu acesso na plataforma Solution e avisa você no e-mail informado.",
    abrirFatura: "Abrir a fatura",
    cursos: "Cursos",
    total: "Total",
    voltar: "Voltar ao catálogo",
  },
```

- [ ] **Step 2: Componente do catálogo**

`components/catalogo/Catalogo.tsx`. Requisitos (o implementador escreve o JSX seguindo `docs/DESIGN.md` e o estilo de `components/sections/cursos/ListaEspera.tsx` para campos e botões):

```tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { catalogo as t } from "@/lib/content";
import { calcularCarrinho, formatarReais } from "@/lib/catalogo/preco";

/**
 * Catálogo + carrinho + formulário do checkout (2026-09-22).
 *
 * O preço exibido sai da MESMA calcularCarrinho que o servidor usa; o servidor
 * recalcula de qualquer jeito, e é o valor dele que vai para o Asaas.
 *
 * O carrinho fica em localStorage — conveniência por navegador. Tudo com
 * try/catch: janela anônima ou armazenamento bloqueado só fazem o carrinho não
 * sobreviver ao recarregar; a página funciona igual.
 */
const CHAVE = "iagentics:carrinho";

type Props = { precoBaseCentavos: number; urlCheckout: string };

export function Catalogo({ precoBaseCentavos, urlCheckout }: Props) {
  const validos = useMemo(() => t.cursos.map((c) => c.slug), []);
  const [slugs, setSlugs] = useState<string[]>([]);
  const [etapa, setEtapa] = useState<"carrinho" | "dados">("carrinho");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Lê depois de montar: no SSR não há localStorage, e ler no render quebraria a hidratação.
  useEffect(() => {
    try {
      const salvo = JSON.parse(localStorage.getItem(CHAVE) ?? "[]");
      if (Array.isArray(salvo)) setSlugs(salvo.filter((s) => typeof s === "string"));
    } catch {}
  }, []);

  function salvar(novos: string[]) {
    setSlugs(novos);
    try {
      localStorage.setItem(CHAVE, JSON.stringify(novos));
    } catch {}
  }

  const carrinho = calcularCarrinho(slugs, validos, precoBaseCentavos);
  const noCarrinho = new Set(carrinho.itens.map((i) => i.slug));

  async function pagar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const form = new FormData(evento.currentTarget);
    setErro(null);
    setEnviando(true);
    try {
      const resposta = await fetch(urlCheckout, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: String(form.get("nome") ?? ""),
          email: String(form.get("email") ?? ""),
          cpf: String(form.get("cpf") ?? ""),
          telefone: String(form.get("telefone") ?? ""),
          consentimento: form.get("consentimento") === "on",
          slugs: carrinho.itens.map((i) => i.slug),
        }),
      });
      const corpo = await resposta.json().catch(() => ({}));
      if (resposta.ok && typeof corpo.url === "string") {
        try {
          localStorage.removeItem(CHAVE);
        } catch {}
        window.location.assign(corpo.url);
        return;
      }
      setErro(t.checkout.erros[corpo.error] ?? t.checkout.erros.geral);
    } catch {
      setErro(t.checkout.erros.geral);
    }
    setEnviando(false);
  }

  // ... JSX (abaixo)
}
```

JSX exigido:
- Container `grid gap-10 lg:grid-cols-12`: lista de cards em `lg:col-span-8` (`grid gap-6 sm:grid-cols-2`), resumo em `<aside aria-label={t.carrinho.titulo}>` com `lg:col-span-4 lg:sticky lg:top-24 lg:self-start`.
- Card (`<article>`): `next/image` da `capa` (aspect 16/9, `alt=""` — o nome vem logo abaixo em texto), `<h3>` com `nome`, `horas`, `frase`. Se NÃO está no carrinho: linha com `t.card.entraPor(formatarReais(carrinho.proximo!.precoCentavos))` e botão `t.card.adicionar` (`salvar([...slugs, c.slug])`). Se está: botão `t.card.remover` (`salvar(slugs.filter((s) => s !== c.slug))`). Botões com `aria-label` incluindo o nome do curso (ex.: `${t.card.adicionar} ${c.nome}`) para leitor de tela distinguir os cards; o texto visível continua sendo só "Adicionar"/"Remover".
- Resumo, etapa `carrinho`: `<h2>` `t.carrinho.titulo`; vazio → `t.carrinho.vazio`; senão lista de itens (nome; se `descontoPct > 0`, preço cheio riscado `<s>` + selo `t.carrinho.desconto(pct)`; preço com desconto em `tabular-nums`), linha `t.carrinho.total` com `formatarReais(totalCentavos)` dentro de um elemento com `data-testid="total"`, `t.carrinho.economia(...)` quando `cheio > total`, e o gatilho: `proximo` não nulo → `t.carrinho.proximo(formatarReais(proximo.precoCentavos), proximo.descontoPct)`; `proximo` nulo e desconto do último item = 25 → `t.carrinho.teto`. Botão `t.carrinho.finalizar` (desabilitado com carrinho vazio) → `setEtapa("dados")`.
- Resumo, etapa `dados`: `<form onSubmit={pagar}>` com `<h2>` `t.checkout.titulo`, campos rotulados (`<label>` envolvendo `<span>` + `<input>`) `nome` (autoComplete name), `email` (type email), `cpf` (inputMode numeric, autoComplete off), `telefone` (type tel, autoComplete tel), `t.checkout.notaCpf` em texto pequeno abaixo do CPF, checkbox `consentimento` com o texto `t.checkout.consentimento`, erro em `<p role="alert">`, botão submit `t.checkout.pagar` / `t.checkout.enviando`, botão `t.checkout.voltar` → `setEtapa("carrinho")`, link `/privacidade` com `t.checkout.privacidade`. O total continua visível acima do formulário.
- Celular: o `<aside>` vem depois da lista na ordem do documento; não precisa de barra fixa (o spec permite "barra inferior expansível", mas o resumo no fim da lista é suficiente para a prévia — YAGNI).

- [ ] **Step 3: Página da prévia**

`app/preview/catalogo/page.tsx`:

```tsx
import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Catalogo } from "@/components/catalogo/Catalogo";
import { catalogo as t } from "@/lib/content";
import { formatarReais, PRECO_TESTE_CENTAVOS } from "@/lib/catalogo/preco";

/* Prévia: noindex, sem canonical (a página oficial ainda é outra), fora do
   sitemap e atrás do Basic Auth do middleware. */
export const metadata: Metadata = {
  title: t.meta.titulo,
  description: t.meta.descricao,
  robots: { index: false, follow: false },
};

/**
 * Prévia do catálogo com checkout (2026-09-22). O preço é o de TESTE
 * (PRECO_TESTE_CENTAVOS): a cobrança é real, pequena, para o Rodrigo testar o
 * fluxo inteiro antes de o catálogo substituir a /cursos.
 */
export default function PaginaCatalogoPrevia() {
  return (
    <>
      <Nav />
      <main id="conteudo" className="pt-16">
        <section className="mx-auto max-w-[1400px] px-5 pb-24 pt-12 sm:px-8 sm:pt-16">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.eyebrow}</p>
          <h1 className="mt-4 text-4xl font-medium tracking-[-0.03em] text-fg md:text-6xl">{t.titulo}</h1>
          <p className="mt-5 max-w-[60ch] text-lg text-fg-muted">{t.lead(formatarReais(PRECO_TESTE_CENTAVOS))}</p>
          <p className="mt-4 inline-block border border-line bg-surface px-3 py-1.5 text-sm text-fg">{t.avisoTeste}</p>
          <div className="mt-12">
            <Catalogo precoBaseCentavos={PRECO_TESTE_CENTAVOS} urlCheckout="/preview/catalogo/checkout" />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
```

(Ajustar tipografia/espaçamento ao DESIGN.md se divergir; a estrutura e os textos são o requisito.)

- [ ] **Step 4: Página do pedido**

`app/preview/catalogo/pedido/[id]/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { catalogo as t } from "@/lib/content";
import { formatarReais } from "@/lib/catalogo/preco";
import { buscarVenda } from "@/lib/catalogo/vendas";

export const metadata: Metadata = { title: t.pedido.titulo, robots: { index: false, follow: false } };

/* Lê o banco a cada acesso: o status muda quando o webhook chega, e o build do
   Railway não alcança o Postgres. */
export const dynamic = "force-dynamic";

/**
 * Para onde o Asaas manda a pessoa depois de pagar. O id é o uuid aleatório da
 * venda — não se chega ao pedido de outra pessoa trocando um número.
 */
export default async function PaginaPedido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const venda = await buscarVenda(id);
  if (!venda) notFound();

  return (
    <>
      <Nav />
      <main id="conteudo" className="pt-16">
        <section className="mx-auto max-w-[760px] px-5 pb-24 pt-12 sm:px-8 sm:pt-16">
          <h1 className="text-4xl font-medium tracking-[-0.03em] text-fg">{t.pedido.titulo}</h1>
          <p role="status" className="mt-4 text-lg text-fg">{t.pedido.status[venda.status] ?? venda.status}</p>
          <p className="mt-2 max-w-[60ch] text-fg-muted">{t.pedido.proximos}</p>

          <h2 className="mt-10 font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.pedido.cursos}</h2>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {venda.itens.map((item) => (
              <li key={item.slug} className="flex justify-between gap-4 py-3 text-fg">
                <span>{item.nome}</span>
                <span className="tabular-nums">{formatarReais(item.precoCentavos)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex justify-between text-lg font-medium text-fg">
            <span>{t.pedido.total}</span>
            <span className="tabular-nums">{formatarReais(venda.totalCentavos)}</span>
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            {venda.status === "pendente" && venda.urlFatura ? (
              <a href={venda.urlFatura} className="rounded-control bg-accent px-8 py-4 font-medium text-accent-on transition-colors hover:bg-accent-hover">
                {t.pedido.abrirFatura}
              </a>
            ) : null}
            <Link href="/preview/catalogo" className="rounded-control border border-line px-8 py-4 font-medium text-fg">
              {t.pedido.voltar}
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 5: Build e olhada no navegador**

Derrubar servidores (armadilha 4), `npx next build`, subir `node e2e/asaas-falso.mjs` e `ASAAS_URL_BASE=http://127.0.0.1:4010 npm run start`, abrir `http://localhost:3000/preview/catalogo` com as credenciais do `.env.local` (Playwright com `httpCredentials`, lendo o arquivo dentro do script — nunca pela linha de comando), capturar tela em 1440×900 e 390×844, adicionar os dois cursos e conferir: R$ 5,00 → total R$ 9,75, gatilho some com o catálogo inteiro no carrinho. Corrigir o que estiver quebrado. Apagar o script de captura depois.

- [ ] **Step 6: Commit**

```bash
git add lib/content.ts components/catalogo app/preview/catalogo/page.tsx "app/preview/catalogo/pedido"
git commit -m "feat: prévia do catálogo com carrinho de desconto progressivo e página do pedido"
```

---

### Task 6: Vendas no /admin

**Files:**
- Create: `lib/admin/csv.ts`
- Modify: `app/admin/lista-espera.csv/route.ts` (usar `campoCsv` de `lib/admin/csv.ts` em vez da função local `campo`)
- Modify: `lib/admin/dados.ts`
- Create: `app/admin/acoes.ts`
- Create: `app/admin/vendas.csv/route.ts`
- Modify: `app/admin/page.tsx`
- Modify: `lib/content-admin.ts`

**Interfaces:**
- Consumes: Task 2 (`vendas`, `marcarAcessoLiberado`, tipos).
- Produces:
  - `campoCsv(valor: string): string`
  - `listarVendas(modo: ModoVenda): Promise<LinhaVenda[]>` e `resumoVendas(modo: ModoVenda): Promise<{ pagas: number; aguardandoLiberacao: number; recebidoCentavos: number }>` em `lib/admin/dados.ts`
  - Server action `liberarAcesso(formData: FormData): Promise<void>` (campo `id`)
  - `GET /admin/vendas.csv?modo=teste|real`
  - Textos `admin.vendas.*` — o e2e usa: título da seção "Vendas", botão "Marcar acesso liberado", rótulo "Pagas aguardando liberação", link "Ver vendas de teste".

- [ ] **Step 1: Extrair o escape de CSV**

`lib/admin/csv.ts`:

```ts
/** Campo de CSV para o Excel em português (separador ponto e vírgula).
 *  Aspas duplicadas e o campo entre aspas: nome com ponto e vírgula ou quebra
 *  de linha não pode partir a coluna. `=`, `+`, `-` e `@` iniciais são
 *  neutralizados porque o Excel os interpretaria como fórmula. */
export function campoCsv(valor: string): string {
  const seguro = /^[=+\-@]/.test(valor) ? `'${valor}` : valor;
  return `"${seguro.replace(/"/g, '""')}"`;
}
```

Em `app/admin/lista-espera.csv/route.ts`, remover a função `campo` (e o comentário dela, que foi para o novo arquivo), importar `campoCsv` e trocar os usos. Comportamento idêntico — o e2e do CSV existente continua passando.

- [ ] **Step 2: Consultas**

Em `lib/admin/dados.ts` (atualizar o comentário do topo, que fala em "três tabelas"):

```ts
import { vendas, type ModoVenda, type ItemVenda, type StatusVenda } from "@/lib/db/schema";

export type LinhaVenda = {
  id: string;
  criadaEm: Date;
  nome: string;
  email: string;
  telefone: string;
  itens: ItemVenda[];
  totalCentavos: number;
  status: StatusVenda;
  pagoEm: Date | null;
  acessoLiberadoEm: Date | null;
};

/** Vendas do modo pedido, mais recentes primeiro. Teste e real nunca se
 *  misturam na mesma tabela da tela. */
export async function listarVendas(modo: ModoVenda): Promise<LinhaVenda[]> {
  return db
    .select({
      id: vendas.id,
      criadaEm: vendas.criadaEm,
      nome: vendas.nome,
      email: vendas.email,
      telefone: vendas.telefone,
      itens: vendas.itens,
      totalCentavos: vendas.totalCentavos,
      status: vendas.status,
      pagoEm: vendas.pagoEm,
      acessoLiberadoEm: vendas.acessoLiberadoEm,
    })
    .from(vendas)
    .where(eq(vendas.modo, modo))
    .orderBy(desc(vendas.criadaEm));
}

export async function resumoVendas(modo: ModoVenda) {
  const [r] = await db
    .select({
      pagas: sql<number>`count(*) filter (where status = 'pago')::int`,
      aguardandoLiberacao: sql<number>`count(*) filter (where status = 'pago' and acesso_liberado_em is null)::int`,
      recebidoCentavos: sql<number>`coalesce(sum(total_centavos) filter (where status = 'pago'), 0)::int`,
    })
    .from(vendas)
    .where(eq(vendas.modo, modo));
  return r;
}
```

(Acrescentar `eq` ao import de `drizzle-orm`.)

- [ ] **Step 3: Server action**

`app/admin/acoes.ts`:

```ts
"use server";
import { revalidatePath } from "next/cache";
import { marcarAcessoLiberado } from "@/lib/catalogo/vendas";

/* Server action do /admin: o POST vai para o caminho do painel, que o
   middleware cobre com o Basic Auth — sem credencial, a ação nem executa. */
export async function liberarAcesso(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await marcarAcessoLiberado(id);
  revalidatePath("/admin");
}
```

- [ ] **Step 4: CSV das vendas**

`app/admin/vendas.csv/route.ts`:

```ts
import { listarVendas } from "@/lib/admin/dados";
import { campoCsv } from "@/lib/admin/csv";
import { formatarReais } from "@/lib/catalogo/preco";

/**
 * Exportação das vendas — é daqui que sai a lista para liberar os acessos na
 * Solution. Protegida pelo Basic Auth do middleware, como todo /admin.
 * Sem CPF: ele não existe no nosso banco (fica no Asaas).
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const modo = new URL(request.url).searchParams.get("modo") === "teste" ? "teste" : "real";
  const linhas = await listarVendas(modo);
  const fmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

  const csv = [
    ["data", "nome", "email", "telefone", "cursos", "total", "status", "pago_em", "acesso_liberado_em"].join(";"),
    ...linhas.map((l) =>
      [
        fmt.format(l.criadaEm),
        l.nome,
        l.email,
        l.telefone,
        l.itens.map((i) => i.nome).join(" | "),
        formatarReais(l.totalCentavos),
        l.status,
        l.pagoEm ? fmt.format(l.pagoEm) : "",
        l.acessoLiberadoEm ? fmt.format(l.acessoLiberadoEm) : "",
      ]
        .map(campoCsv)
        .join(";"),
    ),
  ].join("\r\n");

  const hoje = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vendas-${modo}-${hoje}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
```

- [ ] **Step 5: Textos do painel**

Em `lib/content-admin.ts`, atualizar `lead` para `"Visitas do site, vendas do catálogo e lista de espera do lançamento na Solution."` e acrescentar antes de `lista`:

```ts
  /* Vendas do catálogo (2026-09-22). Sem aviso automático ao Pecege — decisão
     do Rodrigo —, então o contador de "aguardando liberação" é o que impede
     uma venda paga de ficar sem acesso. */
  vendas: {
    titulo: "Vendas",
    aguardando: "Pagas aguardando liberação",
    pagas: "Vendas pagas",
    recebido: "Recebido",
    verTeste: "Ver vendas de teste",
    verReal: "Ver vendas reais",
    modoTeste: "Mostrando vendas de TESTE (prévia, preço reduzido).",
    exportar: "Exportar CSV",
    nenhuma: "Nenhuma venda ainda.",
    colunaData: "Data",
    colunaComprador: "Comprador",
    colunaCursos: "Cursos",
    colunaTotal: "Total",
    colunaStatus: "Status",
    colunaAcesso: "Acesso",
    liberar: "Marcar acesso liberado",
    liberadoEm: (data: string) => `Liberado em ${data}`,
    status: {
      pendente: "Aguardando pagamento",
      pago: "Pago",
      cancelado: "Cancelado",
      estornado: "Estornado",
      falhou: "Falhou",
    } as Record<string, string>,
    lgpd: "Dados pessoais coletados com consentimento para compartilhamento com o Pecege. O CPF não fica aqui: está no painel do Asaas.",
  },
```

- [ ] **Step 6: Seção no painel**

Em `app/admin/page.tsx`:

- Assinatura: `export default async function PaginaAdmin({ searchParams }: { searchParams: Promise<{ vendas?: string }> })`, com `const modo = (await searchParams).vendas === "teste" ? "teste" : "real";`.
- Acrescentar `listarVendas(modo)` e `resumoVendas(modo)` ao `Promise.all` (desestruturar como `listaVendas`, `somaVendas`).
- Importar `liberarAcesso` de `./acoes` e `formatarReais` de `@/lib/catalogo/preco`.
- Nova `<section className="flex flex-col gap-5 border-t border-line pt-10">` ANTES da seção da lista de espera, com:
  - cabeçalho: `<h2>` `t.vendas.titulo` (mesmas classes dos outros h2), link `?vendas=teste` / `?vendas=real` alternando (`t.vendas.verTeste` / `t.vendas.verReal`) e, se houver vendas, `<a href={`/admin/vendas.csv?modo=${modo}`}>` `t.vendas.exportar` (mesmas classes do botão de exportar da lista);
  - se `modo === "teste"`, `<p>` com `t.vendas.modoTeste`;
  - três `Cartao`: `t.vendas.aguardando` → `somaVendas.aguardandoLiberacao`; `t.vendas.pagas` → `somaVendas.pagas`; `t.vendas.recebido` → `formatarReais(somaVendas.recebidoCentavos)`;
  - vazio → `t.vendas.nenhuma`; senão tabela (`overflow-x-auto`, `min-w-[760px]`) com colunas data (`dataHora.format`), comprador (nome + e-mail + telefone em `text-fg-muted`), cursos (`itens.map(nome).join(", ")`), total (`formatarReais`, `tabular-nums`), status (`t.vendas.status[...]`), acesso: se `acessoLiberadoEm` → `t.vendas.liberadoEm(dataHora.format(...))`; senão se `status === "pago"` → `<form action={liberarAcesso}><input type="hidden" name="id" value={v.id} /><button type="submit" ...>{t.vendas.liberar}</button></form>`; senão `—`;
  - `<p className="max-w-[70ch] text-xs text-fg-muted">{t.vendas.lgpd}</p>`.

- [ ] **Step 7: Verificar**

Derrubar servidores, `npx next build`, `npm run test:unit` (PASS), `npx playwright test e2e/admin.spec.ts` (PASS — o CSV da lista continua igual).

- [ ] **Step 8: Commit**

```bash
git add lib/admin app/admin lib/content-admin.ts
git commit -m "feat: vendas do catálogo no painel, com liberação de acesso e CSV"
```

---

### Task 7: Política de privacidade, e2e do fluxo completo e registro

**Files:**
- Modify: `lib/content.ts` (objeto `privacidade`)
- Modify: `e2e/privacidade.spec.ts`
- Create: `e2e/catalogo.spec.ts`
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: tudo das Tasks 1–6.

- [ ] **Step 1: Política de privacidade**

Em `privacidade` (`lib/content.ts`):
- `hero.atualizado`: `"Atualizada em 22 de setembro de 2026"`.
- Em "O que coletamos, e só isso", acrescentar depois de "Lista de espera do lançamento":

```ts
        {
          termo: "Compra de cursos",
          texto:
            "Nome, e-mail, celular, os cursos escolhidos, o valor e a situação do pagamento, além da data em que você autorizou o compartilhamento com o Pecege. Servem para liberar seu acesso na plataforma Solution. O CPF é pedido porque o Asaas, que emite a cobrança, exige: ele vai direto para o Asaas e não é gravado no nosso site.",
        },
```

- Em "Com quem compartilhamos": no texto de "Pecege e plataforma Solution", acrescentar ao início `"Se você comprou um curso, seu nome, e-mail, celular e os cursos comprados são compartilhados com o Pecege para liberar seu acesso na Solution. "` (mantendo o texto da lista de espera que já existe), e um item novo:

```ts
        {
          termo: "Asaas",
          texto: "Emissão e processamento das cobranças dos cursos: recebe nome, e-mail, celular e CPF para gerar a cobrança, e os dados de pagamento que você informa na fatura.",
        },
```

- Em `e2e/privacidade.spec.ts`, acrescentar ao teste existente:

```ts
  /* A compra de cursos entrou em 2026-09-22: a política declara o que é
     gravado e — o ponto que mais importa — que o CPF NÃO fica no site. */
  await expect(page.getByText(/Compra de cursos/)).toBeVisible();
  await expect(page.getByText(/não é gravado no nosso site/)).toBeVisible();
```

- [ ] **Step 2: E2E do catálogo**

`e2e/catalogo.spec.ts`:

```ts
import { test, expect, type APIRequestContext } from "@playwright/test";
import { readFileSync } from "node:fs";

/* Credenciais e token lidos do .env.local — o mesmo arquivo que o `next
   start` carrega. Nunca no código nem na linha de comando. */
function env(chave: string): string | null {
  try {
    return readFileSync(".env.local", "utf8").match(new RegExp(`^${chave}=(.*)$`, "m"))?.[1]?.trim() ?? null;
  } catch {
    return null;
  }
}
const usuario = env("ADMIN_USUARIO");
const senha = env("ADMIN_SENHA");
const tokenWebhook = env("ASAAS_WEBHOOK_TOKEN");

const ASAAS_FALSO = "http://127.0.0.1:4010";
const CPF = "529.982.247-25";
const pedido = (extra: Record<string, unknown> = {}) => ({
  nome: "Compra E2E",
  email: `e2e-catalogo-${Date.now()}@teste.invalido`,
  telefone: "(11) 98888-7777",
  cpf: CPF,
  slugs: ["fundamentos-ia-negocios"],
  consentimento: true,
  ...extra,
});

async function ultimaCobranca(request: APIRequestContext) {
  const estado = await (await request.get(`${ASAAS_FALSO}/__estado`)).json();
  return estado.cobrancas.at(-1);
}

/* A prévia cobra de verdade: sem senha, nada abre — nem pelo caminho do
   markdown para agentes, que reescreve a rota. */
test("sem credencial, a prévia, o checkout e o markdown recusam", async ({ request }) => {
  expect((await request.get("/preview/catalogo")).status()).toBe(401);
  expect((await request.get("/preview/catalogo", { headers: { Accept: "text/markdown" } })).status()).toBe(401);
  expect((await request.post("/preview/catalogo/checkout", { data: pedido() })).status()).toBe(401);
});

test("webhook sem o token certo é recusado", async ({ request }) => {
  expect((await request.post("/api/asaas/webhook", { data: {} })).status()).toBe(401);
  expect((await request.post("/api/asaas/webhook", { data: {}, headers: { "asaas-access-token": "errado" } })).status()).toBe(401);
});

test.describe("com credencial", () => {
  test.skip(!usuario || !senha || !tokenWebhook, "sem ADMIN_USUARIO/ADMIN_SENHA/ASAAS_WEBHOOK_TOKEN no .env.local");
  test.use({ httpCredentials: { username: usuario ?? "", password: senha ?? "" } });

  test("o carrinho aplica o desconto progressivo e sobrevive ao recarregar", async ({ page }) => {
    await page.goto("/preview/catalogo");
    await page.evaluate(() => localStorage.removeItem("iagentics:carrinho"));
    await page.reload();

    const total = page.getByTestId("total");
    await page.getByRole("button", { name: /^Adicionar Fundamentos de IA aplicado/ }).click();
    await expect(total).toHaveText(/R\$\s5,00/);
    await expect(page.getByText(/Adicione mais um e ele sai por R\$\s4,75/)).toBeVisible();

    await page.getByRole("button", { name: /^Adicionar Fundamentos de IA com Copilot/ }).click();
    await expect(total).toHaveText(/R\$\s9,75/);

    await page.reload();
    await expect(page.getByTestId("total")).toHaveText(/R\$\s9,75/);

    await page.getByRole("button", { name: /^Remover Fundamentos de IA com Copilot/ }).click();
    await expect(page.getByTestId("total")).toHaveText(/R\$\s5,00/);
  });

  test("o servidor recusa pedido sem consentimento", async ({ request }) => {
    const r = await request.post("/preview/catalogo/checkout", { data: pedido({ consentimento: false }) });
    expect(r.status()).toBe(422);
    expect((await r.json()).error).toBe("consentimento");
  });

  /* O navegador manda só os slugs: preço forjado no corpo é ignorado, e quem
     decide o valor é o servidor. */
  test("preço forjado no corpo é ignorado", async ({ request }) => {
    const r = await request.post("/preview/catalogo/checkout", {
      data: pedido({ totalCentavos: 1, precoCentavos: 1, value: 0.01 }),
    });
    expect(r.status()).toBe(200);
    expect((await ultimaCobranca(request)).value).toBe(5);
  });

  test("compra completa: formulário, fatura, webhook, pedido pago e painel", async ({ page, request }) => {
    await page.goto("/preview/catalogo");
    await page.evaluate(() => localStorage.removeItem("iagentics:carrinho"));
    await page.reload();

    await page.getByRole("button", { name: /^Adicionar Fundamentos de IA aplicado/ }).click();
    await page.getByRole("button", { name: /^Adicionar Fundamentos de IA com Copilot/ }).click();
    await page.getByRole("button", { name: "Finalizar compra" }).click();

    const nome = `Compra Completa ${Date.now()}`;
    await page.getByLabel("Nome completo").fill(nome);
    await page.getByLabel("E-mail").fill(`e2e-catalogo-${Date.now()}@teste.invalido`);
    await page.getByLabel("CPF").fill(CPF);
    await page.getByLabel("Celular com DDD").fill("11988887777");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Ir para o pagamento" }).click();

    await expect(page).toHaveURL(/127\.0\.0\.1:4010\/fatura\//);
    const cobranca = await ultimaCobranca(request);
    expect(cobranca.value).toBe(9.75);
    expect(cobranca.billingType).toBe("UNDEFINED");
    const idVenda: string = cobranca.externalReference;

    const webhook = await request.post("/api/asaas/webhook", {
      headers: { "asaas-access-token": tokenWebhook! },
      data: { event: "PAYMENT_RECEIVED", payment: { id: cobranca.id, externalReference: idVenda } },
    });
    expect(webhook.status()).toBe(200);

    await page.goto(`/preview/catalogo/pedido/${idVenda}`);
    await expect(page.getByRole("status")).toHaveText("Pagamento confirmado");

    await page.goto("/admin?vendas=teste");
    const linha = page.getByRole("row", { name: new RegExp(nome) });
    await expect(linha).toBeVisible();
    await linha.getByRole("button", { name: "Marcar acesso liberado" }).click();
    await expect(page.getByRole("row", { name: new RegExp(nome) }).getByText(/Liberado em/)).toBeVisible();

    const csv = await (await page.request.get("/admin/vendas.csv?modo=teste")).text();
    expect(csv).toContain(nome);
    // O CPF foi para o Asaas (falso), e só para ele.
    expect(csv).not.toMatch(/529\.?982\.?247-?25/);
  });

  test("pedido com id que não existe responde 404", async ({ page }) => {
    const r = await page.goto("/preview/catalogo/pedido/00000000-0000-4000-8000-000000000000");
    expect(r?.status()).toBe(404);
  });
});
```

Run: derrubar servidores (armadilha 4), `npx next build`, `npm run test:e2e`
Expected: PASS em tudo (59 anteriores + os novos). As linhas de venda que o e2e grava no banco LOCAL ficam lá, como as da lista de espera.

- [ ] **Step 3: Unitários**

Run: `npm run test:unit` → PASS. Anotar os totais dos dois comandos para o CLAUDE.md.

- [ ] **Step 4: CLAUDE.md**

- Stack: "quatro tabelas".
- Mapa de rotas: acrescentar `/preview/catalogo` (prévia do catálogo com checkout, atrás do Basic Auth, cobrança real a preço de teste), `/preview/catalogo/pedido/[id]`, `POST /preview/catalogo/checkout`, `POST /api/asaas/webhook`, `/admin/vendas.csv`. Corrigir "Hoje não há prévia no ar". Tirar "Saíram com a plataforma: ... o cliente Asaas" (ele voltou, só para o catálogo).
- Nova seção curta **Catálogo e checkout (2026-09-22)** com: a regra do desconto (e onde mora); o navegador manda só slugs; checkout dentro da prévia fixa modo e preço pelo caminho; `ASAAS_URL_BASE` sem padrão = falha fechada, produção define, `.env.local` não, e o e2e sobe o Asaas falso na 4010 — **servidor subido à mão para o e2e precisa de `ASAAS_URL_BASE=http://127.0.0.1:4010`**; CPF só no Asaas; webhook no caminho antigo, 200 para tudo que não é falha nossa; liberação no Pecege é manual pelo /admin; o que falta para publicar em /cursos (preço real, rota própria, sem senha, limite de tentativas, sair a lista de espera e a promessa de 10%, prazo de liberação, decidir o "até 3×").
- Segredos: `ASAAS`, `ASAAS_WEBHOOK_TOKEN` e `ASAAS_URL_BASE` passam a ser necessárias (não mais órfãs); `AUTH_*` continua órfã. Atualizar a pendência "Variáveis órfãs".
- Testes: atualizar as contagens.

- [ ] **Step 5: Commit**

```bash
git add lib/content.ts e2e/privacidade.spec.ts e2e/catalogo.spec.ts CLAUDE.md
git commit -m "feat: política de privacidade da compra, e2e do checkout e registro no CLAUDE.md"
```

---

### Task 8: Produção (controlador executa, não subagente)

Toca produção e segredos: roda na sessão principal, com as regras de segurança do CLAUDE.md.

- [ ] **Step 1: Variáveis no Railway (só nomes, nunca valores)**

`export RAILWAY_API_TOKEN=$(grep "^RAILWAY_TOKEN=" .env.local | cut -d= -f2-)`. Conferir a existência dentro do container:
`npx @railway/cli ssh -- node -e 'console.log(["ASAAS","ASAAS_WEBHOOK_TOKEN","ASAAS_URL_BASE"].map(k => k + ": " + (process.env[k] ? "definida" : "AUSENTE")).join("\n"))'`
- `ASAAS_URL_BASE` (não é segredo): `printf 'https://api.asaas.com/v3' | npx @railway/cli variables --set-from-stdin ASAAS_URL_BASE --skip-deploys`.
- Se `ASAAS` ou `ASAAS_WEBHOOK_TOKEN` estiverem AUSENTES: definir a partir do `.env.local` por `--set-from-stdin` num script que lê o arquivo (valor nunca na linha de comando nem no chat).

- [ ] **Step 2: Migração 0011 antes do deploy**

Procedimento do CLAUDE.md (aditiva, antes do deploy): script node em `/app` via `railway ssh` (stdin), numa transação, com guarda `CREATE TABLE IF NOT EXISTS` (já está no SQL), inserindo em `drizzle.__drizzle_migrations` o `hash` = sha256 do conteúdo de `drizzle/0011_vendas.sql` e `created_at` = `when` do journal. Apagar o script do container depois. Conferir `select count(*) from vendas` = 0.

- [ ] **Step 3: Deploy**

`scripts/deploy-railway.sh`; verificar o `BUILD_ID` em produção igual ao `.next/BUILD_ID` local (armadilha 9).

- [ ] **Step 4: Fumaça em produção (sem cobrar)**

- `curl -s -o /dev/null -w "%{http_code}" https://iagentics.com.br/preview/catalogo` → 401.
- `curl -s -o /dev/null -w "%{http_code}" -X POST https://iagentics.com.br/api/asaas/webhook -d '{}'` → 401.
- Fila do webhook no Asaas: dentro do container, script node que faz `GET ${ASAAS_URL_BASE}/webhook` (leitura, sem criar nada) e imprime só `url`, `enabled`, `interrupted`, `apiVersion`. Esperado: `url` = `https://iagentics.com.br/api/asaas/webhook`, `enabled: true`, `interrupted: false`. Se `interrupted: true` (o endpoint respondeu 404 desde 2026-08-28): reativar com `POST ${ASAAS_URL_BASE}/webhook` reenviando a mesma configuração com `interrupted: false` (conferir o formato atual na documentação do Asaas antes), e dizer ao Rodrigo.

- [ ] **Step 5: Entregar ao Rodrigo o teste real**

Ele abre `https://iagentics.com.br/preview/catalogo` (senha do /admin), compra um curso a R$ 5 por Pix, e confere: a fatura abre, o pagamento vira "Pagamento confirmado" no pedido, a venda aparece no `/admin?vendas=teste` com o contador de liberação, o estorno no painel do Asaas muda o status para "Estornado". Se a criação da cobrança falhar com erro do `callback`/`successUrl` (o Asaas exige o domínio cadastrado na conta), ver o log redigido e decidir com ele: cadastrar o domínio no Asaas ou tirar o `callback`.
