import "server-only";
import { desc, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { listaEspera, pageViews } from "@/lib/db/schema";

/**
 * Consultas do painel. Tudo derivado das duas únicas tabelas do site:
 * `page_views` (beacon) e `lista_espera` (formulário de /cursos).
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
