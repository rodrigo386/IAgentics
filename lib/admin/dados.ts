import "server-only";
import { desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { entradas, listaEspera, pageViews, vendas, type ModoVenda, type ItemVenda, type StatusVenda } from "@/lib/db/schema";

/**
 * Consultas do painel. Tudo derivado das quatro tabelas do site: `page_views`
 * (toda visualização), `entradas` (a chegada, com a origem), `lista_espera`
 * (formulário de /cursos) e `vendas` (catálogo de cursos e checkout Asaas).
 *
 * As janelas são calculadas em SQL, com `current_date`, e não em JS: o
 * container roda em UTC e o Rodrigo lê em GMT-3. Com data montada no
 * servidor Node, "hoje" mudaria de significado às 21h — e um painel que troca
 * de número por causa do fuso destrói a confiança em todos os outros.
 */

function diasAtras(n: number) {
  return sql`current_date - ${sql.raw(String(n))}`;
}

export type ResumoVisitas = {
  ultimos7: number;
  anteriores7: number;
  ultimos30: number;
  totalGeral: number;
  /** Primeiro dia com dado — o painel não pode fingir histórico que não tem. */
  desde: string | null;
};

export async function resumoVisitas(): Promise<ResumoVisitas> {
  const [r] = await db
    .select({
      ultimos7: sql<number>`coalesce(sum(visitas) filter (where dia > ${diasAtras(7)}), 0)::int`,
      anteriores7: sql<number>`coalesce(sum(visitas) filter (where dia > ${diasAtras(14)} and dia <= ${diasAtras(7)}), 0)::int`,
      ultimos30: sql<number>`coalesce(sum(visitas) filter (where dia > ${diasAtras(30)}), 0)::int`,
      totalGeral: sql<number>`coalesce(sum(visitas), 0)::int`,
      desde: sql<string | null>`min(dia)::text`,
    })
    .from(pageViews);
  return r;
}

export type LinhaRota = { rota: string; visitas: number };

/** Páginas mais visitadas na janela. */
export async function rotasMaisVistas(dias = 30): Promise<LinhaRota[]> {
  return db
    .select({ rota: pageViews.rota, visitas: sql<number>`sum(visitas)::int` })
    .from(pageViews)
    .where(gte(pageViews.dia, sql`${diasAtras(dias)}`))
    .groupBy(pageViews.rota)
    .orderBy(desc(sql`sum(visitas)`));
}

export type LinhaDia = { dia: string; visitas: number };

/** Série diária, para o gráfico. Dias sem visita não existem na tabela e são
 *  preenchidos com zero pelo generate_series — senão o gráfico "pula" o dia
 *  vazio e sugere continuidade onde houve silêncio. */
export async function visitasPorDia(dias = 30): Promise<LinhaDia[]> {
  const linhas = await db.execute<{ dia: string; visitas: number }>(sql`
    select d::date::text as dia,
           coalesce((select sum(visitas) from page_views where dia = d::date), 0)::int as visitas
    from generate_series(${diasAtras(dias - 1)}, current_date, interval '1 day') as d
    order by d
  `);
  return linhas.rows ?? (linhas as unknown as LinhaDia[]);
}

export type ResumoLista = {
  total: number;
  ultimos7: number;
  ultimoEm: string | null;
};

export async function resumoListaEspera(): Promise<ResumoLista> {
  const [r] = await db
    .select({
      total: sql<number>`count(*)::int`,
      ultimos7: sql<number>`count(*) filter (where criado_em > now() - interval '7 days')::int`,
      ultimoEm: sql<string | null>`max(criado_em)::text`,
    })
    .from(listaEspera);
  return r;
}

export type Inscrito = { nome: string; email: string; criadoEm: Date; consentimentoEm: Date };

export async function inscritos(): Promise<Inscrito[]> {
  return db
    .select({
      nome: listaEspera.nome,
      email: listaEspera.email,
      criadoEm: listaEspera.criadoEm,
      consentimentoEm: listaEspera.consentimentoEm,
    })
    .from(listaEspera)
    .orderBy(desc(listaEspera.criadoEm));
}

/**
 * Conversão da /cursos: quantas visitas viraram inscrição.
 *
 * É o número que diz se a página funciona, e o único do painel que cruza as
 * duas tabelas. Vem com a ressalva embutida: `visitas` conta VISITA, não
 * visitante único (o beacon não identifica ninguém, por decisão de
 * privacidade), então a taxa real é maior que esta. Serve para comparar
 * períodos entre si, não para virar número de apresentação.
 */
export async function conversaoCursos(dias = 30): Promise<{ visitas: number; inscricoes: number; taxa: number }> {
  const [v] = await db
    .select({ visitas: sql<number>`coalesce(sum(visitas), 0)::int` })
    .from(pageViews)
    .where(sql`rota = '/cursos' and dia > ${diasAtras(dias)}`);

  const [i] = await db
    .select({ inscricoes: sql<number>`count(*)::int` })
    .from(listaEspera)
    .where(sql`criado_em > now() - (${sql.raw(String(dias))} || ' days')::interval`);

  const taxa = v.visitas > 0 ? (i.inscricoes / v.visitas) * 100 : 0;
  return { visitas: v.visitas, inscricoes: i.inscricoes, taxa };
}

/* ------------------------------------------------------------------ */
/* De onde vêm (2026-09-09)                                            */
/* ------------------------------------------------------------------ */

export type LinhaOrigem = { origem: string; visitas: number };

/** Chegadas por balde de origem na janela. */
export async function origensDasEntradas(dias = 30): Promise<LinhaOrigem[]> {
  return db
    .select({ origem: entradas.origem, visitas: sql<number>`sum(visitas)::int` })
    .from(entradas)
    .where(gte(entradas.dia, sql`${diasAtras(dias)}`))
    .groupBy(entradas.origem)
    .orderBy(desc(sql`sum(visitas)`));
}

/**
 * Páginas por onde as pessoas ENTRAM, tirando quem veio do próprio site.
 *
 * É o cruzamento que decide pauta: um artigo que aparece aqui está trazendo
 * gente de fora, e não só sendo lido por quem já estava na casa. A tabela de
 * "páginas mais visitadas" não responde isso — lá o artigo aparece igual se
 * chegou pela home.
 */
export async function paginasDeEntrada(dias = 30): Promise<LinhaRota[]> {
  return db
    .select({ rota: entradas.rota, visitas: sql<number>`sum(visitas)::int` })
    .from(entradas)
    .where(sql`dia > ${diasAtras(dias)} and origem <> 'site'`)
    .groupBy(entradas.rota)
    .orderBy(desc(sql`sum(visitas)`));
}

export type ResumoEntradas = {
  entradas: number;
  /** Visualizações no MESMO período em que houve medição de entrada. */
  visualizacoes: number;
  /** Páginas por chegada. `null` sem base — nunca 0, que leria como "ninguém leu". */
  paginasPorEntrada: number | null;
  /** Primeiro dia com entrada medida. A medição nasceu depois do contador de
   *  visitas, e o painel não pode comparar janelas que não coincidem. */
  desde: string | null;
};

export async function resumoEntradas(dias = 30): Promise<ResumoEntradas> {
  const [e] = await db
    .select({
      total: sql<number>`coalesce(sum(visitas), 0)::int`,
      desde: sql<string | null>`min(dia)::text`,
    })
    .from(entradas)
    .where(gte(entradas.dia, sql`${diasAtras(dias)}`));

  if (!e.desde) return { entradas: 0, visualizacoes: 0, paginasPorEntrada: null, desde: null };

  /* A janela das visualizações é recortada pelo primeiro dia de entrada: sem
     isso a razão dividiria 26 dias de visita por 1 dia de chegada e devolveria
     um número absurdo com cara de métrica. */
  const [v] = await db
    .select({ total: sql<number>`coalesce(sum(visitas), 0)::int` })
    .from(pageViews)
    .where(gte(pageViews.dia, sql`${e.desde}::date`));

  return {
    entradas: e.total,
    visualizacoes: v.total,
    paginasPorEntrada: e.total > 0 ? v.total / e.total : null,
    desde: e.desde,
  };
}

/* ------------------------------------------------------------------ */
/* Vendas do catálogo (2026-09-22)                                     */
/* ------------------------------------------------------------------ */

export type LinhaVenda = {
  id: string;
  criadaEm: Date;
  nome: string;
  email: string;
  telefone: string;
  itens: ItemVenda[];
  totalCentavos: number;
  status: StatusVenda;
  pagoEm: Date | null;
  acessoLiberadoEm: Date | null;
};

/** Vendas do modo pedido, mais recentes primeiro. Teste e real nunca se
 *  misturam na mesma tabela da tela. */
export async function listarVendas(modo: ModoVenda): Promise<LinhaVenda[]> {
  return db
    .select({
      id: vendas.id,
      criadaEm: vendas.criadaEm,
      nome: vendas.nome,
      email: vendas.email,
      telefone: vendas.telefone,
      itens: vendas.itens,
      totalCentavos: vendas.totalCentavos,
      status: vendas.status,
      pagoEm: vendas.pagoEm,
      acessoLiberadoEm: vendas.acessoLiberadoEm,
    })
    .from(vendas)
    .where(eq(vendas.modo, modo))
    .orderBy(desc(vendas.criadaEm));
}

export async function resumoVendas(modo: ModoVenda) {
  const [r] = await db
    .select({
      pagas: sql<number>`count(*) filter (where status = 'pago')::int`,
      aguardandoLiberacao: sql<number>`count(*) filter (where status = 'pago' and acesso_liberado_em is null)::int`,
      recebidoCentavos: sql<number>`coalesce(sum(total_centavos) filter (where status = 'pago'), 0)::int`,
    })
    .from(vendas)
    .where(eq(vendas.modo, modo));
  return r;
}
