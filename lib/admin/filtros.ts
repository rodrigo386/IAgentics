import { ETAPAS, type Etapa } from "@/lib/assinatura/fluxo";
import type { StatusAssinatura } from "@/lib/db/schema";

/**
 * Filtros do /admin/cursos (2026-10-20, pedido do Rodrigo: "incluir filtros").
 * Lidos da URL, para uma visão filtrada poder ir para os favoritos.
 *
 * - Período (indicadores, funil e gráficos): 7/30/90 dias até hoje, ou datas
 *   de/até. Datas inválidas, invertidas ou além de um ano caem no padrão de
 *   30 dias, em vez de devolver erro.
 * - Quadro e tabela: busca (nome, e-mail ou telefone), etapa, status e "só
 *   quem assinou no período".
 */
export const PERIODOS = [7, 30, 90] as const;
const MAX_DIAS = 366;
const STATUS: StatusAssinatura[] = ["pendente", "ativa", "atrasada", "cancelada", "contestada", "estornada", "falhou"];

export type Filtros = {
  de: string;
  ate: string;
  /** Quantos dias o período cobre (de e até inclusos). */
  dias: number;
  /** 7, 30 ou 90 quando é um período pronto; null quando é de/até. */
  pronto: number | null;
  etapa: Etapa | null;
  status: StatusAssinatura | null;
  busca: string;
  soPeriodo: boolean;
};

const DATA = /^\d{4}-\d{2}-\d{2}$/;
const valida = (s: unknown): s is string => typeof s === "string" && DATA.test(s) && !Number.isNaN(Date.parse(`${s}T12:00:00Z`));
const diasEntre = (de: string, ate: string) => Math.round((Date.parse(`${ate}T12:00:00Z`) - Date.parse(`${de}T12:00:00Z`)) / 864e5) + 1;
export const somaDias = (dia: string, n: number) => new Date(Date.parse(`${dia}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);

export function lerFiltros(p: Record<string, string | string[] | undefined>, hoje: string): Filtros {
  const um = (k: string) => {
    const v = p[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const de = um("de");
  const ate = um("ate");
  let periodo: Pick<Filtros, "de" | "ate" | "dias" | "pronto">;
  if (valida(de) && valida(ate) && de <= ate && ate <= hoje && diasEntre(de, ate) <= MAX_DIAS) {
    periodo = { de, ate, dias: diasEntre(de, ate), pronto: null };
  } else {
    const pedido = Number(um("dias"));
    const dias = (PERIODOS as readonly number[]).includes(pedido) ? pedido : 30;
    periodo = { de: somaDias(hoje, -(dias - 1)), ate: hoje, dias, pronto: dias };
  }
  const etapa = um("etapa");
  const status = um("status");
  return {
    ...periodo,
    etapa: (ETAPAS as string[]).includes(etapa ?? "") ? (etapa as Etapa) : null,
    status: (STATUS as string[]).includes(status ?? "") ? (status as StatusAssinatura) : null,
    busca: (um("q") ?? "").trim().slice(0, 80),
    soPeriodo: um("periodo") === "1",
  };
}

/** Aplica busca, etapa, status e "só do período" à lista do quadro e da tabela. */
export function filtrarAssinaturas<T extends { a: { nome: string; email: string; telefone: string; status: StatusAssinatura; criadaEm: Date }; etapa: Etapa }>(
  lista: T[],
  f: Filtros,
  diaSP: (d: Date) => string,
): T[] {
  const termo = f.busca.toLowerCase();
  const digitos = f.busca.replace(/\D/g, "");
  return lista.filter(({ a, etapa }) => {
    if (f.etapa && etapa !== f.etapa) return false;
    if (f.status && a.status !== f.status) return false;
    if (f.soPeriodo) {
      const dia = diaSP(a.criadaEm);
      if (dia < f.de || dia > f.ate) return false;
    }
    if (termo) {
      const noTexto = a.nome.toLowerCase().includes(termo) || a.email.toLowerCase().includes(termo);
      const noTelefone = digitos.length >= 3 && a.telefone.includes(digitos);
      if (!noTexto && !noTelefone) return false;
    }
    return true;
  });
}
