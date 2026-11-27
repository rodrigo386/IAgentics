import { normalizarLinkedin } from "@/lib/bolsas/regras";
import { PASSO_FINAL } from "./regras";

/**
 * Cadastro do Nexo Demo (2026-11-27): os quatro campos que o Rodrigo pediu
 * (e-mail, empresa, celular, LinkedIn), o nome (que ele aprovou incluir no
 * mesmo dia) e a caixa de ciência. Puro: o servidor
 * valida com este código e os testes cobrem sem banco.
 */
export type CadastroValido = { nome: string; email: string; empresa: string; celular: string; linkedin: string };
export type Motivo = "nome" | "email" | "empresa" | "celular" | "linkedin" | "ciencia";

const texto = (v: unknown, max = 160) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");

export function validarCadastro(corpo: unknown): { ok: true; dados: CadastroValido } | { ok: false; motivo: Motivo } {
  const c = (corpo && typeof corpo === "object" ? corpo : {}) as Record<string, unknown>;
  const nome = texto(c.nome, 120);
  if (nome.length < 2) return { ok: false, motivo: "nome" };
  const email = texto(c.email, 200).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, motivo: "email" };
  const empresa = texto(c.empresa, 120);
  if (empresa.length < 2) return { ok: false, motivo: "empresa" };
  const celular = texto(c.celular, 40).replace(/\D/g, "");
  if (celular.length < 10 || celular.length > 13) return { ok: false, motivo: "celular" };
  const linkedin = normalizarLinkedin(c.linkedin);
  if (!linkedin) return { ok: false, motivo: "linkedin" };
  if (c.ciencia !== true) return { ok: false, motivo: "ciencia" };
  return { ok: true, dados: { nome, email, empresa, celular, linkedin } };
}

/** O token de acesso tem o formato que a rota gera (32 bytes em base64url)? */
export function tokenValido(v: unknown): v is string {
  return typeof v === "string" && /^[A-Za-z0-9_-]{43}$/.test(v);
}

/** Passo que o navegador informa: inteiro dentro da lista de passos. */
export function passoValido(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= PASSO_FINAL;
}

/** Como a demonstração e o e-mail chamam a pessoa. */
export const primeiroNome = (nome: string) => nome.trim().split(/\s+/)[0] ?? "";
