/**
 * Regras do voucher do preço de fundador (Desafio Prova Real). Puras, para o
 * teste cobrir sem banco.
 *
 * A promessa (regulamento e página): bolsistas recebem o voucher depois da
 * bolsa (a bolsa acaba em 02/02/2027); não selecionados, por e-mail até
 * 10/01/2027. O voucher vale 15 dias e dá R$ 29,90 por mês durante 12 meses;
 * depois vale o preço público, com aviso por e-mail antes.
 */
export const PRAZO_VOUCHER_DIAS = 15;
export const MESES_PRECO_FUNDADOR = 12;
/** Último dia para o voucher dos não selecionados sair (promessa da página). */
export const LIMITE_VOUCHER_NAO_SELECIONADO = "2027-01-10";
/** Dia em que a bolsa acaba e o voucher dos bolsistas pode sair. */
export const FIM_DA_BOLSA = "2027-02-02";
/** Resultado sai em 24/12: o voucher dos não selecionados não sai antes. */
export const DIA_DO_RESULTADO = "2026-12-24";
/** O /admin avisa que o preço de fundador está acabando com esta antecedência. */
export const AVISO_REAJUSTE_DIAS = 60;

export type GrupoVoucher = "bolsista" | "nao_selecionado";

export function grupoDoVoucher(status: string): GrupoVoucher | null {
  if (status === "selecionado" || status === "aceitou") return "bolsista";
  if (status === "nao_selecionado") return "nao_selecionado";
  return null;
}

/** "cedo": ainda não pode sair; "aberta": pode; "atrasada": já passou do prazo
 *  prometido (só os não selecionados têm prazo; o painel avisa, não bloqueia). */
export function janelaDoVoucher(grupo: GrupoVoucher, hoje: string): "cedo" | "aberta" | "atrasada" {
  if (grupo === "bolsista") return hoje >= FIM_DA_BOLSA ? "aberta" : "cedo";
  if (hoje < DIA_DO_RESULTADO) return "cedo";
  return hoje > LIMITE_VOUCHER_NAO_SELECIONADO ? "atrasada" : "aberta";
}

/** Soma `n` dias a uma data AAAA-MM-DD. */
export function somarDias(data: string, n: number): string {
  const [a, m, d] = data.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Soma `n` meses mantendo o dia, sem pular o mês curto (31/01 + 1 mês = 28/02). */
export function somarMeses(data: string, n: number): string {
  const [a, m, d] = data.split("-").map(Number);
  const ultimo = new Date(Date.UTC(a, m - 1 + n + 1, 0)).getUTCDate();
  return new Date(Date.UTC(a, m - 1 + n, Math.min(d, ultimo))).toISOString().slice(0, 10);
}

/** Até quando o voucher que sai hoje vale (inclusive). */
export function validadeDoVoucher(hoje: string): string {
  return somarDias(hoje, PRAZO_VOUCHER_DIAS);
}

/** Quando o preço de fundador acaba: 12 meses depois da primeira fatura. A
 *  fatura 13 já vem a R$ 49,90. */
export function fimDoPrecoFundador(primeiroVencimento: string): string {
  return somarMeses(primeiroVencimento, MESES_PRECO_FUNDADOR);
}

export type EstadoVoucher = "valido" | "usado" | "expirado";

export function estadoDoVoucher(v: { usadoEm: Date | null; validoAte: string | null }, hoje: string): EstadoVoucher {
  if (v.usadoEm) return "usado";
  if (!v.validoAte || v.validoAte < hoje) return "expirado";
  return "valido";
}

/** O preço de fundador está perto de acabar (ou já acabou) e a assinatura
 *  ainda cobra o valor promocional. */
export function precisaReajuste(precoFundadorAte: string | null, hoje: string): boolean {
  return precoFundadorAte !== null && somarDias(hoje, AVISO_REAJUSTE_DIAS) >= precoFundadorAte;
}

/** Código do voucher: 16 bytes aleatórios em base64url (não dá para adivinhar). */
export function novoCodigoVoucher(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return Buffer.from(b).toString("base64url");
}

export const CODIGO_VOUCHER = /^[A-Za-z0-9_-]{22}$/;
