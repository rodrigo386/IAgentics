import "server-only";
import { and, count, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { contratoCursos, contratoMembros, contratos, courses, empresas, users } from "@/lib/db/schema";

/**
 * Venda B2B: empresas, contratos e membros, pelo /admin.
 *
 * A importação registra E-MAILS AUTORIZADOS, não contas — não existe canal de
 * e-mail em produção para convidar ninguém. Quem já tem conta é vinculado no
 * ato; quem não tem, ao criar a conta (lib/plataforma/vinculo.ts).
 *
 * Spec: docs/superpowers/specs/2026-08-20-contrato-b2b-design.md
 */

export type ResultadoContrato =
  | { ok: true; id: string }
  | { ok: false; motivo: "nao_encontrado" | "sem_vagas" | "lista_vazia" | "dados_invalidos" };

export type ResultadoSimples = { ok: true } | { ok: false; motivo: "nao_encontrado" | "sem_vagas" };

/* Deliberadamente simples: o alvo é separar "isto é um e-mail" de "isto é lixo
   colado da planilha" — não validar entregabilidade, que só o envio prova. Um
   e-mail estranho que passe aqui vira membro que nunca se vincula, e aparece
   como vaga ocupada na tela, onde o admin enxerga e corrige. */
const FORMATO_EMAIL = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;

export type ListaAnalisada = { validos: string[]; invalidos: string[] };

/**
 * Quebra o texto colado em e-mails normalizados.
 *
 * PURA de propósito: é o coração da pré-visualização e da importação, e sendo
 * pura dá para testar todo o comportamento chato (caixa, espaço, separador,
 * duplicata) sem arranjo de banco nenhum.
 *
 * Aceita vírgula, ponto-e-vírgula, quebra de linha e tabulação como
 * separadores — é o que sai de "copiar uma coluna do Excel" e de "colar do
 * campo Para: do e-mail", os dois jeitos reais de essa lista chegar.
 */
export function analisarLista(texto: string): ListaAnalisada {
  const pedacos = texto
    .split(/[\n\r,;\t]+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const validos: string[] = [];
  const invalidos: string[] = [];
  const vistos = new Set<string>();

  for (const pedaco of pedacos) {
    if (!FORMATO_EMAIL.test(pedaco)) {
      invalidos.push(pedaco);
      continue;
    }
    const normalizado = pedaco.toLowerCase();
    if (vistos.has(normalizado)) continue; // duplicata na própria lista
    vistos.add(normalizado);
    validos.push(normalizado);
  }

  return { validos, invalidos };
}

/** Membros ATIVOS do contrato (removidos não ocupam vaga). */
async function vagasUsadas(contratoId: string): Promise<number> {
  const [linha] = await db
    .select({ n: count() })
    .from(contratoMembros)
    .where(and(eq(contratoMembros.contratoId, contratoId), isNull(contratoMembros.removidoEm)));
  return Number(linha?.n ?? 0);
}

export type Previa = ListaAnalisada & {
  /** Sem conta ainda: entram pré-autorizados e se vinculam no cadastro. */
  novos: string[];
  /** Já têm conta: vinculados no ato da importação. */
  jaTemConta: string[];
  /** Já são membros ativos deste contrato: ignorados, sem erro. */
  jaNoContrato: string[];
  vagas: number;
  vagasUsadas: number;
  /** Quantos entrariam de fato (novos + jaTemConta). */
  aImportar: number;
  cabe: boolean;
};

/**
 * Classifica a lista SEM gravar nada, para a tela mostrar o resumo antes de
 * confirmar. Importar uma lista de cliente às cegas é como o admin descobre
 * tarde que colou a coluna errada da planilha.
 */
export async function previsualizarImportacao(contratoId: string, texto: string): Promise<Previa> {
  const { validos, invalidos } = analisarLista(texto);

  const [contrato] = await db
    .select({ vagas: contratos.vagas })
    .from(contratos)
    .where(eq(contratos.id, contratoId))
    .limit(1);
  const vagas = contrato?.vagas ?? 0;
  const usadas = await vagasUsadas(contratoId);

  const jaNoContrato: string[] = [];
  const jaTemConta: string[] = [];
  const novos: string[] = [];

  if (validos.length) {
    const membros = await db
      .select({ email: contratoMembros.email })
      .from(contratoMembros)
      .where(
        and(
          eq(contratoMembros.contratoId, contratoId),
          isNull(contratoMembros.removidoEm),
          inArray(contratoMembros.email, validos),
        ),
      );
    const jaMembros = new Set(membros.map((m) => m.email));

    const contas = await db
      .select({ email: sql<string>`lower(${users.email})` })
      .from(users)
      .where(inArray(sql`lower(${users.email})`, validos));
    const comConta = new Set(contas.map((c) => c.email));

    for (const email of validos) {
      if (jaMembros.has(email)) jaNoContrato.push(email);
      else if (comConta.has(email)) jaTemConta.push(email);
      else novos.push(email);
    }
  }

  const aImportar = novos.length + jaTemConta.length;
  return {
    validos,
    invalidos,
    novos,
    jaTemConta,
    jaNoContrato,
    vagas,
    vagasUsadas: usadas,
    aImportar,
    cabe: usadas + aImportar <= vagas,
  };
}

/**
 * Grava a lista. TUDO OU NADA, numa transação.
 *
 * Importar até encher faria o admin descobrir pela metade que faltou vaga, com
 * a lista do cliente parcialmente dentro e nenhuma forma óbvia de saber onde
 * parou. Recusar inteiro deixa o estado claro: ou a lista entrou, ou nada
 * mudou.
 */
export async function importarMembros(contratoId: string, texto: string): Promise<ResultadoContrato> {
  const previa = await previsualizarImportacao(contratoId, texto);

  const [existe] = await db.select({ id: contratos.id }).from(contratos).where(eq(contratos.id, contratoId)).limit(1);
  if (!existe) return { ok: false, motivo: "nao_encontrado" };
  if (previa.aImportar === 0 && previa.jaNoContrato.length === 0) return { ok: false, motivo: "lista_vazia" };
  if (!previa.cabe) return { ok: false, motivo: "sem_vagas" };

  const aGravar = [...previa.novos, ...previa.jaTemConta];
  if (aGravar.length === 0) return { ok: true, id: contratoId }; // só repetidos: nada a fazer

  await db.transaction(async (tx) => {
    // userId preenchido de saída para quem já tem conta: o acesso vale na
    // mesma hora, sem esperar a pessoa fazer login de novo.
    const contas = await tx
      .select({ id: users.id, email: sql<string>`lower(${users.email})` })
      .from(users)
      .where(inArray(sql`lower(${users.email})`, aGravar));
    const idPorEmail = new Map(contas.map((c) => [c.email, c.id]));

    await tx.insert(contratoMembros).values(
      aGravar.map((email) => ({ contratoId, email, userId: idPorEmail.get(email) ?? null })),
    );
  });

  return { ok: true, id: contratoId };
}

export async function criarEmpresa(d: { nome: string; cnpj: string | null }): Promise<ResultadoContrato> {
  const nome = d.nome.trim();
  if (nome.length < 2) return { ok: false, motivo: "dados_invalidos" };
  const [linha] = await db
    .insert(empresas)
    .values({ nome, cnpj: d.cnpj?.trim() || null })
    .returning({ id: empresas.id });
  return { ok: true, id: linha.id };
}

export async function criarContrato(d: {
  empresaId: string;
  valor: string;
  vagas: number;
  inicioEm: Date;
  fimEm: Date | null;
  cursos: string[];
}): Promise<ResultadoContrato> {
  if (!Number.isInteger(d.vagas) || d.vagas < 1) return { ok: false, motivo: "dados_invalidos" };
  if (d.fimEm && d.fimEm <= d.inicioEm) return { ok: false, motivo: "dados_invalidos" };
  if (Number.isNaN(Number(d.valor))) return { ok: false, motivo: "dados_invalidos" };

  const [empresa] = await db.select({ id: empresas.id }).from(empresas).where(eq(empresas.id, d.empresaId)).limit(1);
  if (!empresa) return { ok: false, motivo: "nao_encontrado" };

  const id = await db.transaction(async (tx) => {
    const [linha] = await tx
      .insert(contratos)
      .values({
        empresaId: d.empresaId,
        valor: d.valor,
        vagas: d.vagas,
        inicioEm: d.inicioEm,
        fimEm: d.fimEm,
      })
      .returning({ id: contratos.id });
    if (d.cursos.length) {
      await tx.insert(contratoCursos).values(d.cursos.map((courseId) => ({ contratoId: linha.id, courseId })));
    }
    return linha.id;
  });

  return { ok: true, id };
}

/** Remoção LÓGICA: libera a vaga e preserva o histórico. O progresso e o
 *  certificado da pessoa continuam intactos — estão presos ao userId, não à
 *  participação no contrato. */
export async function removerMembro(membroId: string): Promise<ResultadoSimples> {
  const r = await db
    .update(contratoMembros)
    .set({ removidoEm: new Date() })
    .where(and(eq(contratoMembros.id, membroId), isNull(contratoMembros.removidoEm)))
    .returning({ id: contratoMembros.id });
  return r.length ? { ok: true } : { ok: false, motivo: "nao_encontrado" };
}

/** Readmissão só cabe se ainda houver vaga — a vaga pode ter sido ocupada por
 *  outra pessoa desde a remoção. */
export async function readmitirMembro(membroId: string): Promise<ResultadoSimples> {
  const [membro] = await db
    .select({ contratoId: contratoMembros.contratoId, removidoEm: contratoMembros.removidoEm })
    .from(contratoMembros)
    .where(eq(contratoMembros.id, membroId))
    .limit(1);
  if (!membro || !membro.removidoEm) return { ok: false, motivo: "nao_encontrado" };

  const [contrato] = await db
    .select({ vagas: contratos.vagas })
    .from(contratos)
    .where(eq(contratos.id, membro.contratoId))
    .limit(1);
  if (!contrato) return { ok: false, motivo: "nao_encontrado" };
  if ((await vagasUsadas(membro.contratoId)) >= contrato.vagas) return { ok: false, motivo: "sem_vagas" };

  await db.update(contratoMembros).set({ removidoEm: null }).where(eq(contratoMembros.id, membroId));
  return { ok: true };
}

/* --------------------------------------------------------------------------
   LEITURA PARA AS TELAS
-------------------------------------------------------------------------- */

export type EmpresaLinha = {
  id: string;
  nome: string;
  cnpj: string | null;
  contratos: number;
  vagas: number;
  vagasUsadas: number;
};

export async function listarEmpresas(): Promise<EmpresaLinha[]> {
  /* Uma consulta com agregação, não N+1: a lista pode ter dezenas de empresas
     e o pool do Postgres já é disputado (armadilha 8). O count de membros usa
     DISTINCT porque o join com contratos multiplicaria linhas. */
  const linhas = await db
    .select({
      id: empresas.id,
      nome: empresas.nome,
      cnpj: empresas.cnpj,
      contratos: sql<number>`count(distinct ${contratos.id})`,
      vagas: sql<number>`coalesce(sum(distinct ${contratos.vagas}), 0)`,
      vagasUsadas: sql<number>`count(distinct ${contratoMembros.id}) filter (where ${contratoMembros.removidoEm} is null)`,
    })
    .from(empresas)
    .leftJoin(contratos, eq(contratos.empresaId, empresas.id))
    .leftJoin(contratoMembros, eq(contratoMembros.contratoId, contratos.id))
    .groupBy(empresas.id, empresas.nome, empresas.cnpj)
    .orderBy(empresas.nome);

  return linhas.map((l) => ({
    ...l,
    contratos: Number(l.contratos),
    vagas: Number(l.vagas),
    vagasUsadas: Number(l.vagasUsadas),
  }));
}

export type MembroLinha = {
  id: string;
  email: string;
  temConta: boolean;
  removidoEm: Date | null;
};

export type ContratoDetalhe = {
  id: string;
  valor: string;
  vagas: number;
  vagasUsadas: number;
  inicioEm: Date;
  fimEm: Date | null;
  cursos: { id: string; titulo: string }[];
  membros: MembroLinha[];
};

export type EmpresaDetalhe = {
  id: string;
  nome: string;
  cnpj: string | null;
  contratos: ContratoDetalhe[];
};

export async function buscarEmpresa(id: string): Promise<EmpresaDetalhe | null> {
  const [empresa] = await db.select().from(empresas).where(eq(empresas.id, id)).limit(1);
  if (!empresa) return null;

  const linhasContratos = await db
    .select()
    .from(contratos)
    .where(eq(contratos.empresaId, id))
    .orderBy(contratos.createdAt);

  const ids = linhasContratos.map((c) => c.id);
  const cursosDeTodos = ids.length
    ? await db
        .select({ contratoId: contratoCursos.contratoId, id: courses.id, titulo: courses.titulo })
        .from(contratoCursos)
        .innerJoin(courses, eq(courses.id, contratoCursos.courseId))
        .where(inArray(contratoCursos.contratoId, ids))
        .orderBy(courses.ordem)
    : [];
  const membrosDeTodos = ids.length
    ? await db
        .select({
          contratoId: contratoMembros.contratoId,
          id: contratoMembros.id,
          email: contratoMembros.email,
          userId: contratoMembros.userId,
          removidoEm: contratoMembros.removidoEm,
        })
        .from(contratoMembros)
        .where(inArray(contratoMembros.contratoId, ids))
        .orderBy(contratoMembros.email)
    : [];

  return {
    id: empresa.id,
    nome: empresa.nome,
    cnpj: empresa.cnpj,
    contratos: linhasContratos.map((c) => {
      const membros = membrosDeTodos.filter((m) => m.contratoId === c.id);
      return {
        id: c.id,
        valor: c.valor,
        vagas: c.vagas,
        vagasUsadas: membros.filter((m) => !m.removidoEm).length,
        inicioEm: c.inicioEm,
        fimEm: c.fimEm,
        cursos: cursosDeTodos.filter((x) => x.contratoId === c.id).map(({ id, titulo }) => ({ id, titulo })),
        membros: membros.map((m) => ({
          id: m.id,
          email: m.email,
          temConta: m.userId !== null,
          removidoEm: m.removidoEm,
        })),
      };
    }),
  };
}

/** Vigência para exibição — mesma regra do direito (lib/plataforma/dados.ts),
 *  derivada da data, sem estado guardado. */
export function situacaoDoContrato(c: { inicioEm: Date; fimEm: Date | null }): "vigente" | "vencido" | "aIniciar" {
  const agora = Date.now();
  if (c.inicioEm.getTime() > agora) return "aIniciar";
  if (c.fimEm && c.fimEm.getTime() <= agora) return "vencido";
  return "vigente";
}
