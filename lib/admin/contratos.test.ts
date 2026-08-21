import { eq, like } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { contratoMembros, contratos, courses, empresas, users } from "@/lib/db/schema";
import { direitosDoAluno } from "@/lib/plataforma/dados";
import {
  analisarLista,
  criarContrato,
  criarEmpresa,
  importarMembros,
  previsualizarImportacao,
  readmitirMembro,
  removerMembro,
} from "./contratos";

const prefixo = `teste-contr-${Date.now()}`;

async function cenario(vagas = 5) {
  const empresa = await criarEmpresa({ nome: `${prefixo}-empresa`, cnpj: null });
  if (!empresa.ok) throw new Error("arranjo falhou");
  const [curso] = await db
    .insert(courses)
    .values({ slug: `${prefixo}-c-${Math.random().toString(36).slice(2, 8)}`, titulo: "Curso", publicado: true, ordem: 1 })
    .returning({ id: courses.id });
  const contrato = await criarContrato({
    empresaId: empresa.id,
    valor: "9000.00",
    vagas,
    inicioEm: new Date("2020-01-01T00:00:00Z"),
    fimEm: null,
    cursos: [curso.id],
  });
  if (!contrato.ok) throw new Error("arranjo falhou");
  return { empresaId: empresa.id, contratoId: contrato.id, cursoId: curso.id };
}

describe("análise da lista colada (função pura, sem banco)", () => {
  it("normaliza caixa, apara espaço e aceita vírgula, ponto-e-vírgula e quebra de linha", () => {
    const r = analisarLista(" Maria@Empresa.com , joao@empresa.com\nANA@empresa.com; pedro@empresa.com ");
    expect(r.validos).toEqual([
      "maria@empresa.com",
      "joao@empresa.com",
      "ana@empresa.com",
      "pedro@empresa.com",
    ]);
    expect(r.invalidos).toEqual([]);
  });

  it("remove duplicata dentro da própria lista, inclusive por caixa", () => {
    const r = analisarLista("maria@empresa.com\nMARIA@Empresa.com");
    expect(r.validos).toEqual(["maria@empresa.com"]);
  });

  it("separa os inválidos em vez de descartar em silêncio", () => {
    const r = analisarLista("ok@empresa.com\nsem-arroba\n@semlocal.com\nespaço @empresa.com");
    expect(r.validos).toEqual(["ok@empresa.com"]);
    expect(r.invalidos).toHaveLength(3);
  });
});

describe.skipIf(!process.env.DATABASE_URL)("importação de membros", () => {
  afterAll(async () => {
    await db.delete(empresas).where(like(empresas.nome, `${prefixo}%`));
    await db.delete(courses).where(like(courses.slug, `${prefixo}%`));
    await db.delete(users).where(like(users.email, `${prefixo}%`));
  });

  it("pré-visualização classifica sem gravar nada", async () => {
    const { contratoId } = await cenario();
    const jaTemConta = `${prefixo}-existente@teste.invalido`;
    await db.insert(users).values({ nome: "Já existe", email: jaTemConta, senhaHash: "x" });

    const previa = await previsualizarImportacao(contratoId, `${jaTemConta}\n${prefixo}-novo@teste.invalido\nquebrado`);
    expect(previa.jaTemConta).toEqual([jaTemConta]);
    expect(previa.novos).toEqual([`${prefixo}-novo@teste.invalido`]);
    expect(previa.invalidos).toHaveLength(1);
    expect(previa.cabe).toBe(true);

    // nada gravado
    const linhas = await db.select().from(contratoMembros).where(eq(contratoMembros.contratoId, contratoId));
    expect(linhas).toHaveLength(0);
  });

  /* Tudo-ou-nada: importar até encher faria o Rodrigo descobrir pela metade
     que faltou vaga, com a lista do cliente já parcialmente dentro. */
  it("recusa a lista INTEIRA quando estoura as vagas, sem gravar nada", async () => {
    const { contratoId } = await cenario(2);
    const lista = [1, 2, 3].map((n) => `${prefixo}-e${n}@teste.invalido`).join("\n");

    const r = await importarMembros(contratoId, lista);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe("sem_vagas");

    const linhas = await db.select().from(contratoMembros).where(eq(contratoMembros.contratoId, contratoId));
    expect(linhas).toHaveLength(0);
  });

  it("vincula na hora quem já tem conta, e o direito aparece imediatamente", async () => {
    const { contratoId, cursoId } = await cenario();
    const email = `${prefixo}-comconta@teste.invalido`;
    const [usuario] = await db
      .insert(users)
      .values({ nome: "Com Conta", email, senhaHash: "x" })
      .returning({ id: users.id });

    const r = await importarMembros(contratoId, email);
    expect(r.ok).toBe(true);
    expect((await direitosDoAluno(usuario.id)).has(cursoId)).toBe(true);
  });

  it("importar de novo não duplica quem já está no contrato", async () => {
    const { contratoId } = await cenario();
    const email = `${prefixo}-repetido@teste.invalido`;
    await importarMembros(contratoId, email);
    const r = await importarMembros(contratoId, email);
    expect(r.ok).toBe(true);
    const linhas = await db.select().from(contratoMembros).where(eq(contratoMembros.contratoId, contratoId));
    expect(linhas).toHaveLength(1);
  });

  it("remoção corta o acesso, libera a vaga, e readmissão devolve o acesso", async () => {
    const { contratoId, cursoId } = await cenario(1);
    const email = `${prefixo}-ciclo@teste.invalido`;
    const [usuario] = await db
      .insert(users)
      .values({ nome: "Ciclo", email, senhaHash: "x" })
      .returning({ id: users.id });

    await importarMembros(contratoId, email);
    expect((await direitosDoAluno(usuario.id)).has(cursoId)).toBe(true);

    const [membro] = await db.select().from(contratoMembros).where(eq(contratoMembros.contratoId, contratoId));
    expect((await removerMembro(membro.id)).ok).toBe(true);
    expect((await direitosDoAluno(usuario.id)).size).toBe(0);

    // vaga liberada: o contrato de 1 vaga aceita alguém de novo
    const outro = await importarMembros(contratoId, `${prefixo}-outro@teste.invalido`);
    expect(outro.ok).toBe(true);

    // e readmitir o primeiro agora NÃO cabe (a vaga foi ocupada)
    expect((await readmitirMembro(membro.id)).ok).toBe(false);
  });
});
