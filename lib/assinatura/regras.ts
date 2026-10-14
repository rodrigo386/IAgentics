import type { StatusAssinatura } from "@/lib/db/schema";
import { validarCpf } from "@/lib/catalogo/cpf";

/**
 * Regras puras da assinatura da Solution (2026-10-14): validação do
 * formulário, o que cada evento do Asaas faz com a assinatura, até quando o
 * acesso está pago e o que o /admin precisa fazer com cada linha. Sem banco e
 * sem HTTP, para o teste exercitar tudo.
 */

export const VALOR_ASSINATURA_CENTAVOS = 4990;

export type DadosAssinatura = { nome: string; email: string; telefone: string; cpf: string };
export type ValidacaoAssinatura =
  | { ok: true; dados: DadosAssinatura }
  | { ok: false; motivo: "nome" | "email" | "telefone" | "cpf" | "consentimento" | "compartilhamento" };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarAssinatura(entrada: unknown): ValidacaoAssinatura {
  const { nome, email, telefone, cpf, consentimento, compartilhamento } = (entrada ?? {}) as Record<string, unknown>;
  if (typeof nome !== "string" || nome.trim().length < 2 || nome.trim().length > 200) return { ok: false, motivo: "nome" };
  if (typeof email !== "string" || email.trim().length > 254 || !EMAIL.test(email.trim())) return { ok: false, motivo: "email" };
  const fone = typeof telefone === "string" ? telefone.replace(/\D/g, "") : "";
  if (fone.length < 10 || fone.length > 11) return { ok: false, motivo: "telefone" };
  const cpfLimpo = typeof cpf === "string" ? validarCpf(cpf) : null;
  if (!cpfLimpo) return { ok: false, motivo: "cpf" };
  /* Conferidos NO SERVIDOR, porque qualquer um posta direto na rota: a
     autorização da cobrança recorrente e a ciência do compartilhamento com o
     Pecege (dois checkboxes desde 2026-10-14). */
  if (consentimento !== true) return { ok: false, motivo: "consentimento" };
  if (compartilhamento !== true) return { ok: false, motivo: "compartilhamento" };
  return { ok: true, dados: { nome: nome.trim(), email: email.trim().toLowerCase(), telefone: fone, cpf: cpfLimpo } };
}

/**
 * Evento do Asaas → mudança de status. `de` faz o webhook idempotente e à
 * prova de ordem, como em `vendas`: o Asaas reentrega e não garante a ordem.
 *
 * Pagamento confirmado reativa assinatura atrasada (pagou o boleto vencido) e
 * recupera "falhou" (o Asaas criou a assinatura mesmo com o nosso passo
 * seguinte estourando). Assinatura CANCELADA que recebe pagamento continua
 * cancelada — o dinheiro conta em `pagoAte`, mas não volta a gerar cobrança.
 *
 * Contestação (chargeback) e estorno eram pendência desde 2026-09-22: uma
 * venda contestada ficava "pago" e aguardando liberação. Aqui viram status
 * próprios, e o /admin manda revogar o acesso.
 */
export function transicaoAssinatura(evento: string): { para: StatusAssinatura; de: StatusAssinatura[] } | null {
  switch (evento) {
    case "PAYMENT_RECEIVED":
    case "PAYMENT_CONFIRMED":
      return { para: "ativa", de: ["pendente", "atrasada", "falhou", "ativa"] };
    case "PAYMENT_OVERDUE":
      return { para: "atrasada", de: ["pendente", "ativa"] };
    case "PAYMENT_REFUNDED":
      return { para: "estornada", de: ["ativa", "atrasada", "cancelada", "contestada"] };
    case "PAYMENT_CHARGEBACK_REQUESTED":
    case "PAYMENT_CHARGEBACK_DISPUTE":
    case "PAYMENT_AWAITING_CHARGEBACK_REVERSAL":
      return { para: "contestada", de: ["ativa", "atrasada", "cancelada"] };
    default:
      return null;
  }
}

/** Eventos de pagamento confirmado: os que empurram `pagoAte`. */
export const EVENTOS_PAGO = new Set(["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"]);

/** Até quando a fatura de vencimento `vencimento` paga o acesso: o mesmo dia
 *  do mês seguinte (31/01 → 28 ou 29/02, sem pular para março). */
export function pagoAteDaFatura(vencimento: string): string {
  const [a, m, d] = vencimento.split("-").map(Number);
  const ultimoDia = new Date(Date.UTC(a, m + 1, 0)).getUTCDate(); // último dia do mês seguinte
  const fim = new Date(Date.UTC(a, m, Math.min(d, ultimoDia)));
  return fim.toISOString().slice(0, 10);
}

/** "Hoje" em São Paulo, AAAA-MM-DD (o container roda em UTC). */
export function hojeSP(agora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(agora);
}

/**
 * O que o /admin precisa fazer com a linha. A liberação na Solution é manual,
 * feita pelo Pecege: "liberar" quem pagou e ainda não tem acesso; "revogar"
 * quem tem acesso e deixou de ter direito (o mês pago acabou, ou o pagamento
 * foi contestado ou estornado).
 */
export function acaoDoAdmin(a: {
  status: StatusAssinatura;
  pagoAte: string | null;
  acessoLiberadoEm: Date | null;
  acessoRevogadoEm: Date | null;
}, hoje: string = hojeSP()): "liberar" | "revogar" | null {
  const temAcesso = a.acessoLiberadoEm !== null && a.acessoRevogadoEm === null;
  const pagoVigente = a.pagoAte !== null && a.pagoAte >= hoje;
  if (temAcesso && (a.status === "contestada" || a.status === "estornada" || !pagoVigente)) return "revogar";
  if (!temAcesso && a.acessoRevogadoEm === null && pagoVigente && a.status !== "contestada" && a.status !== "estornada") return "liberar";
  return null;
}
