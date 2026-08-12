import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";

export type EventoAsaas = { event?: string; payment?: { subscription?: string; dueDate?: string } };

/** Transição de status da assinatura casada por asaas_subscription_id — nunca
 *  por e-mail. Idempotente: o UPDATE recalcula o mesmo estado a partir do mesmo
 *  evento, então reentrega do Asaas não muda nada. Evento sem subscription ou
 *  de assinatura desconhecida (cobrança avulsa criada no painel) é no-op — a
 *  rota responde 200 nesses casos para o Asaas não pausar a fila. */
export async function processarEventoAsaas(evento: EventoAsaas): Promise<void> {
  const idAssinatura = evento.payment?.subscription;
  if (!idAssinatura) return;
  const alvo = eq(subscriptions.asaasSubscriptionId, idAssinatura);

  const event = evento.event ?? "";
  if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
    // Acesso até 1 mês após o vencimento pago; meio-dia UTC evita o vencimento
    // "voltar um dia" ao formatar em fuso brasileiro (UTC-3).
    const vencimento = evento.payment?.dueDate ? new Date(`${evento.payment.dueDate}T12:00:00Z`) : new Date();
    const ano = vencimento.getUTCFullYear();
    const mesAlvo = vencimento.getUTCMonth() + 1;
    // Trava no último dia do mês-alvo: setUTCMonth() sozinho transborda quando
    // o mês-alvo é mais curto (ex.: 31/jan + 1 mês viraria 03/mar em vez de
    // 28/fev). Math.min contra o último dia real do mês-alvo evita o estouro
    // sem encolher os casos em que o mês seguinte também tem o mesmo dia.
    const ultimoDiaMesAlvo = new Date(Date.UTC(ano, mesAlvo + 1, 0)).getUTCDate();
    const dia = Math.min(vencimento.getUTCDate(), ultimoDiaMesAlvo);
    const fim = new Date(Date.UTC(ano, mesAlvo, dia, 12, 0, 0));
    await db.update(subscriptions).set({ status: "ativa", currentPeriodEnd: fim }).where(alvo);
  } else if (event === "PAYMENT_OVERDUE") {
    await db.update(subscriptions).set({ status: "inadimplente" }).where(alvo);
  } else if (event === "PAYMENT_REFUNDED" || event === "PAYMENT_DELETED") {
    await db.update(subscriptions).set({ status: "cancelada" }).where(alvo);
  }
  // Demais eventos: no-op de propósito.
}
