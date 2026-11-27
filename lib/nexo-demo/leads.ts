import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { nexoDemoLeads } from "@/lib/db/schema";
import { novoToken } from "@/lib/bolsas/regras";
import { PASSO_FINAL } from "./regras";
import type { CadastroValido } from "./cadastro";

/** Banco do Nexo Demo (2026-11-27). Cada cadastro é uma linha e um acesso novo (ver o schema). */
export async function cadastrar(d: CadastroValido): Promise<{ id: string; token: string }> {
  const [linha] = await db
    .insert(nexoDemoLeads)
    .values({ token: novoToken(), email: d.email, empresa: d.empresa, celular: d.celular, linkedin: d.linkedin, cienciaEm: new Date() })
    .returning({ id: nexoDemoLeads.id, token: nexoDemoLeads.token });
  return linha;
}

export async function marcarEmailEnviado(id: string): Promise<void> {
  await db.update(nexoDemoLeads).set({ emailEnviadoEm: new Date() }).where(eq(nexoDemoLeads.id, id));
}

/** Quem volta pelo link do e-mail: a empresa (para a saudação) e o passo em que parou. */
export async function acessoPorToken(token: string): Promise<{ empresa: string; passo: number } | null> {
  const [linha] = await db.select({ empresa: nexoDemoLeads.empresa, passo: nexoDemoLeads.passo }).from(nexoDemoLeads).where(eq(nexoDemoLeads.token, token)).limit(1);
  return linha ?? null;
}

/**
 * Grava o passo alcançado. Nunca diminui (quem recomeça a demo continua
 * contando como quem chegou ao fim). Devolve o lead só quando ESTA chamada
 * foi a que concluiu, para o aviso ao comercial sair uma vez.
 */
export async function registrarPasso(token: string, passo: number): Promise<{ concluiuAgora: false } | { concluiuAgora: true; email: string; empresa: string; celular: string; linkedin: string }> {
  const agora = new Date();
  await db
    .update(nexoDemoLeads)
    .set({ passo, passoEm: agora })
    .where(sql`${nexoDemoLeads.token} = ${token} and ${nexoDemoLeads.passo} < ${passo}`);
  if (passo < PASSO_FINAL) return { concluiuAgora: false };
  const [linha] = await db
    .update(nexoDemoLeads)
    .set({ concluiuEm: agora })
    .where(sql`${nexoDemoLeads.token} = ${token} and ${nexoDemoLeads.concluiuEm} is null`)
    .returning({ email: nexoDemoLeads.email, empresa: nexoDemoLeads.empresa, celular: nexoDemoLeads.celular, linkedin: nexoDemoLeads.linkedin });
  return linha ? { concluiuAgora: true, ...linha } : { concluiuAgora: false };
}

export type LeadNexoDemo = typeof nexoDemoLeads.$inferSelect;

export async function listarLeads(limite = 1000): Promise<LeadNexoDemo[]> {
  return db.select().from(nexoDemoLeads).orderBy(desc(nexoDemoLeads.criadoEm)).limit(limite);
}

export async function resumoLeads(): Promise<{ cadastros: number; abriramRc: number; concluiram: number }> {
  const [r] = await db
    .select({
      cadastros: sql<number>`count(*)::int`,
      abriramRc: sql<number>`count(*) filter (where ${nexoDemoLeads.passo} >= 1)::int`,
      concluiram: sql<number>`count(*) filter (where ${nexoDemoLeads.concluiuEm} is not null)::int`,
    })
    .from(nexoDemoLeads);
  return r;
}
