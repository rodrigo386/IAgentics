import "server-only";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { avisarInadimplencia } from "@/lib/plataforma/avisos";

export type EventoAsaas = {
  event?: string;
  /** `invoiceUrl` é a fatura em aberto no Asaas — vai no e-mail de cobrança
   *  vencida para poupar um clique. Opcional: nem todo evento a traz. */
  payment?: { subscription?: string; dueDate?: string; invoiceUrl?: string };
};

/** dueDate (YYYY-MM-DD) + 1 mês, com clamp de fim de mês, meio-dia UTC. O
 *  meio-dia UTC evita o vencimento "voltar um dia" ao formatar em fuso
 *  brasileiro (UTC-3); o clamp evita que setUTCMonth() sozinho transborde
 *  quando o mês-alvo é mais curto (ex.: 31/jan + 1 mês viraria 03/mar em vez
 *  de 28/fev) — Math.min contra o último dia real do mês-alvo resolve isso
 *  sem encolher os casos em que o mês seguinte também tem o mesmo dia. Sem
 *  dueDate, usa agora. Exportada (fix — review final, Important) porque o
 *  self-heal de cobrança já paga em lib/asaas/assinatura.ts precisa do mesmo
 *  cálculo fora do webhook, quando a API autenticada do Asaas já confirma o
 *  pagamento antes do evento chegar. */
export function fimDoPeriodoPago(dueDate: string | undefined): Date {
  const vencimento = dueDate ? new Date(`${dueDate}T12:00:00Z`) : new Date();
  const ano = vencimento.getUTCFullYear();
  const mesAlvo = vencimento.getUTCMonth() + 1;
  const ultimoDiaMesAlvo = new Date(Date.UTC(ano, mesAlvo + 1, 0)).getUTCDate();
  const dia = Math.min(vencimento.getUTCDate(), ultimoDiaMesAlvo);
  return new Date(Date.UTC(ano, mesAlvo, dia, 12, 0, 0));
}

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
    const fim = fimDoPeriodoPago(evento.payment?.dueDate);
    await db.update(subscriptions).set({ status: "ativa", currentPeriodEnd: fim }).where(alvo);
  } else if (event === "PAYMENT_OVERDUE") {
    /* O `ne` no WHERE é o que torna o AVISO idempotente, não o UPDATE — este
       já era. O Asaas reentrega evento, e sem esta cláusula cada reentrega
       casaria a linha de novo e mandaria mais um e-mail dizendo ao aluno que
       ele está devendo. Com ela, a segunda entrega não muda linha nenhuma,
       `returning` volta vazio, e nenhum e-mail sai.

       O aviso fica DEPOIS do update de propósito: se o e-mail explodisse antes,
       a rota devolveria 500, o Asaas reentregaria, e a assinatura ficaria
       "ativa" no banco com o pagamento vencido. avisarInadimplencia() também
       nunca lança, então o 500 não acontece por essa via. */
    const [mudou] = await db
      .update(subscriptions)
      .set({ status: "inadimplente" })
      .where(and(alvo, ne(subscriptions.status, "inadimplente")))
      .returning({ userId: subscriptions.userId });
    if (mudou) await avisarInadimplencia(mudou.userId, evento.payment?.invoiceUrl);
  } else if (event === "PAYMENT_REFUNDED" || event === "PAYMENT_DELETED") {
    await db.update(subscriptions).set({ status: "cancelada" }).where(alvo);
  }
  // Demais eventos: no-op de propósito.
}
