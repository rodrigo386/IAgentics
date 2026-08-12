# Redesign editorial da plataforma — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar a área do aluno em acervo editorial: painel com hero "continue de onde parou" + trilhos horizontais por estado, curso com hero de largura total e barra de progresso, aula com índice lateral sticky com marcador — sem dependência nova e sem migração.

**Architecture:** Server Components + CSS puro do design system. Única adição de dados: `buscarUltimaAula(userId)`. As páginas existentes são re-compostas (o esqueleto de duas colunas da aula já existe); `CardCurso` e `IndiceCurso` são reaproveitados (o índice ganha modo `lateral`).

**Tech Stack:** Next.js 15 App Router, Tailwind v4 + tokens de `app/globals.css`, Drizzle (leitura), vitest (integração, Postgres real), Playwright (e2e).

**Spec:** `docs/superpowers/specs/2026-08-12-redesign-editorial-plataforma-design.md`

## Global Constraints

- pt-BR em toda string visível; nunca "PMEs". Strings da plataforma só em `lib/content-plataforma.ts` — nenhuma string visível em componente.
- Design system: violeta `#7607E8` só preenchimento (tokens `bg-accent`/`text-accent-on`/`text-accent-text`); superfícies radius 0; controles `rounded-control` (pill); tokens `bg-bg`, `bg-surface`, `border-line`, `border-line-strong`, `text-fg`, `text-fg-muted`. **Sem modo teatro**: tudo funciona nos temas claro e escuro via tokens.
- **Zero dependência nova, zero migração.** Motion só CSS (`hover`/`focus`/transition), respeitando `prefers-reduced-motion` (o projeto já tem o padrão global).
- Testes de integração (vitest) contra o Postgres real de `DATABASE_URL` (embedded local porta 54329; `npm run db:local` se precisar). Dados de teste com prefixo próprio, limpos no `afterAll`, nunca tocando na semente (curso `fundamentos-ia-copilot` e os 8 irmãos).
- Trilhos: rolagem nativa (`overflow-x: auto` + `scroll-snap`), sem setas no v1; fade na borda direita.
- Trilho "Formações" mostra o catálogo completo com aulas, incluindo cursos que também aparecem em "Em andamento"/"Concluídos" (repetição intencional). Um trilho só aparece se tiver conteúdo.
- `data-testid="card-curso"` continua nos cards (os e2e contam por ele).
- Rotas de `/app` já são dinâmicas (layout `force-dynamic`) — nada de consulta a banco em build.
- Commits frequentes, um por passo de commit indicado.

---

### Task 1: `buscarUltimaAula` (camada de dados)

**Files:**
- Modify: `lib/plataforma/dados.ts` (nova função, depois de `buscarConcluidas`)
- Test: `lib/plataforma/autorizacao.test.ts`

**Interfaces:**
- Consumes: tabelas `lesson_progress → lessons → modules → courses` (existentes).
- Produces: `buscarUltimaAula(userId: string): Promise<{ cursoSlug: string } | null>` — curso da linha mais recente de `lesson_progress` (por `updated_at`), só cursos publicados. Task 3 consome.

- [ ] **Step 1: Write the failing test**

Em `lib/plataforma/autorizacao.test.ts`: adicionar `buscarUltimaAula` ao import de `./dados`, `lessonProgress` ao import do schema, e declarar junto dos outros `let`:

```ts
// Redesign editorial: buscarUltimaAula alimenta o hero do painel.
let userUltimaAula: { id: string };
let cursoRecenteSlug: string;
```

No `beforeAll` (depois dos blocos existentes — os cursos de teste são publicados de propósito e removidos no afterAll; o vitest roda com fileParallelism:false e o e2e roda em comando separado, então não há corrida com painel.spec):

```ts
[userUltimaAula] = await db
  .insert(users)
  .values({ nome: "Teste ultima aula", email: `${prefixo}-ultima@teste.invalido`, senhaHash: "x" })
  .returning({ id: users.id });
const [cursoAntigo] = await db
  .insert(courses)
  .values({ slug: `${prefixo}-curso-antigo`, titulo: "Curso antigo", publicado: true })
  .returning({ id: courses.id });
const [cursoRecente] = await db
  .insert(courses)
  .values({ slug: `${prefixo}-curso-recente`, titulo: "Curso recente", publicado: true })
  .returning({ id: courses.id, slug: courses.slug });
cursoRecenteSlug = cursoRecente.slug;
const [modAntigo] = await db.insert(modules).values({ courseId: cursoAntigo.id, titulo: "M1" }).returning({ id: modules.id });
const [modRecente] = await db.insert(modules).values({ courseId: cursoRecente.id, titulo: "M1" }).returning({ id: modules.id });
const [aulaAntiga] = await db
  .insert(lessons)
  .values({ moduleId: modAntigo.id, slug: "a1", titulo: "A1" })
  .returning({ id: lessons.id });
const [aulaRecente] = await db
  .insert(lessons)
  .values({ moduleId: modRecente.id, slug: "a1", titulo: "A1" })
  .returning({ id: lessons.id });
// updatedAt explícitos e bem separados — mesma razão dos createdAt de assinatura.
await db.insert(lessonProgress).values([
  { userId: userUltimaAula.id, lessonId: aulaAntiga.id, segundosAssistidos: 30, updatedAt: new Date("2020-01-01T00:00:00Z") },
  { userId: userUltimaAula.id, lessonId: aulaRecente.id, segundosAssistidos: 10, updatedAt: new Date("2020-06-01T00:00:00Z") },
]);
```

O `afterAll` existente já apaga users por prefixo (progresso cai por cascade) — adicionar a limpeza dos cursos, na mesma linha dos deletes existentes de curso de teste:

```ts
await db.delete(courses).where(like(courses.slug, `${prefixo}-%`));
```

(Confira se o afterAll já tem um delete de courses por prefixo — o curso oculto de outros testes usa o mesmo padrão; se já cobre `${prefixo}-%`, não duplique.)

Testes novos:

```ts
it("buscarUltimaAula: sem progresso devolve null", async () => {
  expect(await buscarUltimaAula(userSemAssinatura.id)).toBeNull();
});

it("buscarUltimaAula: devolve o curso da linha mais recente por updated_at", async () => {
  expect(await buscarUltimaAula(userUltimaAula.id)).toEqual({ cursoSlug: cursoRecenteSlug });
});

it("buscarUltimaAula: progresso só em curso oculto devolve null", async () => {
  // aulaOculta já existe no arranjo deste arquivo (curso publicado=false)
  await db.insert(lessonProgress).values({ userId: userSemAssinatura.id, lessonId: aulaOculta.id, segundosAssistidos: 5 });
  expect(await buscarUltimaAula(userSemAssinatura.id)).toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/plataforma/autorizacao.test.ts`
Expected: FAIL — `buscarUltimaAula` não existe no módulo.

- [ ] **Step 3: Write minimal implementation**

Em `lib/plataforma/dados.ts`, depois de `buscarConcluidas` (imports `and`, `desc`, `eq` já existem no arquivo):

```ts
/** Curso da última atividade do aluno (linha mais recente de lesson_progress
 *  por updated_at, só cursos publicados). O painel usa para escolher o hero
 *  "continue de onde parou"; a aula-alvo vem de proximaAula() na página —
 *  devolver aula/título daqui duplicaria essa lógica. */
export async function buscarUltimaAula(userId: string): Promise<{ cursoSlug: string } | null> {
  const [linha] = await db
    .select({ cursoSlug: courses.slug })
    .from(lessonProgress)
    .innerJoin(lessons, eq(lessons.id, lessonProgress.lessonId))
    .innerJoin(modules, eq(modules.id, lessons.moduleId))
    .innerJoin(courses, eq(courses.id, modules.courseId))
    .where(and(eq(lessonProgress.userId, userId), eq(courses.publicado, true)))
    .orderBy(desc(lessonProgress.updatedAt))
    .limit(1);
  return linha ?? null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/plataforma/autorizacao.test.ts`
Expected: PASS (todos, incluindo os 3 novos).

- [ ] **Step 5: Commit**

```bash
git add lib/plataforma/dados.ts lib/plataforma/autorizacao.test.ts
git commit -m "feat: buscarUltimaAula para o hero do painel editorial"
```

---

### Task 2: Fundação visual (CSS dos trilhos/hero) + strings novas

**Files:**
- Modify: `app/globals.css` (final do arquivo)
- Modify: `lib/content-plataforma.ts` (blocos `painel` e `aula`)

**Interfaces:**
- Produces: classes CSS `.trilho` e `.hero-editorial`; strings `plataforma.painel.{emAndamento,formacoes,concluidos,emGravacao,continuarAula,boasVindas,boasVindasTexto,cursoConcluido}` e `plataforma.aula.aulaDe`. Tasks 3–5 consomem. (O rótulo do CTA de boas-vindas reusa `plataforma.curso.comecar` — "Começar o curso" — sem duplicar string.)

- [ ] **Step 1: CSS**

Ao final de `app/globals.css`:

```css
/* ---- Redesign editorial da plataforma ---- */
/* Trilho horizontal: rolagem nativa com snap; o fade fixo na borda direita
   sinaliza continuação (decisão do spec: sem setas no v1 — trackpad/touch). */
.trilho {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  scroll-snap-type: x proximity;
  scrollbar-width: none;
  mask-image: linear-gradient(90deg, #000 calc(100% - 48px), transparent);
  -webkit-mask-image: linear-gradient(90deg, #000 calc(100% - 48px), transparent);
}
.trilho::-webkit-scrollbar {
  display: none;
}
.trilho > * {
  flex: 0 0 auto;
  scroll-snap-align: start;
}
/* Hero editorial: véu radial de violeta sobre a superfície do tema — parte dos
   tokens (--accent/--surface), então funciona no claro e no escuro sem fundo fixo. */
.hero-editorial {
  background:
    radial-gradient(120% 180% at 85% -20%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 55%),
    var(--surface);
}
```

- [ ] **Step 2: Strings**

Em `lib/content-plataforma.ts`, bloco `painel` — adicionar depois de `ctaAssinar` (mantendo `continuar`, `catalogo`, `seloAssine`, `horas` como estão):

```ts
/* Redesign editorial: trilhos por estado do aluno + hero. */
emAndamento: "Em andamento",
formacoes: "Formações",
concluidos: "Concluídos",
emGravacao: "Em gravação",
continuarAula: (titulo: string) => `Continuar: ${titulo}`,
boasVindas: "Bem-vindo à Academy",
boasVindasTexto: "Escolha uma formação e comece agora — seu progresso fica salvo aqui.",
cursoConcluido: "Curso concluído",
```

Bloco `aula` — adicionar depois de `aulasDoCurso`:

```ts
aulaDe: (x: number, y: number) => `Aula ${x} de ${y}`,
```

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit && npm run build`
Expected: sem erros (CSS e strings ainda não usados — fundação pura).

- [ ] **Step 4: Commit**

```bash
git add app/globals.css lib/content-plataforma.ts
git commit -m "feat: fundação visual do redesign (trilho, hero-editorial, strings)"
```

---

### Task 3: Painel editorial (hero + trilhos)

**Files:**
- Modify: `app/app/page.tsx` (reescrita do corpo)
- Test: `e2e/painel.spec.ts` (reescrita)

**Interfaces:**
- Consumes: `buscarUltimaAula` (Task 1); `.trilho`/`.hero-editorial` e strings (Task 2); `CardCurso`, `derivarProgresso`, `proximaAula`, `buscarCatalogo`, `buscarConcluidas`, `temAcesso`, `destinoCta` (existentes).
- Produces: painel com hero + 4 trilhos. Nenhuma task posterior depende dele.

- [ ] **Step 1: Write the failing e2e test**

Substituir `e2e/painel.spec.ts` inteiro por:

```ts
import { test, expect } from "@playwright/test";

const email = `e2e-painel-${Date.now()}@teste.invalido`;
const senha = "Senha-e2e-123!";

/**
 * Painel editorial: hero + trilhos por estado do aluno.
 * Aluno novo: hero de boas-vindas; trilhos Formações (1 curso com aulas na
 * semente) e Em gravação (8 cascas) => exatamente 9 cards.
 * Após concluir uma aula: hero vira "Continuar:" e o trilho Em andamento
 * aparece (o curso repete em Formações — repetição intencional do spec).
 */
test("painel editorial: boas-vindas, trilhos e hero de continuar", async ({ page }) => {
  await page.goto("/app/criar-conta");
  await page.getByLabel("Nome").fill("Aluno Painel");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/app$/);

  // Aluno novo: hero de boas-vindas com CTA para a primeira formação com aulas.
  await expect(page.getByText("Bem-vindo à Academy")).toBeVisible();
  await expect(page.getByRole("link", { name: "Começar o curso" })).toBeVisible();

  // Trilhos: rótulos e contagem exata (1 formação com aulas + 8 em gravação).
  await expect(page.getByText("Formações", { exact: true })).toBeVisible();
  await expect(page.getByText("Em gravação", { exact: true })).toBeVisible();
  await expect(page.getByTestId("card-curso")).toHaveCount(9);

  // Capas carregam de verdade (rola até cada card antes de medir — lazy).
  const cards = page.getByTestId("card-curso");
  for (let i = 0; i < 9; i++) {
    await cards.nth(i).scrollIntoViewIfNeeded();
    await expect
      .poll(async () =>
        cards.nth(i).locator("img").evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0),
      )
      .toBe(true);
  }

  // Conclui a aula gratuita e volta ao painel.
  await page.goto("/app/curso/fundamentos-ia-copilot/boas-vindas");
  await page.getByRole("button", { name: "Marcar como concluída" }).click();
  await expect(page.getByRole("link", { name: "Próxima aula" })).toBeVisible();

  await page.goto("/app");
  await expect(page.getByRole("link", { name: /^Continuar:/ })).toBeVisible();
  await expect(page.getByText("Em andamento", { exact: true })).toBeVisible();
  // Curso em andamento repete em Formações: 10 cards agora.
  await expect(page.getByTestId("card-curso")).toHaveCount(10);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test e2e/painel.spec.ts`
Expected: FAIL — hero de boas-vindas não existe ainda.

- [ ] **Step 3: Reescrever o painel**

`app/app/page.tsx` — substituir o componente inteiro (imports: adicionar `buscarUltimaAula` ao import de dados; manter os demais):

```tsx
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CardCurso } from "@/components/plataforma/CardCurso";
import { plataforma } from "@/lib/content-plataforma";
import { destinoCta } from "@/lib/admin/configuracoes";
import {
  buscarCatalogo,
  buscarConcluidas,
  buscarCurso,
  buscarUltimaAula,
  temAcesso as verificarAcesso,
} from "@/lib/plataforma/dados";
import { derivarProgresso, proximaAula } from "@/lib/plataforma/progresso";
import type { Aula, Curso } from "@/lib/plataforma/tipos";

type InfoCurso = { pct: number; feitas: number; total: number; proxima: Aula | null };

/** Trilho horizontal do painel: rótulo mono + cards de largura fixa. Só
 *  renderiza se houver conteúdo (regra do spec). */
function Trilho({
  titulo,
  cursos,
  info,
  temAcesso,
  esmaecido = false,
}: {
  titulo: string;
  cursos: Curso[];
  info: Map<string, InfoCurso>;
  temAcesso: boolean;
  esmaecido?: boolean;
}) {
  if (cursos.length === 0) return null;
  return (
    <section className="mb-12">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{titulo}</p>
      <div className={`trilho mt-5 ${esmaecido ? "opacity-60" : ""}`}>
        {cursos.map((curso) => (
          <div key={curso.id} className="w-[220px] sm:w-[240px]">
            <CardCurso curso={curso} pct={info.get(curso.slug)?.pct ?? 0} temAcesso={temAcesso} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function Painel() {
  const sessao = await auth();
  // O middleware já barra /app sem sessão; defesa em profundidade, como antes.
  if (!sessao?.user?.id) redirect("/app/entrar");
  const userId = sessao.user.id;

  const [catalogo, concluidas, temAcesso, destino, ultima] = await Promise.all([
    buscarCatalogo(),
    buscarConcluidas(userId),
    verificarAcesso(userId),
    destinoCta(),
    buscarUltimaAula(userId),
  ]);

  const indices = await Promise.all(catalogo.map((c) => buscarCurso(c.slug)));
  const info = new Map<string, InfoCurso>();
  for (const indice of indices) {
    if (!indice) continue;
    const aulaIds = indice.modulos.flatMap((m) => m.aulas.map((a) => a.id));
    const progresso = derivarProgresso(aulaIds, concluidas);
    info.set(indice.slug, { ...progresso, proxima: proximaAula(indice.modulos, concluidas) });
  }

  // Hero "continuar": curso da última atividade, se ainda tem próxima aula;
  // senão o de maior progresso em (0,100); senão boas-vindas.
  let heroCurso = ultima ? catalogo.find((c) => c.slug === ultima.cursoSlug) : undefined;
  if (!heroCurso || !info.get(heroCurso.slug)?.proxima) {
    heroCurso = undefined;
    for (const curso of catalogo) {
      const i = info.get(curso.slug);
      if (i?.proxima && i.pct > 0 && i.pct < 100) {
        if (!heroCurso || i.pct > (info.get(heroCurso.slug)?.pct ?? 0)) heroCurso = curso;
      }
    }
  }
  const heroInfo = heroCurso ? info.get(heroCurso.slug) : undefined;
  // Boas-vindas: primeira formação com aulas; sem nenhuma, a primeira do catálogo.
  const boasVindas = catalogo.find((c) => (info.get(c.slug)?.total ?? 0) > 0) ?? catalogo[0];

  const porEstado = (f: (i: InfoCurso) => boolean) => catalogo.filter((c) => {
    const i = info.get(c.slug);
    return i ? f(i) : false;
  });
  const emAndamento = porEstado((i) => i.total > 0 && i.pct > 0 && i.pct < 100);
  const formacoes = porEstado((i) => i.total > 0);
  const concluidos = porEstado((i) => i.total > 0 && i.pct === 100);
  const emGravacao = porEstado((i) => i.total === 0);

  const t = plataforma.painel;

  return (
    <div>
      <h1 className="sr-only">{plataforma.shell.meusCursos}</h1>

      {heroCurso && heroInfo?.proxima ? (
        <section className="hero-editorial mb-12 border border-line">
          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:gap-10 sm:p-8">
            <Link
              href={`/app/curso/${heroCurso.slug}`}
              className="relative aspect-[3/4] w-full max-w-[200px] shrink-0 overflow-hidden border border-line"
            >
              <Image
                src={heroCurso.capaUrl}
                alt=""
                fill
                sizes="200px"
                style={{ objectPosition: "center top" }}
                className="object-cover"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent-text">{t.continuar}</p>
              <h2 className="mt-3 text-2xl font-medium leading-tight tracking-[-0.03em] text-fg sm:text-4xl">
                {heroCurso.titulo}
              </h2>
              <p className="mt-2 text-sm text-fg-muted">
                {plataforma.curso.concluidaDe(heroInfo.feitas, heroInfo.total)}
              </p>
              <div className="mt-5 h-1 w-full max-w-[360px] bg-line">
                <div className="h-full bg-accent" style={{ width: `${heroInfo.pct}%` }} />
              </div>
              <Link
                href={`/app/curso/${heroCurso.slug}/${heroInfo.proxima.slug}`}
                className="mt-6 inline-block max-w-full truncate rounded-control bg-accent px-7 py-3 font-medium text-accent-on transition-colors hover:bg-accent-hover"
              >
                {t.continuarAula(heroInfo.proxima.titulo)}
              </Link>
            </div>
          </div>
        </section>
      ) : boasVindas ? (
        <section className="hero-editorial mb-12 border border-line">
          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:gap-10 sm:p-8">
            <Link
              href={`/app/curso/${boasVindas.slug}`}
              className="relative aspect-[3/4] w-full max-w-[200px] shrink-0 overflow-hidden border border-line"
            >
              <Image
                src={boasVindas.capaUrl}
                alt=""
                fill
                sizes="200px"
                style={{ objectPosition: "center top" }}
                className="object-cover"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent-text">{t.boasVindas}</p>
              <h2 className="mt-3 text-2xl font-medium leading-tight tracking-[-0.03em] text-fg sm:text-4xl">
                {boasVindas.titulo}
              </h2>
              <p className="mt-2 max-w-[55ch] text-sm text-fg-muted">{t.boasVindasTexto}</p>
              <Link
                href={`/app/curso/${boasVindas.slug}`}
                className="mt-6 inline-block rounded-control bg-accent px-7 py-3 font-medium text-accent-on transition-colors hover:bg-accent-hover"
              >
                {plataforma.curso.comecar}
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {!temAcesso ? (
        <section className="mb-10 flex flex-col items-start gap-4 border border-line bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-fg">{t.seloAssine}</p>
          <a
            href={destino}
            className="rounded-control bg-accent px-6 py-2.5 text-sm font-medium text-accent-on transition-colors hover:bg-accent-hover"
          >
            {t.ctaAssinar}
          </a>
        </section>
      ) : null}

      <Trilho titulo={t.emAndamento} cursos={emAndamento} info={info} temAcesso={temAcesso} />
      <Trilho titulo={t.formacoes} cursos={formacoes} info={info} temAcesso={temAcesso} />
      <Trilho titulo={t.concluidos} cursos={concluidos} info={info} temAcesso={temAcesso} />
      <Trilho titulo={t.emGravacao} cursos={emGravacao} info={info} temAcesso={temAcesso} esmaecido />
    </div>
  );
}
```

Nota: a seção antiga "Continue de onde parou" (card horizontal) e a grade `grid-cols-3` saem — o hero e os trilhos as substituem. O banner de assinatura fica como estava.

- [ ] **Step 4: Run tests**

Run: `npx playwright test e2e/painel.spec.ts && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/app/page.tsx e2e/painel.spec.ts
git commit -m "feat: painel editorial com hero e trilhos por estado"
```

---

### Task 4: Hero da página de curso

**Files:**
- Modify: `app/app/curso/[slug]/page.tsx` (header)
- Test: `e2e/curso.spec.ts` (asserts novos)

**Interfaces:**
- Consumes: `.hero-editorial` (Task 2); `plataforma.shell.meusCursos` (breadcrumb) e `plataforma.painel.cursoConcluido` (selo); tudo mais existente.
- Produces: nada consumido por outras tasks.

- [ ] **Step 1: Adicionar asserts ao e2e**

Em `e2e/curso.spec.ts`, logo após o `expect` do heading "Fundamentos de IA com Copilot", adicionar:

```ts
// Redesign: breadcrumb para o painel e barra de progresso no hero.
await expect(page.getByRole("link", { name: "Meus cursos" })).toHaveAttribute("href", "/app");
await expect(page.getByTestId("barra-progresso-curso")).toBeVisible();
```

Run: `npx playwright test e2e/curso.spec.ts`
Expected: FAIL (breadcrumb/barra não existem).

- [ ] **Step 2: Reescrever o header do curso**

Em `app/app/curso/[slug]/page.tsx`, substituir o `<header>` atual (o bloco `flex flex-col gap-6 border-b...` inteiro) por:

```tsx
<header className="hero-editorial border border-line">
  <div className="flex flex-col gap-6 p-6 sm:flex-row sm:gap-10 sm:p-8">
    <div className="relative aspect-[3/4] w-full max-w-[200px] shrink-0 overflow-hidden border border-line">
      <Image
        src={curso.capaUrl}
        alt=""
        fill
        sizes="200px"
        style={{ objectPosition: "center top" }}
        className="object-cover"
      />
    </div>
    <div className="flex flex-1 flex-col justify-center gap-4">
      <div>
        <nav className="text-sm text-fg-muted">
          <Link href="/app" className="hover:text-fg">
            {plataforma.shell.meusCursos}
          </Link>
          <span aria-hidden> → </span>
          <span className="text-fg">{curso.titulo}</span>
        </nav>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-fg-muted">
          {curso.nivel} · {curso.cargaHoras}
          {plataforma.painel.horas} · {aulaIds.length} {t.aulas}
        </p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-3xl font-medium leading-snug tracking-[-0.03em] text-fg sm:text-4xl">{curso.titulo}</h1>
          {/* Selo só com aula de verdade concluída — mesma regra de antes (M1).
              É o ponto de encaixe do botão "Ver certificado" do ciclo 2. */}
          {!proxima && aulaIds.length > 0 ? (
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-text">
              {plataforma.painel.cursoConcluido}
            </span>
          ) : null}
        </div>
        <p className="mt-3 max-w-[65ch] text-fg-muted">{curso.descricao}</p>
      </div>
      <div className="flex flex-col gap-3">
        {progresso.total > 0 ? (
          <div data-testid="barra-progresso-curso" className="h-1 w-full max-w-[360px] bg-line">
            <div className="h-full bg-accent" style={{ width: `${progresso.pct}%` }} />
          </div>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="text-sm text-fg-muted">
            {progresso.total > 0 ? t.concluidaDe(progresso.feitas, progresso.total) : t.emProducao}
          </p>
          {proxima ? (
            <Link
              href={`/app/curso/${curso.slug}/${proxima.slug}`}
              className="rounded-control bg-accent px-6 py-3 text-center font-medium text-accent-on transition-colors hover:bg-accent-hover"
            >
              {progresso.feitas > 0 ? t.continuar : t.comecar}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  </div>
</header>
```

Atenção: o texto do selo muda de `plataforma.aula.concluida` ("Aula concluída" — errado semanticamente para curso) para `plataforma.painel.cursoConcluido` ("Curso concluído"). O resto da página (trava de assinatura, `IndiceCurso`) fica intocado.

- [ ] **Step 3: Run tests**

Run: `npx playwright test e2e/curso.spec.ts e2e/aula.spec.ts && npx tsc --noEmit`
Expected: PASS (aula.spec cobre o texto "1 de 8 aulas concluídas" que continua na página).

- [ ] **Step 4: Commit**

```bash
git add "app/app/curso/[slug]/page.tsx" e2e/curso.spec.ts
git commit -m "feat: hero editorial na página de curso com breadcrumb e barra de progresso"
```

---

### Task 5: Página de aula (breadcrumb + índice lateral sticky com marcador)

**Files:**
- Modify: `app/app/curso/[slug]/[aula]/page.tsx`
- Modify: `components/plataforma/IndiceCurso.tsx` (prop `lateral`)
- Test: `e2e/aula.spec.ts` (asserts novos)

**Interfaces:**
- Consumes: `plataforma.aula.aulaDe` (Task 2); estrutura de duas colunas já existente na página.
- Produces: `IndiceCurso` aceita `lateral?: boolean` (marcador violeta na aula atual). Nenhuma task posterior depende.

- [ ] **Step 1: Adicionar asserts ao e2e**

Em `e2e/aula.spec.ts`, logo após o `expect` do iframe visível (aula gratuita), adicionar:

```ts
// Redesign: breadcrumb "Aula X de Y" e índice lateral com a aula atual marcada.
await expect(page.getByText("Aula 1 de 8")).toBeVisible();
await expect(page.locator('aside a[aria-current="true"]')).toBeVisible();
```

E logo após o clique em "Marcar como concluída" (antes de ir para a página do curso), adicionar:

```ts
// Check de concluída aparece no índice lateral sem recarregar? O índice é
// server-rendered — o check aparece no PRÓXIMO carregamento; valida na volta:
await page.reload();
await expect(page.locator("aside").getByText("✓").first()).toBeVisible();
```

Run: `npx playwright test e2e/aula.spec.ts`
Expected: FAIL ("Aula 1 de 8" não existe).

- [ ] **Step 2: IndiceCurso — modo lateral**

Em `components/plataforma/IndiceCurso.tsx`: adicionar `lateral` à assinatura e usar no destaque da aula atual.

```tsx
export function IndiceCurso({
  cursoSlug,
  modulos,
  concluidas,
  aulaAtualId,
  lateral = false,
}: {
  cursoSlug: string;
  modulos: Modulo[];
  concluidas: string[];
  aulaAtualId?: string;
  lateral?: boolean;
}) {
```

E trocar a `className` do `<Link>` da aula por:

```tsx
className={`flex items-center justify-between gap-4 px-1 py-3 transition-colors hover:bg-surface ${
  atual ? (lateral ? "border-l-2 border-accent bg-surface pl-3" : "bg-surface") : lateral ? "border-l-2 border-transparent pl-3" : ""
}`}
```

(A borda transparente nas não-atuais evita o texto pular quando a atual muda.)

- [ ] **Step 3: Página da aula**

Em `app/app/curso/[slug]/[aula]/page.tsx`:

1. Depois do cálculo de `proxima`/`hrefProxima`, derivar o módulo da aula atual:

```tsx
const moduloAtual = curso.modulos.find((m) => m.aulas.some((a) => a.id === aula.id));
```

2. No topo da coluna principal (primeiro filho de `<div className="min-w-0">`), adicionar o breadcrumb:

```tsx
<nav className="mb-4 text-sm text-fg-muted">
  <Link href={`/app/curso/${curso.slug}`} className="hover:text-fg">
    {curso.titulo}
  </Link>
  <span aria-hidden> · </span>
  <span>{moduloAtual?.titulo}</span>
  <span aria-hidden> · </span>
  <span className="text-fg">{t.aulaDe(indiceAtual + 1, sequencia.length)}</span>
</nav>
```

(Import de `Link` de `next/link` se ainda não houver.)

3. No `<aside>`, tornar sticky com scroll próprio e usar o modo lateral:

```tsx
<aside className="hidden lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:border-l lg:border-line lg:pl-6">
  <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">{t.aulasDoCurso}</p>
  <IndiceCurso cursoSlug={curso.slug} modulos={curso.modulos} concluidas={[...concluidas]} aulaAtualId={aula.id} lateral />
</aside>
```

(O `<details>` mobile fica como está, sem `lateral`.)

- [ ] **Step 4: Run tests**

Run: `npx playwright test e2e/aula.spec.ts e2e/curso.spec.ts e2e/painel.spec.ts && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/app/curso/[slug]/[aula]/page.tsx" components/plataforma/IndiceCurso.tsx e2e/aula.spec.ts
git commit -m "feat: aula com breadcrumb e índice lateral sticky com marcador"
```

---

### Task 6: Entrega (manual — controlador + Rodrigo)

Sem subagente. Pré-requisito: suíte inteira verde e branch integrada (superpowers:finishing-a-development-branch).

- [ ] Suíte completa: `npm run test:unit && npm run test:e2e` + `npm run build`.
- [ ] Merge na `main` (menu do finishing-a-development-branch) e push.
- [ ] Deploy: `bash scripts/deploy-railway.sh` (sem migração e sem variável nova).
- [ ] Validação em produção (browser real, conta admin existente): painel com hero e trilhos; curso com breadcrumb + barra; aula com índice lateral marcado; temas claro e escuro.
