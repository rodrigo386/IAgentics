import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq, like } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses, lessonProgress, lessons, modules, subscriptions, users } from "@/lib/db/schema";
import { gravarProgresso } from "@/lib/plataforma/dados";
import { conclusaoPorCurso, funilDoCurso, gerarCsv, inicioDoPeriodo, resumo, seriesSemanais } from "./metricas";

// Mesmo esqueleto de lib/admin/alunos.test.ts: roda contra o Postgres real,
// prefixo próprio, afterAll limpa por cascade. Insere lesson_progress no curso
// demo REAL ("fundamentos-ia-copilot", semeado por scripts/semente.mjs) — por
// isso a limpeza é por user_id dos alunos prefixados (cascade resolve), nunca
// tocando no curso em si.
//
// O banco local é compartilhado com as suítes e2e, que criam contas reais e
// NUNCA as apagam (convenção já existente no repo) — então funções agregadas
// globais (resumo/conclusaoPorCurso/funilDoCurso/seriesSemanais) sempre têm
// "ruído" de execuções anteriores. Toda asserção aqui é por DELTA (depois -
// antes), nunca por valor absoluto: assim o teste fica correto tanto num banco
// limpo quanto num banco com anos de sobras de execuções passadas.
const prefixo = `teste-adm-met-${Date.now()}`;
const DIA_MS = 24 * 60 * 60 * 1000;
const SLUG_CURSO_DEMO = "fundamentos-ia-copilot";

let cursoOcultoSlug: string;
let totalAulasDemo: number;
let aulaIsoladaId: string; // fora do curso demo: hospeda só os testes de replay/concluida_em abaixo

let linha: {
  resumo7Antes: Awaited<ReturnType<typeof resumo>>;
  resumoTudoAntes: Awaited<ReturnType<typeof resumo>>;
  conclusaoDemoAntes: { comecaram: number; concluiram: number };
  funilAntes: { concluiram: number }[];
};

describe.skipIf(!process.env.DATABASE_URL)("métricas do admin", () => {
  beforeAll(async () => {
    // 1) Fotografia ANTES de inserir qualquer dado do cenário — é essa
    // fotografia que vira a base de comparação de cada `it`.
    const [resumo7Antes, resumoTudoAntes, conclusaoAntesLinhas, funilAntesLinhas] = await Promise.all([
      resumo("7"),
      resumo("tudo"),
      conclusaoPorCurso(),
      funilDoCurso(SLUG_CURSO_DEMO),
    ]);
    if (funilAntesLinhas === null) throw new Error(`curso demo "${SLUG_CURSO_DEMO}" não encontrado — rode a semente`);
    linha = {
      resumo7Antes,
      resumoTudoAntes,
      conclusaoDemoAntes: conclusaoAntesLinhas.find((c) => c.slug === SLUG_CURSO_DEMO) ?? { comecaram: 0, concluiram: 0 },
      funilAntes: funilAntesLinhas,
    };

    // 2) Cenário conhecido, datas EXPLÍCITAS (o teste controla o relógio dos
    // dados, não o relógio da máquina): 2 alunos novos há 3 dias, 1 antigo há
    // 60 dias.
    const agora = new Date();
    const ha3Dias = new Date(agora.getTime() - 3 * DIA_MS);
    const ha60Dias = new Date(agora.getTime() - 60 * DIA_MS);

    const [alunoA] = await db
      .insert(users)
      .values({ nome: "Aluno Novo A", email: `${prefixo}-a@t.invalido`, senhaHash: "x", createdAt: ha3Dias })
      .returning({ id: users.id });
    const [alunoB] = await db
      .insert(users)
      .values({ nome: "Aluno Novo B", email: `${prefixo}-b@t.invalido`, senhaHash: "x", createdAt: ha3Dias })
      .returning({ id: users.id });
    // O terceiro aluno (60 dias atrás) só precisa existir para "novos" excluí-lo
    // do período de 7 dias — nenhuma outra asserção depende do seu id.
    await db
      .insert(users)
      .values({ nome: "Aluno Antigo", email: `${prefixo}-antigo@t.invalido`, senhaHash: "x", createdAt: ha60Dias })
      .returning({ id: users.id });

    const [cursoOculto] = await db
      .insert(courses)
      .values({ slug: `${prefixo}-oculto`, titulo: "Curso Oculto de Teste", publicado: false, ordem: 999 })
      .returning({ slug: courses.slug });
    cursoOcultoSlug = cursoOculto.slug;

    // Curso/aula isolados (não publicados, fora do curso demo): hospedam só os
    // testes de replay/concluida_em no fim do arquivo — mantê-los fora do
    // curso demo evita qualquer risco de mexer nas contagens exatas que
    // conclusaoPorCurso/funilDoCurso já verificam ali em cima.
    const [cursoIsolado] = await db
      .insert(courses)
      .values({ slug: `${prefixo}-isolado`, titulo: "Curso Isolado de Teste", publicado: false, ordem: 997 })
      .returning({ id: courses.id });
    const [moduloIsolado] = await db
      .insert(modules)
      .values({ courseId: cursoIsolado.id, titulo: "Módulo Isolado", ordem: 1 })
      .returning({ id: modules.id });
    const [aulaIsolada] = await db
      .insert(lessons)
      .values({ moduleId: moduloIsolado.id, slug: "aula-isolada", titulo: "Aula Isolada", ordem: 1, gratuita: true })
      .returning({ id: lessons.id });
    aulaIsoladaId = aulaIsolada.id;

    // Progresso no curso demo: aula 1 = "boas-vindas" (ordemGlobal 1), aula 2 =
    // "o-que-e-copilot" (ordemGlobal 2) — as duas primeiras na ordem global
    // (módulo.ordem, aula.ordem) do curso semeado por scripts/semente.mjs.
    const [cursoDemo] = await db.select({ id: courses.id }).from(courses).where(eq(courses.slug, SLUG_CURSO_DEMO)).limit(1);
    const linhasAulasDemo = await db
      .select({ id: lessons.id, slug: lessons.slug })
      .from(lessons)
      .innerJoin(modules, eq(modules.id, lessons.moduleId))
      .where(eq(modules.courseId, cursoDemo.id))
      .orderBy(modules.ordem, lessons.ordem);
    totalAulasDemo = linhasAulasDemo.length;
    const aula1 = linhasAulasDemo.find((l) => l.slug === "boas-vindas");
    const aula2 = linhasAulasDemo.find((l) => l.slug === "o-que-e-copilot");
    if (!aula1 || !aula2) throw new Error("aulas 'boas-vindas'/'o-que-e-copilot' não encontradas no curso demo");

    // Aluno A concluiu aulas 1 e 2; aluno B só a 1. concluidaEm explícito
    // (= agora): estes inserts vão direto no banco, não passam por
    // gravarProgresso, então precisam da mesma invariante "concluida=true ⇒
    // concluida_em preenchida" que gravarProgresso mantém no caminho real.
    await db.insert(lessonProgress).values([
      { userId: alunoA.id, lessonId: aula1.id, concluida: true, concluidaEm: agora },
      { userId: alunoA.id, lessonId: aula2.id, concluida: true, concluidaEm: agora },
      { userId: alunoB.id, lessonId: aula1.id, concluida: true, concluidaEm: agora },
    ]);
  });

  afterAll(async () => {
    // cascade: subscriptions e lesson_progress dos alunos prefixados caem junto.
    await db.delete(users).where(like(users.email, `${prefixo}%`));
    await db.delete(courses).where(like(courses.slug, `${prefixo}%`));
  });

  it("inicioDoPeriodo: '7' corta 7 dias atrás; 'tudo' retorna null", () => {
    const agora = new Date("2026-08-12T12:00:00.000Z");
    expect(inicioDoPeriodo("tudo", agora)).toBeNull();
    expect(inicioDoPeriodo("7", agora)?.getTime()).toBe(agora.getTime() - 7 * DIA_MS);
    expect(inicioDoPeriodo("30", agora)?.getTime()).toBe(agora.getTime() - 30 * DIA_MS);
    expect(inicioDoPeriodo("90", agora)?.getTime()).toBe(agora.getTime() - 90 * DIA_MS);
  });

  it("resumo('7'): novos=2 (o de 60 dias fora), alunosAtivos e aulasConcluidas contam só o período", async () => {
    const depois = await resumo("7");
    // A e B: cadastro há 3 dias, dentro do período de 7 — o antigo (60 dias) fica de fora.
    expect(depois.novos - linha.resumo7Antes.novos).toBe(2);
    // A e B tocaram progresso agora mesmo (dentro de qualquer período) — 2 alunos ativos.
    expect(depois.alunosAtivos - linha.resumo7Antes.alunosAtivos).toBe(2);
    // 2 aulas concluídas por A + 1 por B = 3 linhas com concluida=true.
    expect(depois.aulasConcluidas - linha.resumo7Antes.aulasConcluidas).toBe(3);
  });

  it("resumo('tudo') inclui o antigo", async () => {
    const depois = await resumo("tudo");
    // Sem corte, os 3 (A, B e o antigo de 60 dias) contam como novos.
    expect(depois.novos - linha.resumoTudoAntes.novos).toBe(3);
  });

  it("assinaturasAtivas usa o status ATUAL: aluno com manual+cancelada não conta", async () => {
    const antes = await resumo("tudo");

    const [alunoRevogado] = await db
      .insert(users)
      .values({ nome: "Revogado", email: `${prefixo}-revogado@t.invalido`, senhaHash: "x" })
      .returning({ id: users.id });
    // Nunca UPDATE: manual e depois cancelada, as duas linhas ficam no histórico.
    await db.insert(subscriptions).values({ userId: alunoRevogado.id, status: "manual" });
    await db.insert(subscriptions).values({ userId: alunoRevogado.id, status: "cancelada" });
    const depoisRevogado = await resumo("tudo");
    // Status atual é "cancelada" (linha mais recente) — não soma em assinaturasAtivas.
    expect(depoisRevogado.assinaturasAtivas - antes.assinaturasAtivas).toBe(0);

    const [alunoComAcesso] = await db
      .insert(users)
      .values({ nome: "Com Acesso", email: `${prefixo}-comacesso@t.invalido`, senhaHash: "x" })
      .returning({ id: users.id });
    await db.insert(subscriptions).values({ userId: alunoComAcesso.id, status: "manual" });
    const depoisComAcesso = await resumo("tudo");
    // Sem linha de cancelamento depois: status atual "manual" soma +1.
    expect(depoisComAcesso.assinaturasAtivas - depoisRevogado.assinaturasAtivas).toBe(1);
  });

  it("seriesSemanais agrupa por segunda-feira e o total das barras soma os cadastros do período", async () => {
    // Cross-check no MESMO instante contra resumo("tudo").novos, não contra uma
    // fotografia antiga: outros `it`s deste arquivo também inserem alunos
    // prefixados entre a fotografia do beforeAll e este teste (ex.: o de
    // assinaturasAtivas, que roda antes deste na mesma suíte) — uma comparação
    // por delta-desde-o-beforeAll contaria esses de mais. resumo() e
    // seriesSemanais() somam a MESMA tabela (users), então o total das barras
    // tem que bater com resumo().novos sempre, independente de quantos alunos
    // prefixados já existem neste ponto da suíte.
    const [depois, resumoTudoAgora] = await Promise.all([seriesSemanais("tudo"), resumo("tudo")]);
    const totalDepois = depois.cadastros.reduce((soma, ponto) => soma + ponto.valor, 0);
    expect(totalDepois).toBe(resumoTudoAgora.novos);

    for (const ponto of depois.cadastros) {
      expect(ponto.semana).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      // date_trunc('week', ...) do Postgres começa na segunda-feira por padrão.
      const dataPonto = new Date(`${ponto.semana}T00:00:00.000Z`);
      expect(dataPonto.getUTCDay()).toBe(1);
    }
  });

  it("conclusaoPorCurso: comecaram=2, concluiram=0, pct=0 no cenário; curso oculto não aparece", async () => {
    const linhas = await conclusaoPorCurso();
    const demo = linhas.find((l) => l.slug === SLUG_CURSO_DEMO);
    expect(demo).toBeDefined();
    // A e B começaram (>=1 linha de progresso); nenhum dos dois concluiu as 8
    // aulas do curso (A fez 2, B fez 1) — 0 de novos "concluiram".
    expect(demo!.comecaram - linha.conclusaoDemoAntes.comecaram).toBe(2);
    expect(demo!.concluiram - linha.conclusaoDemoAntes.concluiram).toBe(0);
    // pct é sempre concluiram/comecaram arredondado — validação da fórmula em
    // cima do próprio resultado (robusta a qualquer dado pré-existente).
    expect(demo!.pct).toBe(demo!.comecaram ? Math.round((demo!.concluiram / demo!.comecaram) * 100) : 0);

    expect(linhas.some((l) => l.slug === cursoOcultoSlug)).toBe(false);
  });

  it("funilDoCurso: aula 1 → 2, aula 2 → 1, demais → 0, na ordem global", async () => {
    const linhas = await funilDoCurso(SLUG_CURSO_DEMO);
    expect(linhas).not.toBeNull();
    expect(linhas).toHaveLength(totalAulasDemo);
    expect(linhas).toHaveLength(linha.funilAntes.length);
    linhas!.forEach((l, i) => expect(l.ordemGlobal).toBe(i + 1));

    expect(linhas![0].concluiram - linha.funilAntes[0].concluiram).toBe(2); // aula 1: A e B
    expect(linhas![1].concluiram - linha.funilAntes[1].concluiram).toBe(1); // aula 2: só A
    for (let i = 2; i < linhas!.length; i++) {
      expect(linhas![i].concluiram - linha.funilAntes[i].concluiram).toBe(0); // demais: sem novas conclusões
    }
  });

  it("funilDoCurso de slug inexistente → null", async () => {
    expect(await funilDoCurso(`${prefixo}-slug-que-nao-existe`)).toBeNull();
    expect(await funilDoCurso(cursoOcultoSlug)).toBeNull(); // oculto conta como "não existe" para quem consome
  });

  it("gerarCsv('cadastros'): primeira linha de cabeçalho, separador ';', começa com BOM \uFEFF", async () => {
    const csv = await gerarCsv("cadastros", "tudo");
    expect(csv).not.toBeNull();
    expect(csv!.startsWith("\uFEFF")).toBe(true);
    const semBom = csv!.slice(1);
    const linhasCsv = semBom.split("\n");
    expect(linhasCsv[0]).toBe("semana;novos_cadastros");
    expect(linhasCsv.length).toBeGreaterThan(1); // há cadastros no período "tudo" (A, B, antigo, ...)
  });

  it("gerarCsv de bloco inválido → null", async () => {
    expect(await gerarCsv("nao-existe" as Parameters<typeof gerarCsv>[0], "30")).toBeNull();
  });

  it("gerarCsv('funil') exige cursoSlug válido e publicado", async () => {
    expect(await gerarCsv("funil", "tudo")).toBeNull(); // sem cursoSlug
    expect(await gerarCsv("funil", "tudo", `${prefixo}-slug-que-nao-existe`)).toBeNull();
    const csvFunil = await gerarCsv("funil", "tudo", SLUG_CURSO_DEMO);
    expect(csvFunil).not.toBeNull();
    expect(csvFunil!.startsWith("\uFEFF")).toBe(true);
    expect(csvFunil!.slice(1).split("\n")[0]).toBe("modulo;aula;ordem;concluiram");
  });

  // Fix round 1 \u2014 regress\u00E3o do IMPORTANT 1: aulasConcluidas usava updated_at
  // como proxy de "quando concluiu", mas gravarProgresso toca updated_at em
  // TODO replay (mesmo sem re-concluir) \u2014 reabrir uma aula j\u00E1 feita inflava o
  // cart\u00E3o do per\u00EDodo. A corre\u00E7\u00E3o introduz lesson_progress.concluida_em, que
  // s\u00F3 nasce na primeira conclus\u00E3o e nunca se move depois.

  it("aulasConcluidas usa concluida_em (primeira conclus\u00E3o), n\u00E3o updated_at: replay n\u00E3o conta de novo", async () => {
    // Fotografia ANTES de qualquer inser\u00E7\u00E3o do cen\u00E1rio \u2014 as duas compara\u00E7\u00F5es
    // abaixo (logo ap\u00F3s concluir, e de novo ap\u00F3s o replay) partem daqui.
    const antes7 = await resumo("7");
    const antesTudo = await resumo("tudo");

    const [alunoReplay] = await db
      .insert(users)
      .values({ nome: "Aluno Replay", email: `${prefixo}-replay@t.invalido`, senhaHash: "x" })
      .returning({ id: users.id });

    // Concluiu a aula h\u00E1 40 dias \u2014 fora do per\u00EDodo de 7/30, dentro de 90/tudo.
    const ha40Dias = new Date(Date.now() - 40 * DIA_MS);
    await db.insert(lessonProgress).values({
      userId: alunoReplay.id,
      lessonId: aulaIsoladaId,
      concluida: true,
      concluidaEm: ha40Dias,
      updatedAt: ha40Dias,
    });

    const logoAposConcluir7 = await resumo("7");
    const logoAposConcluirTudo = await resumo("tudo");
    // A conclus\u00E3o de 40 dias atr\u00E1s: fora do per\u00EDodo de 7 dias, dentro de "tudo".
    expect(logoAposConcluir7.aulasConcluidas - antes7.aulasConcluidas).toBe(0);
    expect(logoAposConcluirTudo.aulasConcluidas - antesTudo.aulasConcluidas).toBe(1);

    // Replay HOJE: reabre a aula e o player manda s\u00F3 segundosAssistidos, sem
    // re-concluir \u2014 \u00E9 exatamente o caminho de
    // app/app/curso/[slug]/[aula]/actions.ts (marcarProgresso do player).
    await gravarProgresso(alunoReplay.id, aulaIsoladaId, { segundosAssistidos: 30 });

    const [linhaDepois] = await db
      .select({ concluidaEm: lessonProgress.concluidaEm, updatedAt: lessonProgress.updatedAt })
      .from(lessonProgress)
      .where(and(eq(lessonProgress.userId, alunoReplay.id), eq(lessonProgress.lessonId, aulaIsoladaId)));
    // concluida_em n\u00E3o se mexe no replay...
    expect(linhaDepois.concluidaEm?.getTime()).toBe(ha40Dias.getTime());
    // ...mas updated_at sim \u2014 "\u00FAltimo acesso" (Task 2) continua correto.
    expect(linhaDepois.updatedAt.getTime()).toBeGreaterThan(ha40Dias.getTime());

    const depois7 = await resumo("7");
    const depoisTudo = await resumo("tudo");
    // Fora do per\u00EDodo de 7 dias CONTINUA em 0 depois do replay de hoje \u2014 se
    // aulasConcluidas ainda usasse updated_at (que o replay acabou de mover
    // pra agora), este delta viraria 1, n\u00E3o continuaria 0.
    expect(depois7.aulasConcluidas - antes7.aulasConcluidas).toBe(0);
    // "tudo" continua em +1 (mesma conclus\u00E3o de antes, n\u00E3o conta 2x nem some).
    expect(depoisTudo.aulasConcluidas - antesTudo.aulasConcluidas).toBe(1);
  });

  it("gravarProgresso: marcar conclu\u00EDda de novo numa aula j\u00E1 conclu\u00EDda n\u00E3o move concluida_em", async () => {
    const [alunoRemarca] = await db
      .insert(users)
      .values({ nome: "Aluno Remarca", email: `${prefixo}-remarca@t.invalido`, senhaHash: "x" })
      .returning({ id: users.id });

    await gravarProgresso(alunoRemarca.id, aulaIsoladaId, { concluida: true });
    const [primeira] = await db
      .select({ concluidaEm: lessonProgress.concluidaEm })
      .from(lessonProgress)
      .where(and(eq(lessonProgress.userId, alunoRemarca.id), eq(lessonProgress.lessonId, aulaIsoladaId)));
    expect(primeira.concluidaEm).not.toBeNull();

    // Espera curta pra garantir que, se o bug reaparecer, now() da segunda
    // chamada seja detectavelmente diferente da primeira (n\u00E3o passa "por sorte").
    await new Promise((resolve) => setTimeout(resolve, 20));

    await gravarProgresso(alunoRemarca.id, aulaIsoladaId, { concluida: true }); // replay: marca de novo
    const [segunda] = await db
      .select({ concluidaEm: lessonProgress.concluidaEm })
      .from(lessonProgress)
      .where(and(eq(lessonProgress.userId, alunoRemarca.id), eq(lessonProgress.lessonId, aulaIsoladaId)));

    expect(segunda.concluidaEm?.getTime()).toBe(primeira.concluidaEm?.getTime());
  });
});
