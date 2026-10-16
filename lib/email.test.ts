import { describe, expect, it } from "vitest";
import { emailBoasVindas, RESPONDER_ASSINATURA } from "./email";

/* E-mail de boas-vindas de quem pagou a assinatura (2026-10-16). O prazo de
   24 horas úteis é a promessa que o Rodrigo pediu; se mudar, muda aqui, no
   e-mail e nos textos da /cursos (content.ts) juntos. */
describe("emailBoasVindas", () => {
  const e = emailBoasVindas("Ana Paula Souza");

  it("cumprimenta pelo primeiro nome e promete o acesso em até 24 horas úteis", () => {
    expect(e.texto).toMatch(/^Olá, Ana\./);
    expect(e.assunto).toContain("24 horas úteis");
    expect(e.texto).toContain("Em até 24 horas úteis vamos liberar o seu acesso pela Plataforma Solution");
    expect(e.html).toContain("24 horas úteis");
  });

  it("leva o link da Solution no HTML e por extenso no texto puro", () => {
    expect(e.html).toContain('href="https://plataformasolution.com.br/"');
    expect(e.texto).toContain("https://plataformasolution.com.br/");
  });

  it("não deixa o nome injetar HTML", () => {
    const x = emailBoasVindas("<b>Eva</b> Lima");
    expect(x.html).not.toContain("<b>Eva</b>");
    expect(x.html).toContain("&lt;b&gt;Eva&lt;/b&gt;");
  });

  it("manda as respostas para o contato, não para o nao-responda", () => {
    expect(RESPONDER_ASSINATURA).toBe("contato@iagentics.com.br");
  });
});
