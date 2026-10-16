import "server-only";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { assinaturas } from "@/lib/db/schema";
import { cancelarAssinaturaAsaas } from "@/lib/asaas/cliente";
import { emailBoasVindas, enviarEmail, RESPONDER_ASSINATURA } from "@/lib/email";
import { EVENTOS_PAGO, pagoAteDaFatura, transicaoAssinatura } from "./regras";

/**
 * Banco da assinatura da Solution (2026-10-14). Mesmo desenho de
 * lib/catalogo/vendas.ts: a linha nasce ANTES de falar com o Asaas, o webhook
 * é idempotente, e nada aqui loga dado pessoal.
 */
export type Assinatura = typeof assinaturas.$inferSelect;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function criarLinha(d: { nome: string; email: string; telefone: string; valorCentavos: number }): Promise<string> {
  const [linha] = await db.insert(assinaturas).values(d).returning({ id: assinaturas.id });
  return linha.id;
}

export async function anexarAsaas(id: string, d: { clienteId: string; assinaturaId: string; urlFatura?: string | null }) {
  await db
    .update(assinaturas)
    .set({ asaasClienteId: d.clienteId, asaasAssinaturaId: d.assinaturaId, urlFatura: d.urlFatura ?? null })
    .where(eq(assinaturas.id, id));
}

export async function marcarFalha(id: string) {
  await db.update(assinaturas).set({ status: "falhou" }).where(and(eq(assinaturas.id, id), eq(assinaturas.status, "pendente")));
}

export async function buscarAssinatura(id: string): Promise<Assinatura | null> {
  if (!UUID.test(id)) return null;
  const [linha] = await db.select().from(assinaturas).where(eq(assinaturas.id, id));
  return linha ?? null;
}

export async function listarAssinaturas(): Promise<Assinatura[]> {
  return db.select().from(assinaturas).orderBy(desc(assinaturas.criadaEm)).limit(500);
}

export type EventoAssinatura = {
  event?: string;
  payment?: { id?: string; subscription?: string | null; externalReference?: string | null; dueDate?: string | null };
};

/**
 * Aplica um evento do webhook a uma assinatura, achada pelo id da assinatura
 * do Asaas (`payment.subscription`). Pagamento confirmado também empurra
 * `pagoAte` para o vencimento da fatura + 1 mês — com `greatest`, para que a
 * reentrega de uma fatura antiga nunca encurte o acesso.
 */
export async function aplicarEventoAssinatura(evento: EventoAssinatura): Promise<"atualizado" | "sem-efeito" | "ignorado"> {
  const transicao = transicaoAssinatura(evento.event ?? "");
  const idAsaas = evento.payment?.subscription ?? "";
  if (!transicao || !idAsaas) return "ignorado";

  const pago = EVENTOS_PAGO.has(evento.event ?? "");
  const vencimento = evento.payment?.dueDate ?? "";
  const novoPagoAte = pago && /^\d{4}-\d{2}-\d{2}$/.test(vencimento) ? pagoAteDaFatura(vencimento) : null;

  // Pagamento de assinatura cancelada: o status fica, mas o mês pago conta.
  let pagoAtualizado = 0;
  if (pago && novoPagoAte) {
    const r = await db
      .update(assinaturas)
      .set({
        pagoAte: sql`greatest(coalesce(${assinaturas.pagoAte}, ${novoPagoAte}::date), ${novoPagoAte}::date)`,
        ultimoPagamentoEm: sql`now()`,
      })
      .where(and(eq(assinaturas.asaasAssinaturaId, idAsaas), inArray(assinaturas.status, ["cancelada", ...transicao.de])))
      .returning({ id: assinaturas.id });
    pagoAtualizado = r.length;
  }

  const linhas = await db
    .update(assinaturas)
    .set({ status: transicao.para })
    .where(and(eq(assinaturas.asaasAssinaturaId, idAsaas), inArray(assinaturas.status, transicao.de)))
    .returning({ id: assinaturas.id });
  if (pago) await enviarBoasVindas(idAsaas);
  return linhas.length > 0 || pagoAtualizado > 0 ? "atualizado" : "sem-efeito";
}

/**
 * E-mail de boas-vindas, uma vez por assinatura ativa (2026-10-16). A marca
 * `boasVindasEm` é gravada ANTES do envio: o Asaas manda dois avisos para o
 * mesmo pagamento no cartão (confirmado e recebido), e só quem conseguir
 * marcar envia. Se o envio falhar, a marca é desfeita para o próximo aviso
 * tentar de novo. Falha de e-mail nunca derruba o webhook: o pagamento já
 * foi gravado, e o Asaas não precisa reentregar por causa disso.
 */
export async function enviarBoasVindas(idAsaas: string): Promise<boolean> {
  const [a] = await db
    .update(assinaturas)
    .set({ boasVindasEm: sql`now()` })
    .where(and(eq(assinaturas.asaasAssinaturaId, idAsaas), eq(assinaturas.status, "ativa"), isNull(assinaturas.boasVindasEm)))
    .returning({ id: assinaturas.id, nome: assinaturas.nome, email: assinaturas.email });
  if (!a) return false;
  const { ok } = await enviarEmail({ para: a.email, responderPara: RESPONDER_ASSINATURA, ...emailBoasVindas(a.nome) }).catch(() => ({ ok: false }));
  if (!ok) await db.update(assinaturas).set({ boasVindasEm: null }).where(eq(assinaturas.id, a.id));
  return ok;
}

/** Botões do /admin. Cada um só vale uma vez (clicar de novo não reescreve). */
export async function marcarAcessoLiberado(id: string): Promise<boolean> {
  if (!UUID.test(id)) return false;
  const r = await db
    .update(assinaturas)
    .set({ acessoLiberadoEm: sql`now()`, acessoRevogadoEm: null })
    .where(and(eq(assinaturas.id, id), isNull(assinaturas.acessoLiberadoEm)))
    .returning({ id: assinaturas.id });
  return r.length > 0;
}

export async function marcarAcessoRevogado(id: string): Promise<boolean> {
  if (!UUID.test(id)) return false;
  const r = await db
    .update(assinaturas)
    .set({ acessoRevogadoEm: sql`now()` })
    .where(and(eq(assinaturas.id, id), isNull(assinaturas.acessoRevogadoEm)))
    .returning({ id: assinaturas.id });
  return r.length > 0;
}

/**
 * Cancela a pedido da pessoa (WhatsApp ou e-mail, decisão do Rodrigo): para de
 * cobrar no Asaas e marca aqui. O acesso continua até `pagoAte`; quando ele
 * passar, o /admin manda revogar.
 */
export async function cancelarAssinatura(id: string): Promise<boolean> {
  const a = await buscarAssinatura(id);
  if (!a || a.status === "cancelada") return false;
  if (a.asaasAssinaturaId) await cancelarAssinaturaAsaas(a.asaasAssinaturaId);
  const r = await db
    .update(assinaturas)
    .set({ status: "cancelada", canceladaEm: sql`now()` })
    .where(and(eq(assinaturas.id, id), inArray(assinaturas.status, ["pendente", "ativa", "atrasada", "falhou"])))
    .returning({ id: assinaturas.id });
  return r.length > 0;
}
