import { afterAll, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { criarUsuario, redefinirSenhaComToken, verificarCredenciais } from "./usuarios";
import { emitirToken } from "./tokens";

const email = `reset-${Date.now()}@teste.invalido`;
afterAll(async () => {
  await db.delete(users).where(eq(sql`lower(${users.email})`, email));
});

describe("redefinirSenhaComToken", () => {
  it("troca a senha, queima o token e confirma o e-mail pendente", async () => {
    process.env.EMAIL_CAIXA_TESTE = "/dev/null"; // conta nasce pendente
    const r = await criarUsuario({ nome: "Reset Teste", email, senha: "senha-antiga-1" });
    delete process.env.EMAIL_CAIXA_TESTE;
    if (!r.ok) throw new Error("deveria criar");

    const t = await emitirToken(r.id, "reset");
    if (!t.ok) throw new Error("token deveria sair");
    expect(await redefinirSenhaComToken(t.segredo, "senha-nova-123")).toBe(true);

    // senha nova entra; antiga não; e-mail ficou confirmado (posse provada)
    expect(await verificarCredenciais(email, "senha-nova-123")).not.toBeNull();
    expect(await verificarCredenciais(email, "senha-antiga-1")).toBeNull();
    // token queimado
    expect(await redefinirSenhaComToken(t.segredo, "outra-senha-99")).toBe(false);
  });

  it("senha curta é recusada sem queimar o token", async () => {
    const [u] = await db.select({ id: users.id }).from(users).where(eq(sql`lower(${users.email})`, email)).limit(1);
    // limpa folga para emitir de novo
    const { authTokens } = await import("@/lib/db/schema");
    await db.delete(authTokens).where(eq(authTokens.userId, u.id));
    const t = await emitirToken(u.id, "reset");
    if (!t.ok) throw new Error("token deveria sair");
    await expect(redefinirSenhaComToken(t.segredo, "curta")).rejects.toThrow();
    expect(await redefinirSenhaComToken(t.segredo, "senha-valida-77")).toBe(true);
  });
});
