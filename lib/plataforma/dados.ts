import "server-only"; // build falha se um componente client importar isto
import { and, desc, eq, gt, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  contratoCursos,
  contratoMembros,
  contratos,
  courses,
  lessonMedia,
  lessonProgress,
  lessons,
  modules,
  subscriptions,
  users,
} from "@/lib/db/schema";
import { emitirSeConcluido } from "./certificados";
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
 *  ehAssinante (abaixo) tem que derivar deste MESMO critério, nunca de "já
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

/* ---------------------------------------------------------------------------
   DIREITO DE ACESSO POR CURSO

   Até 2026-08-20 acesso era um booleano para o acervo inteiro — uma função
   `temAcesso`, removida nesta refatoração. A venda B2B em grupo vende CURSOS
   ESPECÍFICOS por contrato, então acesso virou um conjunto de cursos, e "é
   assinante" deixou de ser a mesma pergunta que "pode assistir a isto".

   O que valia para a antiga temAcesso e continua valendo para as três abaixo:

   - Toda função sensível recebe userId EXPLÍCITO e nunca lê a sessão sozinha,
     para não haver como chamá-la "sem querer" para o usuário errado.
   - Fonte de verdade única com buscarAssinatura: a mesma linha mais recente.
   - `contaAtiva` é checada ANTES da assinatura (fix round final, I1): conta
     desativada perde acesso mesmo com assinatura "manual"/"ativa" válida no
     histórico e com JWT ainda vivo.
   - Aula gratuita NÃO passa por aqui: buscarMidia e podeVerAula só consultam o
     direito para conteúdo pago, então o catálogo grátis continua liberado. É
     deliberado — o alvo é cortar mídia paga e escrita de progresso, não o que
     é aberto de propósito.

   Spec: docs/superpowers/specs/2026-08-20-direito-de-acesso-por-curso-design.md
--------------------------------------------------------------------------- */

/**
 * A pergunta COMERCIAL: este aluno é assinante?
 *
 * É o comportamento literal do antigo `temAcesso`, com o nome da pergunta que
 * ele de fato responde. Quem chama isto quer saber da relação comercial —
 * mostrar CTA de assinatura, o banner do painel, barrar segunda assinatura no
 * Asaas. NÃO serve para decidir se alguém pode assistir a um curso: a partir do
 * contrato B2B as duas respostas deixam de coincidir.
 */
export async function ehAssinante(userId: string): Promise<boolean> {
  if (!(await contaAtiva(userId))) return false;
  const status = await buscarAssinatura(userId);
  return status === "ativa" || status === "manual";
}

/**
 * A pergunta de ACESSO, em lote: a que cursos este aluno tem direito?
 *
 * Direito é DERIVADO, nunca armazenado — calculado perguntando a cada fonte no
 * momento da consulta. Tabela de direitos materializada é a origem clássica de
 * divergência aqui: assinatura cancela, contrato vence, membro sai do grupo, e
 * a tabela segue afirmando o contrário até alguém rodar uma varredura.
 *
 * Hoje há uma fonte só: a assinatura, que dá direito ao acervo publicado
 * inteiro. O contrato B2B entra AQUI e em `podeAcessarCurso`, como UNIÃO —
 * basta uma fonte conceder. Nunca "a linha mais recente vence": uma pessoa pode
 * ter assinatura própria E estar num grupo, e o fim do contrato do grupo não
 * pode derrubar o que ela paga sozinha.
 *
 * Em lote de propósito: o painel renderiza ~10 cards e uma consulta por card
 * multiplicaria por 10 a pressão sobre o pool (armadilha 8 do CLAUDE.md). São 3
 * consultas fixas, independentemente de quantos cursos existirem.
 */
export async function direitosDoAluno(userId: string): Promise<Set<string>> {
  /* contaAtiva no TOPO, não mais só dentro de ehAssinante (etapa 2): com o
     contrato como segunda fonte, uma conta desativada com contrato vigente
     manteria acesso — o buraco do I1 reaberto por outra porta. */
  if (!(await contaAtiva(userId))) return new Set();

  const direitos = new Set<string>();

  if (await ehAssinante(userId)) {
    const publicados = await db.select({ id: courses.id }).from(courses).where(eq(courses.publicado, true));
    for (const c of publicados) direitos.add(c.id);
  }

  for (const id of await cursosPorContrato(userId)) direitos.add(id);

  return direitos;
}

/**
 * Vigente: já começou E (não tem fim OU o fim ainda não chegou).
 *
 * Vencimento é DERIVADO, não agendado — não existe job noturno cortando
 * acesso. No instante em que `fimEm` passa, a consulta para de devolver
 * aqueles cursos. Nada para sincronizar e nada que possa falhar em silêncio às
 * 3 da manhã deixando cliente com acesso que já venceu.
 */
function contratoVigente() {
  return and(lte(contratos.inicioEm, sql`now()`), or(isNull(contratos.fimEm), gt(contratos.fimEm, sql`now()`)));
}

/** Cursos liberados por contrato B2B vigente. Só curso PUBLICADO — contrato
 *  não ressuscita curso despublicado. */
async function cursosPorContrato(userId: string): Promise<string[]> {
  const linhas = await db
    .select({ id: contratoCursos.courseId })
    .from(contratoMembros)
    .innerJoin(contratos, eq(contratos.id, contratoMembros.contratoId))
    .innerJoin(contratoCursos, eq(contratoCursos.contratoId, contratos.id))
    .innerJoin(courses, eq(courses.id, contratoCursos.courseId))
    .where(
      and(
        eq(contratoMembros.userId, userId),
        isNull(contratoMembros.removidoEm),
        eq(courses.publicado, true),
        contratoVigente(),
      ),
    );
  return linhas.map((l) => l.id);
}

/**
 * A pergunta de ACESSO, para um curso só.
 *
 * Delega a `direitosDoAluno` de propósito (etapa 2): a união de fontes passa a
 * existir em UM lugar só. Duas implementações da mesma regra divergem na
 * primeira mudança — e aqui divergir significa alguém assistindo ao que não
 * comprou, ou sendo barrado do que comprou.
 *
 * Custa uma consulta a mais que a versão dedicada, num caminho que já faz
 * outras. É troca deliberada: correção acima de micro-otimização.
 */
export async function podeAcessarCurso(userId: string, courseId: string): Promise<boolean> {
  return (await direitosDoAluno(userId)).has(courseId);
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

/** O portão: sai mídia só se (aula gratuita E curso publicado) OU direito ao curso.
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
      // O join até courses já existe; o id sai de graça e evita uma consulta
      // extra só para descobrir a que curso a aula pertence.
      courseId: courses.id,
    })
    .from(lessonMedia)
    .innerJoin(lessons, eq(lessons.id, lessonMedia.lessonId))
    .innerJoin(modules, eq(modules.id, lessons.moduleId))
    .innerJoin(courses, eq(courses.id, modules.courseId))
    .where(eq(lessonMedia.lessonId, lessonId))
    .limit(1);
  if (!linha || !linha.publicado) return null;
  if (!linha.gratuita && !(await podeAcessarCurso(userId, linha.courseId))) return null;
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
      courseId: courses.id,
    })
    .from(lessons)
    .innerJoin(modules, eq(modules.id, lessons.moduleId))
    .innerJoin(courses, eq(courses.id, modules.courseId))
    .where(eq(lessons.id, lessonId))
    .limit(1);
  if (!linha || !linha.publicado) return false;
  return linha.gratuita || (await podeAcessarCurso(userId, linha.courseId));
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

  // Fechou 100%? A emissão do certificado mora na conclusão — idempotente,
  // e emitirSeConcluido re-verifica o critério inteiro (não confia no chamador).
  if (marcandoConcluida) {
    const [m] = await db
      .select({ courseId: modules.courseId })
      .from(lessons)
      .innerJoin(modules, eq(modules.id, lessons.moduleId))
      .where(eq(lessons.id, lessonId))
      .limit(1);
    if (m) {
      try {
        await emitirSeConcluido(userId, m.courseId);
      } catch (e) {
        // Efeito colateral com rede de recuperação (emissão preguiçosa na página do
        // curso) — não propaga: marcar a aula como concluída é o fluxo crítico aqui.
        console.error("emitirSeConcluido (gancho)", e);
      }
    }
  }
}
