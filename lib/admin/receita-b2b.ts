import "server-only";
import { and, gt, isNotNull, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { contratos } from "@/lib/db/schema";

/**
 * Receita dos contratos B2B, para somar à do Asaas no painel (etapa 4).
 *
 * O PROBLEMA DE MODELAGEM, e por que a resposta não é "somar tudo":
 *
 * MRR é receita que se REPETE. Um contrato de R$ 12.000 por 12 meses vale
 * R$ 1.000/mês e é recorrente de verdade. Um contrato de R$ 12.000 SEM data de
 * fim não é recorrente coisa nenhuma — é pagamento único, e não existe período
 * pelo qual amortizá-lo. Jogar os dois no mesmo número infla o MRR com dinheiro
 * que não volta no mês seguinte, e um painel que mente para cima é pior que
 * painel nenhum: ele sustenta decisão de contratação e de investimento.
 *
 * Por isso a separação:
 *   - contratos COM vigência  → entram no MRR, amortizados por mês
 *   - contratos SEM vigência  → ficam fora do MRR, somados à parte
 *
 * Mesma definição de vigente do direito de acesso (lib/plataforma/dados.ts):
 * já começou e ainda não terminou. Derivada da data, sem estado guardado.
 */

export type ReceitaB2B = {
  /** Parcela mensal dos contratos vigentes COM data de fim. */
  mrr: number;
  /** Quantos contratos vigentes com vigência definida. */
  contratosComVigencia: number;
  /** Valor total dos contratos vigentes SEM data de fim — receita única, fora
   *  do MRR de propósito. */
  valorSemVigencia: number;
  contratosSemVigencia: number;
};

/** Meses entre duas datas, mínimo 1 — contrato de 20 dias não pode virar
 *  divisor fracionário e explodir o MRR para cima. */
function mesesEntre(inicio: Date, fim: Date): number {
  const dias = (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(1, Math.round(dias / 30.44));
}

export async function receitaB2B(): Promise<ReceitaB2B> {
  const vigente = and(
    lte(contratos.inicioEm, sql`now()`),
    or(isNull(contratos.fimEm), gt(contratos.fimEm, sql`now()`)),
  );

  const comFim = await db
    .select({ valor: contratos.valor, inicioEm: contratos.inicioEm, fimEm: contratos.fimEm })
    .from(contratos)
    .where(and(vigente, isNotNull(contratos.fimEm)));

  const semFim = await db
    .select({ valor: contratos.valor })
    .from(contratos)
    .where(and(vigente, isNull(contratos.fimEm)));

  const mrr = comFim.reduce((soma, c) => {
    const meses = mesesEntre(c.inicioEm, c.fimEm as Date);
    return soma + Number(c.valor) / meses;
  }, 0);

  return {
    mrr,
    contratosComVigencia: comFim.length,
    valorSemVigencia: semFim.reduce((soma, c) => soma + Number(c.valor), 0),
    contratosSemVigencia: semFim.length,
  };
}
