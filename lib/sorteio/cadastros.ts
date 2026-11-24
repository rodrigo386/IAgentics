import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { sorteioCadastros } from "@/lib/db/schema";
import { EVENTO, type CadastroValido } from "./regras";

/**
 * Banco do sorteio. Um cadastro por e-mail no evento: repetir não gera outro
 * número e não sobrescreve. A rota NÃO devolve o número de um e-mail já
 * cadastrado (quem digitasse um e-mail alheio veria o número dele); diz só que
 * ele já participa e que o número está no e-mail.
 */
export async function cadastrar(d: CadastroValido): Promise<{ novo: true; id: string; numero: number } | { novo: false }> {
  const agora = new Date();
  const [linha] = await db
    .insert(sorteioCadastros)
    .values({
      evento: EVENTO,
      nome: d.nome,
      email: d.email,
      whatsapp: d.whatsapp,
      empresa: d.empresa,
      cargo: d.cargo,
      area: d.area,
      regulamentoEm: agora,
      seguindoEm: agora,
      comunicacoesEm: d.comunicacoes ? agora : null,
    })
    .onConflictDoNothing()
    .returning({ id: sorteioCadastros.id, numero: sorteioCadastros.numero });
  return linha ? { novo: true, ...linha } : { novo: false };
}

export async function marcarEmailEnviado(id: string): Promise<void> {
  await db.update(sorteioCadastros).set({ emailEnviadoEm: new Date() }).where(eq(sorteioCadastros.id, id));
}

export type CadastroSorteio = typeof sorteioCadastros.$inferSelect;

export async function listarCadastros(evento = EVENTO): Promise<CadastroSorteio[]> {
  return db.select().from(sorteioCadastros).where(eq(sorteioCadastros.evento, evento)).orderBy(desc(sorteioCadastros.criadoEm));
}

export async function resumoSorteio(evento = EVENTO): Promise<{ cadastros: number; comunicacoes: number; emails: number }> {
  const [r] = await db
    .select({
      cadastros: sql<number>`count(*)::int`,
      comunicacoes: sql<number>`count(*) filter (where ${sorteioCadastros.comunicacoesEm} is not null)::int`,
      emails: sql<number>`count(*) filter (where ${sorteioCadastros.emailEnviadoEm} is not null)::int`,
    })
    .from(sorteioCadastros)
    .where(and(eq(sorteioCadastros.evento, evento)));
  return r;
}
