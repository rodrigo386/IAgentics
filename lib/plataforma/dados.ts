import "server-only"; // build falha se um componente client importar isto
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses, lessonMedia, lessonProgress, lessons, modules, subscriptions, users } from "@/lib/db/schema";
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

/** subscriptions não tem unique em userId — o histórico de mudanças de status
 *  fica todo lá. "Status atual" é sempre a linha mais recente por createdAt;
 *  temAcesso (abaixo) tem que derivar deste MESMO critério, nunca de "já
 *  teve alguma linha ativa/manual" em algum momento. */
export async function buscarAssinatura(userId: string): Promise<StatusAssinatura> {
  const [linha] = await db
    .select({ status: subscriptions.status })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);
  return (linha?.status as StatusAssinatura) ?? null;
}

/** Só chamada pela página de conta quando buscarAssinatura devolve "ativa"
 *  (no Ciclo 1 essa branch é inatingível com dado real — nada grava status
 *  "ativa", só "manual" via SQL — mas o texto por extenso fica pronto para
 *  quando o Asaas existir). Mesmo critério de "mais recente" de buscarAssinatura. */
export async function buscarFimAssinatura(userId: string): Promise<Date | null> {
  const [linha] = await db
    .select({ ate: subscriptions.currentPeriodEnd })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);
  return linha?.ate ?? null;
}

/** Fix round final (I1): consulta users.ativo direto no banco, nunca o JWT —
 *  a sessão fica viva até o cookie expirar mesmo depois de um admin desativar
 *  a conta, então "está autenticado" e "a conta ainda existe/está ativa" são
 *  perguntas diferentes. Mesmo padrão de ehAdminAtivo (lib/admin/sessao.ts). */
export async function contaAtiva(userId: string): Promise<boolean> {
  const [linha] = await db.select({ ativo: users.ativo }).from(users).where(eq(users.id, userId)).limit(1);
  return linha?.ativo ?? false;
}

/** O portão de acesso pago: única checagem de assinatura ativa/manual da
 *  camada de dados. Toda função sensível recebe userId explícito — nunca lê
 *  sessão sozinha, para nunca ser chamada "sem querer" para o usuário errado.
 *  Fonte de verdade única com buscarAssinatura: mesma linha mais recente.
 *  Fix round final (I1): checa contaAtiva ANTES da assinatura — desativado
 *  perde acesso pago mesmo com assinatura "manual"/"ativa" válida no histórico
 *  e com JWT ainda vivo. Aula gratuita não passa por aqui (buscarMidia só
 *  chama temAcesso para conteúdo pago), então continua liberada — aceitável:
 *  o alvo é cortar MÍDIA PAGA e ESCRITA de progresso, não o catálogo grátis. */
export async function temAcesso(userId: string): Promise<boolean> {
  if (!(await contaAtiva(userId))) return false;
  const status = await buscarAssinatura(userId);
  return status === "ativa" || status === "manual";
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

/** Fix round final (I3): portão de ACESSO, separado do portão de MÍDIA
 *  (buscarMidia). Antes, "sem linha em lesson_media" (aula publicada mas
 *  ainda sem vídeo cadastrado) e "sem acesso pago" produziam o MESMO null de
 *  buscarMidia — a página não conseguia distinguir "está em produção" de
 *  "assine para ver", e mostrava a trava de venda pra quem já é assinante.
 *  Esta função consulta só lessons→modules→courses, de propósito SEM tocar
 *  em lesson_media: responde "o usuário poderia ver esta aula", não "existe
 *  vídeo pra ela". */
export async function podeVerAula(userId: string, lessonId: string): Promise<boolean> {
  const [linha] = await db
    .select({
      gratuita: lessons.gratuita,
      publicado: courses.publicado,
    })
    .from(lessons)
    .innerJoin(modules, eq(modules.id, lessons.moduleId))
    .innerJoin(courses, eq(courses.id, modules.courseId))
    .where(eq(lessons.id, lessonId))
    .limit(1);
  if (!linha || !linha.publicado) return false;
  return linha.gratuita || (await temAcesso(userId));
}

/** Portão de escrita, espelho do portão de acesso (podeVerAula): só quem
 *  poderia assistir a aula pode gravar progresso nela. Sem isto, qualquer
 *  usuário autenticado (sem checagem de acesso ao lessonId) conseguia chamar
 *  as server actions com o id de uma aula paga e fabricar `concluida: true`
 *  de conteúdo que nunca assistiu. Delega a podeVerAula (não mais a
 *  buscarMidia) para não depender de lesson_media já ter linha — uma aula
 *  publicada sem vídeo ainda cadastrado continua um alvo legítimo de
 *  progresso zero/fabricado bloqueado, sem ficar amarrado a mídia existir. */
export async function podeGravarProgresso(userId: string, lessonId: string): Promise<boolean> {
  return podeVerAula(userId, lessonId);
}

export async function gravarProgresso(
  userId: string,
  lessonId: string,
  campos: { concluida?: boolean; segundosAssistidos?: number },
): Promise<void> {
  const marcandoConcluida = campos.concluida === true;
  await db
    .insert(lessonProgress)
    .values({
      userId,
      lessonId,
      concluida: campos.concluida ?? false,
      segundosAssistidos: campos.segundosAssistidos ?? 0,
      // Insert só acontece na primeira linha do par (userId, lessonId) — sem
      // histórico prévio pra preservar: concluidaEm nasce agora se já chega
      // concluída, senão fica em aberto.
      concluidaEm: marcandoConcluida ? new Date() : null,
    })
    .onConflictDoUpdate({
      target: [lessonProgress.userId, lessonProgress.lessonId],
      set: {
        ...campos,
        updatedAt: new Date(), // sempre sobe — "último acesso" da Task 2 depende disso
        // Replay (marcar concluída de novo numa aula já concluída) NÃO pode
        // "renovar" a data de conclusão pras métricas por período — só grava
        // now() na PRIMEIRA vez que concluida vira true. lesson_progress.concluida
        // aqui, sem EXCLUDED, lê o valor da linha ANTES deste upsert.
        ...(marcandoConcluida
          ? {
              concluidaEm: sql`case when ${lessonProgress.concluida} then ${lessonProgress.concluidaEm} else now() end`,
            }
          : {}),
      },
    });
}
