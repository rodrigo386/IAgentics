import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq, like } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses, lessonProgress, lessons, modules, subscriptions, users } from "@/lib/db/schema";
import { contaAtiva, gravarProgresso, temAcesso } from "@/lib/plataforma/dados";
import { criarUsuario } from "@/lib/plataforma/usuarios";
import {
  buscarAluno,
  definirAtivo,
  definirRole,
  excluirAluno,
  liberarAcesso,
  listarAlunos,
  revogarAcesso,
} from "./alunos";

// Mesmo esqueleto de lib/plataforma/autorizacao.test.ts e lib/admin/fundacao.test.ts:
// roda contra o Postgres real, dados com prefixo próprio, afterAll limpa por cascade
// (subscriptions/lesson_progress caem junto com users; modules/lessons/lesson_media
// caem junto com courses). NUNCA toca nos dados da semente.
const prefixo = `teste-adm-alu-${Date.now()}`;
const senha = "Senha-adm-123!";

let cursoTeste: { id: string; slug: string };
let aula1: { id: string; titulo: string };
let aula2: { id: string; titulo: string };
let aula3: { id: string; titulo: string };

async function novoAluno(sufixo: string) {
  await criarUsuario({ nome: `Aluno ${sufixo}`, email: `${prefixo}-${sufixo}@t.invalido`, senha });
  const [u] = await db.select().from(users).where(eq(users.email, `${prefixo}-${sufixo}@t.invalido`));
  return u;
}

describe.skipIf(!process.env.DATABASE_URL)("regras de administração de alunos", () => {
  beforeAll(async () => {
    const [curso] = await db
      .insert(courses)
      .values({ slug: `${prefixo}-curso`, titulo: "Curso de teste admin", publicado: true, ordem: 1 })
      .returning({ id: courses.id, slug: courses.slug });
    cursoTeste = curso;
    const [modulo] = await db
      .insert(modules)
      .values({ courseId: cursoTeste.id, titulo: "Módulo de teste", ordem: 1 })
      .returning({ id: modules.id });
    const aulas = await db
      .insert(lessons)
      .values([
        { moduleId: modulo.id, slug: "aula-1", titulo: "Aula 1", ordem: 1, gratuita: true },
        { moduleId: modulo.id, slug: "aula-2", titulo: "Aula 2", ordem: 2, gratuita: true },
        { moduleId: modulo.id, slug: "aula-3", titulo: "Aula 3", ordem: 3, gratuita: true },
      ])
      .returning({ id: lessons.id, titulo: lessons.titulo });
    [aula1, aula2, aula3] = aulas;
  });

  afterAll(async () => {
    await db.delete(courses).where(like(courses.slug, `${prefixo}%`));
    await db.delete(users).where(like(users.email, `${prefixo}%`));
  });

  it("liberarAcesso insere linha manual e status do aluno vira manual", async () => {
    const aluno = await novoAluno("liberar");
    const resultado = await liberarAcesso(randomUUID(), aluno.id);
    expect(resultado).toEqual({ ok: true });
    const linhas = await db.select().from(subscriptions).where(eq(subscriptions.userId, aluno.id));
    expect(linhas).toHaveLength(1);
    expect(linhas[0].status).toBe("manual");
    expect(await temAcesso(aluno.id)).toBe(true);
  });

  it("liberar quando já tem acesso → { ok: false, motivo: 'ja_tem_acesso' } e NÃO insere segunda linha", async () => {
    const aluno = await novoAluno("jaacesso");
    await db.insert(subscriptions).values({ userId: aluno.id, status: "manual" });
    const resultado = await liberarAcesso(randomUUID(), aluno.id);
    expect(resultado).toEqual({ ok: false, motivo: "ja_tem_acesso" });
    const linhas = await db.select().from(subscriptions).where(eq(subscriptions.userId, aluno.id));
    expect(linhas).toHaveLength(1);
  });

  it("revogarAcesso insere linha cancelada (nunca UPDATE: as duas linhas existem) e temAcesso vira false", async () => {
    const aluno = await novoAluno("revogar");
    await db.insert(subscriptions).values({ userId: aluno.id, status: "manual" });
    const resultado = await revogarAcesso(randomUUID(), aluno.id);
    expect(resultado).toEqual({ ok: true });
    const linhas = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, aluno.id))
      .orderBy(subscriptions.createdAt);
    expect(linhas).toHaveLength(2);
    expect(linhas[0].status).toBe("manual");
    expect(linhas[1].status).toBe("cancelada");
    expect(await temAcesso(aluno.id)).toBe(false);
  });

  it("revogar quem não tem acesso → 'ja_sem_acesso'", async () => {
    const aluno = await novoAluno("semacesso");
    const resultado = await revogarAcesso(randomUUID(), aluno.id);
    expect(resultado).toEqual({ ok: false, motivo: "ja_sem_acesso" });
    const linhas = await db.select().from(subscriptions).where(eq(subscriptions.userId, aluno.id));
    expect(linhas).toHaveLength(0);
  });

  it("definirRole em si mesmo → 'auto' e o role não muda", async () => {
    const aluno = await novoAluno("role-self");
    const resultado = await definirRole(aluno.id, aluno.id, "admin");
    expect(resultado).toEqual({ ok: false, motivo: "auto" });
    const [depois] = await db.select().from(users).where(eq(users.id, aluno.id));
    expect(depois.role).toBe("aluno");
  });

  it("definirAtivo(false) em si mesmo → 'auto'", async () => {
    const aluno = await novoAluno("ativo-self");
    const resultado = await definirAtivo(aluno.id, aluno.id, false);
    expect(resultado).toEqual({ ok: false, motivo: "auto" });
    const [depois] = await db.select().from(users).where(eq(users.id, aluno.id));
    expect(depois.ativo).toBe(true);
  });

  // Fix round final (I1): regressão do lado admin — desativar outro aluno de
  // fato desliga contaAtiva (o portão que dados.ts/actions passam a checar).
  it("definirAtivo(false) em outro aluno desativa a conta e contaAtiva vira false", async () => {
    const aluno = await novoAluno("desativa-outro");
    expect(await contaAtiva(aluno.id)).toBe(true);
    const resultado = await definirAtivo(randomUUID(), aluno.id, false);
    expect(resultado).toEqual({ ok: true });
    expect(await contaAtiva(aluno.id)).toBe(false);
  });

  it("excluirAluno com e-mail divergente → 'email_nao_confere' e o usuário continua existindo", async () => {
    const aluno = await novoAluno("excl-errado");
    const resultado = await excluirAluno(randomUUID(), aluno.id, "email-errado@t.invalido");
    expect(resultado).toEqual({ ok: false, motivo: "email_nao_confere" });
    const [depois] = await db.select().from(users).where(eq(users.id, aluno.id));
    expect(depois).toBeDefined();
  });

  it("excluirAluno com e-mail certo apaga usuário, progresso e assinaturas (cascade)", async () => {
    const aluno = await novoAluno("excl-certo");
    await db.insert(subscriptions).values({ userId: aluno.id, status: "manual" });
    await db.insert(lessonProgress).values({ userId: aluno.id, lessonId: aula1.id, concluida: true });
    // trim + lowercase: confirmação com espaços e caixa diferente ainda confere.
    const resultado = await excluirAluno(randomUUID(), aluno.id, `  ${prefixo}-EXCL-CERTO@t.invalido  `);
    expect(resultado).toEqual({ ok: true });
    const [depois] = await db.select().from(users).where(eq(users.id, aluno.id));
    expect(depois).toBeUndefined();
    const subsDepois = await db.select().from(subscriptions).where(eq(subscriptions.userId, aluno.id));
    expect(subsDepois).toHaveLength(0);
    const progDepois = await db.select().from(lessonProgress).where(eq(lessonProgress.userId, aluno.id));
    expect(progDepois).toHaveLength(0);
  });

  it("excluir a si mesmo → 'auto' mesmo com e-mail certo", async () => {
    const aluno = await novoAluno("excl-self");
    const resultado = await excluirAluno(aluno.id, aluno.id, `${prefixo}-excl-self@t.invalido`);
    expect(resultado).toEqual({ ok: false, motivo: "auto" });
    const [depois] = await db.select().from(users).where(eq(users.id, aluno.id));
    expect(depois).toBeDefined();
  });

  it("listarAlunos: busca por trecho do e-mail acha; paginação limita a 50; total correto", async () => {
    const registros = Array.from({ length: 55 }, (_, i) => ({
      nome: `Aluno Lista ${i}`,
      email: `${prefixo}-lista-${String(i).padStart(2, "0")}@t.invalido`,
      senhaHash: "x",
    }));
    await db.insert(users).values(registros);

    const pagina1 = await listarAlunos({ q: `${prefixo}-lista-` });
    expect(pagina1.porPagina).toBe(50);
    expect(pagina1.total).toBe(55);
    expect(pagina1.linhas).toHaveLength(50);

    const pagina2 = await listarAlunos({ q: `${prefixo}-lista-`, pagina: 2 });
    expect(pagina2.total).toBe(55);
    expect(pagina2.linhas).toHaveLength(5);

    const busca = await listarAlunos({ q: `${prefixo}-lista-07@` });
    expect(busca.linhas).toHaveLength(1);
    expect(busca.linhas[0].email).toBe(`${prefixo}-lista-07@t.invalido`);
  });

  it("buscarAluno: histórico vem completo (2 linhas após liberar+revogar) e mais recente primeiro", async () => {
    const aluno = await novoAluno("historico");
    await liberarAcesso(randomUUID(), aluno.id);
    await revogarAcesso(randomUUID(), aluno.id);
    const detalhe = await buscarAluno(aluno.id);
    expect(detalhe).not.toBeNull();
    expect(detalhe!.historico).toHaveLength(2);
    expect(detalhe!.historico[0].status).toBe("cancelada");
    expect(detalhe!.historico[1].status).toBe("manual");
    expect(detalhe!.status).toBe("cancelada");
  });

  it("buscarAluno: progresso soma feitas/total corretamente por curso", async () => {
    const aluno = await novoAluno("progresso");
    await db.insert(lessonProgress).values([
      { userId: aluno.id, lessonId: aula1.id, concluida: true },
      { userId: aluno.id, lessonId: aula2.id, concluida: true },
      { userId: aluno.id, lessonId: aula3.id, concluida: false },
    ]);
    const detalhe = await buscarAluno(aluno.id);
    expect(detalhe!.progresso).toHaveLength(1);
    const bloco = detalhe!.progresso[0];
    expect(bloco.slug).toBe(cursoTeste.slug);
    expect(bloco.feitas).toBe(2);
    expect(bloco.total).toBe(3);
    expect(bloco.pct).toBe(67);
    expect(bloco.aulas.map((a) => a.titulo).sort()).toEqual(["Aula 1", "Aula 2"]);
  });

  // Fix round final (I2): id fora do formato uuid batia direto no banco e
  // virava 500 (exceção de sintaxe do Postgres) em vez do null que a página
  // já sabe tratar como "aluno não encontrado".
  it("buscarAluno com id não-uuid retorna null sem lançar", async () => {
    await expect(buscarAluno("abc")).resolves.toBeNull();
    await expect(buscarAluno("")).resolves.toBeNull();
  });

  // Fix round final (I4): a projeção usava lessonProgress.updatedAt, que
  // sobe a cada toque do player — reabrir uma aula já concluída (replay)
  // "movia" a data de conclusão exibida no detalhe do aluno. concluidaEm
  // nasce só na primeira conclusão e nunca se move (mesma invariante que
  // lib/admin/metricas.ts já depende para aulasConcluidas por período).
  it("buscarAluno: progresso.aulas mostra a data de conclusão original, mesmo após replay mover updated_at", async () => {
    const aluno = await novoAluno("concluida-em");
    await gravarProgresso(aluno.id, aula1.id, { concluida: true });
    const [antes] = await db
      .select({ concluidaEm: lessonProgress.concluidaEm, updatedAt: lessonProgress.updatedAt })
      .from(lessonProgress)
      .where(and(eq(lessonProgress.userId, aluno.id), eq(lessonProgress.lessonId, aula1.id)));
    expect(antes.concluidaEm).not.toBeNull();

    // Espera curta pra garantir que, se o bug reaparecer, o updated_at do
    // replay seja detectavelmente diferente da conclusão original.
    await new Promise((resolve) => setTimeout(resolve, 20));
    await gravarProgresso(aluno.id, aula1.id, { segundosAssistidos: 30 }); // replay: sem re-concluir

    const [depois] = await db
      .select({ concluidaEm: lessonProgress.concluidaEm, updatedAt: lessonProgress.updatedAt })
      .from(lessonProgress)
      .where(and(eq(lessonProgress.userId, aluno.id), eq(lessonProgress.lessonId, aula1.id)));
    expect(depois.updatedAt.getTime()).toBeGreaterThan(antes.updatedAt.getTime());

    const detalhe = await buscarAluno(aluno.id);
    const bloco = detalhe!.progresso.find((p) => p.slug === cursoTeste.slug)!;
    const aulaDetalhe = bloco.aulas.find((a) => a.titulo === aula1.titulo)!;
    // O detalhe mostra a data ORIGINAL de conclusão, não a do replay.
    expect(aulaDetalhe.concluidaEm.getTime()).toBe(antes.concluidaEm!.getTime());
  });
});
