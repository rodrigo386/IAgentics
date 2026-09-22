import "server-only";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { vendas, type ItemVenda, type ModoVenda } from "@/lib/db/schema";
import { transicaoDoEvento } from "./eventos";

export type Venda = typeof vendas.$inferSelect;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function criarVenda(d: {
  nome: string;
  email: string;
  telefone: string;
  itens: ItemVenda[];
  totalCentavos: number;
  modo: ModoVenda;
}): Promise<string> {
  const [linha] = await db.insert(vendas).values(d).returning({ id: vendas.id });
  return linha.id;
}

export async function anexarCobranca(id: string, c: { clienteId: string; cobrancaId: string; urlFatura: string }) {
  await db
    .update(vendas)
    .set({ asaasClienteId: c.clienteId, asaasCobrancaId: c.cobrancaId, urlFatura: c.urlFatura })
    .where(eq(vendas.id, id));
}

export async function marcarFalha(id: string) {
  await db.update(vendas).set({ status: "falhou" }).where(and(eq(vendas.id, id), eq(vendas.status, "pendente")));
}

/** O id vem da URL do pedido: o que não é uuid nem chega ao banco (o Postgres
 *  recusaria o cast com erro 500). */
export async function buscarVenda(id: string): Promise<Venda | null> {
  if (!UUID.test(id)) return null;
  const [linha] = await db.select().from(vendas).where(eq(vendas.id, id));
  return linha ?? null;
}

export type EventoAsaas = { event?: string; payment?: { id?: string; externalReference?: string | null } };

/**
 * Aplica um evento do webhook. A venda é achada por `externalReference`, que o
 * checkout preenche com o id da venda ao criar a cobrança.
 *
 * "ignorado": evento que não interessa ou sem referência válida (cobrança
 * criada à mão no painel do Asaas, por exemplo). "sem-efeito": a venda não
 * existe ou já estava no estado — reentrega do Asaas cai aqui. Em nenhum caso
 * a rota responde erro: erro repetido faz o Asaas pausar a fila inteira.
 */
export async function aplicarEventoAsaas(evento: EventoAsaas): Promise<"atualizado" | "sem-efeito" | "ignorado"> {
  const transicao = transicaoDoEvento(evento.event ?? "");
  const referencia = evento.payment?.externalReference ?? "";
  if (!transicao || !UUID.test(referencia)) return "ignorado";

  const linhas = await db
    .update(vendas)
    .set({
      status: transicao.para,
      // coalesce: reentrega não reescreve a data do primeiro pagamento.
      ...(transicao.para === "pago" ? { pagoEm: sql`coalesce(${vendas.pagoEm}, now())` } : {}),
    })
    .where(and(eq(vendas.id, referencia), inArray(vendas.status, transicao.de)))
    .returning({ id: vendas.id });

  return linhas.length > 0 ? "atualizado" : "sem-efeito";
}

/** Botão do /admin. Só vale para venda paga e ainda não liberada — clicar duas
 *  vezes não reescreve a data. */
export async function marcarAcessoLiberado(id: string): Promise<boolean> {
  if (!UUID.test(id)) return false;
  const linhas = await db
    .update(vendas)
    .set({ acessoLiberadoEm: sql`now()` })
    .where(and(eq(vendas.id, id), eq(vendas.status, "pago"), isNull(vendas.acessoLiberadoEm)))
    .returning({ id: vendas.id });
  return linhas.length > 0;
}
