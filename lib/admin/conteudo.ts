import "server-only";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses, lessonMedia, lessonProgress, lessons, modules } from "@/lib/db/schema";
import type { ResultadoAcao } from "@/lib/admin/alunos";
import type { Aula, Curso, Modulo } from "@/lib/plataforma/tipos";

/** Pura: sem acento, minúsculas, hífens simples, sem hífen nas pontas.
 *  NFD decompõe "ç"/"ã"/"é" em base + marca combinante; a faixa ̀-ͯ
 *  cobre as marcas diacríticas Unicode — removê-las antes do lowercase e da
 *  troca de tudo que não é [a-z0-9] por hífen. */
export function gerarSlug(titulo: string): string {
  return titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** drizzle-orm@0.45 envolve o erro do driver em DrizzleQueryError; o código pg
 *  real (23505 = unique_violation) vem em e.cause.code, não em e.code — mesmo
 *  detalhe já documentado em lib/plataforma/usuarios.ts (criarUsuario). */
function ehViolacaoDeUnicidade(e: unknown): boolean {
  const codigoPg = (e as { code?: string; cause?: { code?: string } })?.code ?? (e as { cause?: { code?: string } })?.cause?.code;
  return codigoPg === "23505";
}

export type CursoAdminLinha = {
  id: string;
  slug: string;
  titulo: string;
  publicado: boolean;
  ordem: number;
  totalAulas: number;
  aulasSemVideo: number;
};

export type Impacto = { aulas: number; alunosComProgresso: number };

type AulaAdmin = Aula & { midia: { provider: string; videoId: string } | null };
// Omit<Modulo, "aulas"> em vez de "Modulo & {...}": interseção direta com a
// mesma chave ("aulas") em dois tipos de array incompatíveis (Aula[] vs.
// AulaAdmin[]) faz o TS resolver .find()/.map() pelo tipo mais genérico —
// aulaComMidia.midia deixa de existir no autocomplete e no build.
type ModuloAdmin = Omit<Modulo, "aulas"> & { aulas: AulaAdmin[] };
export type CursoAdmin = Curso & { publicado: boolean; modulos: ModuloAdmin[] };

function paraCurso(r: typeof courses.$inferSelect): Curso & { publicado: boolean } {
  return {
    id: r.id,
    slug: r.slug,
    titulo: r.titulo,
    descricao: r.descricao,
    capaUrl: r.capaUrl,
    nivel: r.nivel,
    cargaHoras: Number(r.cargaHoras),
    ordem: r.ordem,
    publicado: r.publicado,
  };
}

function paraAula(r: typeof lessons.$inferSelect): Aula {
  return {
    id: r.id,
    slug: r.slug,
    titulo: r.titulo,
    descricao: r.descricao,
    duracaoSeg: r.duracaoSeg,
    ordem: r.ordem,
    gratuita: r.gratuita,
  };
}

/** Lista de /admin/conteudo: um curso por linha, com contagem de aulas e de
 *  aulas ainda sem mídia — sem N+1, três queries no total (cursos, totais por
 *  curso via join agrupado, sem-vídeo por curso via left join + isNull). */
export async function listarCursosAdmin(): Promise<CursoAdminLinha[]> {
  const cursosLinhas = await db
    .select({ id: courses.id, slug: courses.slug, titulo: courses.titulo, publicado: courses.publicado, ordem: courses.ordem })
    .from(courses)
    .orderBy(courses.ordem);
  if (!cursosLinhas.length) return [];

  const idsCursos = cursosLinhas.map((c) => c.id);

  const totaisLinhas = await db
    .select({ cursoId: modules.courseId, total: sql<number>`count(*)::int` })
    .from(lessons)
    .innerJoin(modules, eq(modules.id, lessons.moduleId))
    .where(inArray(modules.courseId, idsCursos))
    .groupBy(modules.courseId);
  const totalPorCurso = new Map(totaisLinhas.map((t) => [t.cursoId, t.total]));

  const semVideoLinhas = await db
    .select({ cursoId: modules.courseId, n: sql<number>`count(*)::int` })
    .from(lessons)
    .innerJoin(modules, eq(modules.id, lessons.moduleId))
    .leftJoin(lessonMedia, eq(lessonMedia.lessonId, lessons.id))
    .where(and(inArray(modules.courseId, idsCursos), isNull(lessonMedia.lessonId)))
    .groupBy(modules.courseId);
  const semVideoPorCurso = new Map(semVideoLinhas.map((s) => [s.cursoId, s.n]));

  return cursosLinhas.map((c) => ({
    id: c.id,
    slug: c.slug,
    titulo: c.titulo,
    publicado: c.publicado,
    ordem: c.ordem,
    totalAulas: totalPorCurso.get(c.id) ?? 0,
    aulasSemVideo: semVideoPorCurso.get(c.id) ?? 0,
  }));
}

/** Detalhe de /admin/conteudo/[slug]: curso completo, publicado ou não (ao
 *  contrário de buscarCurso() de lib/plataforma/dados.ts, que só serve o
 *  aluno e por isso filtra publicado=true), com módulos/aulas/mídia. */
export async function buscarCursoAdmin(slug: string): Promise<CursoAdmin | null> {
  const [linhaCurso] = await db.select().from(courses).where(eq(courses.slug, slug)).limit(1);
  if (!linhaCurso) return null;

  const linhasModulos = await db.select().from(modules).where(eq(modules.courseId, linhaCurso.id)).orderBy(modules.ordem);
  const idsModulos = linhasModulos.map((m) => m.id);

  const linhasAulas = idsModulos.length
    ? await db.select().from(lessons).where(inArray(lessons.moduleId, idsModulos)).orderBy(lessons.ordem)
    : [];
  const idsAulas = linhasAulas.map((a) => a.id);

  const linhasMidia = idsAulas.length ? await db.select().from(lessonMedia).where(inArray(lessonMedia.lessonId, idsAulas)) : [];
  const midiaPorAula = new Map(linhasMidia.map((m) => [m.lessonId, { provider: m.videoProvider, videoId: m.videoId }]));

  const modulosResultado: ModuloAdmin[] = linhasModulos.map((m) => ({
    id: m.id,
    titulo: m.titulo,
    ordem: m.ordem,
    aulas: linhasAulas
      .filter((a) => a.moduleId === m.id)
      .map((a) => ({ ...paraAula(a), midia: midiaPorAula.get(a.id) ?? null })),
  }));

  return { ...paraCurso(linhaCurso), modulos: modulosResultado };
}

/** slug/titulo únicos são garantidos pelo índice único do banco
 *  (courses.slug), não por um SELECT-antes-do-INSERT: um check-then-act
 *  teria uma corrida real entre duas submissões quase simultâneas (dois
 *  cliques, duas abas) — as duas leituras passam, as duas escritas tentam
 *  entrar, e a segunda quebraria com uma exceção não tratada em vez do
 *  'slug_existe' esperado. Deixar o banco decidir e traduzir a violação de
 *  unicidade fecha a corrida (mesmo padrão de lib/plataforma/usuarios.ts). */
export async function criarCurso(titulo: string): Promise<{ ok: true; slug: string } | { ok: false; motivo: "slug_existe" }> {
  const slug = gerarSlug(titulo);
  if (!slug) return { ok: false, motivo: "slug_existe" }; // título sem nenhum caractere aproveitável (só símbolos/emoji)

  const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${courses.ordem}), 0)::int` }).from(courses);
  try {
    await db.insert(courses).values({ slug, titulo, publicado: false, ordem: (max ?? 0) + 1 });
    return { ok: true, slug };
  } catch (e) {
    if (ehViolacaoDeUnicidade(e)) return { ok: false, motivo: "slug_existe" };
    throw e;
  }
}

export async function salvarCurso(
  id: string,
  campos: { titulo: string; slug: string; descricao: string; capaUrl: string; nivel: string; cargaHoras: number; ordem: number },
): Promise<{ ok: true } | { ok: false; motivo: "slug_existe" }> {
  try {
    await db
      .update(courses)
      .set({
        titulo: campos.titulo,
        slug: campos.slug,
        descricao: campos.descricao,
        capaUrl: campos.capaUrl,
        nivel: campos.nivel,
        cargaHoras: String(campos.cargaHoras),
        ordem: campos.ordem,
      })
      .where(eq(courses.id, id));
    return { ok: true };
  } catch (e) {
    // UPDATE é uma única declaração — se ela quebra, o Postgres desfaz tudo
    // (nunca aplica metade dos campos); a linha continua exatamente como
    // estava antes desta chamada.
    if (ehViolacaoDeUnicidade(e)) return { ok: false, motivo: "slug_existe" };
    throw e;
  }
}

/** Não bloqueia a mudança de status — devolve um aviso informativo para o
 *  admin decidir com contexto: aulas sem vídeo ainda mostram "em produção"
 *  para o aluno (Task 2), e ocultar um curso com progresso ativo não some
 *  com o progresso, só barra acesso novo às aulas. */
export async function definirPublicado(
  id: string,
  publicado: boolean,
): Promise<{ ok: true; aviso: "aulas_sem_video" | "alunos_ativos" | null; n: number }> {
  await db.update(courses).set({ publicado }).where(eq(courses.id, id));

  if (publicado) {
    const [linha] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(lessons)
      .innerJoin(modules, eq(modules.id, lessons.moduleId))
      .leftJoin(lessonMedia, eq(lessonMedia.lessonId, lessons.id))
      .where(and(eq(modules.courseId, id), isNull(lessonMedia.lessonId)));
    const n = linha?.n ?? 0;
    return { ok: true, aviso: n > 0 ? "aulas_sem_video" : null, n };
  }

  const [linha] = await db
    .select({ n: sql<number>`count(distinct ${lessonProgress.userId})::int` })
    .from(lessonProgress)
    .innerJoin(lessons, eq(lessons.id, lessonProgress.lessonId))
    .innerJoin(modules, eq(modules.id, lessons.moduleId))
    .where(eq(modules.courseId, id));
  const n = linha?.n ?? 0;
  return { ok: true, aviso: n > 0 ? "alunos_ativos" : null, n };
}

async function idsDasAulas(nivel: "curso" | "modulo" | "aula", id: string): Promise<string[]> {
  if (nivel === "aula") {
    const linhas = await db.select({ id: lessons.id }).from(lessons).where(eq(lessons.id, id));
    return linhas.map((l) => l.id);
  }
  if (nivel === "modulo") {
    const linhas = await db.select({ id: lessons.id }).from(lessons).where(eq(lessons.moduleId, id));
    return linhas.map((l) => l.id);
  }
  const linhas = await db
    .select({ id: lessons.id })
    .from(lessons)
    .innerJoin(modules, eq(modules.id, lessons.moduleId))
    .where(eq(modules.courseId, id));
  return linhas.map((l) => l.id);
}

/** Usado na confirmação de exclusão (curso/módulo/aula): quantas aulas somem
 *  e quantos alunos DISTINTOS têm alguma linha de progresso nelas — inclui
 *  progresso não concluído (segundosAssistidos > 0), porque a exclusão apaga
 *  a linha de lesson_progress independente do estado "concluida". */
export async function contarImpacto(nivel: "curso" | "modulo" | "aula", id: string): Promise<Impacto> {
  const idsAulas = await idsDasAulas(nivel, id);
  if (!idsAulas.length) return { aulas: 0, alunosComProgresso: 0 };

  const [linha] = await db
    .select({ n: sql<number>`count(distinct ${lessonProgress.userId})::int` })
    .from(lessonProgress)
    .where(inArray(lessonProgress.lessonId, idsAulas));

  return { aulas: idsAulas.length, alunosComProgresso: linha?.n ?? 0 };
}

export type ImpactoDoCurso = { curso: Impacto; porModulo: Map<string, Impacto>; porAula: Map<string, Impacto> };

/** Batelada de contarImpacto para TODA a árvore de um curso, em 2 queries no
 *  total — não N chamadas de contarImpacto (uma por módulo + uma por aula).
 *  A página de detalhe do curso (que mostra o aviso de exclusão de CADA
 *  módulo e CADA aula ao mesmo tempo) usa esta função; contarImpacto(nivel,id)
 *  continua existindo para o caso de um item isolado (ex.: confirmar a
 *  exclusão de só uma aula). */
export async function contarImpactoDoCurso(courseId: string): Promise<ImpactoDoCurso> {
  const linhasAulas = await db
    .select({ id: lessons.id, moduleId: lessons.moduleId })
    .from(lessons)
    .innerJoin(modules, eq(modules.id, lessons.moduleId))
    .where(eq(modules.courseId, courseId));
  const idsAulas = linhasAulas.map((a) => a.id);

  const progressoLinhas = idsAulas.length
    ? await db
        .select({ lessonId: lessonProgress.lessonId, userId: lessonProgress.userId })
        .from(lessonProgress)
        .where(inArray(lessonProgress.lessonId, idsAulas))
    : [];

  const usuariosPorAula = new Map<string, Set<string>>();
  for (const p of progressoLinhas) {
    const conjunto = usuariosPorAula.get(p.lessonId) ?? new Set<string>();
    conjunto.add(p.userId);
    usuariosPorAula.set(p.lessonId, conjunto);
  }

  const porAula = new Map<string, Impacto>();
  const aulasPorModulo = new Map<string, string[]>();
  for (const a of linhasAulas) {
    porAula.set(a.id, { aulas: 1, alunosComProgresso: usuariosPorAula.get(a.id)?.size ?? 0 });
    const doModulo = aulasPorModulo.get(a.moduleId) ?? [];
    doModulo.push(a.id);
    aulasPorModulo.set(a.moduleId, doModulo);
  }

  const porModulo = new Map<string, Impacto>();
  const usuariosDoCurso = new Set<string>();
  for (const [moduleId, idsDoModulo] of aulasPorModulo) {
    const usuariosDoModulo = new Set<string>();
    for (const aulaId of idsDoModulo) {
      for (const userId of usuariosPorAula.get(aulaId) ?? []) {
        usuariosDoModulo.add(userId);
        usuariosDoCurso.add(userId);
      }
    }
    porModulo.set(moduleId, { aulas: idsDoModulo.length, alunosComProgresso: usuariosDoModulo.size });
  }

  return {
    curso: { aulas: linhasAulas.length, alunosComProgresso: usuariosDoCurso.size },
    porModulo,
    porAula,
  };
}

export async function excluirCurso(id: string): Promise<ResultadoAcao> {
  const [curso] = await db.select({ id: courses.id, publicado: courses.publicado }).from(courses).where(eq(courses.id, id)).limit(1);
  if (!curso) return { ok: false, motivo: "nao_encontrado" };
  if (curso.publicado) return { ok: false, motivo: "curso_publicado" };
  await db.delete(courses).where(eq(courses.id, id)); // cascade: modules → lessons → lesson_media/lesson_progress
  return { ok: true };
}

export async function criarModulo(courseId: string, titulo: string): Promise<void> {
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${modules.ordem}), 0)::int` })
    .from(modules)
    .where(eq(modules.courseId, courseId));
  await db.insert(modules).values({ courseId, titulo, ordem: (max ?? 0) + 1 });
}

export async function salvarModulo(id: string, titulo: string): Promise<void> {
  await db.update(modules).set({ titulo }).where(eq(modules.id, id));
}

/** Transação: lê o vizinho pela ordem (ordemAtual + direção) dentro do MESMO
 *  curso e troca os dois valores. Sem vizinho (extremo da lista) → no-op. */
export async function moverModulo(id: string, direcao: -1 | 1): Promise<void> {
  await db.transaction(async (tx) => {
    const [atual] = await tx.select({ id: modules.id, courseId: modules.courseId, ordem: modules.ordem }).from(modules).where(eq(modules.id, id)).limit(1);
    if (!atual) return;
    const [vizinho] = await tx
      .select({ id: modules.id, ordem: modules.ordem })
      .from(modules)
      .where(and(eq(modules.courseId, atual.courseId), eq(modules.ordem, atual.ordem + direcao)))
      .limit(1);
    if (!vizinho) return;
    await tx.update(modules).set({ ordem: vizinho.ordem }).where(eq(modules.id, atual.id));
    await tx.update(modules).set({ ordem: atual.ordem }).where(eq(modules.id, vizinho.id));
  });
}

export async function excluirModulo(id: string): Promise<void> {
  await db.delete(modules).where(eq(modules.id, id)); // cascade: lessons → lesson_media/lesson_progress
}

export async function criarAula(moduleId: string, titulo: string): Promise<{ ok: true; slug: string } | { ok: false; motivo: "slug_existe" }> {
  const slug = gerarSlug(titulo);
  if (!slug) return { ok: false, motivo: "slug_existe" }; // título sem nenhum caractere aproveitável

  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${lessons.ordem}), 0)::int` })
    .from(lessons)
    .where(eq(lessons.moduleId, moduleId));
  try {
    await db.insert(lessons).values({ moduleId, slug, titulo, ordem: (max ?? 0) + 1 });
    return { ok: true, slug };
  } catch (e) {
    // unicidade é por (moduleId, slug) — lessons_modulo_slug — então o mesmo
    // título em módulos DIFERENTES nunca colide; só dentro do mesmo módulo.
    if (ehViolacaoDeUnicidade(e)) return { ok: false, motivo: "slug_existe" };
    throw e;
  }
}

export async function salvarAula(
  id: string,
  campos: { titulo: string; slug: string; descricao: string; duracaoSeg: number; gratuita: boolean },
): Promise<{ ok: true } | { ok: false; motivo: "slug_existe" }> {
  try {
    await db
      .update(lessons)
      .set({
        titulo: campos.titulo,
        slug: campos.slug,
        descricao: campos.descricao,
        duracaoSeg: campos.duracaoSeg,
        gratuita: campos.gratuita,
      })
      .where(eq(lessons.id, id));
    // 0 linhas afetadas = aula já não existe (corrida rara) — nada a fazer, nada a reportar.
    return { ok: true };
  } catch (e) {
    if (ehViolacaoDeUnicidade(e)) return { ok: false, motivo: "slug_existe" };
    throw e;
  }
}

/** Mesmo padrão de moverModulo, só que o vizinho é buscado dentro do MESMO módulo. */
export async function moverAula(id: string, direcao: -1 | 1): Promise<void> {
  await db.transaction(async (tx) => {
    const [atual] = await tx.select({ id: lessons.id, moduleId: lessons.moduleId, ordem: lessons.ordem }).from(lessons).where(eq(lessons.id, id)).limit(1);
    if (!atual) return;
    const [vizinho] = await tx
      .select({ id: lessons.id, ordem: lessons.ordem })
      .from(lessons)
      .where(and(eq(lessons.moduleId, atual.moduleId), eq(lessons.ordem, atual.ordem + direcao)))
      .limit(1);
    if (!vizinho) return;
    await tx.update(lessons).set({ ordem: vizinho.ordem }).where(eq(lessons.id, atual.id));
    await tx.update(lessons).set({ ordem: atual.ordem }).where(eq(lessons.id, vizinho.id));
  });
}

export async function excluirAula(id: string): Promise<void> {
  await db.delete(lessons).where(eq(lessons.id, id)); // cascade: lesson_media/lesson_progress
}

/** videoId vazio (string em branco após trim) apaga a linha — a aula volta a
 *  "sem vídeo" para lib/plataforma/dados.ts (buscarMidia depende da linha
 *  EXISTIR, nunca de um videoId vazio dentro dela). */
export async function salvarMidia(lessonId: string, provider: "youtube" | "panda" | "mux", videoId: string): Promise<void> {
  const valor = videoId.trim();
  if (!valor) {
    await db.delete(lessonMedia).where(eq(lessonMedia.lessonId, lessonId));
    return;
  }
  await db
    .insert(lessonMedia)
    .values({ lessonId, videoProvider: provider, videoId: valor })
    .onConflictDoUpdate({ target: lessonMedia.lessonId, set: { videoProvider: provider, videoId: valor } });
}
