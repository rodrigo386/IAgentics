import "server-only";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";

export type ChaveConfig = "cta_destino" | "aviso_topo" | "email_contato";

const CHAVES: ChaveConfig[] = ["cta_destino", "aviso_topo", "email_contato"];

export async function lerConfiguracao(chave: ChaveConfig): Promise<string> {
  const [linha] = await db.select({ valor: settings.valor }).from(settings).where(eq(settings.chave, chave)).limit(1);
  return linha?.valor ?? "";
}

/** Sempre devolve as 3 chaves, mesmo as que nunca foram salvas (valor ""). */
export async function lerTodas(): Promise<Record<ChaveConfig, string>> {
  const linhas = await db.select({ chave: settings.chave, valor: settings.valor }).from(settings).where(inArray(settings.chave, CHAVES));
  const porChave = new Map(linhas.map((l) => [l.chave, l.valor]));
  return {
    cta_destino: porChave.get("cta_destino") ?? "",
    aviso_topo: porChave.get("aviso_topo") ?? "",
    email_contato: porChave.get("email_contato") ?? "",
  };
}

/** Upsert em lote (uma única instrução) — mesmo padrão de salvarMidia
 *  (lib/admin/conteudo.ts), só que aqui N chaves de uma vez em vez de 1. */
export async function salvarConfiguracoes(valores: Partial<Record<ChaveConfig, string>>): Promise<void> {
  const linhas = (Object.entries(valores) as [ChaveConfig, string][]).map(([chave, valor]) => ({ chave, valor }));
  if (!linhas.length) return;
  await db
    .insert(settings)
    .values(linhas)
    .onConflictDoUpdate({ target: settings.chave, set: { valor: sql`excluded.valor`, updatedAt: sql`now()` } });
}

/** CTA das 3 travas do /app (painel, curso, aula): valor salvo ou o
 *  destino padrão de sempre, se a chave nunca foi configurada. */
export async function destinoCta(): Promise<string> {
  const valor = await lerConfiguracao("cta_destino");
  return valor || "/academy#contato";
}
