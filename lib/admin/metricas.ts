import "server-only";
import { and, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { certificates, courses, lessonProgress, lessons, modules, pageViews, subscriptions, users } from "@/lib/db/schema";
import { VALOR_MENSAL } from "@/lib/asaas/cliente";

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

export type PontoDia = { dia: string; valor: number };
export type LinhaRota = { rota: string; visitas: number };

/** Visitas do site (page_views, alimentada pelo beacon). Mesmo contrato de
 *  período das demais consultas: corte por inicioDoPeriodo, "tudo" = sem corte.
 *  A coluna `dia` é DATE - o corte compara pela string YYYY-MM-DD (UTC), o
 *  mesmo formato que o coletor grava. */
export async function trafegoDoSite(p: Periodo): Promise<{
  total: number;
  porDia: PontoDia[];
  porRota: LinhaRota[];
}> {
  const corte = inicioDoPeriodo(p, new Date());
  const corteDia = corte ? corte.toISOString().slice(0, 10) : null;
  const filtro = corteDia ? gte(pageViews.dia, corteDia) : undefined;

  const [porDia, porRota] = await Promise.all([
    db
      .select({ dia: pageViews.dia, valor: sql<number>`sum(${pageViews.visitas})::int` })
      .from(pageViews)
      .where(filtro)
      .groupBy(pageViews.dia)
      .orderBy(pageViews.dia),
    db
      .select({ rota: pageViews.rota, visitas: sql<number>`sum(${pageViews.visitas})::int` })
      .from(pageViews)
      .where(filtro)
      .groupBy(pageViews.rota)
      .orderBy(sql`sum(${pageViews.visitas}) desc`),
  ]);

  const total = porRota.reduce((soma, l) => soma + l.visitas, 0);
  return { total, porDia, porRota };
}

/* ----------------------------------------------------------------------------
   Analítico por aba (2026-08-15): comparações com o período ANTERIOR de mesmo
   tamanho, saúde das assinaturas, MRR estimado, funil site→assinatura.
   Regra do painel: só métrica calculável com dado real - nada estimado além
   do MRR, que é aritmética declarada (ativas × VALOR_MENSAL).
---------------------------------------------------------------------------- */

/** Janela imediatamente anterior ao período, com o MESMO tamanho: para "30"
 *  é [agora-60d, agora-30d). "tudo" não tem anterior - comparação vira null
 *  e o cartão simplesmente não mostra variação. */
function janelaAnterior(p: Periodo, agora: Date): { inicio: Date; fim: Date } | null {
  if (p === "tudo") return null;
  const dias = DIAS_POR_PERIODO[p];
  const fim = new Date(agora.getTime() - dias * DIA_MS);
  return { inicio: new Date(fim.getTime() - dias * DIA_MS), fim };
}

/** Alunos cuja PRIMEIRA linha ativa/manual cai depois do corte: novas
 *  assinaturas de verdade, não mudanças de status de quem já assinava. */
async function novasAssinaturasDesde(corte: Date | null): Promise<number> {
  const r = await db.execute<{ n: number }>(sql`
    select count(*)::int as n from (
      select user_id, min(created_at) as primeira
      from subscriptions
      where status in ('ativa', 'manual')
      group by user_id
    ) t
    ${corte ? sql`where primeira >= ${corte}` : sql``}
  `);
  return r.rows[0]?.n ?? 0;
}

export type AnaliticoApp = {
  novosAnterior: number | null;
  aulasConcluidasAnterior: number | null;
  certificados: number;
  certificadosAnterior: number | null;
  novasAssinaturas: number;
  status: { ativas: number; manuais: number; pendentes: number; inadimplentes: number; canceladas: number };
  mrr: number;
  pendentesConfirmacao: number;
  catalogo: { cursos: number; aulas: number; horas: number };
  topAulas: { aula: string; curso: string; concluidas: number }[];
};

export async function analiticoDoApp(p: Periodo): Promise<AnaliticoApp> {
  const agora = new Date();
  const corte = inicioDoPeriodo(p, agora);
  const anterior = janelaAnterior(p, agora);

  const [
    novosAnteriorLinha,
    aulasAnteriorLinha,
    certificadosLinha,
    certificadosAnteriorLinha,
    novasAssinaturas,
    statusResultado,
    pendentesLinha,
    cursosLinha,
    aulasLinha,
    horasLinha,
    topAulas,
  ] = await Promise.all([
    anterior
      ? db
          .select({ n: sql<number>`count(*)::int` })
          .from(users)
          .where(and(gte(users.createdAt, anterior.inicio), lt(users.createdAt, anterior.fim)))
      : Promise.resolve(null),
    anterior
      ? db
          .select({ n: sql<number>`count(*)::int` })
          .from(lessonProgress)
          .where(
            and(
              eq(lessonProgress.concluida, true),
              gte(lessonProgress.concluidaEm, anterior.inicio),
              lt(lessonProgress.concluidaEm, anterior.fim),
            ),
          )
      : Promise.resolve(null),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(certificates)
      .where(corte ? gte(certificates.emitidoEm, corte) : undefined),
    anterior
      ? db
          .select({ n: sql<number>`count(*)::int` })
          .from(certificates)
          .where(and(gte(certificates.emitidoEm, anterior.inicio), lt(certificates.emitidoEm, anterior.fim)))
      : Promise.resolve(null),
    novasAssinaturasDesde(corte),
    // Status ATUAL por aluno (linha mais recente) - mesma semântica de
    // temAcesso/buscarAssinatura, agora aberta por categoria.
    db.execute<{ status: string; n: number }>(sql`
      select status, count(*)::int as n from (
        select distinct on (user_id) status
        from subscriptions
        order by user_id, created_at desc
      ) s
      group by status
    `),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(users)
      .where(and(sql`${users.emailConfirmadoEm} is null`, eq(users.ativo, true))),
    db.select({ n: sql<number>`count(*)::int` }).from(courses).where(eq(courses.publicado, true)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(lessons)
      .innerJoin(modules, eq(modules.id, lessons.moduleId))
      .innerJoin(courses, and(eq(courses.id, modules.courseId), eq(courses.publicado, true))),
    db
      .select({ h: sql<number>`coalesce(sum(${courses.cargaHoras}), 0)::float` })
      .from(courses)
      .where(eq(courses.publicado, true)),
    db
      .select({
        aula: lessons.titulo,
        curso: courses.titulo,
        concluidas: sql<number>`count(*)::int`,
      })
      .from(lessonProgress)
      .innerJoin(lessons, eq(lessons.id, lessonProgress.lessonId))
      .innerJoin(modules, eq(modules.id, lessons.moduleId))
      .innerJoin(courses, eq(courses.id, modules.courseId))
      .where(
        corte
          ? and(eq(lessonProgress.concluida, true), gte(lessonProgress.concluidaEm, corte))
          : eq(lessonProgress.concluida, true),
      )
      .groupBy(lessons.titulo, courses.titulo)
      .orderBy(sql`count(*) desc`)
      .limit(5),
  ]);

  const porStatus = new Map(statusResultado.rows.map((l) => [l.status, l.n]));
  const ativas = porStatus.get("ativa") ?? 0;

  return {
    novosAnterior: novosAnteriorLinha ? (novosAnteriorLinha[0]?.n ?? 0) : null,
    aulasConcluidasAnterior: aulasAnteriorLinha ? (aulasAnteriorLinha[0]?.n ?? 0) : null,
    certificados: certificadosLinha[0]?.n ?? 0,
    certificadosAnterior: certificadosAnteriorLinha ? (certificadosAnteriorLinha[0]?.n ?? 0) : null,
    novasAssinaturas,
    status: {
      ativas,
      manuais: porStatus.get("manual") ?? 0,
      pendentes: porStatus.get("pendente") ?? 0,
      inadimplentes: porStatus.get("inadimplente") ?? 0,
      canceladas: porStatus.get("cancelada") ?? 0,
    },
    // Só assinatura paga entra no MRR; cortesia (manual) fica de fora e
    // aparece separada na saúde das assinaturas.
    mrr: ativas * VALOR_MENSAL,
    pendentesConfirmacao: pendentesLinha[0]?.n ?? 0,
    catalogo: {
      cursos: cursosLinha[0]?.n ?? 0,
      aulas: aulasLinha[0]?.n ?? 0,
      horas: horasLinha[0]?.h ?? 0,
    },
    topAulas,
  };
}

export type AnaliticoSite = {
  visitasAnterior: number | null;
  contas: number;
  confirmadas: number;
  novasAssinaturas: number;
};

/** Funil site→app do período: visitas vêm de trafegoDoSite (mesma chamada que
 *  alimenta o gráfico); aqui ficam as etapas seguintes e a comparação. */
export async function analiticoDoSite(p: Periodo): Promise<AnaliticoSite> {
  const agora = new Date();
  const corte = inicioDoPeriodo(p, agora);
  const anterior = janelaAnterior(p, agora);

  const [visitasAnteriorResultado, contasLinha, confirmadasLinha, novasAssinaturas] = await Promise.all([
    anterior
      ? db
          .select({ n: sql<number>`coalesce(sum(${pageViews.visitas}), 0)::int` })
          .from(pageViews)
          .where(
            and(
              gte(pageViews.dia, anterior.inicio.toISOString().slice(0, 10)),
              lt(pageViews.dia, anterior.fim.toISOString().slice(0, 10)),
            ),
          )
      : Promise.resolve(null),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(users)
      .where(corte ? gte(users.createdAt, corte) : undefined),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(users)
      .where(corte ? gte(users.emailConfirmadoEm, corte) : sql`${users.emailConfirmadoEm} is not null`),
    novasAssinaturasDesde(corte),
  ]);

  return {
    visitasAnterior: visitasAnteriorResultado ? (visitasAnteriorResultado[0]?.n ?? 0) : null,
    contas: contasLinha[0]?.n ?? 0,
    confirmadas: confirmadasLinha[0]?.n ?? 0,
    novasAssinaturas,
  };
}
