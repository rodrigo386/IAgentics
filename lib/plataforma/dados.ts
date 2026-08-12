import "server-only"; // build falha se um componente client importar isto
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses, lessonMedia, lessonProgress, lessons, modules, subscriptions } from "@/lib/db/schema";
import type { Aula, Curso, CursoComIndice, Modulo, StatusAssinatura } from "./tipos";

/** Mapeamento explícito por campo: as colunas já vêm em camelCase do schema
 *  (drizzle), então este passo é sobre o contrato de tipos.ts, não sobre snake_case. */
function paraCurso(r: typeof courses.$inferSelect): Curso {
  return {
    id: r.id,
    slug: r.slug,
    titulo: r.titulo,
    descricao: r.descricao,
    capaUrl: r.capaUrl,
    nivel: r.nivel,
    cargaHoras: Number(r.cargaHoras),
    ordem: r.ordem,
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

/** O portão de acesso pago: única checagem de assinatura ativa/manual da
 *  camada de dados. Toda função sensível recebe userId explícito — nunca lê
 *  sessão sozinha, para nunca ser chamada "sem querer" para o usuário errado. */
export async function temAcesso(userId: string): Promise<boolean> {
  const [linha] = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), inArray(subscriptions.status, ["ativa", "manual"])))
    .limit(1);
  return !!linha;
}

export async function buscarCatalogo(): Promise<Curso[]> {
  const linhas = await db.select().from(courses).where(eq(courses.publicado, true)).orderBy(courses.ordem);
  return linhas.map(paraCurso);
}

export async function buscarCurso(slug: string): Promise<CursoComIndice | null> {
  const [linhaCurso] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.slug, slug), eq(courses.publicado, true)))
    .limit(1);
  if (!linhaCurso) return null;

  const linhasModulos = await db
    .select()
    .from(modules)
    .where(eq(modules.courseId, linhaCurso.id))
    .orderBy(modules.ordem);

  const idsModulos = linhasModulos.map((m) => m.id);
  const linhasAulas = idsModulos.length
    ? await db.select().from(lessons).where(inArray(lessons.moduleId, idsModulos)).orderBy(lessons.ordem)
    : [];

  const modulosResultado: Modulo[] = linhasModulos.map((m) => ({
    id: m.id,
    titulo: m.titulo,
    ordem: m.ordem,
    aulas: linhasAulas.filter((a) => a.moduleId === m.id).map(paraAula),
  }));

  return { ...paraCurso(linhaCurso), modulos: modulosResultado };
}

export async function buscarConcluidas(userId: string): Promise<Set<string>> {
  const linhas = await db
    .select({ lessonId: lessonProgress.lessonId })
    .from(lessonProgress)
    .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.concluida, true)));
  return new Set(linhas.map((r) => r.lessonId));
}

export async function buscarAssinatura(userId: string): Promise<StatusAssinatura> {
  const [linha] = await db
    .select({ status: subscriptions.status })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);
  return (linha?.status as StatusAssinatura) ?? null;
}

/** O portão: sai mídia só se (aula gratuita E curso publicado) OU temAcesso.
 *  Nunca lança para "sem acesso" — a chamadora decide o que mostrar com null. */
export async function buscarMidia(
  userId: string,
  lessonId: string,
): Promise<{ provider: string; videoId: string } | null> {
  const [linha] = await db
    .select({
      provider: lessonMedia.videoProvider,
      videoId: lessonMedia.videoId,
      gratuita: lessons.gratuita,
      publicado: courses.publicado,
    })
    .from(lessonMedia)
    .innerJoin(lessons, eq(lessons.id, lessonMedia.lessonId))
    .innerJoin(modules, eq(modules.id, lessons.moduleId))
    .innerJoin(courses, eq(courses.id, modules.courseId))
    .where(eq(lessonMedia.lessonId, lessonId))
    .limit(1);
  if (!linha || !linha.publicado) return null;
  if (!linha.gratuita && !(await temAcesso(userId))) return null;
  return { provider: linha.provider, videoId: linha.videoId };
}

export async function gravarProgresso(
  userId: string,
  lessonId: string,
  campos: { concluida?: boolean; segundosAssistidos?: number },
): Promise<void> {
  await db
    .insert(lessonProgress)
    .values({
      userId,
      lessonId,
      concluida: campos.concluida ?? false,
      segundosAssistidos: campos.segundosAssistidos ?? 0,
    })
    .onConflictDoUpdate({
      target: [lessonProgress.userId, lessonProgress.lessonId],
      set: { ...campos, updatedAt: new Date() },
    });
}
