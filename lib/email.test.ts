import { describe, expect, it } from "vitest";
import { diagnose } from "@/lib/content";
import { emailBoasVindas, emailDiagnose, emailInscricaoBolsa, emailResultadoBolsa, emailVoucherBolsa, RESPONDER_ASSINATURA } from "./email";

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

describe("emailDiagnose", () => {
  const respostas = Object.fromEntries(
    diagnose.pilares.flatMap((p, pi) => p.processos.map((_, ii) => [`${pi}-${ii}`, { h: pi === 6 ? 1 : 3, p: 4, i: 2 }])),
  );
  const d = { nome: "=Ana <b>", email: "ana@x.com", empresa: "Ação & Cia", cargo: "Gerente", whatsapp: "", papel: "gestor" as const, respostas };
  const e = emailDiagnose(d);

  it("resume média, nível e maior salto, e anexa um CSV com uma linha por processo", () => {
    expect(e.assunto).toBe("Diagnose de Compras: Ação & Cia (gestor, =Ana <b>)");
    expect(e.texto).toContain("Maturidade média hoje: 2,7 (Repetitivo)");
    expect(e.texto).toContain("Maior salto possível: IA e Dados");
    expect(e.anexos[0].arquivo).toBe("diagnose-compras-acao-cia-gestor.csv");
    expect(e.anexos[0].conteudo.split("\r\n")).toHaveLength(39);
  });

  it("não deixa o nome injetar HTML nem fórmula no CSV", () => {
    expect(e.html).not.toContain("<b>,");
    expect(e.html).toContain("=Ana &lt;b&gt;");
    expect(e.anexos[0].conteudo).toContain(`"'=Ana <b>"`);
  });
});

describe("emailInscricaoBolsa", () => {
  it("leva os dois passos da seleção, as datas e o regulamento, com o nome escapado", () => {
    const e = emailInscricaoBolsa("<b>Ana</b> Souza", { grupo: false });
    expect(e.assunto).toBe("Inscrição confirmada: Desafio Prova Real");
    expect(e.texto).toContain("@iagenticsacademy");
    expect(e.texto).toContain("https://www.instagram.com/iagenticsacademy");
    expect(e.texto).toContain("Eu estou participando do Desafio Prova Real");
    expect(e.texto).toContain("24 de dezembro");
    expect(e.texto).toContain("https://iagentics.com.br/bolsas/regulamento");
    expect(e.texto).not.toContain("grupo exclusivo");
    expect(e.html).not.toContain("<b>Ana</b>");
    expect(e.html).toContain("&lt;b&gt;Ana&lt;/b&gt;");
  });
  it("só fala do grupo de WhatsApp para quem pediu", () => {
    expect(emailInscricaoBolsa("Ana Souza", { grupo: true }).texto).toContain("grupo exclusivo do desafio no WhatsApp");
  });
});

describe("emailResultadoBolsa", () => {
  it("o selecionado recebe as datas da bolsa e o voucher depois dela", () => {
    const e = emailResultadoBolsa("Ana Souza", true);
    expect(e.assunto).toContain("selecionado");
    expect(e.texto).toContain("2 de janeiro a 2 de fevereiro de 2027");
    expect(e.texto).toContain("R$ 29,90");
    expect(e.html).toContain("Olá, Ana.");
  });

  it("o não selecionado recebe a promessa do voucher até 10 de janeiro, válido por 15 dias", () => {
    const e = emailResultadoBolsa("Ana Souza", false);
    expect(e.assunto).not.toContain("selecionado");
    expect(e.texto).toContain("até 10 de janeiro de 2027");
    expect(e.texto).toContain("15 dias");
    expect(e.texto).not.toContain("2 de janeiro a 2 de fevereiro");
  });

  it("escapa o nome no HTML", () => {
    expect(emailResultadoBolsa("<b>Ana</b> Souza", true).html).not.toContain("<b>Ana</b>");
  });
});

describe("emailVoucherBolsa", () => {
  const url = "https://iagentics.com.br/cursos/voucher/abcdefghijklmnopqrstuv";
  it("leva o link, o preço de fundador e a validade", () => {
    const e = emailVoucherBolsa("Ana Souza", { url, validoAte: "25/01/2027", bolsista: false });
    expect(e.texto).toContain(url);
    expect(e.html).toContain(url);
    expect(e.texto).toContain("R$ 29,90 por mês durante 12 meses");
    expect(e.texto).toContain("25/01/2027");
  });
  it("o bolsista ouve que a bolsa terminou; o não selecionado, que é o voucher prometido", () => {
    expect(emailVoucherBolsa("Ana", { url, validoAte: "x", bolsista: true }).texto).toContain("bolsa no Desafio Prova Real terminou");
    expect(emailVoucherBolsa("Ana", { url, validoAte: "x", bolsista: false }).texto).toContain("voucher exclusivo");
  });
});
