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
  // Caso comum pós-certificação (replay de "concluída"): 1 query só, antes das 3 caras.
  if (await doAlunoNoCurso(userId, courseId)) return;

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
