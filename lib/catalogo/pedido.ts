import { validarCpf } from "./cpf";

/**
 * Validação do pedido do catálogo, separada da rota para ser testável sem
 * subir HTTP nem banco — mesmo desenho de lib/lista-espera.ts.
 */

export type DadosPedido = { nome: string; email: string; telefone: string; cpf: string; slugs: string[] };

export type ValidacaoPedido =
  | { ok: true; dados: DadosPedido }
  | { ok: false; motivo: "nome" | "email" | "telefone" | "cpf" | "cursos" | "consentimento" };

/* Permissivo de propósito, como na lista de espera: barrar um e-mail válido
   custa uma venda; aceitar um digitado errado custa um e-mail que não chega. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarPedido(entrada: unknown, validos: readonly string[]): ValidacaoPedido {
  const { nome, email, telefone, cpf, slugs, consentimento } = (entrada ?? {}) as Record<string, unknown>;

  if (typeof nome !== "string" || nome.trim().length < 2) return { ok: false, motivo: "nome" };
  if (typeof email !== "string" || !EMAIL.test(email.trim())) return { ok: false, motivo: "email" };

  // DDD + número: 10 dígitos (fixo) ou 11 (celular).
  const fone = typeof telefone === "string" ? telefone.replace(/\D/g, "") : "";
  if (fone.length < 10 || fone.length > 11) return { ok: false, motivo: "telefone" };

  const cpfLimpo = typeof cpf === "string" ? validarCpf(cpf) : null;
  if (!cpfLimpo) return { ok: false, motivo: "cpf" };

  if (!Array.isArray(slugs)) return { ok: false, motivo: "cursos" };
  const conhecidos = new Set(validos);
  const limpos = [...new Set(slugs.filter((s): s is string => typeof s === "string" && conhecidos.has(s)))];
  if (limpos.length === 0) return { ok: false, motivo: "cursos" };

  /* Conferido NO SERVIDOR: é a base legal do compartilhamento com o Pecege, e
     qualquer um posta direto na rota sem passar pelo checkbox. */
  if (consentimento !== true) return { ok: false, motivo: "consentimento" };

  return {
    ok: true,
    dados: { nome: nome.trim(), email: email.trim().toLowerCase(), telefone: fone, cpf: cpfLimpo, slugs: limpos },
  };
}

/** Data de vencimento da cobrança, em YYYY-MM-DD, contada a partir do "hoje" de
 *  São Paulo. O container roda em UTC: depois das 21h, a data UTC já é amanhã,
 *  e o vencimento encurtaria um dia sem ninguém ver. */
export function vencimentoEm(dias: number, agora: Date = new Date()): string {
  const hoje = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(agora);
  const data = new Date(`${hoje}T12:00:00Z`);
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}
