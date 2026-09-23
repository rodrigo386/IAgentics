import type { StatusVenda } from "@/lib/db/schema";

/**
 * Evento do Asaas → mudança de status da venda.
 *
 * `de` é a lista de status a partir dos quais a mudança vale, e é ela que faz
 * o webhook idempotente e à prova de ordem: o Asaas reentrega evento e não
 * garante a ordem. Um PAYMENT_OVERDUE atrasado não pode cancelar uma venda já
 * paga, e um PAYMENT_RECEIVED repetido não muda nada.
 *
 * `cancelado` está na origem de `pago` de propósito: boleto vencido que a
 * pessoa paga mesmo assim é dinheiro recebido. `falhou` também está: a rota do
 * checkout marca a venda "falhou" quando `criarCobranca` estoura (timeout de
 * 15s, ou 5xx depois que o Asaas já criou a cobrança do lado dele) — o Asaas
 * confirmando pagamento para o nosso `externalReference` é sempre dinheiro de
 * verdade, então recuperar de "falhou" para "pago" é o comportamento certo,
 * nunca um bug.
 */
export function transicaoDoEvento(event: string): { para: StatusVenda; de: StatusVenda[] } | null {
  switch (event) {
    case "PAYMENT_RECEIVED":
    case "PAYMENT_CONFIRMED":
      return { para: "pago", de: ["pendente", "cancelado", "falhou"] };
    case "PAYMENT_REFUNDED":
      return { para: "estornado", de: ["pago"] };
    case "PAYMENT_OVERDUE":
    case "PAYMENT_DELETED":
      return { para: "cancelado", de: ["pendente"] };
    default:
      return null;
  }
}
