import { eq, like } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { contratoCursos, contratoMembros, contratos, courses, empresas, users } from "@/lib/db/schema";
import { direitosDoAluno } from "./dados";
import { vincularMembroPorEmail } from "./vinculo";

/**
 * O vínculo entre e-mail pré-autorizado e conta.
 *
 * É a peça que sustenta a decisão de arquitetura da etapa 2: como NÃO existe
 * canal de e-mail em produção (RESEND_API_KEY é pendência), a importação
 * registra e-mails autorizados em vez de criar contas e convidar. A pessoa
 * cria a própria conta e o sistema liga as pontas aqui.
 *
 * Spec: docs/superpowers/specs/2026-08-20-contrato-b2b-design.md
 */
const prefixo = `teste-vinc-${Date.now()}`;

async function contratoComEmailAutorizado(email: string) {
  const [empresa] = await db
    .insert(empresas)
    .values({ nome: `${prefixo}-empresa` })
    .returning({ id: empresas.id });
  const [curso] = await db
    .insert(courses)
    .values({ slug: `${prefixo}-curso-${Math.random().toString(36).slice(2, 8)}`, titulo: "Curso do contrato", publicado: true, ordem: 1 })
    .returning({ id: courses.id });
  const [contrato] = await db
    .insert(contratos)
    .values({ empresaId: empresa.id, valor: "5000.00", vagas: 5 })
    .returning({ id: contratos.id });
  await db.insert(contratoCursos).values({ contratoId: contrato.id, courseId: curso.id });
  // Pré-autorização: e-mail no contrato, SEM userId — a pessoa ainda não existe.
  await db.insert(contratoMembros).values({ contratoId: contrato.id, email });
  return { cursoId: curso.id, contratoId: contrato.id };
}

describe.skipIf(!process.env.DATABASE_URL)("vínculo de membro por e-mail", () => {
  afterAll(async () => {
    await db.delete(empresas).where(like(empresas.nome, `${prefixo}%`));
    await db.delete(courses).where(like(courses.slug, `${prefixo}%`));
    await db.delete(users).where(like(users.email, `${prefixo}%`));
  });

  it("liga a conta ao membro pré-autorizado e o direito aparece", async () => {
    const email = `${prefixo}-novo@teste.invalido`;
    const { cursoId } = await contratoComEmailAutorizado(email);

    const [usuario] = await db
      .insert(users)
      .values({ nome: "Pessoa Nova", email, senhaHash: "x" })
      .returning({ id: users.id });

    // Antes do vínculo: membro existe, mas não aponta para ninguém.
    expect((await direitosDoAluno(usuario.id)).size).toBe(0);

    expect(await vincularMembroPorEmail(usuario.id, email)).toBe(1);
    expect((await direitosDoAluno(usuario.id)).has(cursoId)).toBe(true);
  });

  /* O caso que o check do banco protege e este teste prova ponta a ponta: a
     planilha do cliente vem com caixa mista. Sem normalizar, a pessoa fica
     pré-autorizada e NUNCA recebe acesso — sem erro, sem log. */
  it("casa mesmo com caixa diferente entre a lista e o cadastro", async () => {
    const emailMinusculo = `${prefixo}-caixa@teste.invalido`;
    const { cursoId } = await contratoComEmailAutorizado(emailMinusculo);

    const [usuario] = await db
      .insert(users)
      .values({ nome: "Pessoa Caixa", email: emailMinusculo, senhaHash: "x" })
      .returning({ id: users.id });

    // Chamado com a caixa que o formulário recebeu, não a normalizada.
    const comCaixaMista = `${prefixo}-CAIXA@Teste.Invalido`.replace(`${prefixo}-CAIXA`, `${prefixo}-Caixa`);
    expect(await vincularMembroPorEmail(usuario.id, comCaixaMista)).toBe(1);
    expect((await direitosDoAluno(usuario.id)).has(cursoId)).toBe(true);
  });

  it("é idempotente: rodar de novo não muda nada", async () => {
    const email = `${prefixo}-idem@teste.invalido`;
    await contratoComEmailAutorizado(email);
    const [usuario] = await db
      .insert(users)
      .values({ nome: "Pessoa Idem", email, senhaHash: "x" })
      .returning({ id: users.id });

    expect(await vincularMembroPorEmail(usuario.id, email)).toBe(1);
    expect(await vincularMembroPorEmail(usuario.id, email)).toBe(0);
  });

  it("não liga membro removido", async () => {
    const email = `${prefixo}-removido@teste.invalido`;
    const { contratoId } = await contratoComEmailAutorizado(email);
    await db
      .update(contratoMembros)
      .set({ removidoEm: new Date() })
      .where(eq(contratoMembros.contratoId, contratoId));

    const [usuario] = await db
      .insert(users)
      .values({ nome: "Pessoa Removida", email, senhaHash: "x" })
      .returning({ id: users.id });

    expect(await vincularMembroPorEmail(usuario.id, email)).toBe(0);
    expect((await direitosDoAluno(usuario.id)).size).toBe(0);
  });

  it("e-mail sem pré-autorização nenhuma não liga nada", async () => {
    const [usuario] = await db
      .insert(users)
      .values({ nome: "Pessoa Solta", email: `${prefixo}-solta@teste.invalido`, senhaHash: "x" })
      .returning({ id: users.id });
    expect(await vincularMembroPorEmail(usuario.id, `${prefixo}-solta@teste.invalido`)).toBe(0);
  });
});
