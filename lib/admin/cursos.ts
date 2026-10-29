import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/**
 * Consultas do painel de cursos, /admin/cursos (2026-10-16): a venda da
 * assinatura da Solution, da visita na /cursos ao acesso liberado.
 *
 * "Hoje" e "dia" são os de São Paulo, calculados no banco: o container e o
 * Postgres rodam em UTC, e uma assinatura feita às 22h não pode cair no dia
 * seguinte do gráfico. Nada aqui devolve dado pessoal: nome, e-mail e
 * telefone só aparecem no quadro do fluxo, que lê `listarAssinaturas()`.
 */
const DIA_SP = (coluna: string) => sql.raw(`(${coluna} at time zone 'America/Sao_Paulo')::date`);

/** O período dos filtros (lib/admin/filtros.ts), de e até inclusos, em datas de SP. */
export type Intervalo = { de: string; ate: string };
const DE = (i: Intervalo) => sql`${i.de}::date`;
const ATE = (i: Intervalo) => sql`${i.ate}::date`;

type Linhas<T> = { rows?: T[] } | T[];
const linhas = <T>(r: Linhas<T>): T[] => (Array.isArray(r) ? r : (r.rows ?? []));

export type DiaVisitas = { dia: string; visitas: number };
export type DiaAssinaturas = { dia: string; iniciadas: number; pagas: number };
export type Origem = { origem: string; visitas: number };
export type Funil = { visitas: number; iniciadas: number; pagaram: number; liberadas: number };
export type Resumo = {
  ativas: number;
  atrasadas: number;
  canceladasNoPeriodo: number;
  pagaramNoPeriodo: number;
  /** Quem já pagou alguma vez, desde o início: base para a taxa de cancelamento. */
  pagaramDesdeSempre: number;
};

/** Visualizações da /cursos por dia, com os dias sem visita valendo zero. */
export async function visitasCursosPorDia(i: Intervalo): Promise<DiaVisitas[]> {
  return linhas(
    await db.execute<DiaVisitas>(sql`
      select d::date::text as dia,
             coalesce((select sum(visitas) from page_views where rota = '/cursos' and dia = d::date), 0)::int as visitas
      from generate_series(${DE(i)}, ${ATE(i)}, interval '1 day') as d
      order by d`),
  );
}

/** Assinaturas iniciadas por dia (formulário enviado) e quantas delas já pagaram. */
export async function assinaturasPorDia(i: Intervalo): Promise<DiaAssinaturas[]> {
  return linhas(
    await db.execute<DiaAssinaturas>(sql`
      select d::date::text as dia,
             count(a.id)::int as iniciadas,
             count(a.id) filter (where a.pago_ate is not null)::int as pagas
      from generate_series(${DE(i)}, ${ATE(i)}, interval '1 day') as d
      left join assinaturas a on ${DIA_SP("a.criada_em")} = d::date
      group by d order by d`),
  );
}

/** De onde vêm as visitas que CHEGAM pela /cursos (tabela `entradas`). */
export async function origensCursos(i: Intervalo): Promise<Origem[]> {
  return linhas(
    await db.execute<Origem>(sql`
      select origem, sum(visitas)::int as visitas
      from entradas where rota = '/cursos' and dia between ${DE(i)} and ${ATE(i)}
      group by origem order by visitas desc`),
  );
}

/** Funil do período: visitas → formulário enviado → pagou → acesso liberado. As
 *  três últimas etapas contam as MESMAS assinaturas (as iniciadas no período). */
export async function funilCursos(i: Intervalo): Promise<Funil> {
  const [r] = linhas(
    await db.execute<Funil>(sql`
      select
        (select coalesce(sum(visitas), 0) from page_views where rota = '/cursos' and dia between ${DE(i)} and ${ATE(i)})::int as visitas,
        count(*)::int as iniciadas,
        count(*) filter (where pago_ate is not null)::int as pagaram,
        count(*) filter (where acesso_liberado_em is not null)::int as liberadas
      from assinaturas where ${DIA_SP("criada_em")} between ${DE(i)} and ${ATE(i)}`),
  );
  return r ?? { visitas: 0, iniciadas: 0, pagaram: 0, liberadas: 0 };
}

export async function resumoCursos(i: Intervalo): Promise<Resumo> {
  const [r] = linhas(
    await db.execute<Resumo>(sql`
      select
        count(*) filter (where status = 'ativa')::int as ativas,
        count(*) filter (where status = 'atrasada')::int as atrasadas,
        /* Só quem já tinha pago: cancelar um checkout nunca pago não é perder assinante. */
        count(*) filter (where cancelada_em is not null and pago_ate is not null and ${DIA_SP("cancelada_em")} between ${DE(i)} and ${ATE(i)})::int as "canceladasNoPeriodo",
        count(*) filter (where pago_ate is not null and ${DIA_SP("criada_em")} between ${DE(i)} and ${ATE(i)})::int as "pagaramNoPeriodo",
        count(*) filter (where pago_ate is not null)::int as "pagaramDesdeSempre"
      from assinaturas`),
  );
  return r ?? { ativas: 0, atrasadas: 0, canceladasNoPeriodo: 0, pagaramNoPeriodo: 0, pagaramDesdeSempre: 0 };
}

export type FunilInterno = {
  /** Primeiro dia com evento medido no período (null: nada medido ainda). */
  inicio: string | null;
  /** Visitas na /cursos do início da medição até o fim do período. */
  visitas: number;
  totais: Record<string, number>;
};

/** O funil dentro da página (2026-10-29): os totais de cada evento de
 *  lib/eventos.ts no período, e as visitas contadas só desde que a medição
 *  começou, para as porcentagens compararem a mesma janela. */
export async function funilInterno(i: Intervalo): Promise<FunilInterno> {
  const eventos = linhas(
    await db.execute<{ evento: string; total: number }>(sql`
      select evento, sum(total)::int as total from eventos_cursos
      where dia between ${DE(i)} and ${ATE(i)} group by evento`),
  );
  const [r] = linhas(
    await db.execute<{ inicio: string | null }>(sql`
      select min(dia)::text as inicio from eventos_cursos where dia between ${DE(i)} and ${ATE(i)}`),
  );
  const inicio = r?.inicio ?? null;
  let visitas = 0;
  if (inicio) {
    const [v] = linhas(
      await db.execute<{ visitas: number }>(sql`
        select coalesce(sum(visitas), 0)::int as visitas from page_views
        where rota = '/cursos' and dia between ${inicio}::date and ${ATE(i)}`),
    );
    visitas = v?.visitas ?? 0;
  }
  return { inicio, visitas, totais: Object.fromEntries(eventos.map((e) => [e.evento, e.total])) };
}
