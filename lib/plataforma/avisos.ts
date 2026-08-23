import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { emailDeInadimplencia, enviarEmail, urlBase } from "./email";

/**
 * E-mails disparados por EVENTO, não por tempo decorrido.
 *
 * A distinção é a razão deste módulo existir separado: nada aqui depende de
 * agendador, então tudo aqui funciona hoje. Os avisos por tempo (retomada em 7
 * dias, curso novo) são a Onda 2 e só existem depois do cron — ver
 * docs/ROADMAP-ACADEMY.md.
 *
 * REGRA DA CASA para todo aviso: nunca lançar. O chamador é sempre um fluxo
 * crítico (webhook de cobrança, cadastro) que não pode falhar porque um e-mail
 * não saiu. Falha vira log e a vida segue.
 */

/**
 * Avisa o aluno que a cobrança venceu e o acesso está suspenso.
 *
 * `urlFatura` vem do próprio evento do Asaas (`payment.invoiceUrl`) — link
 * direto para a fatura em aberto, um clique a menos. Sem ela, /app/assinar
 * resolve igual: iniciarAssinatura() procura cobrança PENDING/OVERDUE e devolve
 * a invoiceUrl dela em vez de criar assinatura nova (lib/asaas/assinatura.ts).
 *
 * Quem garante o envio único é o CHAMADOR, não esta função: o webhook só chama
 * quando o UPDATE de fato mudou o status (ver lib/asaas/webhook.ts). Reentrega
 * do Asaas não muda linha nenhuma e portanto não manda e-mail nenhum.
 */
export async function avisarInadimplencia(userId: string, urlFatura?: string): Promise<void> {
  try {
    const [aluno] = await db
      .select({ nome: users.nome, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!aluno?.email) return;

    const url = urlFatura || `${urlBase()}/app/assinar`;
    const { ok } = await enviarEmail({ para: aluno.email, ...emailDeInadimplencia(aluno.nome, url) });
    // Log sem e-mail e sem a URL da fatura: a fatura do Asaas é um link de
    // pagamento e não tem por que viver em log, pela mesma régua dos tokens.
    if (!ok) console.error("[aviso] inadimplência não enviada", userId);
  } catch (erro) {
    console.error("[aviso] inadimplência falhou", userId, erro instanceof Error ? erro.message : erro);
  }
}
