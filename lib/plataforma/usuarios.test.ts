import { eq, like } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { trocarSenhaVerificando, verificarCredenciais } from "./usuarios";

const prefixo = `teste-usuarios-${Date.now()}`;
const email = `${prefixo}-troca@teste.invalido`;
let userId: string;

describe.skipIf(!process.env.DATABASE_URL)("trocarSenhaVerificando", () => {
  beforeAll(async () => {
    const [u] = await db
      .insert(users)
      // emailConfirmadoEm: fixture representa um usuário já confirmado — quem
      // troca senha já está logado, e verificarCredenciais agora exige
      // confirmação (Task 4: bloqueio total atrás do interruptor do canal).
      .values({ nome: "Teste troca", email, senhaHash: await bcrypt.hash("senha-antiga-1", 10), emailConfirmadoEm: new Date() })
      .returning({ id: users.id });
    userId = u.id;
  });
  afterAll(async () => {
    await db.delete(users).where(like(users.email, `${prefixo}-%`));
  });

  it("senha atual errada: recusa e mantém a antiga funcionando", async () => {
    const r = await trocarSenhaVerificando(userId, "senha-errada-x", "senha-nova-123");
    expect(r).toEqual({ ok: false, motivo: "senha_atual_errada" });
    expect(await verificarCredenciais(email, "senha-antiga-1")).not.toBeNull();
  });

  it("senha atual correta: troca — a nova entra, a antiga morre", async () => {
    const r = await trocarSenhaVerificando(userId, "senha-antiga-1", "senha-nova-123");
    expect(r).toEqual({ ok: true });
    expect(await verificarCredenciais(email, "senha-nova-123")).not.toBeNull();
    expect(await verificarCredenciais(email, "senha-antiga-1")).toBeNull();
  });

  it("nova senha abaixo do piso: lança (mesma defesa em profundidade de criarUsuario)", async () => {
    await expect(trocarSenhaVerificando(userId, "senha-nova-123", "curta")).rejects.toThrow();
  });
});
