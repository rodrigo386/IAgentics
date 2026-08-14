import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { authTokens, users } from "@/lib/db/schema";
import { consumirToken, emitirToken } from "./tokens";

let userId: string;

beforeAll(async () => {
  const [u] = await db
    .insert(users)
    .values({ nome: "Tokens Teste", email: `tokens-${Date.now()}@teste.invalido`, senhaHash: "x" })
    .returning({ id: users.id });
  userId = u.id;
});

afterAll(async () => {
  await db.delete(users).where(eq(users.id, userId)); // cascade limpa os tokens
});

describe("emitirToken / consumirToken", () => {
  it("emite e consome uma única vez", async () => {
    const r = await emitirToken(userId, "reset");
    if (!r.ok) throw new Error("emissão deveria passar");
    expect(r.segredo.length).toBeGreaterThanOrEqual(40); // 32 bytes base64url ~43
    const v1 = await consumirToken(r.segredo, "reset");
    expect(v1).toEqual({ ok: true, userId });
    const v2 = await consumirToken(r.segredo, "reset");
    expect(v2.ok).toBe(false); // uso único
  });

  it("não vaza o segredo no banco (guarda só o hash)", async () => {
    // limpa a folga de 60s da emissão anterior
    await db.delete(authTokens).where(eq(authTokens.userId, userId));
    const r = await emitirToken(userId, "reset");
    if (!r.ok) throw new Error("emissão deveria passar");
    const linhas = await db.select().from(authTokens).where(eq(authTokens.userId, userId));
    expect(linhas.some((l) => l.tokenHash === r.segredo)).toBe(false);
    expect(linhas[0].tokenHash).toMatch(/^[0-9a-f]{64}$/); // sha256 hex
  });

  it("tipo errado não consome", async () => {
    await db.delete(authTokens).where(eq(authTokens.userId, userId));
    const r = await emitirToken(userId, "confirmacao");
    if (!r.ok) throw new Error("emissão deveria passar");
    expect((await consumirToken(r.segredo, "reset")).ok).toBe(false);
    expect((await consumirToken(r.segredo, "confirmacao")).ok).toBe(true);
  });

  it("segunda emissão dentro de 60s pede para aguardar", async () => {
    await db.delete(authTokens).where(eq(authTokens.userId, userId));
    expect((await emitirToken(userId, "reset")).ok).toBe(true);
    expect(await emitirToken(userId, "reset")).toEqual({ ok: false, motivo: "aguarde" });
  });

  it("emissão nova invalida o link anterior do mesmo tipo", async () => {
    await db.delete(authTokens).where(eq(authTokens.userId, userId));
    const antigo = await emitirToken(userId, "reset");
    if (!antigo.ok) throw new Error("emissão deveria passar");
    // simula a folga vencida para poder emitir de novo
    await db.update(authTokens).set({ criadoEm: new Date(Date.now() - 61_000) }).where(eq(authTokens.userId, userId));
    const novo = await emitirToken(userId, "reset");
    if (!novo.ok) throw new Error("emissão deveria passar");
    expect((await consumirToken(antigo.segredo, "reset")).ok).toBe(false);
    expect((await consumirToken(novo.segredo, "reset")).ok).toBe(true);
  });

  it("token expirado não consome", async () => {
    await db.delete(authTokens).where(eq(authTokens.userId, userId));
    const r = await emitirToken(userId, "reset");
    if (!r.ok) throw new Error("emissão deveria passar");
    await db.update(authTokens).set({ expiraEm: new Date(Date.now() - 1000) }).where(eq(authTokens.userId, userId));
    expect((await consumirToken(r.segredo, "reset")).ok).toBe(false);
  });

  it("concorrência real mata a corrida do link órfão", async () => {
    // 4× emitirToken simultâneos no mesmo usuário: advisory lock serializa,
    // exatamente 1 sucede e 3 ficam em "aguarde"
    await db.delete(authTokens).where(eq(authTokens.userId, userId));
    const resultados = await Promise.all([
      emitirToken(userId, "reset"),
      emitirToken(userId, "reset"),
      emitirToken(userId, "reset"),
      emitirToken(userId, "reset"),
    ]);
    const sucessos = resultados.filter((r) => r.ok === true);
    const aguardes = resultados.filter((r) => r.ok === false && r.motivo === "aguarde");
    expect(sucessos).toHaveLength(1);
    expect(aguardes).toHaveLength(3);
    // valida que o segredo vencedor consome com sucesso
    if (!sucessos[0].ok) throw new Error("sucesso deveria ter ok=true");
    const consumo = await consumirToken(sucessos[0].segredo, "reset");
    expect(consumo).toEqual({ ok: true, userId });
  });
});
