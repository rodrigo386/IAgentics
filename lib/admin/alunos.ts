import "server-only";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses, lessonProgress, lessons, modules, subscriptions, users } from "@/lib/db/schema";
import { buscarAssinatura } from "@/lib/plataforma/dados";
import type { StatusAssinatura } from "@/lib/plataforma/tipos";

export type AlunoLinha = {
  id: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  status: StatusAssinatura;
  criadoEm: Date;
  ultimoAcesso: Date | null;
};

export type AlunoDetalhe = AlunoLinha & {
  historico: { status: string; criadoEm: Date }[]; // todas as linhas, mais recente primeiro
  progresso: {
    slug: string;
    titulo: string;
    feitas: number;
    total: number;
    pct: number;
    aulas: { titulo: string; concluidaEm: Date }[];
  }[];
};

export type ResultadoAcao =
  | { ok: true }
  | {
      ok: false;
      motivo: "auto" | "nao_encontrado" | "ja_tem_acesso" | "ja_sem_acesso" | "email_nao_confere" | "curso_publicado";
    };

const POR_PAGINA = 50;

// Fix round final (I2): id vem cru da URL (/admin/alunos/[id]) — um valor
// qualquer (ex.: "abc") batia direto num eq(users.id, id) com coluna uuid, o
// Postgres rejeitava a sintaxe e a exceção não tratada virava 500 em vez do
// 404 (via null) que a página já sabe renderizar. Validar antes do SELECT
// evita a viagem ao banco só para descobrir que o formato já está errado.
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Lista paginada de /admin/alunos. Três queries por página, nunca N+1 por
 *  linha: (1) a página de users com o total via `count(*) over()` — window
 *  function, não uma 4ª query; (2) status atual (linha mais recente por
 *  usuário, DISTINCT ON) só dos ids desta página; (3) último acesso (max de
 *  lesson_progress.updated_at) agrupado, também só dos ids desta página. */
export async function listarAlunos(o: {
  q?: string;
  pagina?: number;
}): Promise<{ linhas: AlunoLinha[]; total: number; porPagina: number }> {
  const pagina = o.pagina && o.pagina > 0 ? Math.floor(o.pagina) : 1;
  const q = o.q?.trim();
  const condicao = q ? or(ilike(users.nome, `%${q}%`), ilike(users.email, `%${q}%`)) : undefined;

  // Query 1: página de usuários, mais recentes primeiro (id como desempate —
  // createdAt sozinho não garante ordem estável entre chamadas quando duas
  // linhas nascem no mesmo instante, o que quebraria a paginação).
  const linhasUsuarios = await db
    .select({
      id: users.id,
      nome: users.nome,
      email: users.email,
      role: users.role,
      ativo: users.ativo,
      criadoEm: users.createdAt,
      total: sql<number>`count(*) over()::int`,
    })
    .from(users)
    .where(condicao)
    .orderBy(desc(users.createdAt), users.id)
    .limit(POR_PAGINA)
    .offset((pagina - 1) * POR_PAGINA);

  const ids = linhasUsuarios.map((l) => l.id);

  // Query 2: status atual = linha mais recente de subscriptions por usuário.
  const statusLinhas = ids.length
    ? await db
        .selectDistinctOn([subscriptions.userId], { userId: subscriptions.userId, status: subscriptions.status })
        .from(subscriptions)
        .where(inArray(subscriptions.userId, ids))
        .orderBy(subscriptions.userId, desc(subscriptions.createdAt))
    : [];
  const statusPorId = new Map(statusLinhas.map((s) => [s.userId, s.status as StatusAssinatura]));

  // Query 3: último acesso = maior updated_at de lesson_progress, agrupado.
  const acessoLinhas = ids.length
    ? await db
        .select({
          userId: lessonProgress.userId,
          // drizzle desativa o auto-parse de timestamp do driver pg e só decodifica
          // Date para colunas reais (Column.mapFromDriverValue) — um fragmento sql
          // cru sem .mapWith() volta como STRING crua, não Date. mapWith fecha isso.
          ultimo: sql`max(${lessonProgress.updatedAt})`.mapWith((v: string) => new Date(v)),
        })
        .from(lessonProgress)
        .where(inArray(lessonProgress.userId, ids))
        .groupBy(lessonProgress.userId)
    : [];
  const ultimoPorId = new Map(acessoLinhas.map((a) => [a.userId, a.ultimo]));

  const linhas: AlunoLinha[] = linhasUsuarios.map((l) => ({
    id: l.id,
    nome: l.nome,
    email: l.email,
    role: l.role,
    ativo: l.ativo,
    criadoEm: l.criadoEm,
    status: statusPorId.get(l.id) ?? null,
    ultimoAcesso: ultimoPorId.get(l.id) ?? null,
  }));

  // A window function só viaja em cima das linhas retornadas: página vazia
  // (ex.: ?pagina= além do fim) não carrega total nenhum. Cai numa query
  // extra só nesse caso raro, fora do caminho comum de paginação.
  let total = linhasUsuarios[0]?.total ?? 0;
  if (linhasUsuarios.length === 0 && pagina > 1) {
    const [c] = await db.select({ total: sql<number>`count(*)::int` }).from(users).where(condicao);
    total = c?.total ?? 0;
  }

  return { linhas, total, porPagina: POR_PAGINA };
}

/** Detalhe de /admin/alunos/[id]: identidade, histórico completo de
 *  assinatura e progresso por curso. Não é chamada em lote (uma tela, um
 *  aluno) — a dúzia de queries aqui não é N+1, é o preço normal de um
 *  detalhe rico sem lib de agregação. */
export async function buscarAluno(id: string): Promise<AlunoDetalhe | null> {
  if (!RE_UUID.test(id)) return null;

  const [u] = await db
    .select({
      id: users.id,
      nome: users.nome,
      email: users.email,
      role: users.role,
      ativo: users.ativo,
      criadoEm: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  if (!u) return null;

  const [status, historico, acessoLinha, progressoLinhas] = await Promise.all([
    buscarAssinatura(id),
    db
      .select({ status: subscriptions.status, criadoEm: subscriptions.createdAt })
      .from(subscriptions)
      .where(eq(subscriptions.userId, id))
      .orderBy(desc(subscriptions.createdAt)),
    db
      .select({ ultimo: sql`max(${lessonProgress.updatedAt})`.mapWith((v: string) => new Date(v)) })
      .from(lessonProgress)
      .where(eq(lessonProgress.userId, id)),
    db
      .select({
        cursoId: courses.id,
        cursoSlug: courses.slug,
        cursoTitulo: courses.titulo,
        aulaTitulo: lessons.titulo,
        // Fix round final (I4): updatedAt sobe a cada toque do player (é o
        // "último acesso" da Task 2) — usá-lo aqui mostrava a data do replay
        // mais recente, não a da conclusão de verdade. concluidaEm nasce só
        // na primeira conclusão e nunca se move (ver gravarProgresso); o
        // coalesce cobre só a hipótese de linha antiga sem concluida_em
        // preenchida (anterior a esta coluna existir).
        concluidaEm: sql`coalesce(${lessonProgress.concluidaEm}, ${lessonProgress.updatedAt})`.mapWith(
          (v: string) => new Date(v),
        ),
      })
      .from(lessonProgress)
      .innerJoin(lessons, eq(lessons.id, lessonProgress.lessonId))
      .innerJoin(modules, eq(modules.id, lessons.moduleId))
      .innerJoin(courses, eq(courses.id, modules.courseId))
      .where(and(eq(lessonProgress.userId, id), eq(lessonProgress.concluida, true)))
      .orderBy(desc(lessonProgress.updatedAt)),
  ]);

  const idsCursos = [...new Set(progressoLinhas.map((p) => p.cursoId))];
  const totaisPorCurso = idsCursos.length
    ? await db
        .select({ cursoId: modules.courseId, total: sql<number>`count(*)::int` })
        .from(lessons)
        .innerJoin(modules, eq(modules.id, lessons.moduleId))
        .where(inArray(modules.courseId, idsCursos))
        .groupBy(modules.courseId)
    : [];
  const totalPorCursoId = new Map(totaisPorCurso.map((t) => [t.cursoId, t.total]));

  const blocosPorCurso = new Map<string, { slug: string; titulo: string; aulas: { titulo: string; concluidaEm: Date }[] }>();
  for (const p of progressoLinhas) {
    const bloco = blocosPorCurso.get(p.cursoId) ?? { slug: p.cursoSlug, titulo: p.cursoTitulo, aulas: [] };
    bloco.aulas.push({ titulo: p.aulaTitulo, concluidaEm: p.concluidaEm });
    blocosPorCurso.set(p.cursoId, bloco);
  }
  const progresso = [...blocosPorCurso.entries()].map(([cursoId, bloco]) => {
    const total = totalPorCursoId.get(cursoId) ?? 0;
    const feitas = bloco.aulas.length;
    return {
      slug: bloco.slug,
      titulo: bloco.titulo,
      feitas,
      total,
      pct: total ? Math.round((feitas / total) * 100) : 0,
      aulas: bloco.aulas,
    };
  });

  return {
    id: u.id,
    nome: u.nome,
    email: u.email,
    role: u.role,
    ativo: u.ativo,
    criadoEm: u.criadoEm,
    status,
    ultimoAcesso: acessoLinha[0]?.ultimo ?? null,
    historico,
    progresso,
  };
}

/** Assinatura NUNCA sofre UPDATE: liberar = inserir linha "manual". O status
 *  atual é derivado com a MESMA leitura de buscarAssinatura (linha mais
 *  recente), nunca de "já teve alguma linha manual/ativa em algum momento". */
export async function liberarAcesso(executorId: string, alunoId: string): Promise<ResultadoAcao> {
  const [aluno] = await db.select({ id: users.id }).from(users).where(eq(users.id, alunoId)).limit(1);
  if (!aluno) return { ok: false, motivo: "nao_encontrado" };
  const status = await buscarAssinatura(alunoId);
  if (status === "ativa" || status === "manual") return { ok: false, motivo: "ja_tem_acesso" };
  await db.insert(subscriptions).values({ userId: alunoId, status: "manual" });
  return { ok: true };
}

/** Espelho de liberarAcesso: revogar = inserir linha "cancelada", nunca UPDATE. */
export async function revogarAcesso(executorId: string, alunoId: string): Promise<ResultadoAcao> {
  const [aluno] = await db.select({ id: users.id }).from(users).where(eq(users.id, alunoId)).limit(1);
  if (!aluno) return { ok: false, motivo: "nao_encontrado" };
  const status = await buscarAssinatura(alunoId);
  if (status !== "ativa" && status !== "manual") return { ok: false, motivo: "ja_sem_acesso" };
  await db.insert(subscriptions).values({ userId: alunoId, status: "cancelada" });
  return { ok: true };
}

/** Promover/rebaixar: recusado na função para o próprio executor, não só
 *  escondido na UI — um admin não consegue se rebaixar nem se auto-promover
 *  chamando a action diretamente. */
export async function definirRole(executorId: string, alunoId: string, role: "aluno" | "admin"): Promise<ResultadoAcao> {
  if (executorId === alunoId) return { ok: false, motivo: "auto" };
  const resultado = await db.update(users).set({ role }).where(eq(users.id, alunoId)).returning({ id: users.id });
  if (!resultado.length) return { ok: false, motivo: "nao_encontrado" };
  return { ok: true };
}

/** Desativar/reativar: mesma recusa a si mesmo — um admin não consegue se
 *  trancar para fora da própria conta chamando a action diretamente. */
export async function definirAtivo(executorId: string, alunoId: string, ativo: boolean): Promise<ResultadoAcao> {
  if (executorId === alunoId) return { ok: false, motivo: "auto" };
  const resultado = await db.update(users).set({ ativo }).where(eq(users.id, alunoId)).returning({ id: users.id });
  if (!resultado.length) return { ok: false, motivo: "nao_encontrado" };
  return { ok: true };
}

/** Exclusão: recusada a si mesmo (checada ANTES do e-mail — excluir a si
 *  mesmo é "auto" mesmo com confirmação certa) e exige o e-mail exato do
 *  aluno (trim + lowercase dos dois lados) como confirmação. */
export async function excluirAluno(executorId: string, alunoId: string, emailConfirmacao: string): Promise<ResultadoAcao> {
  if (executorId === alunoId) return { ok: false, motivo: "auto" };
  const [aluno] = await db.select({ email: users.email }).from(users).where(eq(users.id, alunoId)).limit(1);
  if (!aluno) return { ok: false, motivo: "nao_encontrado" };
  if (emailConfirmacao.trim().toLowerCase() !== aluno.email.trim().toLowerCase()) {
    return { ok: false, motivo: "email_nao_confere" };
  }
  await db.delete(users).where(eq(users.id, alunoId)); // cascade: subscriptions e lesson_progress
  return { ok: true };
}
