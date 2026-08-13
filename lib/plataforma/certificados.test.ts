import { eq, like } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { certificates, courses, lessons, modules, users } from "@/lib/db/schema";
import { gravarProgresso } from "./dados";
import { buscarPorCodigo, doAlunoNoCurso, emitirSeConcluido, gerarCodigo, listarDoAluno } from "./certificados";

const prefixo = `teste-cert-${Date.now()}`;

let aluno: { id: string };
let cursoId: string;
let cursoOcultoId: string;
let aula1: string;
let aula2: string;
let aulaOculta: string;

describe.skipIf(!process.env.DATABASE_URL)("certificados", () => {
  beforeAll(async () => {
    [aluno] = await db
      .insert(users)
      .values({ nome: "Aluno Certificado", email: `${prefixo}-aluno@teste.invalido`, senhaHash: "x" })
      .returning({ id: users.id });
    const [curso] = await db
      .insert(courses)
      .values({ slug: `${prefixo}-curso`, titulo: "Curso Cert", cargaHoras: "6", publicado: true })
      .returning({ id: courses.id });
    cursoId = curso.id;
    const [mod] = await db.insert(modules).values({ courseId: cursoId, titulo: "M1" }).returning({ id: modules.id });
    const [a1] = await db.insert(lessons).values({ moduleId: mod.id, slug: "a1", titulo: "A1", gratuita: true }).returning({ id: lessons.id });
    const [a2] = await db.insert(lessons).values({ moduleId: mod.id, slug: "a2", titulo: "A2" }).returning({ id: lessons.id });
    aula1 = a1.id;
    aula2 = a2.id;

    const [oculto] = await db
      .insert(courses)
      .values({ slug: `${prefixo}-oculto`, titulo: "Curso Oculto Cert", publicado: false })
      .returning({ id: courses.id });
    cursoOcultoId = oculto.id;
    const [modO] = await db.insert(modules).values({ courseId: cursoOcultoId, titulo: "M1" }).returning({ id: modules.id });
    const [aO] = await db.insert(lessons).values({ moduleId: modO.id, slug: "a1", titulo: "A1" }).returning({ id: lessons.id });
    aulaOculta = aO.id;
  });

  afterAll(async () => {
    await db.delete(users).where(like(users.email, `${prefixo}-%`)); // certificates/progresso caem por cascade
    await db.delete(courses).where(like(courses.slug, `${prefixo}-%`));
  });

  it("gerarCodigo: formato XXXX-XXXX-XX sem caracteres ambíguos", () => {
    for (let i = 0; i < 50; i++) {
      const c = gerarCodigo();
      expect(c).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{2}$/);
    }
  });

  it("99% não emite; fechar 100% via gravarProgresso emite; repetir não duplica", async () => {
    await gravarProgresso(aluno.id, aula1, { concluida: true });
    expect(await doAlunoNoCurso(aluno.id, cursoId)).toBeNull(); // 1 de 2

    await gravarProgresso(aluno.id, aula2, { concluida: true }); // fecha 100% → gancho emite
    const cert = await doAlunoNoCurso(aluno.id, cursoId);
    expect(cert).not.toBeNull();

    await gravarProgresso(aluno.id, aula2, { concluida: true }); // replay
    await emitirSeConcluido(aluno.id, cursoId); // chamada direta redundante
    const linhas = await db.select().from(certificates).where(eq(certificates.userId, aluno.id));
    expect(linhas).toHaveLength(1); // idempotente
  });

  it("buscarPorCodigo: devolve dados; normaliza minúsculas/espaços; inválido → null", async () => {
    const cert = await doAlunoNoCurso(aluno.id, cursoId);
    const achado = await buscarPorCodigo(`  ${cert!.codigo.toLowerCase()}  `);
    expect(achado).toMatchObject({
      alunoId: aluno.id,
      alunoNome: "Aluno Certificado",
      cursoTitulo: "Curso Cert",
      cargaHoras: 6,
    });
    expect(achado?.emitidoEm).toBeInstanceOf(Date);
    expect(await buscarPorCodigo("XXXX-XXXX-99")).toBeNull();
  });

  it("listarDoAluno devolve o certificado emitido", async () => {
    const lista = await listarDoAluno(aluno.id);
    expect(lista).toHaveLength(1);
    expect(lista[0].cursoTitulo).toBe("Curso Cert");
  });

  it("curso oculto não emite mesmo 100% concluído", async () => {
    await gravarProgresso(aluno.id, aulaOculta, { concluida: true });
    await emitirSeConcluido(aluno.id, cursoOcultoId);
    expect(await doAlunoNoCurso(aluno.id, cursoOcultoId)).toBeNull();
  });
});
