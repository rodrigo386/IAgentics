import "server-only";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { contaAtiva, temAcesso } from "@/lib/plataforma/dados";
import { buscarUsuario } from "@/lib/plataforma/usuarios";
import { plataforma } from "@/lib/content-plataforma";
import { validarCpf } from "./cpf";
import { clienteAsaas, type ClienteAsaas } from "./cliente";

export type ResultadoAssinar = { ok: true; url: string } | { ok: false; erro: string };

/** Contratação: cria cliente + assinatura no Asaas e devolve a URL da fatura
 *  hospedada. O webhook (lib/asaas/webhook.ts) é quem ativa depois do pagamento.
 *  `cliente` é injetável — teste usa um fake; produção usa o real por padrão. */
export async function iniciarAssinatura(
  userId: string,
  cpfBruto: string,
  cliente: ClienteAsaas = clienteAsaas,
): Promise<ResultadoAssinar> {
  const t = plataforma.assinar;
  if (!(await contaAtiva(userId))) return { ok: false, erro: t.erroGenerico };
  if (await temAcesso(userId)) return { ok: false, erro: t.jaAssinante };
  const cpf = validarCpf(cpfBruto);
  if (!cpf) return { ok: false, erro: t.cpfInvalido };
  const usuario = await buscarUsuario(userId);
  if (!usuario) return { ok: false, erro: t.erroGenerico };

  try {
    // Reuso 1: já existe assinatura pendente no Asaas → volta pra MESMA fatura
    // em aberto em vez de criar uma duplicata (clique repetido no botão).
    const [ultima] = await db
      .select({ status: subscriptions.status, asaasSubscriptionId: subscriptions.asaasSubscriptionId })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    if (ultima?.status === "pendente" && ultima.asaasSubscriptionId) {
      const aberta = (await cliente.listarCobrancas(ultima.asaasSubscriptionId)).find(
        (c) => (c.status === "PENDING" || c.status === "OVERDUE") && c.invoiceUrl,
      );
      if (aberta) return { ok: true, url: aberta.invoiceUrl };
      // sem cobrança aberta = assinatura morta no Asaas; segue e cria nova
    }

    // Reuso 2: cliente Asaas já criado em tentativa/assinatura anterior.
    const [comCliente] = await db
      .select({ id: subscriptions.asaasCustomerId })
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), isNotNull(subscriptions.asaasCustomerId)))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    const customerId =
      comCliente?.id ?? (await cliente.criarCliente({ name: usuario.nome, email: usuario.email, cpfCnpj: cpf })).id;

    const nextDueDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const assinatura = await cliente.criarAssinatura({ customer: customerId, nextDueDate });

    // Linha nova, nunca update — o histórico de status é o mesmo padrão do
    // liberar/revogar do admin, e temAcesso lê sempre a linha mais recente.
    await db.insert(subscriptions).values({
      userId,
      status: "pendente",
      asaasCustomerId: customerId,
      asaasSubscriptionId: assinatura.id,
    });

    const [cobranca] = await cliente.listarCobrancas(assinatura.id);
    if (!cobranca?.invoiceUrl) return { ok: false, erro: t.erroGenerico };
    return { ok: true, url: cobranca.invoiceUrl };
  } catch (e) {
    console.error("iniciarAssinatura", e); // detalhe só no servidor; a tela vê o genérico
    return { ok: false, erro: t.erroGenerico };
  }
}
