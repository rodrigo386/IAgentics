import { sorteio } from "@/lib/content";

/**
 * Regras do sorteio no Case 2026 (/sorteio, 2026-11-23). Puras: o servidor
 * valida com este código e os testes cobrem sem banco.
 *
 * O sorteio é feito por fora (decisão do Rodrigo), com o CSV do
 * /admin/sorteio. `EVENTO` separa os cadastros, para a mesma página servir ao
 * próximo evento: troque o evento e as datas, e o número da sorte continua a
 * sequência (é único na tabela inteira).
 */
export const EVENTO = "case-2026";
export const CADASTRO_FECHA = new Date("2026-11-26T18:00:00-03:00");

export function cadastroAberto(agora: Date): boolean {
  return agora <= CADASTRO_FECHA;
}

/** A hora do servidor. `SORTEIO_RELOGIO` existe para o e2e (playwright.config.ts). */
export function agoraSorteio(): Date {
  const fixo = process.env.SORTEIO_RELOGIO;
  return fixo ? new Date(fixo) : new Date();
}

export const AREAS: readonly string[] = sorteio.formulario.areas;

export type CadastroValido = {
  nome: string;
  email: string;
  whatsapp: string;
  empresa: string;
  cargo: string;
  area: string;
  comunicacoes: boolean;
};

export type Motivo = "nome" | "email" | "whatsapp" | "area" | "seguindo" | "regulamento";

const texto = (v: unknown, max = 160) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");

export function validarCadastro(corpo: unknown): { ok: true; dados: CadastroValido } | { ok: false; motivo: Motivo } {
  const c = (corpo && typeof corpo === "object" ? corpo : {}) as Record<string, unknown>;
  const nome = texto(c.nome, 120);
  if (nome.length < 3 || !nome.includes(" ")) return { ok: false, motivo: "nome" };
  const email = texto(c.email, 200).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, motivo: "email" };
  const whatsapp = texto(c.whatsapp, 40).replace(/\D/g, "");
  if (whatsapp.length < 10 || whatsapp.length > 13) return { ok: false, motivo: "whatsapp" };
  const area = texto(c.area, 80);
  if (!AREAS.includes(area)) return { ok: false, motivo: "area" };
  /* Seguir a IAgentics no Instagram e/ou no LinkedIn é condição para participar
     (pedido do Rodrigo, 2026-11-23). É declaração: o site não confere. */
  if (c.seguindo !== true) return { ok: false, motivo: "seguindo" };
  if (c.regulamento !== true) return { ok: false, motivo: "regulamento" };
  return {
    ok: true,
    dados: { nome, email, whatsapp, empresa: texto(c.empresa, 120), cargo: texto(c.cargo, 120), area, comunicacoes: c.comunicacoes === true },
  };
}

/** O número como a pessoa vê: quatro dígitos, "0007". */
export function formatarNumero(n: number): string {
  return String(n).padStart(4, "0");
}
