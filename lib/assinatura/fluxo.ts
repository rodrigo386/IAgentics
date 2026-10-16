import type { StatusAssinatura } from "@/lib/db/schema";
import { acaoDoAdmin, hojeSP } from "./regras";

/**
 * O fluxo do cliente no /admin/cursos (2026-10-16): em que etapa cada
 * assinatura está e, para quem pagou e espera o acesso, quanto do prazo de
 * 24 horas úteis já passou (o prazo prometido no e-mail de boas-vindas e na
 * /cursos).
 *
 * Funções puras: nada de banco aqui, para o teste cobrir as regras.
 */

/** Prazo prometido ao cliente para liberar o acesso, em horas úteis. */
export const PRAZO_LIBERACAO_HORAS = 24;

/** São Paulo não tem horário de verão desde 2019: UTC−3 fixo. */
const FUSO_SP_MS = 3 * 60 * 60 * 1000;
const HORA_MS = 60 * 60 * 1000;
const DIA_MS = 24 * HORA_MS;

/**
 * Horas úteis entre dois instantes: as horas que caem de segunda a sexta, no
 * calendário de São Paulo. "24 horas úteis" = 24 horas de dias úteis (o
 * fim de semana não conta). Feriados não entram na conta: um feriado na
 * semana faz o painel acusar atraso um dia antes do que o combinado.
 */
export function horasUteisEntre(inicio: Date, fim: Date): number {
  // Desloca para o relógio de SP e trabalha em "UTC" a partir daí.
  let t = inicio.getTime() - FUSO_SP_MS;
  const ate = fim.getTime() - FUSO_SP_MS;
  if (ate <= t) return 0;
  let ms = 0;
  while (t < ate) {
    const meiaNoiteSeguinte = (Math.floor(t / DIA_MS) + 1) * DIA_MS;
    const fimDoTrecho = Math.min(meiaNoiteSeguinte, ate);
    const diaDaSemana = new Date(t).getUTCDay(); // 0 domingo, 6 sábado
    if (diaDaSemana !== 0 && diaDaSemana !== 6) ms += fimDoTrecho - t;
    t = fimDoTrecho;
  }
  return ms / HORA_MS;
}

export type Prazo = { horas: number; situacao: "no-prazo" | "vence-logo" | "atrasado" };

/** Situação do prazo de liberação: avisa quando faltam 6 horas úteis ou menos. */
export function prazoDeLiberacao(pagoEm: Date, agora: Date = new Date()): Prazo {
  const horas = horasUteisEntre(pagoEm, agora);
  const situacao = horas > PRAZO_LIBERACAO_HORAS ? "atrasado" : horas > PRAZO_LIBERACAO_HORAS - 6 ? "vence-logo" : "no-prazo";
  return { horas, situacao };
}

export type Etapa = "pagamento" | "liberar" | "com-acesso" | "atrasada" | "revogar" | "encerrada";

/** As colunas do quadro, na ordem da jornada. */
export const ETAPAS: Etapa[] = ["pagamento", "liberar", "com-acesso", "atrasada", "revogar", "encerrada"];

/**
 * A etapa da assinatura. O que pede ação (liberar, revogar) vem primeiro,
 * pela mesma regra da coluna Fazer do /admin (`acaoDoAdmin`); o resto segue o
 * status. Uma atrasada que ainda tem mês pago fica em "atrasada"; quando o
 * mês acaba, vira "revogar".
 */
export function etapaDoCliente(
  a: { status: StatusAssinatura; pagoAte: string | null; acessoLiberadoEm: Date | null; acessoRevogadoEm: Date | null },
  hoje: string = hojeSP(),
): Etapa {
  const acao = acaoDoAdmin(a, hoje);
  if (acao === "liberar") return "liberar";
  if (acao === "revogar") return "revogar";
  if (a.status === "pendente") return "pagamento";
  if (a.status === "atrasada") return "atrasada";
  const temAcesso = a.acessoLiberadoEm !== null && a.acessoRevogadoEm === null;
  if (temAcesso && (a.status === "ativa" || a.status === "cancelada")) return "com-acesso";
  return "encerrada";
}
