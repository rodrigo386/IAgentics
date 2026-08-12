import "server-only";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function criarUsuario(d: { nome: string; email: string; senha: string }):
  Promise<{ ok: true } | { ok: false; motivo: "email_existe" }> {
  const senhaHash = await bcrypt.hash(d.senha, 10);
  try {
    await db.insert(users).values({ nome: d.nome.trim(), email: d.email.trim().toLowerCase(), senhaHash });
    return { ok: true };
  } catch (e: any) {
    // drizzle-orm@0.45 envolve o erro do driver em DrizzleQueryError; o código
    // pg real (23505 = unique_violation) vem em e.cause.code, não em e.code.
    const codigoPg = e?.code ?? e?.cause?.code;
    if (codigoPg === "23505") return { ok: false, motivo: "email_existe" }; // unique lower(email)
    throw e;
  }
}

export async function verificarCredenciais(email: string, senha: string) {
  const [u] = await db.select().from(users)
    .where(eq(sql`lower(${users.email})`, email.trim().toLowerCase())).limit(1);
  if (!u) { await bcrypt.compare(senha, "$2a$10$invalidoinvalidoinvalidoinvalidoinvalido12345678901234"); return null; } // tempo constante
  return (await bcrypt.compare(senha, u.senhaHash)) ? u : null;
}
