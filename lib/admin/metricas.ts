import "server-only";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses, lessonProgress, lessons, modules, subscriptions, users } from "@/lib/db/schema";

export type Periodo = "7" | "30" | "90" | "tudo";

const DIAS_POR_PERIODO = { "7": 7, "30": 30, "90": 90 } as const;
const DIA_MS = 24 * 60 * 60 * 1000;

const PERIODOS: Periodo[] = ["7", "30", "90", "tudo"];

/** Fix round final (I5): route handler de CSV lia periodo cru de searchParams
 *  e só fazia `as Periodo` — um valor fora da união não corta em nenhum WHERE
 *  (o SQL trata como "sem filtro", não como erro) e ainda assim chegava
 *  intacto no template do Content-Disposition. Validar aqui, antes de gerar
 *  qualquer coisa, é o mesmo padrão de "cast confia, checagem em runtime é a
 *  validação real" já usado por BLOCOS_CSV em gerarCsv. */
export function ehPeriodoValido(v: string | null | undefined): v is Periodo {
  return !!v && (PERIODOS as string[]).includes(v);
}

/** null = sem corte (período "tudo"). O relógio é sempre o argumento `agora`,
 *  nunca `new Date()` interno, para o teste poder controlar o dado sem
 *  depender do relógio da máquina. */
export function inicioDoPeriodo(p: Periodo, agora: Date): Date | null {
  if (p === "tudo") return null;
  const dias = DIAS_POR_PERIODO[p];
  return new Date(agora.getTime() - dias * DIA_MS);
}

export type PontoSemana = { semana: string; valor: number };

export async function resumo(p: Periodo): Promise<{
  alunosTotais: number;
  novos: number;
  assinaturasAtivas: number;
  alunosAtivos: number;
  aulasConcluidas: number;
}> {
  const corte = inicioDoPeriodo(p, new Date());

  const [totaisLinha, novosLinha, ativasResultado, ativosLinha, concluidasLinha] = await Promise.all([
    // alunosTotais: contexto sempre global, não filtra por período.
    db.select({ n: sql<number>`count(*)::int` }).from(users),
    // novos: cadastros dentro do período.
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(users)
      .where(corte ? gte(users.createdAt, corte) : undefined),
    // assinaturasAtivas: status ATUAL por aluno (linha mais recente), nunca linha
    // histórica — mesma semântica de temAcesso/buscarAssinatura. Independe do período.
    db.execute<{ n: number }>(sql`
      select count(*)::int as n from (
        select distinct on (user_id) status
        from subscriptions
        order by user_id, created_at desc
      ) s
      where status in ('ativa', 'manual')
    `),
    // alunosAtivos: alunos distintos com progresso tocado dentro do período.
    db
      .select({ n: sql<number>`count(distinct ${lessonProgress.userId})::int` })
      .from(lessonProgress)
      .where(corte ? gte(lessonProgress.updatedAt, corte) : undefined),
    // aulasConcluidas: linhas concluídas cuja PRIMEIRA conclusão (concluida_em,
    // nunca updated_at) cai dentro do período. updated_at sobe a cada replay
    // (gravarProgresso toca nela em toda batida, mesmo sem re-concluir), então
    // usá-la aqui inflaria o cartão quando um aluno reabre uma aula já feita.
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(lessonProgress)
      .where(
        corte
          ? and(eq(lessonProgress.concluida, true), gte(lessonProgress.concluidaEm, corte))
          : eq(lessonProgress.concluida, true),
      ),
  ]);

  return {
    alunosTotais: totaisLinha[0]?.n ?? 0,
    novos: novosLinha[0]?.n ?? 0,
    assinaturasAtivas: ativasResultado.rows[0]?.n ?? 0,
    alunosAtivos: ativosLinha[0]?.n ?? 0,
    aulasConcluidas: concluidasLinha[0]?.n ?? 0,
  };
}

export async function seriesSemanais(p: Periodo): Promise<{ cadastros: PontoSemana[]; atividade: PontoSemana[] }> {
  const corte = inicioDoPeriodo(p, new Date());

  // to_char(date_trunc('week', ...), 'YYYY-MM-DD') sai do Postgres já como TEXT
  // (não timestamp) — sem risco do problema de fragmento sql cru virando string
  // "por engano": aqui a string É o formato final, não precisa de .mapWith.
  const semanaCadastro = sql<string>`to_char(date_trunc('week', ${users.createdAt}), 'YYYY-MM-DD')`;
  const cadastros = await db
    .select({ semana: semanaCadastro, valor: sql<number>`count(*)::int` })
    .from(users)
    .where(corte ? gte(users.createdAt, corte) : undefined)
    .groupBy(semanaCadastro)
    .orderBy(semanaCadastro);

  const semanaAtividade = sql<string>`to_char(date_trunc('week', ${lessonProgress.updatedAt}), 'YYYY-MM-DD')`;
  const atividade = await db
    .select({ semana: semanaAtividade, valor: sql<number>`count(distinct ${lessonProgress.userId})::int` })
    .from(lessonProgress)
    .where(corte ? gte(lessonProgress.updatedAt, corte) : undefined)
    .groupBy(semanaAtividade)
    .orderBy(semanaAtividade);

  return { cadastros, atividade };
}

export async function conclusaoPorCurso(): Promise<
  { slug: string; titulo: string; comecaram: number; concluiram: number; pct: number }[]
> {
  const cursosPublicados = await db
    .select({ id: courses.id, slug: courses.slug, titulo: courses.titulo })
    .from(courses)
    .where(eq(courses.publicado, true))
    .orderBy(courses.ordem);
  if (!cursosPublicados.length) return [];

  const idsCursos = cursosPublicados.map((c) => c.id);

  const totaisLinhas = await db
    .select({ cursoId: modules.courseId, total: sql<number>`count(*)::int` })
    .from(lessons)
    .innerJoin(modules, eq(modules.id, lessons.moduleId))
    .where(inArray(modules.courseId, idsCursos))
    .groupBy(modules.courseId);
  const totalPorCurso = new Map(totaisLinhas.map((t) => [t.cursoId, t.total]));

  const progressoLinhas = await db
    .select({ cursoId: modules.courseId, userId: lessonProgress.userId, concluida: lessonProgress.concluida })
    .from(lessonProgress)
    .innerJoin(lessons, eq(lessons.id, lessonProgress.lessonId))
    .innerJoin(modules, eq(modules.id, lessons.moduleId))
    .where(inArray(modules.courseId, idsCursos));

  // comecaram = alunos distintos com >=1 linha de progresso no curso;
  // concluiram = alunos cujo total de aulas concluídas bate com o total do curso.
  const feitasPorCursoAluno = new Map<string, Map<string, number>>();
  for (const linha of progressoLinhas) {
    let porAluno = feitasPorCursoAluno.get(linha.cursoId);
    if (!porAluno) {
      porAluno = new Map();
      feitasPorCursoAluno.set(linha.cursoId, porAluno);
    }
    if (!porAluno.has(linha.userId)) porAluno.set(linha.userId, 0);
    if (linha.concluida) porAluno.set(linha.userId, (porAluno.get(linha.userId) ?? 0) + 1);
  }

  return cursosPublicados.map((c) => {
    const porAluno = feitasPorCursoAluno.get(c.id);
    const total = totalPorCurso.get(c.id) ?? 0;
    const comecaram = porAluno ? porAluno.size : 0;
    let concluiram = 0;
    if (porAluno && total > 0) {
      for (const feitas of porAluno.values()) if (feitas === total) concluiram += 1;
    }
    const pct = comecaram ? Math.round((concluiram / comecaram) * 100) : 0;
    return { slug: c.slug, titulo: c.titulo, comecaram, concluiram, pct };
  });
}

export async function funilDoCurso(
  slug: string,
): Promise<{ modulo: string; aula: string; ordemGlobal: number; concluiram: number }[] | null> {
  const [curso] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(and(eq(courses.slug, slug), eq(courses.publicado, true)))
    .limit(1);
  if (!curso) return null; // curso não existe ou está oculto (não publicado)

  const linhasAulas = await db
    .select({
      lessonId: lessons.id,
      aula: lessons.titulo,
      modulo: modules.titulo,
      moduloOrdem: modules.ordem,
      aulaOrdem: lessons.ordem,
    })
    .from(lessons)
    .innerJoin(modules, eq(modules.id, lessons.moduleId))
    .where(eq(modules.courseId, curso.id))
    .orderBy(modules.ordem, lessons.ordem);
  if (!linhasAulas.length) return [];

  const idsAulas = linhasAulas.map((l) => l.lessonId);
  const concluidasLinhas = await db
    .select({ lessonId: lessonProgress.lessonId, n: sql<number>`count(*)::int` })
    .from(lessonProgress)
    .where(and(inArray(lessonProgress.lessonId, idsAulas), eq(lessonProgress.concluida, true)))
    .groupBy(lessonProgress.lessonId);
  const concluidasPorAula = new Map(concluidasLinhas.map((c) => [c.lessonId, c.n]));

  return linhasAulas.map((l, i) => ({
    modulo: l.modulo,
    aula: l.aula,
    ordemGlobal: i + 1,
    concluiram: concluidasPorAula.get(l.lessonId) ?? 0,
  }));
}

const BLOCOS_CSV = ["cadastros", "atividade", "conclusao", "funil"] as const;
type BlocoCsv = (typeof BLOCOS_CSV)[number];

function escaparCampoCsv(v: string | number): string {
  const texto = String(v);
  // Excel brasileiro: separador ';' — só precisa de aspas quando o próprio
  // valor carrega ';', quebra de linha ou aspas.
  if (/[;\n"]/.test(texto)) return `"${texto.replace(/"/g, '""')}"`;
  return texto;
}

function linhaCsv(campos: (string | number)[]): string {
  return campos.map(escaparCampoCsv).join(";");
}

/** null = bloco desconhecido, ou bloco "funil" sem cursoSlug válido/publicado.
 *  O cast do route handler (`as Parameters<typeof gerarCsv>[0]`) confia numa
 *  string vinda de searchParams — a checagem em BLOCOS_CSV é a validação real,
 *  em runtime, que o tipo por si só não garante. */
export async function gerarCsv(bloco: BlocoCsv, p: Periodo, cursoSlug?: string): Promise<string | null> {
  if (!BLOCOS_CSV.includes(bloco)) return null;

  const BOM = "\uFEFF"; // Excel brasileiro só reconhece UTF-8 sem essa marca como Latin-1
  const linhas: string[] = [];

  if (bloco === "cadastros" || bloco === "atividade") {
    const series = await seriesSemanais(p);
    const pontos = bloco === "cadastros" ? series.cadastros : series.atividade;
    linhas.push(linhaCsv(["semana", bloco === "cadastros" ? "novos_cadastros" : "alunos_ativos"]));
    for (const pt of pontos) linhas.push(linhaCsv([pt.semana, pt.valor]));
  } else if (bloco === "conclusao") {
    const linhasConclusao = await conclusaoPorCurso();
    linhas.push(linhaCsv(["curso", "comecaram", "concluiram", "percentual"]));
    for (const c of linhasConclusao) linhas.push(linhaCsv([c.titulo, c.comecaram, c.concluiram, c.pct]));
  } else {
    if (!cursoSlug) return null;
    const funil = await funilDoCurso(cursoSlug);
    if (funil === null) return null;
    linhas.push(linhaCsv(["modulo", "aula", "ordem", "concluiram"]));
    for (const f of funil) linhas.push(linhaCsv([f.modulo, f.aula, f.ordemGlobal, f.concluiram]));
  }

  return BOM + linhas.join("\n");
}
