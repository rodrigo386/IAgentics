import { afterAll, afterEach, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  confirmarEmailPorToken,
  credenciaisValidasMasNaoConfirmadas,
  criarUsuario,
  verificarCredenciais,
} from "./usuarios";
import { emitirToken } from "./tokens";

const emails: string[] = [];
function novoEmail() {
  const e = `conf-${Date.now()}-${emails.length}@teste.invalido`;
  emails.push(e);
  return e;
}

afterEach(() => {
  delete process.env.EMAIL_CAIXA_TESTE;
});
afterAll(async () => {
  for (const e of emails) await db.delete(users).where(eq(sql`lower(${users.email})`, e));
});

describe("confirmação no cadastro", () => {
  it("canal inativo: conta nasce confirmada e loga", async () => {
    const email = novoEmail();
    const r = await criarUsuario({ nome: "Sem Canal", email, senha: "senha-boa-123" });
    if (!r.ok) throw new Error("deveria criar");
    expect(r.confirmacaoPendente).toBe(false);
    expect(await verificarCredenciais(email, "senha-boa-123")).not.toBeNull();
  });

  it("canal ativo: conta nasce pendente, login negado, reenvio detecta", async () => {
    process.env.EMAIL_CAIXA_TESTE = "/dev/null";
    const email = novoEmail();
    const r = await criarUsuario({ nome: "Com Canal", email, senha: "senha-boa-123" });
    if (!r.ok) throw new Error("deveria criar");
    expect(r.confirmacaoPendente).toBe(true);
    expect(await verificarCredenciais(email, "senha-boa-123")).toBeNull();
    expect(await credenciaisValidasMasNaoConfirmadas(email, "senha-boa-123")).toBe(true);
    expect(await credenciaisValidasMasNaoConfirmadas(email, "senha-errada")).toBe(false);
  });

  it("confirmar por token libera o login", async () => {
    process.env.EMAIL_CAIXA_TESTE = "/dev/null";
    const email = novoEmail();
    const r = await criarUsuario({ nome: "Confirma", email, senha: "senha-boa-123" });
    if (!r.ok) throw new Error("deveria criar");
    const t = await emitirToken(r.id, "confirmacao");
    if (!t.ok) throw new Error("token deveria sair");
    expect(await confirmarEmailPorToken(t.segredo)).toBe(true);
    expect(await verificarCredenciais(email, "senha-boa-123")).not.toBeNull();
    expect(await confirmarEmailPorToken(t.segredo)).toBe(false); // uso único
  });
});
