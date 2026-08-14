import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { emailDeConfirmacao, emailDeReset, emailTransacionalAtivo, enviarEmail, urlBase } from "./email";

const ENVS = ["EMAIL_CAIXA_TESTE", "RESEND_API_KEY", "AUTH_URL"] as const;
const originais = Object.fromEntries(ENVS.map((k) => [k, process.env[k]]));
afterEach(() => {
  for (const k of ENVS) {
    if (originais[k] === undefined) delete process.env[k];
    else process.env[k] = originais[k];
  }
});

describe("camada de e-mail", () => {
  it("interruptor: inativo sem envs, ativo com caixa OU chave", () => {
    delete process.env.EMAIL_CAIXA_TESTE;
    delete process.env.RESEND_API_KEY;
    expect(emailTransacionalAtivo()).toBe(false);
    process.env.EMAIL_CAIXA_TESTE = "/tmp/x";
    expect(emailTransacionalAtivo()).toBe(true);
    delete process.env.EMAIL_CAIXA_TESTE;
    process.env.RESEND_API_KEY = "re_x";
    expect(emailTransacionalAtivo()).toBe(true);
  });

  it("caixa de teste escreve a mensagem em arquivo (uma linha JSON)", async () => {
    const arquivo = join(mkdtempSync(join(tmpdir(), "caixa-")), "emails.jsonl");
    process.env.EMAIL_CAIXA_TESTE = arquivo;
    const r = await enviarEmail({ para: "a@b.c", assunto: "Oi", texto: "corpo", html: "<p>corpo</p>" });
    expect(r.ok).toBe(true);
    const linha = JSON.parse(readFileSync(arquivo, "utf8").trim().split("\n").at(-1)!);
    expect(linha.para).toBe("a@b.c");
    expect(linha.texto).toContain("corpo");
  });

  it("templates carregam o link no texto e no html", () => {
    const c = emailDeConfirmacao("Rodrigo", "https://x/tok");
    expect(c.texto).toContain("https://x/tok");
    expect(c.html).toContain("https://x/tok");
    const s = emailDeReset("Rodrigo", "https://x/tok2");
    expect(s.texto).toContain("https://x/tok2");
    expect(s.assunto).toContain("senha");
  });

  it("urlBase tira a barra final e tem fallback local", () => {
    process.env.AUTH_URL = "https://iagentics.com.br/";
    expect(urlBase()).toBe("https://iagentics.com.br");
    delete process.env.AUTH_URL;
    expect(urlBase()).toBe("http://localhost:3000");
  });
});
