import "server-only";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { contaAtiva, temAcesso } from "@/lib/plataforma/dados";
import { buscarUsuario } from "@/lib/plataforma/usuarios";
import { plataforma } from "@/lib/content-plataforma";
import { validarCpf } from "./cpf";
import { clienteAsaas, type ClienteAsaas } from "./cliente";
import { fimDoPeriodoPago } from "./webhook";

export type ResultadoAssinar = { ok: true; url: string } | { ok: true; liberado: true } | { ok: false; erro: string };

/** Mutex em processo, por userId (fix round 2, F1 — substitui o db.transaction
 *  + pg_advisory_xact_lock do fix round 1). Aquela versão segurava uma conexão
 *  do pool de Postgres (max: 5, COMPARTILHADO com o site inteiro) durante as
 *  chamadas HTTP ao Asaas: 5 assinaturas concorrentes batendo num Asaas lento
 *  esgotariam o pool e travariam TODO o site, não só a contratação. Este mutex
 *  serializa só as chamadas de iniciarAssinatura pro MESMO userId, em memória,
 *  sem prender conexão de banco nenhuma — cada chamada encadeia no promise
 *  anterior do mesmo userId e a entrada é limpa quando a fila esvazia.
 *  Vale porque o deploy é instância única (Railway, 1 container); escalando
 *  horizontalmente isto vira 1 mutex por processo e não serializa mais nada
 *  sozinho — precisaria virar lock distribuído. Nesse cenário, a auto-cura via
 *  listarAssinaturasDoCliente (Reuso 2 abaixo) é a rede de segurança residual:
 *  mesmo se duas instâncias criarem duas assinaturas ACTIVE pro mesmo usuário,
 *  a próxima chamada acha a órfã antes de criar uma terceira. */
const filaPorUsuario = new Map<string, Promise<unknown>>();

function comLockDoUsuario<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  const anterior = filaPorUsuario.get(userId) ?? Promise.resolve();
  const resultado = anterior.then(fn, fn); // roda fn após a fila, mesmo se a chamada anterior rejeitou
  const semRejeicao = resultado.catch(() => undefined); // a fila em si nunca fica travada rejeitada
  filaPorUsuario.set(userId, semRejeicao);
  semRejeicao.finally(() => {
    if (filaPorUsuario.get(userId) === semRejeicao) filaPorUsuario.delete(userId); // limpa se ninguém entrou na fila depois
  });
  return resultado;
}

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

  return comLockDoUsuario(userId, async () => {
    try {
      // Reuso 1: pendente OU inadimplente já têm assinatura viva no Asaas.
      // ("inadimplente" = venceu mas segue cobrável, tem a mesma fatura em
      // aberto que "pendente" tem — sem isto, um retry sobre uma inadimplente
      // criaria uma SEGUNDA assinatura ativa no Asaas sem cancelar a original,
      // que continuava cobrando.) Volta pra MESMA fatura em vez de criar uma
      // duplicata (clique repetido no botão / segunda chamada que esperou o
      // lock acima).
      const [ultima] = await db
        .select({ id: subscriptions.id, status: subscriptions.status, asaasSubscriptionId: subscriptions.asaasSubscriptionId })
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1);
      if ((ultima?.status === "pendente" || ultima?.status === "inadimplente") && ultima.asaasSubscriptionId) {
        const cobrancas = await cliente.listarCobrancas(ultima.asaasSubscriptionId);
        // Fix (Important — review final): cobrança RECEIVED/CONFIRMED tem
        // PRECEDÊNCIA sobre "sem cobrança aberta ⇒ morta". Sem isto: aluno
        // paga, webhook atrasa/pausa, a linha segue "pendente"; ele re-submete
        // /app/assinar, cai aqui, não acha PENDING/OVERDUE e o código antigo
        // tratava como assinatura morta — criava uma SEGUNDA assinatura B no
        // Asaas (cobrando de novo) enquanto a A ficava paga e esquecida.
        // Quando o webhook da A finalmente processa, ativa a linha ANTIGA (A)
        // — mas temAcesso lê sempre a MAIS RECENTE (B, pendente): aluno pagou
        // e continua sem acesso. A fonte aqui é a API autenticada do Asaas —
        // mesmo efeito que o webhook teria, sem esperar ele. UPDATE pelo id
        // da PRÓPRIA linha (não pelo subscription id) porque é exatamente a
        // linha que já temos em mãos.
        const paga = cobrancas.find((c) => c.status === "RECEIVED" || c.status === "CONFIRMED");
        if (paga) {
          await db
            .update(subscriptions)
            .set({ status: "ativa", currentPeriodEnd: fimDoPeriodoPago(paga.dueDate) })
            .where(eq(subscriptions.id, ultima.id));
          return { ok: true, liberado: true };
        }
        const aberta = cobrancas.find((c) => (c.status === "PENDING" || c.status === "OVERDUE") && c.invoiceUrl);
        if (aberta) return { ok: true, url: aberta.invoiceUrl };
        // sem cobrança paga nem aberta = assinatura morta no Asaas; segue e cria nova
      }

      // Reuso 2: cliente Asaas já criado em tentativa/assinatura anterior.
      const [comCliente] = await db
        .select({ id: subscriptions.asaasCustomerId })
        .from(subscriptions)
        .where(and(eq(subscriptions.userId, userId), isNotNull(subscriptions.asaasCustomerId)))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1);

      let customerId: string;
      if (comCliente?.id) {
        customerId = comCliente.id;
        // Auto-cura de órfã: um insert que falhasse logo depois de
        // criarAssinatura numa tentativa anterior deixaria uma assinatura
        // ACTIVE no Asaas sem NENHUMA linha aqui. Sem checar isto, o retry
        // criaria uma SEGUNDA cobrança — e se a órfã fosse paga, o webhook não
        // teria userId nenhum pra casar o pagamento (dinheiro entra, acesso
        // não libera). Antes de criar outra assinatura, procura essa órfã
        // pelo customer e, achando fatura em aberto, insere a linha pendente
        // que faltou e devolve a fatura dela. Só cria assinatura nova se nada
        // for achado.
        const ativas = (await cliente.listarAssinaturasDoCliente(customerId)).filter((a) => a.status === "ACTIVE");
        for (const ativa of ativas) {
          const cobrancas = await cliente.listarCobrancas(ativa.id);
          // Mesma precedência do Reuso 1 acima: cobrança RECEIVED/CONFIRMED
          // cura a órfã direto para "ativa" (ids + currentPeriodEnd), sem
          // depender de achar cobrança aberta primeiro.
          const paga = cobrancas.find((c) => c.status === "RECEIVED" || c.status === "CONFIRMED");
          if (paga) {
            await db.insert(subscriptions).values({
              userId,
              status: "ativa",
              asaasCustomerId: customerId,
              asaasSubscriptionId: ativa.id,
              currentPeriodEnd: fimDoPeriodoPago(paga.dueDate),
            });
            return { ok: true, liberado: true };
          }
          const aberta = cobrancas.find((c) => (c.status === "PENDING" || c.status === "OVERDUE") && c.invoiceUrl);
          if (aberta) {
            await db.insert(subscriptions).values({
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
  });
}
