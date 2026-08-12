import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, settings } from "@/lib/db/schema";
import { ehAdminAtivo } from "./sessao";
import { criarUsuario, verificarCredenciais } from "@/lib/plataforma/usuarios";

const prefixo = `teste-adm-${Date.now()}`;
const senha = "Senha-adm-123!";

describe.skipIf(!process.env.DATABASE_URL)("fundação do admin", () => {
  afterAll(async () => {
    const { like } = await import("drizzle-orm");
    await db.delete(users).where(like(users.email, `${prefixo}%`));
  });

  it("aluno comum não é admin ativo", async () => {
    await criarUsuario({ nome: "Aluno", email: `${prefixo}-a@t.invalido`, senha });
    const [u] = await db.select().from(users).where(eq(users.email, `${prefixo}-a@t.invalido`));
    expect(await ehAdminAtivo(u.id)).toBe(false);
  });

  it("admin ativo passa; admin desativado não", async () => {
    await criarUsuario({ nome: "Chefe", email: `${prefixo}-b@t.invalido`, senha });
    const [u] = await db.select().from(users).where(eq(users.email, `${prefixo}-b@t.invalido`));
    await db.update(users).set({ role: "admin" }).where(eq(users.id, u.id));
    expect(await ehAdminAtivo(u.id)).toBe(true);
    await db.update(users).set({ ativo: false }).where(eq(users.id, u.id));
    expect(await ehAdminAtivo(u.id)).toBe(false);
  });

  it("conta desativada não loga (mensagem neutra vem da action, aqui é null)", async () => {
    await criarUsuario({ nome: "Fora", email: `${prefixo}-c@t.invalido`, senha });
    await db.update(users).set({ ativo: false }).where(eq(users.email, `${prefixo}-c@t.invalido`));
    expect(await verificarCredenciais(`${prefixo}-c@t.invalido`, senha)).toBeNull();
  });

  it("settings aceita upsert por chave", async () => {
    await db.insert(settings).values({ chave: "teste_adm_chave", valor: "x" })
      .onConflictDoUpdate({ target: settings.chave, set: { valor: "y" } });
    await db.insert(settings).values({ chave: "teste_adm_chave", valor: "z" })
      .onConflictDoUpdate({ target: settings.chave, set: { valor: "z" } });
    const [linha] = await db.select().from(settings).where(eq(settings.chave, "teste_adm_chave"));
    expect(linha.valor).toBe("z");
    await db.delete(settings).where(eq(settings.chave, "teste_adm_chave"));
  });

  it("uuid inexistente não é admin", async () => {
    expect(await ehAdminAtivo("00000000-0000-0000-0000-000000000000")).toBe(false);
  });
});
