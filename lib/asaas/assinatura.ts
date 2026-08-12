import "server-only";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
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
    return await db.transaction(async (tx) => {
      // Lock por usuário (fix round, Critical 1): sem isto, duas chamadas
      // concorrentes de iniciarAssinatura pro MESMO userId (duplo clique, aba
      // duplicada) leem "nenhuma pendente" ao mesmo tempo e cada uma cria
      // customer + assinatura REAIS no Asaas — cobrança duplicada. A segunda
      // chamada bloqueia aqui até a primeira commitar; ao acordar, relê a
      // última linha (já com a pendente da primeira) e cai no Reuso 1 abaixo.
      // Custo aceito: prende uma conexão do pool durante as chamadas HTTP ao
      // Asaas — fluxo curto, por usuário, não é hot path.
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${"assinar:" + userId}))`);

      // Reuso 1: pendente OU inadimplente já têm assinatura viva no Asaas.
      // (Fix round, Critical 2: só "pendente" disparava aqui — um retry com a
      // última linha "inadimplente" caía direto no Reuso 2 e criava uma
      // SEGUNDA assinatura ativa no Asaas sem cancelar a original, que
      // continuava cobrando. "inadimplente" = venceu mas segue cobrável, tem
      // a mesma fatura em aberto que "pendente" tem.) Volta pra MESMA fatura
      // em vez de criar uma duplicata (clique repetido no botão).
      const [ultima] = await tx
        .select({ status: subscriptions.status, asaasSubscriptionId: subscriptions.asaasSubscriptionId })
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1);
      if ((ultima?.status === "pendente" || ultima?.status === "inadimplente") && ultima.asaasSubscriptionId) {
        const aberta = (await cliente.listarCobrancas(ultima.asaasSubscriptionId)).find(
          (c) => (c.status === "PENDING" || c.status === "OVERDUE") && c.invoiceUrl,
        );
        if (aberta) return { ok: true, url: aberta.invoiceUrl };
        // sem cobrança aberta = assinatura morta no Asaas; segue e cria nova
      }

      // Reuso 2: cliente Asaas já criado em tentativa/assinatura anterior.
      const [comCliente] = await tx
        .select({ id: subscriptions.asaasCustomerId })
        .from(subscriptions)
        .where(and(eq(subscriptions.userId, userId), isNotNull(subscriptions.asaasCustomerId)))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1);

      let customerId: string;
      if (comCliente?.id) {
        customerId = comCliente.id;
        // Auto-cura de órfã (fix round, Important 1 — e defesa extra do
        // Critical 2): um insert que falhasse logo depois de criarAssinatura
        // numa tentativa anterior deixaria uma assinatura ACTIVE no Asaas sem
        // NENHUMA linha aqui. Sem checar isto, o retry criaria uma SEGUNDA
        // cobrança — e se a órfã fosse paga, o webhook não teria userId
        // nenhum pra casar o pagamento (dinheiro entra, acesso não libera).
        // Antes de criar outra assinatura, procura essa órfã pelo customer e,
        // achando fatura em aberto, insere a linha pendente que faltou e
        // devolve a fatura dela. Só cria assinatura nova se nada for achado.
        const ativas = (await cliente.listarAssinaturasDoCliente(customerId)).filter((a) => a.status === "ACTIVE");
        for (const ativa of ativas) {
          const aberta = (await cliente.listarCobrancas(ativa.id)).find(
            (c) => (c.status === "PENDING" || c.status === "OVERDUE") && c.invoiceUrl,
          );
          if (aberta) {
            await tx.insert(subscriptions).values({
              userId,
              status: "pendente",
              asaasCustomerId: customerId,
              asaasSubscriptionId: ativa.id,
            });
            return { ok: true, url: aberta.invoiceUrl };
          }
        }
      } else {
        customerId = (await cliente.criarCliente({ name: usuario.nome, email: usuario.email, cpfCnpj: cpf })).id;
      }

      const nextDueDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const assinatura = await cliente.criarAssinatura({ customer: customerId, nextDueDate });

      // Linha nova, nunca update — o histórico de status é o mesmo padrão do
      // liberar/revogar do admin, e temAcesso lê sempre a linha mais recente.
      await tx.insert(subscriptions).values({
        userId,
        status: "pendente",
        asaasCustomerId: customerId,
        asaasSubscriptionId: assinatura.id,
      });

      const [cobranca] = await cliente.listarCobrancas(assinatura.id);
      if (!cobranca?.invoiceUrl) return { ok: false, erro: t.erroGenerico };
      return { ok: true, url: cobranca.invoiceUrl };
    });
  } catch (e) {
    console.error("iniciarAssinatura", e); // detalhe só no servidor; a tela vê o genérico
    return { ok: false, erro: t.erroGenerico };
  }
}
