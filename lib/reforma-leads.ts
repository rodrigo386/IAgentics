import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { leadsReforma } from "@/lib/db/schema";
import type { Cenario, Contato } from "@/lib/reforma";

/** Grava o pedido do comparativo (calculadora da Reforma, 2026-11-18). */
export async function gravarLead(c: Contato, cenario: Cenario): Promise<string> {
  const agora = new Date();
  const [linha] = await db
    .insert(leadsReforma)
    .values({
      nome: c.nome,
      email: c.email,
      empresa: c.empresa,
      cargo: c.cargo || null,
      cenario,
      consentimentoEm: agora,
      avisarAliquotasEm: c.avisarAliquotas ? agora : null,
    })
    .returning({ id: leadsReforma.id });
  return linha.id;
}

export async function marcarEmailEnviado(id: string): Promise<void> {
  await db.update(leadsReforma).set({ emailEnviadoEm: new Date() }).where(eq(leadsReforma.id, id));
}

export async function listarLeads(limite = 500) {
  return db.select().from(leadsReforma).orderBy(desc(leadsReforma.criadoEm)).limit(limite);
}
