import { randomUUID } from "node:crypto";
import { eq, like } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { courses, lessonMedia, lessonProgress, lessons, modules, subscriptions, users } from "@/lib/db/schema";
import {
  buscarAssinatura,
  buscarCatalogo,
  buscarConcluidas,
  buscarCurso,
  buscarMidia,
  buscarUltimaAula,
  contaAtiva,
  direitosDoAluno,
  ehAssinante,
  podeAcessarCurso,
  gravarProgresso,
  podeGravarProgresso,
  podeVerAula,
  temAcesso,
} from "./dados";

// Roda contra o Postgres real (precisa de DATABASE_URL); dados próprios com prefixo
// próprio, limpos no afterAll. NUNCA toca nos dados da semente (curso
// fundamentos-ia-copilot e as 8 cascas).
const prefixo = `teste-aut-${Date.now()}`;

let userSemAssinatura: { id: string };
let userComAssinatura: { id: string };
// Regressão do Critical: linha "manual" antiga + linha "cancelada" mais nova —
// temAcesso tem que seguir a mais recente, não "já teve alguma ativa/manual".
let userCanceladaRecente: { id: string };
let userInadimplente: { id: string };
let userCancelada: { id: string };
// Regressão do I1: assinatura manual válida, mas a CONTA foi desativada —
// temAcesso/buscarMidia/podeGravarProgresso têm que negar mesmo assim, sem
// esperar o JWT expirar (auth() sozinho não enxerga isso).
let userDesativado: { id: string };
// Ciclo Asaas: linha "pendente" (assinatura criada, fatura ainda não paga) —
// por construção NÃO dá acesso: pendente ∉ ('ativa','manual').
let userPendente: { id: string };
let aulaGratuita: { id: string };
let aulaPaga: { id: string };
let aulaSemMidia: { id: string };
let aulaOculta: { id: string };
let cursoOcultoSlug: string;
// Direito por curso (2026-08-20): os testes de direitosDoAluno/podeAcessarCurso
// precisam do ID, não do slug — direito é conjunto de IDs de curso.
let cursoPublicadoId: string;
let cursoOcultoId: string;
// Redesign editorial: buscarUltimaAula alimenta o hero do painel.
let userUltimaAula: { id: string };
let userUltimaAulaSemProgresso: { id: string };
let userUltimaAulaSoOculto: { id: string };
let cursoRecenteSlug: string;

describe.skipIf(!process.env.DATABASE_URL)("autorização da camada de dados", () => {
  beforeAll(async () => {
    [userSemAssinatura] = await db
      .insert(users)
      .values({ nome: "Teste sem assinatura", email: `${prefixo}-sem@teste.invalido`, senhaHash: "x" })
      .returning({ id: users.id });
    [userComAssinatura] = await db
      .insert(users)
      .values({ nome: "Teste com assinatura", email: `${prefixo}-com@teste.invalido`, senhaHash: "x" })
      .returning({ id: users.id });
    await db.insert(subscriptions).values({ userId: userComAssinatura.id, status: "manual" });

    // createdAt explícitos e bem separados: a ordenação "mais recente vence"
    // não pode depender da resolução do relógio entre dois inserts seguidos.
    [userCanceladaRecente] = await db
      .insert(users)
      .values({ nome: "Teste cancelada recente", email: `${prefixo}-cancelada-recente@teste.invalido`, senhaHash: "x" })
      .returning({ id: users.id });
    await db.insert(subscriptions).values([
      { userId: userCanceladaRecente.id, status: "manual", createdAt: new Date("2020-01-01T00:00:00Z") },
      { userId: userCanceladaRecente.id, status: "cancelada", createdAt: new Date("2020-06-01T00:00:00Z") },
    ]);

    [userInadimplente] = await db
      .insert(users)
      .values({ nome: "Teste inadimplente", email: `${prefixo}-inadimplente@teste.invalido`, senhaHash: "x" })
      .returning({ id: users.id });
    await db.insert(subscriptions).values({ userId: userInadimplente.id, status: "inadimplente" });

    [userCancelada] = await db
      .insert(users)
      .values({ nome: "Teste cancelada", email: `${prefixo}-cancelada@teste.invalido`, senhaHash: "x" })
      .returning({ id: users.id });
    await db.insert(subscriptions).values({ userId: userCancelada.id, status: "cancelada" });

    [userDesativado] = await db
      .insert(users)
      .values({ nome: "Teste desativado", email: `${prefixo}-desativado@teste.invalido`, senhaHash: "x" })
      .returning({ id: users.id });
    await db.insert(subscriptions).values({ userId: userDesativado.id, status: "manual" });
    await db.update(users).set({ ativo: false }).where(eq(users.id, userDesativado.id));

    [userPendente] = await db
      .insert(users)
      .values({ nome: "Teste pendente", email: `${prefixo}-pendente@teste.invalido`, senhaHash: "x" })
      .returning({ id: users.id });
    await db.insert(subscriptions).values({ userId: userPendente.id, status: "pendente" });

    const [cursoPublicado] = await db
      .insert(courses)
      .values({ slug: `${prefixo}-curso-publicado`, titulo: "Curso publicado de teste", publicado: true, ordem: 1 })
      .returning({ id: courses.id });
    cursoPublicadoId = cursoPublicado.id;
    const [moduloPublicado] = await db
      .insert(modules)
      .values({ courseId: cursoPublicado.id, titulo: "Módulo de teste", ordem: 1 })
      .returning({ id: modules.id });
    [aulaGratuita] = await db
      .insert(lessons)
      .values({ moduleId: moduloPublicado.id, slug: "gratuita", titulo: "Aula grátis", ordem: 1, gratuita: true })
      .returning({ id: lessons.id });
    [aulaPaga] = await db
      .insert(lessons)
      .values({ moduleId: moduloPublicado.id, slug: "paga", titulo: "Aula paga", ordem: 2, gratuita: false })
      .returning({ id: lessons.id });
    // Regressão do I3: publicada, paga, SEM linha em lesson_media — "em
    // produção" pro conteúdo, não "sem acesso". podeVerAula não deve
    // depender de lesson_media existir; buscarMidia continua null aqui.
    [aulaSemMidia] = await db
      .insert(lessons)
      .values({ moduleId: moduloPublicado.id, slug: "sem-midia", titulo: "Aula sem mídia", ordem: 3, gratuita: false })
      .returning({ id: lessons.id });
    await db.insert(lessonMedia).values([
      { lessonId: aulaGratuita.id, videoProvider: "youtube", videoId: "video-gratuita" },
      { lessonId: aulaPaga.id, videoProvider: "youtube", videoId: "video-paga" },
    ]);

    const [cursoOculto] = await db
      .insert(courses)
      .values({ slug: `${prefixo}-curso-oculto`, titulo: "Curso oculto de teste", publicado: false, ordem: 2 })
      .returning({ id: courses.id, slug: courses.slug });
    cursoOcultoSlug = cursoOculto.slug;
    cursoOcultoId = cursoOculto.id;
    const [moduloOculto] = await db
      .insert(modules)
      .values({ courseId: cursoOculto.id, titulo: "Módulo oculto", ordem: 1 })
      .returning({ id: modules.id });
    [aulaOculta] = await db
      .insert(lessons)
      .values({ moduleId: moduloOculto.id, slug: "oculta", titulo: "Aula oculta", ordem: 1, gratuita: true })
      .returning({ id: lessons.id });
    await db.insert(lessonMedia).values({ lessonId: aulaOculta.id, videoProvider: "youtube", videoId: "video-oculta" });

    [userUltimaAula] = await db
      .insert(users)
      .values({ nome: "Teste ultima aula", email: `${prefixo}-ultima@teste.invalido`, senhaHash: "x" })
      .returning({ id: users.id });
    [userUltimaAulaSemProgresso] = await db
      .insert(users)
      .values({ nome: "Teste ultima aula sem progresso", email: `${prefixo}-ultima-sem-prog@teste.invalido`, senhaHash: "x" })
      .returning({ id: users.id });
    [userUltimaAulaSoOculto] = await db
      .insert(users)
      .values({ nome: "Teste ultima aula so oculto", email: `${prefixo}-ultima-so-oculto@teste.invalido`, senhaHash: "x" })
      .returning({ id: users.id });
    const [cursoAntigo] = await db
      .insert(courses)
      .values({ slug: `${prefixo}-curso-antigo`, titulo: "Curso antigo", publicado: true })
      .returning({ id: courses.id });
    const [cursoRecente] = await db
      .insert(courses)
      .values({ slug: `${prefixo}-curso-recente`, titulo: "Curso recente", publicado: true })
      .returning({ id: courses.id, slug: courses.slug });
    cursoRecenteSlug = cursoRecente.slug;
    const [modAntigo] = await db.insert(modules).values({ courseId: cursoAntigo.id, titulo: "M1" }).returning({ id: modules.id });
    const [modRecente] = await db.insert(modules).values({ courseId: cursoRecente.id, titulo: "M1" }).returning({ id: modules.id });
    const [aulaAntiga] = await db
      .insert(lessons)
      .values({ moduleId: modAntigo.id, slug: "a1", titulo: "A1" })
      .returning({ id: lessons.id });
    const [aulaRecente] = await db
      .insert(lessons)
      .values({ moduleId: modRecente.id, slug: "a1", titulo: "A1" })
      .returning({ id: lessons.id });
    // updatedAt explícitos e bem separados — mesma razão dos createdAt de assinatura.
    await db.insert(lessonProgress).values([
      { userId: userUltimaAula.id, lessonId: aulaAntiga.id, segundosAssistidos: 30, updatedAt: new Date("2020-01-01T00:00:00Z") },
      { userId: userUltimaAula.id, lessonId: aulaRecente.id, segundosAssistidos: 10, updatedAt: new Date("2020-06-01T00:00:00Z") },
    ]);
  });

  afterAll(async () => {
    // cascade em modules/lessons/lesson_media (via courses) e em
    // subscriptions/lesson_progress (via users) cuida do resto.
    await db.delete(courses).where(like(courses.slug, `${prefixo}%`));
    await db.delete(users).where(like(users.email, `${prefixo}%`));
  });

  it("mídia de aula gratuita sai para usuário sem assinatura", async () => {
    const midia = await buscarMidia(userSemAssinatura.id, aulaGratuita.id);
    expect(midia).toEqual({ provider: "youtube", videoId: "video-gratuita" });
  });

  it("mídia de aula paga NÃO sai para usuário sem assinatura (null)", async () => {
    const midia = await buscarMidia(userSemAssinatura.id, aulaPaga.id);
    expect(midia).toBeNull();
  });

  it("mídia de aula paga sai para assinante manual", async () => {
    const midia = await buscarMidia(userComAssinatura.id, aulaPaga.id);
    expect(midia).toEqual({ provider: "youtube", videoId: "video-paga" });
  });

  it("assinatura manual antiga + cancelada mais recente → sem acesso (status atual manda)", async () => {
    expect(await temAcesso(userCanceladaRecente.id)).toBe(false);
    const midia = await buscarMidia(userCanceladaRecente.id, aulaPaga.id);
    expect(midia).toBeNull();
  });

  it("assinatura inadimplente não libera mídia de aula paga", async () => {
    const midia = await buscarMidia(userInadimplente.id, aulaPaga.id);
    expect(midia).toBeNull();
  });

  it("assinatura cancelada não libera mídia de aula paga", async () => {
    const midia = await buscarMidia(userCancelada.id, aulaPaga.id);
    expect(midia).toBeNull();
  });

  // Fix round final (I1): desativado continuava agindo com JWT vivo —
  // temAcesso lia só a assinatura, nunca users.ativo.
  it("conta desativada com assinatura manual válida → sem acesso (temAcesso false, mídia paga null)", async () => {
    expect(await contaAtiva(userDesativado.id)).toBe(false);
    expect(await temAcesso(userDesativado.id)).toBe(false);
    const midia = await buscarMidia(userDesativado.id, aulaPaga.id);
    expect(midia).toBeNull();
  });

  it("assinatura pendente não dá acesso", async () => {
    expect(await temAcesso(userPendente.id)).toBe(false);
  });

  it("buscarAssinatura devolve o status pendente", async () => {
    expect(await buscarAssinatura(userPendente.id)).toBe("pendente");
  });

  /* -------------------------------------------------------------------------
     DIREITO DE ACESSO POR CURSO (etapa 1 da venda B2B, 2026-08-20)

     O portão deixa de ser um booleano para o acervo inteiro e passa a ser um
     CONJUNTO de cursos. Nesta etapa existe uma fonte só — a assinatura —, então
     o comportamento tem que ser idêntico ao do antigo temAcesso: estas
     asserções são o que prova isso.

     Spec: docs/superpowers/specs/2026-08-20-direito-de-acesso-por-curso-design.md
  ------------------------------------------------------------------------- */

  it("assinante tem direito a TODOS os cursos publicados", async () => {
    const direitos = await direitosDoAluno(userComAssinatura.id);
    const publicados = await db.select({ id: courses.id }).from(courses).where(eq(courses.publicado, true));
    expect([...direitos].sort()).toEqual(publicados.map((c) => c.id).sort());
  });

  it("curso NÃO publicado nunca entra no direito, nem para assinante", async () => {
    const direitos = await direitosDoAluno(userComAssinatura.id);
    expect(direitos.has(cursoOcultoId)).toBe(false);
    expect(await podeAcessarCurso(userComAssinatura.id, cursoOcultoId)).toBe(false);
  });

  it("assinante pode acessar o curso publicado", async () => {
    expect(await podeAcessarCurso(userComAssinatura.id, cursoPublicadoId)).toBe(true);
  });

  it("sem assinatura, conjunto vazio e nenhum curso acessível", async () => {
    expect((await direitosDoAluno(userSemAssinatura.id)).size).toBe(0);
    expect(await podeAcessarCurso(userSemAssinatura.id, cursoPublicadoId)).toBe(false);
  });

  it("status que não libera não dá direito (cancelada recente, inadimplente, cancelada, pendente)", async () => {
    for (const u of [userCanceladaRecente, userInadimplente, userCancelada, userPendente]) {
      expect((await direitosDoAluno(u.id)).size).toBe(0);
      expect(await podeAcessarCurso(u.id, cursoPublicadoId)).toBe(false);
    }
  });

  /* Mesma garantia do I1, agora no modelo novo: conta desativada perde direito
     mesmo com assinatura manual válida no histórico. Se esta asserção cair, a
     refatoração reabriu o buraco de "JWT vivo depois de desativar a conta". */
  it("conta desativada perde o direito mesmo com assinatura válida", async () => {
    expect((await direitosDoAluno(userDesativado.id)).size).toBe(0);
    expect(await podeAcessarCurso(userDesativado.id, cursoPublicadoId)).toBe(false);
    expect(await ehAssinante(userDesativado.id)).toBe(false);
  });

  /* ehAssinante é a pergunta COMERCIAL e tem que responder exatamente o que o
     antigo temAcesso respondia — é dela que dependem o CTA de assinatura, o
     banner do painel e a trava de segunda assinatura no Asaas. */
  it("ehAssinante espelha o comportamento do antigo temAcesso", async () => {
    expect(await ehAssinante(userComAssinatura.id)).toBe(true);
    expect(await ehAssinante(userSemAssinatura.id)).toBe(false);
    expect(await ehAssinante(userCanceladaRecente.id)).toBe(false);
    expect(await ehAssinante(userPendente.id)).toBe(false);
  });

  it("mídia de curso não publicado não sai nem para assinante", async () => {
    const midia = await buscarMidia(userComAssinatura.id, aulaOculta.id);
    expect(midia).toBeNull();
  });

  it("buscarCurso de não publicado retorna null", async () => {
    expect(await buscarCurso(cursoOcultoSlug)).toBeNull();
  });

  it("buscarCatalogo não lista não publicado", async () => {
    const catalogo = await buscarCatalogo();
    expect(catalogo.some((c) => c.slug === cursoOcultoSlug)).toBe(false);
    expect(catalogo.some((c) => c.slug === `${prefixo}-curso-publicado`)).toBe(true);
  });

  it("gravarProgresso não aceita lessonId inexistente (FK erro)", async () => {
    await expect(
      gravarProgresso(userSemAssinatura.id, randomUUID(), { concluida: true }),
    ).rejects.toThrow();
  });

  it("buscarConcluidas de A não vê progresso de B", async () => {
    await gravarProgresso(userSemAssinatura.id, aulaGratuita.id, { concluida: true });
    const concluidasA = await buscarConcluidas(userSemAssinatura.id);
    const concluidasB = await buscarConcluidas(userComAssinatura.id);
    expect(concluidasA.has(aulaGratuita.id)).toBe(true);
    expect(concluidasB.has(aulaGratuita.id)).toBe(false);
  });

  // Fix round 1 (revisão Task 7, Important): podeGravarProgresso é o portão de
  // escrita que faltava nas server actions — espelha exatamente a matriz de
  // buscarMidia (portão de leitura), testado aqui sem simular sessão.
  describe("podeGravarProgresso (portão de escrita, espelha buscarMidia)", () => {
    it("aula paga sem assinatura → false", async () => {
      expect(await podeGravarProgresso(userSemAssinatura.id, aulaPaga.id)).toBe(false);
    });

    it("aula de curso oculto → false", async () => {
      expect(await podeGravarProgresso(userComAssinatura.id, aulaOculta.id)).toBe(false);
    });

    it("aula gratuita sem assinatura → true", async () => {
      expect(await podeGravarProgresso(userSemAssinatura.id, aulaGratuita.id)).toBe(true);
    });

    it("aula paga com assinatura manual → true", async () => {
      expect(await podeGravarProgresso(userComAssinatura.id, aulaPaga.id)).toBe(true);
    });

    it("aula publicada SEM linha em lesson_media → podeVerAula true para assinante (e buscarMidia null)", async () => {
      expect(await podeVerAula(userComAssinatura.id, aulaSemMidia.id)).toBe(true);
      expect(await buscarMidia(userComAssinatura.id, aulaSemMidia.id)).toBeNull();
    });

    it("aula paga com assinatura manual mas conta desativada → false (I1: JWT vivo não basta)", async () => {
      expect(await podeGravarProgresso(userDesativado.id, aulaPaga.id)).toBe(false);
    });
  });

  it("buscarUltimaAula: sem progresso devolve null", async () => {
    expect(await buscarUltimaAula(userUltimaAulaSemProgresso.id)).toBeNull();
  });

  it("buscarUltimaAula: devolve o curso da linha mais recente por updated_at", async () => {
    expect(await buscarUltimaAula(userUltimaAula.id)).toEqual({ cursoSlug: cursoRecenteSlug });
  });

  it("buscarUltimaAula: progresso só em curso oculto devolve null", async () => {
    // aulaOculta já existe no arranjo deste arquivo (curso publicado=false)
    await db.insert(lessonProgress).values({ userId: userUltimaAulaSoOculto.id, lessonId: aulaOculta.id, segundosAssistidos: 5 });
    expect(await buscarUltimaAula(userUltimaAulaSoOculto.id)).toBeNull();
  });
});
