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
 * pessoa paga mesmo assim é dinheiro recebido.
 */
export function transicaoDoEvento(event: string): { para: StatusVenda; de: StatusVenda[] } | null {
  switch (event) {
    case "PAYMENT_RECEIVED":
    case "PAYMENT_CONFIRMED":
      return { para: "pago", de: ["pendente", "cancelado"] };
    case "PAYMENT_REFUNDED":
      return { para: "estornado", de: ["pago"] };
    case "PAYMENT_OVERDUE":
    case "PAYMENT_DELETED":
      return { para: "cancelado", de: ["pendente"] };
    default:
      return null;
  }
}
