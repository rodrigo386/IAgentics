import { afterAll, describe, expect, it } from "vitest";
import { and, eq, like, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses, lessonMedia, lessonProgress, lessons, modules, users } from "@/lib/db/schema";
import {
  buscarCursoAdmin,
  contarImpacto,
  contarImpactoDoCurso,
  criarAula,
  criarCurso,
  criarModulo,
  definirPublicado,
  excluirAula,
  excluirCurso,
  excluirModulo,
  gerarSlug,
  listarCursosAdmin,
  moverAula,
  moverModulo,
  salvarAula,
  salvarCurso,
  salvarMidia,
  salvarModulo,
} from "./conteudo";

// Mesmo esqueleto de lib/admin/alunos.test.ts: roda contra o Postgres real,
// dados com prefixo próprio, afterAll limpa por cascade (modules/lessons/
// lesson_media caem junto com courses; lesson_progress cai junto com users
// E com lessons). NUNCA toca nos dados da semente.
const prefixo = `teste-adm-cnt-${Date.now()}`;

describe("gerarSlug", () => {
  it("gerarSlug: 'Formação de IA & Métodos!' → 'formacao-de-ia-metodos'", () => {
    expect(gerarSlug("Formação de IA & Métodos!")).toBe("formacao-de-ia-metodos");
  });

  it("gerarSlug não produz hífens duplos nem nas pontas", () => {
    expect(gerarSlug("  --IA:  Curso---Top--  ")).toBe("ia-curso-top");
    expect(gerarSlug("Só   espaços???")).toBe("so-espacos");
  });
});

describe.skipIf(!process.env.DATABASE_URL)("regras de administração de conteúdo", () => {
  afterAll(async () => {
    await db.delete(courses).where(like(courses.slug, `${prefixo}%`));
    await db.delete(users).where(like(users.email, `${prefixo}%`));
  });

  async function novoCurso(sufixo: string, extra: Partial<typeof courses.$inferInsert> = {}) {
    const [c] = await db
      .insert(courses)
      .values({ slug: `${prefixo}-${sufixo}`, titulo: `Curso ${sufixo}`, ...extra })
      .returning();
    return c;
  }

  async function novoModulo(courseId: string, titulo: string, ordem: number) {
    const [m] = await db.insert(modules).values({ courseId, titulo, ordem }).returning();
    return m;
  }

  async function novaAula(moduleId: string, sufixo: string, ordem: number) {
    const [a] = await db.insert(lessons).values({ moduleId, slug: `${sufixo}`, titulo: `Aula ${sufixo}`, ordem }).returning();
    return a;
  }

  async function novoAluno(sufixo: string) {
    const [u] = await db.insert(users).values({ nome: `Aluno ${sufixo}`, email: `${prefixo}-${sufixo}@t.invalido`, senhaHash: "x" }).returning();
    return u;
  }

  it("criarCurso nasce publicado=false e ordem = max+1; slug colidente → 'slug_existe'", async () => {
    const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${courses.ordem}), 0)::int` }).from(courses);

    const resultado = await criarCurso(`${prefixo} Curso Novo`);
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.slug).toBe(gerarSlug(`${prefixo} Curso Novo`));

    const [linha] = await db.select().from(courses).where(eq(courses.slug, resultado.slug));
    expect(linha.publicado).toBe(false);
    expect(linha.ordem).toBe(max + 1);

    const colisao = await criarCurso(`${prefixo} Curso Novo`); // mesmo título → mesmo slug
    expect(colisao).toEqual({ ok: false, motivo: "slug_existe" });
  });

  it("salvarCurso com slug de outro curso → 'slug_existe' e nada muda", async () => {
    const cursoA = await novoCurso("salvar-a");
    const cursoB = await novoCurso("salvar-b");

    const resultado = await salvarCurso(cursoB.id, {
      titulo: "Título novo",
      slug: cursoA.slug, // colide com o curso A
      descricao: "desc nova",
      capaUrl: "/nova.png",
      nivel: "Avançado",
      cargaHoras: 10,
      ordem: 99,
    });
    expect(resultado).toEqual({ ok: false, motivo: "slug_existe" });

    const [depois] = await db.select().from(courses).where(eq(courses.id, cursoB.id));
    expect(depois.slug).toBe(`${prefixo}-salvar-b`);
    expect(depois.titulo).toBe("Curso salvar-b");
    expect(depois.descricao).toBe("");

    const salvouOk = await salvarCurso(cursoB.id, {
      titulo: "Título novo",
      slug: `${prefixo}-salvar-b-novo`,
      descricao: "desc nova",
      capaUrl: "/nova.png",
      nivel: "Avançado",
      cargaHoras: 10,
      ordem: 99,
    });
    expect(salvouOk).toEqual({ ok: true });
    const [depoisOk] = await db.select().from(courses).where(eq(courses.id, cursoB.id));
    expect(depoisOk.titulo).toBe("Título novo");
    expect(depoisOk.slug).toBe(`${prefixo}-salvar-b-novo`);
    expect(Number(depoisOk.cargaHoras)).toBe(10);
  });

  it("moverModulo troca ordem com o vizinho; no extremo é no-op", async () => {
    const curso = await novoCurso("mod-mover");
    const m1 = await novoModulo(curso.id, "M1", 1);
    const m2 = await novoModulo(curso.id, "M2", 2);

    await moverModulo(m2.id, -1); // sobe: troca com m1
    let [d1] = await db.select().from(modules).where(eq(modules.id, m1.id));
    let [d2] = await db.select().from(modules).where(eq(modules.id, m2.id));
    expect(d1.ordem).toBe(2);
    expect(d2.ordem).toBe(1);

    await moverModulo(d2.id, -1); // d2 já é o primeiro (ordem 1) → no-op
    [d1] = await db.select().from(modules).where(eq(modules.id, m1.id));
    [d2] = await db.select().from(modules).where(eq(modules.id, m2.id));
    expect(d1.ordem).toBe(2);
    expect(d2.ordem).toBe(1);

    await moverModulo(d1.id, 1); // d1 já é o último (ordem 2) → no-op
    [d1] = await db.select().from(modules).where(eq(modules.id, m1.id));
    expect(d1.ordem).toBe(2);
  });

  it("moverAula idem, dentro do módulo", async () => {
    const curso = await novoCurso("aula-mover");
    const modulo = await novoModulo(curso.id, "M", 1);
    const a1 = await novaAula(modulo.id, "a1", 1);
    const a2 = await novaAula(modulo.id, "a2", 2);

    await moverAula(a1.id, 1); // desce: troca com a2
    let [d1] = await db.select().from(lessons).where(eq(lessons.id, a1.id));
    let [d2] = await db.select().from(lessons).where(eq(lessons.id, a2.id));
    expect(d1.ordem).toBe(2);
    expect(d2.ordem).toBe(1);

    await moverAula(d1.id, 1); // d1 já é a última (ordem 2) → no-op
    [d1] = await db.select().from(lessons).where(eq(lessons.id, a1.id));
    [d2] = await db.select().from(lessons).where(eq(lessons.id, a2.id));
    expect(d1.ordem).toBe(2);
    expect(d2.ordem).toBe(1);
  });

  it("salvarMidia cria linha; chamada de novo atualiza; videoId vazio remove a linha", async () => {
    const curso = await novoCurso("midia");
    const modulo = await novoModulo(curso.id, "M", 1);
    const aula = await novaAula(modulo.id, "a1", 1);

    await salvarMidia(aula.id, "youtube", "abc123");
    let linhas = await db.select().from(lessonMedia).where(eq(lessonMedia.lessonId, aula.id));
    expect(linhas).toHaveLength(1);
    expect(linhas[0].videoProvider).toBe("youtube");
    expect(linhas[0].videoId).toBe("abc123");

    await salvarMidia(aula.id, "panda", "xyz789"); // segunda chamada: UPDATE, não segunda linha
    linhas = await db.select().from(lessonMedia).where(eq(lessonMedia.lessonId, aula.id));
    expect(linhas).toHaveLength(1);
    expect(linhas[0].videoProvider).toBe("panda");
    expect(linhas[0].videoId).toBe("xyz789");

    await salvarMidia(aula.id, "panda", ""); // vazio: remove
    linhas = await db.select().from(lessonMedia).where(eq(lessonMedia.lessonId, aula.id));
    expect(linhas).toHaveLength(0);
  });

  it("contarImpacto de curso soma aulas e alunos distintos com progresso nelas", async () => {
    const curso = await novoCurso("impacto");
    const modulo = await novoModulo(curso.id, "M", 1);
    const a1 = await novaAula(modulo.id, "i1", 1);
    const a2 = await novaAula(modulo.id, "i2", 2);
    const aluno1 = await novoAluno("impacto-1");
    const aluno2 = await novoAluno("impacto-2");

    await db.insert(lessonProgress).values([
      { userId: aluno1.id, lessonId: a1.id, concluida: true },
      { userId: aluno2.id, lessonId: a2.id, concluida: false },
      { userId: aluno1.id, lessonId: a2.id, concluida: false }, // mesmo aluno, outra aula: não deve dobrar a contagem
    ]);

    const impacto = await contarImpacto("curso", curso.id);
    expect(impacto.aulas).toBe(2);
    expect(impacto.alunosComProgresso).toBe(2);

    const impactoModulo = await contarImpacto("modulo", modulo.id);
    expect(impactoModulo).toEqual(impacto);

    const impactoAula = await contarImpacto("aula", a1.id);
    expect(impactoAula).toEqual({ aulas: 1, alunosComProgresso: 1 });
  });

  it("contarImpactoDoCurso: mesma conta de contarImpacto, em lote, para todo módulo/aula do curso de uma vez", async () => {
    const curso = await novoCurso("impacto-lote");
    const modA = await novoModulo(curso.id, "MA", 1);
    const modB = await novoModulo(curso.id, "MB", 2);
    const modVazio = await novoModulo(curso.id, "M vazio", 3);
    const a1 = await novaAula(modA.id, "lote-a1", 1);
    const a2 = await novaAula(modA.id, "lote-a2", 2);
    const a3 = await novaAula(modB.id, "lote-a3", 1);
    const aluno1 = await novoAluno("impacto-lote-1");
    const aluno2 = await novoAluno("impacto-lote-2");

    await db.insert(lessonProgress).values([
      { userId: aluno1.id, lessonId: a1.id, concluida: true },
      { userId: aluno2.id, lessonId: a2.id, concluida: false },
      { userId: aluno1.id, lessonId: a3.id, concluida: false }, // aluno1 aparece em dois módulos diferentes
    ]);

    const lote = await contarImpactoDoCurso(curso.id);
    expect(lote.curso).toEqual({ aulas: 3, alunosComProgresso: 2 }); // aluno1 e aluno2, sem duplicar aluno1

    expect(lote.porModulo.get(modA.id)).toEqual({ aulas: 2, alunosComProgresso: 2 });
    expect(lote.porModulo.get(modB.id)).toEqual({ aulas: 1, alunosComProgresso: 1 });
    expect(lote.porModulo.has(modVazio.id)).toBe(false); // módulo sem aula não entra no mapa

    expect(lote.porAula.get(a1.id)).toEqual({ aulas: 1, alunosComProgresso: 1 });
    expect(lote.porAula.get(a2.id)).toEqual({ aulas: 1, alunosComProgresso: 1 });
    expect(lote.porAula.get(a3.id)).toEqual({ aulas: 1, alunosComProgresso: 1 });

    // Bate exatamente com o que contarImpacto(nivel,id) diria item a item.
    expect(lote.porModulo.get(modA.id)).toEqual(await contarImpacto("modulo", modA.id));
    expect(lote.porAula.get(a1.id)).toEqual(await contarImpacto("aula", a1.id));
  });

  it("excluirCurso publicado → 'curso_publicado'; despublicado apaga em cascata", async () => {
    const publicado = await novoCurso("excl-pub", { publicado: true });
    const resultadoPublicado = await excluirCurso(publicado.id);
    expect(resultadoPublicado).toEqual({ ok: false, motivo: "curso_publicado" });
    const [aindaExiste] = await db.select().from(courses).where(eq(courses.id, publicado.id));
    expect(aindaExiste).toBeDefined();

    const oculto = await novoCurso("excl-oculto");
    const modulo = await novoModulo(oculto.id, "M", 1);
    const aula = await novaAula(modulo.id, "a", 1);
    await db.insert(lessonMedia).values({ lessonId: aula.id, videoProvider: "youtube", videoId: "x" });

    const resultadoOculto = await excluirCurso(oculto.id);
    expect(resultadoOculto).toEqual({ ok: true });
    const [cursoDepois] = await db.select().from(courses).where(eq(courses.id, oculto.id));
    expect(cursoDepois).toBeUndefined();
    const modulosDepois = await db.select().from(modules).where(eq(modules.courseId, oculto.id));
    expect(modulosDepois).toHaveLength(0);
    const aulasDepois = await db.select().from(lessons).where(eq(lessons.moduleId, modulo.id));
    expect(aulasDepois).toHaveLength(0);
    const midiaDepois = await db.select().from(lessonMedia).where(eq(lessonMedia.lessonId, aula.id));
    expect(midiaDepois).toHaveLength(0);
  });

  it("definirPublicado(true) com aula sem vídeo → { ok: true, aviso: 'aulas_sem_video' }", async () => {
    const curso = await novoCurso("pub-semvideo");
    const modulo = await novoModulo(curso.id, "M", 1);
    await novaAula(modulo.id, "a", 1);

    const resultado = await definirPublicado(curso.id, true);
    expect(resultado).toEqual({ ok: true, aviso: "aulas_sem_video", n: 1 });
    const [depois] = await db.select().from(courses).where(eq(courses.id, curso.id));
    expect(depois.publicado).toBe(true);
  });

  it("definirPublicado(true) sem aula sem vídeo → aviso null", async () => {
    const curso = await novoCurso("pub-comvideo");
    const modulo = await novoModulo(curso.id, "M", 1);
    const aula = await novaAula(modulo.id, "a", 1);
    await db.insert(lessonMedia).values({ lessonId: aula.id, videoProvider: "youtube", videoId: "x" });

    const resultado = await definirPublicado(curso.id, true);
    expect(resultado).toEqual({ ok: true, aviso: null, n: 0 });
  });

  it("definirPublicado(false) com aluno com progresso → aviso 'alunos_ativos'", async () => {
    const curso = await novoCurso("desp-comprog", { publicado: true });
    const modulo = await novoModulo(curso.id, "M", 1);
    const aula = await novaAula(modulo.id, "a", 1);
    const aluno = await novoAluno("desp-comprog");
    await db.insert(lessonProgress).values({ userId: aluno.id, lessonId: aula.id, concluida: false });

    const resultado = await definirPublicado(curso.id, false);
    expect(resultado).toEqual({ ok: true, aviso: "alunos_ativos", n: 1 });
    const [depois] = await db.select().from(courses).where(eq(courses.id, curso.id));
    expect(depois.publicado).toBe(false);
  });

  it("criarAula nasce com slug e ordem corretos; slug colidente no mesmo módulo → 'slug_existe'", async () => {
    const curso = await novoCurso("aula-criar");
    const modulo = await novoModulo(curso.id, "M", 1);

    const primeira = await criarAula(modulo.id, "Minha Primeira Aula");
    expect(primeira.ok).toBe(true);
    if (!primeira.ok) return;
    expect(primeira.slug).toBe("minha-primeira-aula");
    const [linha] = await db.select().from(lessons).where(and(eq(lessons.moduleId, modulo.id), eq(lessons.slug, primeira.slug)));
    expect(linha.ordem).toBe(1);
    expect(linha.gratuita).toBe(false);

    const segunda = await criarAula(modulo.id, "Segunda Aula");
    expect(segunda.ok).toBe(true);
    if (!segunda.ok) return;
    const [linha2] = await db.select().from(lessons).where(eq(lessons.slug, segunda.slug));
    expect(linha2.ordem).toBe(2);

    const colisao = await criarAula(modulo.id, "Minha Primeira Aula"); // mesmo título, mesmo módulo
    expect(colisao).toEqual({ ok: false, motivo: "slug_existe" });
  });

  it("salvarAula: slug de outra aula do mesmo módulo → 'slug_existe' e nada muda", async () => {
    const curso = await novoCurso("aula-salvar");
    const modulo = await novoModulo(curso.id, "M", 1);
    const a1 = await novaAula(modulo.id, "primeira", 1);
    const a2 = await novaAula(modulo.id, "segunda", 2);

    const resultado = await salvarAula(a2.id, {
      titulo: "Novo título",
      slug: a1.slug, // colide com a1, mesmo módulo
      descricao: "nova desc",
      duracaoSeg: 120,
      gratuita: true,
    });
    expect(resultado).toEqual({ ok: false, motivo: "slug_existe" });

    const [depois] = await db.select().from(lessons).where(eq(lessons.id, a2.id));
    expect(depois.slug).toBe("segunda");
    expect(depois.titulo).toBe("Aula segunda");
    expect(depois.gratuita).toBe(false);

    const salvouOk = await salvarAula(a2.id, {
      titulo: "Novo título",
      slug: "segunda-nova",
      descricao: "nova desc",
      duracaoSeg: 120,
      gratuita: true,
    });
    expect(salvouOk).toEqual({ ok: true });
    const [depoisOk] = await db.select().from(lessons).where(eq(lessons.id, a2.id));
    expect(depoisOk.titulo).toBe("Novo título");
    expect(depoisOk.slug).toBe("segunda-nova");
    expect(depoisOk.gratuita).toBe(true);
  });

  it("excluirModulo apaga em cascata (aulas e mídia); excluirAula idem para a mídia", async () => {
    const curso = await novoCurso("cascade");
    const modulo = await novoModulo(curso.id, "M", 1);
    const a1 = await novaAula(modulo.id, "c1", 1);
    const a2 = await novaAula(modulo.id, "c2", 2);
    await db.insert(lessonMedia).values({ lessonId: a1.id, videoProvider: "youtube", videoId: "x" });
    await db.insert(lessonMedia).values({ lessonId: a2.id, videoProvider: "youtube", videoId: "y" });

    await excluirAula(a1.id);
    const aulasDepois1 = await db.select().from(lessons).where(eq(lessons.id, a1.id));
    expect(aulasDepois1).toHaveLength(0);
    const midiaDepois1 = await db.select().from(lessonMedia).where(eq(lessonMedia.lessonId, a1.id));
    expect(midiaDepois1).toHaveLength(0);

    await excluirModulo(modulo.id);
    const modulosDepois = await db.select().from(modules).where(eq(modules.id, modulo.id));
    expect(modulosDepois).toHaveLength(0);
    const aulasDepois2 = await db.select().from(lessons).where(eq(lessons.id, a2.id));
    expect(aulasDepois2).toHaveLength(0);
    const midiaDepois2 = await db.select().from(lessonMedia).where(eq(lessonMedia.lessonId, a2.id));
    expect(midiaDepois2).toHaveLength(0);
  });

  it("criarModulo nasce com ordem = max+1 dentro do curso; salvarModulo troca o título", async () => {
    const curso = await novoCurso("modulo-criar");
    await criarModulo(curso.id, "Primeiro módulo");
    await criarModulo(curso.id, "Segundo módulo");
    const linhas = await db.select().from(modules).where(eq(modules.courseId, curso.id)).orderBy(modules.ordem);
    expect(linhas).toHaveLength(2);
    expect(linhas[0].ordem).toBe(1);
    expect(linhas[1].ordem).toBe(2);

    await salvarModulo(linhas[0].id, "Título trocado");
    const [depois] = await db.select().from(modules).where(eq(modules.id, linhas[0].id));
    expect(depois.titulo).toBe("Título trocado");
  });

  it("listarCursosAdmin: totalAulas e aulasSemVideo por curso", async () => {
    const curso = await novoCurso("listar");
    const modulo = await novoModulo(curso.id, "M", 1);
    const comVideo = await novaAula(modulo.id, "cv", 1);
    await novaAula(modulo.id, "sv1", 2);
    await novaAula(modulo.id, "sv2", 3);
    await db.insert(lessonMedia).values({ lessonId: comVideo.id, videoProvider: "youtube", videoId: "x" });

    const linhas = await listarCursosAdmin();
    const linha = linhas.find((l) => l.id === curso.id);
    expect(linha).toBeDefined();
    expect(linha!.totalAulas).toBe(3);
    expect(linha!.aulasSemVideo).toBe(2);
    expect(linha!.publicado).toBe(false);
  });

  it("buscarCursoAdmin: curso oculto aparece (ao contrário de buscarCurso do aluno), com módulos/aulas/mídia aninhados", async () => {
    const curso = await novoCurso("buscar", { publicado: false });
    const modulo = await novoModulo(curso.id, "Módulo único", 1);
    const aula = await novaAula(modulo.id, "com-midia", 1);
    await db.insert(lessonMedia).values({ lessonId: aula.id, videoProvider: "panda", videoId: "p-1" });
    await novaAula(modulo.id, "sem-midia", 2);

    const resultado = await buscarCursoAdmin(curso.slug);
    expect(resultado).not.toBeNull();
    expect(resultado!.publicado).toBe(false);
    expect(resultado!.modulos).toHaveLength(1);
    expect(resultado!.modulos[0].aulas).toHaveLength(2);
    const aulaComMidia = resultado!.modulos[0].aulas.find((a) => a.slug === "com-midia");
    expect(aulaComMidia?.midia).toEqual({ provider: "panda", videoId: "p-1" });
    const aulaSemMidia = resultado!.modulos[0].aulas.find((a) => a.slug === "sem-midia");
    expect(aulaSemMidia?.midia).toBeNull();

    expect(await buscarCursoAdmin(`${prefixo}-nao-existe`)).toBeNull();
  });
});
