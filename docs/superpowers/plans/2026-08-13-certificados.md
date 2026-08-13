# Certificados de conclusão — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Certificado por formação concluída (100% das aulas), emitido automaticamente e para sempre, com página pública de validação que é o próprio certificado e compartilhamento no LinkedIn por URL pré-preenchida.

**Architecture:** Tabela `certificates` + camada `lib/plataforma/certificados.ts` (emissão idempotente com gancho no `gravarProgresso` e emissão preguiçosa na página do curso — sem backfill). Página pública `/certificados/[codigo]` server-rendered com OG estático (still Remotion). Encaixes: botão "Ver certificado" no hero do curso e lista na conta.

**Tech Stack:** Next.js 15 App Router, Drizzle + node-postgres, `node:crypto` (código), Remotion (still OG), vitest (integração), Playwright (e2e).

**Spec:** `docs/superpowers/specs/2026-08-13-certificados-design.md`

## Global Constraints

- pt-BR; nunca "PMEs". Strings visíveis só em `lib/content-plataforma.ts`.
- Design system por tokens: violeta como preenchimento (borda só como indicador de estado); superfícies radius 0; controles `rounded-control` pill; funciona nos temas claro e escuro.
- **Válido para sempre**: NENHUMA checagem de assinatura na página pública ou na emissão além do critério de conclusão.
- Critério de emissão: curso `publicado = true`, `total de aulas > 0`, todas concluídas pelo aluno. Idempotente (unique `(user_id, course_id)`).
- Código: alfabeto `23456789ABCDEFGHJKMNPQRSTUVWXYZ` (31 chars, sem 0/O/1/I/L), formato `XXXX-XXXX-XX`; comparação sempre com `trim().toUpperCase()`.
- Zero dependência nova. Assets novos versionados no nome (`-v1`), nunca sobrescritos (armadilha de cache conhecida do projeto).
- Páginas novas que consultam banco: `export const dynamic = "force-dynamic"` (build do Railway sem rede de banco — incidente real).
- Testes de integração contra Postgres real (porta 54329; `npm run db:local` se precisar), dados prefixados, limpos no afterAll, sem tocar na semente. e2e nunca dispara chamada externa (LinkedIn só por assert de href).
- Commits frequentes, um por passo indicado.

---

### Task 1: Tabela `certificates` (schema + migração 0004)

**Files:**
- Modify: `lib/db/schema.ts` (tabela nova ao final, depois de `lessonProgress`)
- Create: `drizzle/0004_certificados.sql` (via `drizzle-kit generate --custom`)

**Interfaces:**
- Produces: tabela/objeto `certificates` com `{ id, userId, courseId, codigo (unique), emitidoEm }` e unique `(user_id, course_id)`. Tasks 2+ consomem.

- [ ] **Step 1: Schema**

Em `lib/db/schema.ts`, ao final:

```ts
/** Certificados de conclusão: um por aluno por formação, válido PARA SEMPRE
 *  (decisão do ciclo: a página pública não checa assinatura). `codigo` é a
 *  chave da URL pública — unique, alfabeto sem ambíguos, gerado em
 *  lib/plataforma/certificados.ts. */
export const certificates = pgTable("certificates", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  codigo: text("codigo").notNull().unique(),
  emitidoEm: timestamp("emitido_em", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("certificates_aluno_curso_unico").on(t.userId, t.courseId)]);
```

- [ ] **Step 2: Migração custom**

Run: `npx drizzle-kit generate --custom --name=certificados`

Conteúdo de `drizzle/0004_certificados.sql`:

```sql
CREATE TABLE "certificates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "course_id" uuid NOT NULL,
  "codigo" text NOT NULL,
  "emitido_em" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "certificates_codigo_unique" UNIQUE("codigo")
);--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "certificates_aluno_curso_unico" ON "certificates" ("user_id","course_id");
```

- [ ] **Step 3: Aplicar e verificar**

Run: `npm run db:migrar` (log deve mostrar `alvo: 127.0.0.1:54329` ou localhost — NUNCA host railway) e depois `npx tsc --noEmit`.
Expected: `migração ok`; sem erros de tipo.

- [ ] **Step 4: Commit**

```bash
git add lib/db/schema.ts drizzle/
git commit -m "feat: tabela certificates (migração 0004)"
```

---

### Task 2: Camada `lib/plataforma/certificados.ts` + gancho no gravarProgresso

**Files:**
- Create: `lib/plataforma/certificados.ts`
- Modify: `lib/plataforma/dados.ts` (final de `gravarProgresso`)
- Test: `lib/plataforma/certificados.test.ts`

**Interfaces:**
- Consumes: tabela `certificates` (Task 1); `gravarProgresso`/`derivarProgresso` existentes.
- Produces (Tasks 4-5 consomem exatamente isto):

```ts
export function gerarCodigo(): string; // "XXXX-XXXX-XX"
export async function emitirSeConcluido(userId: string, courseId: string): Promise<void>;
export async function buscarPorCodigo(codigoBruto: string): Promise<{
  codigo: string; emitidoEm: Date; alunoId: string; alunoNome: string;
  cursoTitulo: string; cursoSlug: string; cargaHoras: number;
} | null>;
export async function listarDoAluno(userId: string): Promise<Array<{ codigo: string; emitidoEm: Date; cursoTitulo: string }>>;
export async function doAlunoNoCurso(userId: string, courseId: string): Promise<{ codigo: string } | null>;
```

- [ ] **Step 1: Write the failing test**

`lib/plataforma/certificados.test.ts`:

```ts
import { eq, like } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { certificates, courses, lessons, modules, users } from "@/lib/db/schema";
import { gravarProgresso } from "./dados";
import { buscarPorCodigo, doAlunoNoCurso, emitirSeConcluido, gerarCodigo, listarDoAluno } from "./certificados";

const prefixo = `teste-cert-${Date.now()}`;

let aluno: { id: string };
let cursoId: string;
let cursoOcultoId: string;
let aula1: string;
let aula2: string;
let aulaOculta: string;

describe.skipIf(!process.env.DATABASE_URL)("certificados", () => {
  beforeAll(async () => {
    [aluno] = await db
      .insert(users)
      .values({ nome: "Aluno Certificado", email: `${prefixo}-aluno@teste.invalido`, senhaHash: "x" })
      .returning({ id: users.id });
    const [curso] = await db
      .insert(courses)
      .values({ slug: `${prefixo}-curso`, titulo: "Curso Cert", cargaHoras: "6", publicado: true })
      .returning({ id: courses.id });
    cursoId = curso.id;
    const [mod] = await db.insert(modules).values({ courseId: cursoId, titulo: "M1" }).returning({ id: modules.id });
    const [a1] = await db.insert(lessons).values({ moduleId: mod.id, slug: "a1", titulo: "A1", gratuita: true }).returning({ id: lessons.id });
    const [a2] = await db.insert(lessons).values({ moduleId: mod.id, slug: "a2", titulo: "A2" }).returning({ id: lessons.id });
    aula1 = a1.id;
    aula2 = a2.id;

    const [oculto] = await db
      .insert(courses)
      .values({ slug: `${prefixo}-oculto`, titulo: "Curso Oculto Cert", publicado: false })
      .returning({ id: courses.id });
    cursoOcultoId = oculto.id;
    const [modO] = await db.insert(modules).values({ courseId: cursoOcultoId, titulo: "M1" }).returning({ id: modules.id });
    const [aO] = await db.insert(lessons).values({ moduleId: modO.id, slug: "a1", titulo: "A1" }).returning({ id: lessons.id });
    aulaOculta = aO.id;
  });

  afterAll(async () => {
    await db.delete(users).where(like(users.email, `${prefixo}-%`)); // certificates/progresso caem por cascade
    await db.delete(courses).where(like(courses.slug, `${prefixo}-%`));
  });

  it("gerarCodigo: formato XXXX-XXXX-XX sem caracteres ambíguos", () => {
    for (let i = 0; i < 50; i++) {
      const c = gerarCodigo();
      expect(c).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{2}$/);
    }
  });

  it("99% não emite; fechar 100% via gravarProgresso emite; repetir não duplica", async () => {
    await gravarProgresso(aluno.id, aula1, { concluida: true });
    expect(await doAlunoNoCurso(aluno.id, cursoId)).toBeNull(); // 1 de 2

    await gravarProgresso(aluno.id, aula2, { concluida: true }); // fecha 100% → gancho emite
    const cert = await doAlunoNoCurso(aluno.id, cursoId);
    expect(cert).not.toBeNull();

    await gravarProgresso(aluno.id, aula2, { concluida: true }); // replay
    await emitirSeConcluido(aluno.id, cursoId); // chamada direta redundante
    const linhas = await db.select().from(certificates).where(eq(certificates.userId, aluno.id));
    expect(linhas).toHaveLength(1); // idempotente
  });

  it("buscarPorCodigo: devolve dados; normaliza minúsculas/espaços; inválido → null", async () => {
    const cert = await doAlunoNoCurso(aluno.id, cursoId);
    const achado = await buscarPorCodigo(`  ${cert!.codigo.toLowerCase()}  `);
    expect(achado).toMatchObject({
      alunoId: aluno.id,
      alunoNome: "Aluno Certificado",
      cursoTitulo: "Curso Cert",
      cargaHoras: 6,
    });
    expect(achado?.emitidoEm).toBeInstanceOf(Date);
    expect(await buscarPorCodigo("XXXX-XXXX-99")).toBeNull();
  });

  it("listarDoAluno devolve o certificado emitido", async () => {
    const lista = await listarDoAluno(aluno.id);
    expect(lista).toHaveLength(1);
    expect(lista[0].cursoTitulo).toBe("Curso Cert");
  });

  it("curso oculto não emite mesmo 100% concluído", async () => {
    await gravarProgresso(aluno.id, aulaOculta, { concluida: true });
    await emitirSeConcluido(aluno.id, cursoOcultoId);
    expect(await doAlunoNoCurso(aluno.id, cursoOcultoId)).toBeNull();
  });
});
```

Nota: `gravarProgresso` só grava se chamado — aqui o teste chama direto (a autorização `podeGravarProgresso` é da action, não desta função; padrão já usado em outros testes).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/plataforma/certificados.test.ts`
Expected: FAIL — módulo `./certificados` não existe.

- [ ] **Step 3: Implementação**

`lib/plataforma/certificados.ts`:

```ts
import "server-only";
import { randomBytes } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { certificates, courses, lessonProgress, lessons, modules, users } from "@/lib/db/schema";

/** Sem 0/O, 1/I/L — o código aparece impresso e é digitado por RH/recrutador. */
const ALFABETO = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** "XXXX-XXXX-XX": 10 chars úteis de um alfabeto de 31 (~49 bits) — chute de
 *  URL impraticável. O viés do módulo (256 % 31) é irrelevante aqui: o código
 *  precisa ser imprevisível e único, não uniforme perfeito. */
export function gerarCodigo(): string {
  const bytes = randomBytes(10);
  let s = "";
  for (let i = 0; i < 10; i++) s += ALFABETO[bytes[i] % ALFABETO.length];
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8)}`;
}

/** Emissão idempotente: só emite se o curso é publicado, tem aulas e TODAS
 *  estão concluídas pelo aluno. Chamada pelo gancho do gravarProgresso (ao
 *  fechar 100%) e pela página do curso (emissão preguiçosa — cobre quem
 *  concluiu antes deste ciclo existir, sem backfill). Válido para sempre:
 *  nenhuma checagem de assinatura aqui, por decisão do spec. */
export async function emitirSeConcluido(userId: string, courseId: string): Promise<void> {
  const [curso] = await db.select({ publicado: courses.publicado }).from(courses).where(eq(courses.id, courseId)).limit(1);
  if (!curso?.publicado) return;

  const aulas = await db
    .select({ id: lessons.id })
    .from(lessons)
    .innerJoin(modules, eq(modules.id, lessons.moduleId))
    .where(eq(modules.courseId, courseId));
  if (aulas.length === 0) return;

  const concluidas = await db
    .select({ lessonId: lessonProgress.lessonId })
    .from(lessonProgress)
    .where(and(
      eq(lessonProgress.userId, userId),
      eq(lessonProgress.concluida, true),
      inArray(lessonProgress.lessonId, aulas.map((a) => a.id)),
    ));
  if (concluidas.length < aulas.length) return;

  if (await doAlunoNoCurso(userId, courseId)) return;

  // 23505 pode ser colisão de codigo (re-gera) OU corrida no par aluno+curso
  // (outra request emitiu primeiro — também fim feliz). 3 tentativas bastam:
  // a chance de colisão dupla de código é astronômica.
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    try {
      await db.insert(certificates).values({ userId, courseId, codigo: gerarCodigo() });
      return;
    } catch (e: any) {
      const codigoPg = e?.code ?? e?.cause?.code;
      if (codigoPg !== "23505") throw e;
      if (await doAlunoNoCurso(userId, courseId)) return;
    }
  }
}

/** Página pública: normaliza o código digitado/colado antes de buscar.
 *  `alunoId` existe só para a página comparar com a sessão (botões do dono)
 *  — nunca é renderizado. */
export async function buscarPorCodigo(codigoBruto: string) {
  const codigo = codigoBruto.trim().toUpperCase();
  const [linha] = await db
    .select({
      codigo: certificates.codigo,
      emitidoEm: certificates.emitidoEm,
      alunoId: users.id,
      alunoNome: users.nome,
      cursoTitulo: courses.titulo,
      cursoSlug: courses.slug,
      cargaHoras: courses.cargaHoras,
    })
    .from(certificates)
    .innerJoin(users, eq(users.id, certificates.userId))
    .innerJoin(courses, eq(courses.id, certificates.courseId))
    .where(eq(certificates.codigo, codigo))
    .limit(1);
  return linha ? { ...linha, cargaHoras: Number(linha.cargaHoras) } : null;
}

export async function listarDoAluno(userId: string): Promise<Array<{ codigo: string; emitidoEm: Date; cursoTitulo: string }>> {
  return db
    .select({ codigo: certificates.codigo, emitidoEm: certificates.emitidoEm, cursoTitulo: courses.titulo })
    .from(certificates)
    .innerJoin(courses, eq(courses.id, certificates.courseId))
    .where(eq(certificates.userId, userId))
    .orderBy(desc(certificates.emitidoEm));
}

export async function doAlunoNoCurso(userId: string, courseId: string): Promise<{ codigo: string } | null> {
  const [linha] = await db
    .select({ codigo: certificates.codigo })
    .from(certificates)
    .where(and(eq(certificates.userId, userId), eq(certificates.courseId, courseId)))
    .limit(1);
  return linha ?? null;
}
```

Gancho em `lib/plataforma/dados.ts`, no FINAL de `gravarProgresso` (depois do upsert; import no topo: `import { emitirSeConcluido } from "./certificados";` — sem ciclo: certificados.ts não importa dados.ts):

```ts
  // Fechou 100%? A emissão do certificado mora na conclusão — idempotente,
  // e emitirSeConcluido re-verifica o critério inteiro (não confia no chamador).
  if (marcandoConcluida) {
    const [m] = await db
      .select({ courseId: modules.courseId })
      .from(lessons)
      .innerJoin(modules, eq(modules.id, lessons.moduleId))
      .where(eq(lessons.id, lessonId))
      .limit(1);
    if (m) await emitirSeConcluido(userId, m.courseId);
  }
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run lib/plataforma/certificados.test.ts && npm run test:unit`
Expected: PASS no arquivo novo e na suíte inteira (nenhuma regressão do gancho).

- [ ] **Step 5: Commit**

```bash
git add lib/plataforma/certificados.ts lib/plataforma/certificados.test.ts lib/plataforma/dados.ts
git commit -m "feat: emissão idempotente de certificados com gancho na conclusão"
```

---

### Task 3: Strings + imagem OG (still Remotion)

**Files:**
- Modify: `lib/content-plataforma.ts` (bloco novo `certificado`; bloco `conta` ganha 2 chaves)
- Create: `remotion/OgCertificado.tsx`
- Modify: `remotion/Root.tsx` (registro), `package.json` (script)
- Create (gerado): `public/plataforma/og-certificado-v1.jpg`

**Interfaces:**
- Produces: `plataforma.certificado.*` e `plataforma.conta.{certificados,semCertificados}` (Tasks 4-5 consomem); asset `/plataforma/og-certificado-v1.jpg`.

- [ ] **Step 1: Strings**

Em `lib/content-plataforma.ts` — bloco novo `certificado` antes de `assinar`:

```ts
certificado: {
  titulo: "Certificado de conclusão",
  emissor: "IAgentics Academy",
  concluiuA: "concluiu a formação",
  seloValido: "✓ Certificado válido",
  autenticidade: "Emitido por IAgentics Academy. Este endereço confirma a autenticidade do certificado.",
  cargaHoraria: "Carga horária",
  emitidoEm: "Emitido em",
  codigo: "Código de validação",
  adicionarLinkedin: "Adicionar ao LinkedIn",
  compartilharLinkedin: "Compartilhar no LinkedIn",
  imprimir: "Imprimir / salvar PDF",
  verCertificado: "Ver certificado",
  metaTitulo: (formacao: string) => `Certificado — ${formacao} · IAgentics Academy`,
  metaDescricao: (aluno: string, formacao: string) => `${aluno} concluiu a formação ${formacao} na IAgentics Academy.`,
},
```

No bloco `conta`, depois de `assinatura`:

```ts
certificados: "Certificados",
semCertificados: "Nenhum certificado ainda — conclua uma formação.",
```

- [ ] **Step 2: Composição still**

`remotion/OgCertificado.tsx` — 1200×630 estático, mesma linguagem do banner (rampa + véu + logo). Espelhe o uso de `Logo`/fontes de `remotion/BannerBoasVindas.tsx` (lá o logo e a fonte mono já funcionam no Remotion — copie o mecanismo, não reinvente):

```tsx
import { AbsoluteFill } from "remotion";
import { Logo } from "@/components/ui/Logo";
import { plataforma } from "@/lib/content-plataforma";

/** Still 1200×630 para OG da página de certificado. Estático de propósito
 *  (durationInFrames: 1) — é imagem, não vídeo. Rampa + véu idênticos ao
 *  banner do painel para a identidade fechar. */
export function OgCertificado() {
  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(115deg, var(--brand-violet), var(--brand-indigo), var(--brand-periwinkle), var(--brand-blue))",
        justifyContent: "center",
        padding: 96,
      }}
    >
      <AbsoluteFill style={{ background: "rgb(19 23 35 / 0.4)" }} />
      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 32, color: "var(--brand-paper)" }}>
        <div style={{ width: 320, color: "var(--brand-paper)" }}>
          <Logo />
        </div>
        <div style={{ fontFamily: "var(--font-mono, monospace)", textTransform: "uppercase", letterSpacing: "0.24em", fontSize: 22, opacity: 0.9 }}>
          {plataforma.nome}
        </div>
        <div style={{ fontSize: 76, fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          {plataforma.certificado.titulo}
        </div>
      </div>
    </AbsoluteFill>
  );
}
```

(Se `BannerBoasVindas` carrega fonte via `delayRender`/CSS próprio, replique o mesmo esquema aqui; ajuste `fontFamily` para o que o banner realmente usa.)

Registro em `remotion/Root.tsx`:

```tsx
<Composition id="og-certificado" component={OgCertificado} durationInFrames={1} fps={30} width={1200} height={630} />
```

Script em `package.json`:

```json
"video:still:og": "remotion still og-certificado public/plataforma/og-certificado-v1.jpg",
```

- [ ] **Step 3: Renderizar e verificar**

Run: `npm run video:still:og && ls -la public/plataforma/og-certificado-v1.jpg && npx tsc --noEmit`
Expected: arquivo gerado (< 400 KB; se maior, use `--jpeg-quality=80` no script), tipos ok.

- [ ] **Step 4: Commit**

```bash
git add lib/content-plataforma.ts remotion/OgCertificado.tsx remotion/Root.tsx package.json public/plataforma/og-certificado-v1.jpg
git commit -m "feat: strings do certificado e imagem OG (still Remotion)"
```

---

### Task 4: Página pública `/certificados/[codigo]`

**Files:**
- Create: `app/certificados/[codigo]/page.tsx`
- Create: `components/plataforma/BotaoImprimir.tsx`
- Modify: `app/globals.css` (bloco `@media print`)
- Test: `e2e/certificado.spec.ts` (primeiro teste: 404 forjado)

**Interfaces:**
- Consumes: `buscarPorCodigo` (Task 2); `plataforma.certificado.*` e OG asset (Task 3); `auth` de `@/auth`; `Logo` de `@/components/ui/Logo`.
- Produces: rota pública com botões condicionais ao dono. Task 5 linka para cá.

- [ ] **Step 1: e2e mínimo desta task (falhando)**

`e2e/certificado.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("código forjado dá 404", async ({ page }) => {
  const resposta = await page.goto("/certificados/XXXX-XXXX-99");
  expect(resposta?.status()).toBe(404);
});
```

Run: `npx playwright test e2e/certificado.spec.ts`
Expected: FAIL (rota não existe — hoje devolve 404 do Next, mas sem a página o teste... na verdade PASSA por acidente: o 404 genérico também é 404). Por isso o assert é complementado no Step 4 com o caminho feliz da Task 5. Rode mesmo assim para registrar o estado; o teste desta task é o build + tsc.

- [ ] **Step 2: Botão de imprimir (client mínimo)**

`components/plataforma/BotaoImprimir.tsx`:

```tsx
"use client";
import { plataforma } from "@/lib/content-plataforma";

export function BotaoImprimir() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-control border border-line-strong px-6 py-2.5 text-sm font-medium transition-colors hover:border-fg"
    >
      {plataforma.certificado.imprimir}
    </button>
  );
}
```

- [ ] **Step 3: Página**

`app/certificados/[codigo]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { Logo } from "@/components/ui/Logo";
import { BotaoImprimir } from "@/components/plataforma/BotaoImprimir";
import { plataforma } from "@/lib/content-plataforma";
import { buscarPorCodigo } from "@/lib/plataforma/certificados";

// Consulta banco por request; o build do Railway não alcança o banco (incidente
// documentado) — nunca prerenderizar.
export const dynamic = "force-dynamic";

const t = plataforma.certificado;

async function urlDaPagina(codigo: string): Promise<string> {
  // Origem da requisição: funciona em localhost e produção sem env nova.
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  return `${proto}://${host}/certificados/${codigo}`;
}

export async function generateMetadata({ params }: { params: Promise<{ codigo: string }> }): Promise<Metadata> {
  const { codigo } = await params;
  const cert = await buscarPorCodigo(decodeURIComponent(codigo));
  if (!cert) return { title: t.titulo };
  // og:image tem que ser ABSOLUTA (LinkedIn/scrapers ignoram relativa e o
  // projeto não define metadataBase) — deriva a origem da própria requisição.
  const h = await headers();
  const origem = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host") ?? "localhost:3000"}`;
  return {
    title: t.metaTitulo(cert.cursoTitulo),
    description: t.metaDescricao(cert.alunoNome, cert.cursoTitulo),
    openGraph: {
      title: t.metaTitulo(cert.cursoTitulo),
      description: t.metaDescricao(cert.alunoNome, cert.cursoTitulo),
      images: [`${origem}/plataforma/og-certificado-v1.jpg`],
    },
  };
}

export default async function PaginaCertificado({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const cert = await buscarPorCodigo(decodeURIComponent(codigo));
  if (!cert) notFound();

  const sessao = await auth();
  const dono = sessao?.user?.id === cert.alunoId;
  const url = await urlDaPagina(cert.codigo);

  const dataEmissao = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(cert.emitidoEm);
  const emitido = new Date(cert.emitidoEm);

  const addLinkedin = `https://www.linkedin.com/profile/add?${new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: cert.cursoTitulo,
    organizationName: "IAgentics",
    issueYear: String(emitido.getFullYear()),
    issueMonth: String(emitido.getMonth() + 1),
    certUrl: url,
    certId: cert.codigo,
  }).toString()}`;
  const shareLinkedin = `https://www.linkedin.com/sharing/share-offsite/?${new URLSearchParams({ url }).toString()}`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-12 print:p-0">
      <div className="w-full max-w-3xl">
        <article className="hero-editorial relative border border-line p-8 sm:p-12">
          <div className="relative z-10 flex flex-col gap-8">
            <div className="flex items-center justify-between gap-6">
              <span aria-hidden className="w-[140px] text-fg">
                <Logo />
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.emissor}</span>
            </div>

            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-accent-text">{t.titulo}</p>
              <h1 className="mt-4 text-4xl font-medium leading-tight tracking-[-0.03em] text-fg sm:text-5xl">
                {cert.alunoNome}
              </h1>
              <p className="mt-3 text-fg-muted">
                {t.concluiuA} <span className="text-fg">{cert.cursoTitulo}</span>
              </p>
            </div>

            <dl className="grid grid-cols-1 gap-4 border-t border-line pt-6 sm:grid-cols-3">
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">{t.cargaHoraria}</dt>
                <dd className="mt-1 text-fg">{cert.cargaHoras}{plataforma.painel.horas}</dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">{t.emitidoEm}</dt>
                <dd className="mt-1 text-fg">{dataEmissao}</dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">{t.codigo}</dt>
                <dd className="mt-1 font-mono text-fg">{cert.codigo}</dd>
              </div>
            </dl>

            <p className="border-t border-line pt-6 text-sm text-fg-muted">
              <span className="font-medium text-accent-text">{t.seloValido}</span> — {t.autenticidade}
            </p>
          </div>
        </article>

        {dono ? (
          <div className="no-print mt-6 flex flex-wrap items-center gap-3">
            <a
              href={addLinkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-control bg-accent px-6 py-2.5 text-sm font-medium text-accent-on transition-colors hover:bg-accent-hover"
            >
              {t.adicionarLinkedin}
            </a>
            <a
              href={shareLinkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-control border border-line-strong px-6 py-2.5 text-sm font-medium transition-colors hover:border-fg"
            >
              {t.compartilharLinkedin}
            </a>
            <BotaoImprimir />
          </div>
        ) : null}
      </div>
    </main>
  );
}
```

- [ ] **Step 4: CSS de impressão**

Em `app/globals.css`, junto do bloco do redesign:

```css
/* Impressão do certificado: só o documento, sem botões — "salvar PDF" é o
   imprimir do navegador (decisão do spec: sem PDF no servidor). */
@media print {
  .no-print {
    display: none !important;
  }
}
```

- [ ] **Step 5: Verificar**

Run: `npx tsc --noEmit && npm run build && npx playwright test e2e/certificado.spec.ts`
Expected: tudo verde (o build prova o `force-dynamic`; o e2e do 404 passa).

- [ ] **Step 6: Commit**

```bash
git add "app/certificados" components/plataforma/BotaoImprimir.tsx app/globals.css e2e/certificado.spec.ts
git commit -m "feat: página pública do certificado com validação e LinkedIn"
```

---

### Task 5: Encaixes (curso + conta) e e2e do fluxo completo

**Files:**
- Modify: `app/app/curso/[slug]/page.tsx` (selo → botão "Ver certificado" + emissão preguiçosa)
- Modify: `app/app/conta/page.tsx` (seção Certificados)
- Test: `e2e/certificado.spec.ts` (teste do fluxo completo)

**Interfaces:**
- Consumes: `emitirSeConcluido`, `doAlunoNoCurso`, `listarDoAluno` (Task 2); página `/certificados/[codigo]` (Task 4); `plataforma.certificado.verCertificado`, `plataforma.conta.{certificados,semCertificados}` (Task 3).

- [ ] **Step 1: e2e do fluxo completo (falhando)**

Adicionar em `e2e/certificado.spec.ts` (o arranjo copia o padrão de `e2e/painel.spec.ts`: helper `criarConta`, promoção a admin via `scripts/promover-admin.mjs`, liberação de acesso pela UI em contexto separado, loop de conclusão pelas 8 aulas):

```ts
import { execSync } from "node:child_process";
import { type Page } from "@playwright/test";

const senha = "Senha-e2e-123!";

async function criarConta(page: Page, contaEmail: string, nome: string) {
  await page.goto("/app/criar-conta");
  await page.getByLabel("Nome").fill(nome);
  await page.getByLabel("E-mail").fill(contaEmail);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/app$/);
}

test("fluxo completo: concluir formação → certificado público, LinkedIn e conta", async ({ browser }) => {
  const emailAdmin = `e2e-cert-adm-${Date.now()}@teste.invalido`;
  const emailAluno = `e2e-cert-aluno-${Date.now()}@teste.invalido`;

  const contextoAdmin = await browser.newContext();
  const paginaAdmin = await contextoAdmin.newPage();
  await criarConta(paginaAdmin, emailAdmin, "Admin Cert E2E");
  execSync(`node scripts/promover-admin.mjs ${emailAdmin}`, { stdio: "pipe" });

  const contextoAluno = await browser.newContext();
  const paginaAluno = await contextoAluno.newPage();
  await criarConta(paginaAluno, emailAluno, "Aluno Cert E2E");

  await paginaAdmin.goto("/admin/alunos");
  await paginaAdmin.getByLabel("Buscar por nome ou e-mail").fill(emailAluno);
  await paginaAdmin.getByRole("button", { name: "Buscar" }).click();
  await paginaAdmin.getByRole("row").filter({ hasText: emailAluno }).getByRole("link").click();
  await paginaAdmin.getByRole("button", { name: "Liberar acesso" }).click();
  await expect(paginaAdmin.getByText("Acesso liberado.")).toBeVisible();

  await paginaAluno.goto("/app/curso/fundamentos-ia-copilot/boas-vindas");
  for (let i = 0; i < 10; i++) {
    await paginaAluno.getByRole("button", { name: "Marcar como concluída" }).click();
    const proxima = paginaAluno.getByRole("link", { name: "Próxima aula" });
    const semProxima = paginaAluno.getByText("Aula concluída", { exact: true });
    await expect(proxima.or(semProxima)).toBeVisible();
    if (await proxima.isVisible()) {
      await proxima.click();
    } else {
      await paginaAluno.reload();
      await expect(semProxima).toBeVisible();
      break;
    }
  }

  // Curso concluído → botão Ver certificado (a emissão aconteceu no gancho
  // da última conclusão; o botão da página do curso a confirma).
  await paginaAluno.goto("/app/curso/fundamentos-ia-copilot");
  await paginaAluno.getByRole("link", { name: "Ver certificado" }).click();
  await expect(paginaAluno).toHaveURL(/\/certificados\//);
  await expect(paginaAluno.getByRole("heading", { name: "Aluno Cert E2E" })).toBeVisible();
  await expect(paginaAluno.getByText("Fundamentos de IA com Copilot")).toBeVisible();
  await expect(paginaAluno.getByText("✓ Certificado válido")).toBeVisible();

  // Dono vê os botões; o href do LinkedIn carrega certUrl e certId.
  const urlCertificado = paginaAluno.url();
  const addLi = paginaAluno.getByRole("link", { name: "Adicionar ao LinkedIn" });
  await expect(addLi).toBeVisible();
  const href = (await addLi.getAttribute("href")) ?? "";
  expect(href).toContain("certUrl=");
  expect(href).toContain("certId=");
  expect(href).toContain(encodeURIComponent(urlCertificado));

  // Visitante deslogado: mesma URL continua válida (para sempre), sem botões.
  const contextoVisitante = await browser.newContext();
  const paginaVisitante = await contextoVisitante.newPage();
  await paginaVisitante.goto(urlCertificado);
  await expect(paginaVisitante.getByText("✓ Certificado válido")).toBeVisible();
  await expect(paginaVisitante.getByRole("link", { name: "Adicionar ao LinkedIn" })).toHaveCount(0);

  // Conta lista o certificado.
  await paginaAluno.goto("/app/conta");
  await expect(paginaAluno.getByText("Certificados", { exact: true })).toBeVisible();
  await expect(paginaAluno.getByRole("link", { name: "Ver certificado" })).toBeVisible();

  await contextoVisitante.close();
  await contextoAluno.close();
  await contextoAdmin.close();
});
```

Run: `npx playwright test e2e/certificado.spec.ts`
Expected: FAIL — "Ver certificado" não existe na página do curso.

- [ ] **Step 2: Página do curso**

Em `app/app/curso/[slug]/page.tsx`:

1. Import: `import { doAlunoNoCurso, emitirSeConcluido } from "@/lib/plataforma/certificados";`
2. Depois do cálculo de `proxima` (linha ~30), a emissão preguiçosa + busca:

```ts
// Emissão preguiçosa: quem concluiu antes do ciclo de certificados existir
// ganha o certificado ao abrir o curso (sem backfill). Idempotente.
let certificado: { codigo: string } | null = null;
if (progresso.total > 0 && progresso.pct === 100) {
  await emitirSeConcluido(userId, curso.id);
  certificado = await doAlunoNoCurso(userId, curso.id);
}
```

3. No hero, o bloco do selo (linhas ~65-69) vira:

```tsx
{!proxima && aulaIds.length > 0 ? (
  certificado ? (
    <Link
      href={`/certificados/${certificado.codigo}`}
      className="rounded-control bg-accent px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-accent-on transition-colors hover:bg-accent-hover"
    >
      {plataforma.certificado.verCertificado}
    </Link>
  ) : (
    <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-text">
      {plataforma.painel.cursoConcluido}
    </span>
  )
) : null}
```

(O comentário existente "É o ponto de encaixe do botão Ver certificado do ciclo 2" sai — o encaixe foi ocupado; o comentário do M1 sobre curso vazio fica.)

- [ ] **Step 3: Conta**

Em `app/app/conta/page.tsx`:

1. Imports: `import Link from "next/link";` e `import { listarDoAluno } from "@/lib/plataforma/certificados";` e `import { plataforma } from ...` (já existe).
2. Buscar junto: trocar o `Promise.all` para incluir `listarDoAluno(userId)`:

```ts
const [usuario, status, certificados] = await Promise.all([
  buscarUsuario(userId),
  buscarAssinatura(userId),
  listarDoAluno(userId),
]);
```

3. Seção nova antes da seção de assinatura:

```tsx
<section className="flex flex-col gap-3 border-t border-line pt-8">
  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.certificados}</p>
  {certificados.length === 0 ? (
    <p className="text-sm text-fg-muted">{t.semCertificados}</p>
  ) : (
    <ul className="flex flex-col gap-2">
      {certificados.map((c) => (
        <li key={c.codigo} className="flex items-center justify-between gap-4">
          <span className="min-w-0 truncate text-fg">{c.cursoTitulo}</span>
          <Link
            href={`/certificados/${c.codigo}`}
            className="shrink-0 text-sm text-accent-text underline-offset-4 hover:underline"
          >
            {plataforma.certificado.verCertificado}
          </Link>
        </li>
      ))}
    </ul>
  )}
</section>
```

- [ ] **Step 4: Run tests**

Run: `npx playwright test e2e/certificado.spec.ts e2e/conta.spec.ts e2e/curso.spec.ts && npm run test:unit && npx tsc --noEmit`
Expected: PASS em tudo (lembre do `npm run build` antes do e2e se o `.next` estiver velho — o playwright serve build de produção).

- [ ] **Step 5: Commit**

```bash
git add "app/app/curso/[slug]/page.tsx" app/app/conta/page.tsx e2e/certificado.spec.ts
git commit -m "feat: Ver certificado no curso e lista na conta (emissão preguiçosa)"
```

---

### Task 6: Entrega (manual — controlador + Rodrigo)

Sem subagente. Pré-requisito: suíte inteira verde e branch integrada (superpowers:finishing-a-development-branch).

- [ ] Suíte completa: `npm run test:unit && npm run test:e2e` + `npm run build`.
- [ ] Merge na `main` e push.
- [ ] Migração 0004 em produção: deploy primeiro (imagem nova carrega drizzle/0004), depois `railway ssh --service IAgentics -- node scripts/migrar.mjs` (conferir `alvo: postgres.railway.internal`). No intervalo deploy→migração, a página `/certificados/...` daria erro de tabela — janela de minutos, sem tráfego (nenhum link público existe ainda).
- [ ] Deploy: `bash scripts/deploy-railway.sh` até SUCCESS.
- [ ] Smoke: `/certificados/XXXX-XXXX-99` → 404; Rodrigo abre o curso concluído logado → certificado retroativo emite e a página pública abre; testar o botão "Adicionar ao LinkedIn" de verdade (leva ao formulário de Licenças e certificados pré-preenchido).
