import "server-only";
import { createHash, randomBytes } from "crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
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
 *  vez) e respeita a folga de 60s. O segredo NUNCA é gravado — só o SHA-256. */
export async function emitirToken(
  userId: string,
  tipo: TipoToken,
): Promise<{ ok: true; segredo: string } | { ok: false; motivo: "aguarde" }> {
  const [ultimo] = await db
    .select({ criadoEm: authTokens.criadoEm })
    .from(authTokens)
    .where(and(eq(authTokens.userId, userId), eq(authTokens.tipo, tipo)))
    .orderBy(desc(authTokens.criadoEm))
    .limit(1);
  if (ultimo && Date.now() - ultimo.criadoEm.getTime() < FOLGA_MS) {
    return { ok: false, motivo: "aguarde" };
  }

  const segredo = randomBytes(32).toString("base64url");
  await db.delete(authTokens).where(and(eq(authTokens.userId, userId), eq(authTokens.tipo, tipo)));
  await db.insert(authTokens).values({
    userId,
    tipo,
    tokenHash: hash(segredo),
    expiraEm: new Date(Date.now() + VALIDADE_MS[tipo]),
  });
  return { ok: true, segredo };
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
