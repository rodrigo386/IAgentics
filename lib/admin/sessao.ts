import "server-only";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

/** Consulta o banco — nunca o JWT, que fica defasado após rebaixar/desativar. */
export async function ehAdminAtivo(userId: string): Promise<boolean> {
  const [u] = await db.select({ id: users.id }).from(users)
    .where(and(eq(users.id, userId), eq(users.role, "admin"), eq(users.ativo, true)))
    .limit(1);
  return !!u;
}

/**
 * O portão do admin. TODA page (via layout), action e handler abre com isto.
 * Falha vira 404 — para quem não é admin, a área não existe (403 confirmaria).
 */
export async function exigirAdmin(): Promise<{ id: string; nome: string; email: string }> {
  const sessao = await auth();
  const id = sessao?.user?.id;
  if (!id || !(await ehAdminAtivo(id))) notFound();
  return { id, nome: sessao.user.name ?? "", email: sessao.user.email ?? "" };
}
