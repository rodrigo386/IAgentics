import "server-only";
import { createHash, randomBytes } from "crypto";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { authTokens } from "@/lib/db/schema";

export type TipoToken = "confirmacao" | "reset";

/** Validade por tipo (spec): confirmação 7 dias, reset 60 minutos. */
const VALIDADE_MS: Record<TipoToken, number> = {
  confirmacao: 7 * 24 * 60 * 60 * 1000,
  reset: 60 * 60 * 1000,
};

/** Folga mínima entre emissões do mesmo tipo para o mesmo usuário. */
const FOLGA_MS = 60_000;

function hash(segredo: string): string {
  return createHash("sha256").update(segredo).digest("hex");
}

/** Emite um token novo: invalida os anteriores do mesmo tipo (um link vivo por
 *  vez) e respeita a folga de 60s. O segredo NUNCA é gravado — só o SHA-256.
 *
 *  Usa transação + advisory lock por (userId, tipo) para serializar concorrentes.
 *  Sem lock: dois emitirToken simultâneos podem ambos passar na folga, um DELETE
 *  apagar a linha do outro, e o segredo já enviado por e-mail fica órfão (consumirToken
 *  falharia silenciosamente). O lock de transação é seguro aqui porque a xação é rápida
 *  (3 statements de banco, sem I/O externo), não bloqueia workers indefinidamente, e o
 *  pool suporta (max 5 conexões). Diferente de Asaas que trava com chamadas externas —
 *  aqui a transação libera logo no commit. */
export async function emitirToken(
  userId: string,
  tipo: TipoToken,
): Promise<{ ok: true; segredo: string } | { ok: false; motivo: "aguarde" }> {
  return db.transaction(async (tx) => {
    // Serializa por (userId, tipo) para matar corrida do link órfão
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${userId + ":" + tipo}, 0))`);

    const [ultimo] = await tx
      .select({ criadoEm: authTokens.criadoEm })
      .from(authTokens)
      .where(and(eq(authTokens.userId, userId), eq(authTokens.tipo, tipo)))
      .orderBy(desc(authTokens.criadoEm))
      .limit(1);
    if (ultimo && Date.now() - ultimo.criadoEm.getTime() < FOLGA_MS) {
      return { ok: false, motivo: "aguarde" };
    }

    const segredo = randomBytes(32).toString("base64url");
    await tx.delete(authTokens).where(and(eq(authTokens.userId, userId), eq(authTokens.tipo, tipo)));
    await tx.insert(authTokens).values({
      userId,
      tipo,
      tokenHash: hash(segredo),
      expiraEm: new Date(Date.now() + VALIDADE_MS[tipo]),
    });
    return { ok: true, segredo };
  });
}

/** Valida e queima em um passo: o UPDATE condicional só preenche usado_em se o
 *  token ainda está virgem e no prazo — corrida de dois cliques no mesmo link
 *  consome uma vez só. Resposta binária, sem distinguir expirado de usado. */
export async function consumirToken(
  segredo: string,
  tipo: TipoToken,
): Promise<{ ok: true; userId: string } | { ok: false }> {
  const agora = new Date();
  const [linha] = await db
    .update(authTokens)
    .set({ usadoEm: agora })
    .where(
      and(
        eq(authTokens.tokenHash, hash(segredo)),
        eq(authTokens.tipo, tipo),
        isNull(authTokens.usadoEm),
      ),
    )
    .returning({ userId: authTokens.userId, expiraEm: authTokens.expiraEm });
  if (!linha) return { ok: false };
  if (linha.expiraEm.getTime() < agora.getTime()) return { ok: false };
  return { ok: true, userId: linha.userId };
}
