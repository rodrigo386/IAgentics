import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { contratoMembros } from "@/lib/db/schema";

/**
 * Liga uma conta aos membros de contrato pré-autorizados com aquele e-mail.
 *
 * É a peça central da decisão de arquitetura da etapa 2. Como NÃO existe canal
 * de e-mail em produção (`emailTransacionalAtivo()` depende da
 * `RESEND_API_KEY`, que é pendência), convidar por e-mail não era opção. Em vez
 * de criar contas e mandar convite, a importação registra E-MAILS AUTORIZADOS:
 * a pessoa cria a própria conta com o e-mail corporativo e o vínculo acontece
 * aqui, no cadastro.
 *
 * Normaliza para minúsculo antes de comparar. O banco já recusa gravar caixa
 * alta (check `contrato_membros_email_minusculo_chk`), mas a comparação também
 * precisa normalizar o lado de CÁ — o e-mail chega como a pessoa digitou no
 * formulário. Sem isso, "Maria@Empresa.com" no cadastro não casaria com
 * "maria@empresa.com" na lista, e a pessoa ficaria pré-autorizada sem nunca
 * receber acesso: sem erro, sem log, sem sintoma além de um cliente reclamando.
 *
 * Idempotente: só toca em membros ainda sem `userId`. Rodar duas vezes devolve
 * 0 na segunda. Membro removido não é ligado — readmitir é ação explícita do
 * admin, não efeito colateral de alguém criar conta.
 *
 * Devolve quantos vínculos foram feitos (uma pessoa pode estar em mais de um
 * contrato — dois empregadores, ou dois contratos da mesma empresa).
 */
export async function vincularMembroPorEmail(userId: string, email: string): Promise<number> {
  const alvo = email.trim().toLowerCase();
  if (!alvo) return 0;

  const ligados = await db
    .update(contratoMembros)
    .set({ userId })
    .where(
      and(
        eq(contratoMembros.email, alvo),
        isNull(contratoMembros.userId),
        isNull(contratoMembros.removidoEm),
      ),
    )
    .returning({ id: contratoMembros.id });

  return ligados.length;
}
