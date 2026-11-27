import { describe, expect, it } from "vitest";
import { bolsas, PRECO_FUNDADOR, PRECO_MENSAL } from "@/lib/content";
import { VALOR_ASSINATURA_CENTAVOS } from "@/lib/assinatura/regras";
import {
  faseDasInscricoes,
  descontoFundador,
  VALOR_FUNDADOR_CENTAVOS,
  normalizarInstagram,
  normalizarLinkedin,
  novoToken,
  validarInscricao,
} from "./regras";

const base = {
  nome: "Ana Souza",
  email: "Ana@Empresa.com",
  whatsapp: "(11) 98888-7777",
  empresa: "Empresa X",
  instagram: "@ana.compras",
  linkedin: "",
  problema: "Levo 3 horas por semana montando o comparativo de cotações do frete.",
  regulamento: true,
  cienciaDados: true,
};

describe("janela das inscrições", () => {
  it("abre em 23/11 e fecha às 23h59 de 05/12, horário de SP", () => {
    expect(faseDasInscricoes(new Date("2026-11-22T23:59:00-03:00"))).toBe("antes");
    expect(faseDasInscricoes(new Date("2026-11-23T00:00:00-03:00"))).toBe("abertas");
    expect(faseDasInscricoes(new Date("2026-12-05T23:59:00-03:00"))).toBe("abertas");
    // 00h30 de 06/12 em SP já é 03h30 em UTC: encerrada nos dois relógios.
    expect(faseDasInscricoes(new Date("2026-12-06T03:30:00Z"))).toBe("encerradas");
  });
  it("as datas escritas na página batem com as do servidor", () => {
    expect(bolsas.etapas.itens[0].quando).toBe("23 de novembro a 5 de dezembro");
    expect(bolsas.capa.fatos[2].valor).toBe("05/12");
    expect(bolsas.fases.antes).toContain("23 de novembro");
    expect(bolsas.fases.encerradas).toContain("5 de dezembro");
  });
});

describe("validarInscricao", () => {
  it("aceita e normaliza", () => {
    const r = validarInscricao(base);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.dados.email).toBe("ana@empresa.com");
      expect(r.dados.whatsapp).toBe("11988887777");
      expect(r.dados.instagram).toBe("https://www.instagram.com/ana.compras");
      expect(r.dados.linkedin).toBeNull();
      expect(r.dados.contatoComercial).toBe(false);
      expect(r.dados.grupoWhatsapp).toBe(false);
    }
  });
  it("guarda as duas autorizações opcionais quando marcadas", () => {
    const r = validarInscricao({ ...base, contatoComercial: true, grupoWhatsapp: true, usoImagem: true });
    expect(r.ok && r.dados.contatoComercial && r.dados.grupoWhatsapp && r.dados.usoImagem).toBe(true);
  });
  it("exige pelo menos um perfil, e válido", () => {
    expect(validarInscricao({ ...base, instagram: "" })).toEqual({ ok: false, motivo: "perfis" });
    expect(validarInscricao({ ...base, linkedin: "meu linkedin" })).toEqual({ ok: false, motivo: "perfis" });
    const so = validarInscricao({ ...base, instagram: "", linkedin: "linkedin.com/in/ana-souza/" });
    expect(so.ok && so.dados.linkedin).toBe("https://www.linkedin.com/in/ana-souza");
  });
  it("recusa as duas caixas obrigatórias desmarcadas e os campos inválidos", () => {
    expect(validarInscricao({ ...base, regulamento: false })).toEqual({ ok: false, motivo: "regulamento" });
    expect(validarInscricao({ ...base, cienciaDados: "on" })).toEqual({ ok: false, motivo: "cienciaDados" });
    expect(validarInscricao({ ...base, nome: "Ana" })).toEqual({ ok: false, motivo: "nome" });
    const semEmpresa = validarInscricao({ ...base, empresa: "" });
    expect(semEmpresa.ok && semEmpresa.dados.empresa).toBe("");
    expect(validarInscricao({ ...base, problema: "curto" })).toEqual({ ok: false, motivo: "problema" });
    expect(validarInscricao({ ...base, problema: "x".repeat(601) })).toEqual({ ok: false, motivo: "problema" });
  });
});

describe("perfis", () => {
  it("instagram por @, nome ou endereço", () => {
    expect(normalizarInstagram("ana_b")).toBe("https://www.instagram.com/ana_b");
    expect(normalizarInstagram("https://instagram.com/ana_b/?hl=pt")).toBe("https://www.instagram.com/ana_b");
    expect(normalizarInstagram("https://evil.com/instagram.com/x")).toBeNull();
    expect(normalizarInstagram("instagram.com/@ana_b")).toBe("https://www.instagram.com/ana_b");
    expect(normalizarInstagram("https://www.instagram.com/ana_b/reels/")).toBe("https://www.instagram.com/ana_b");
    expect(normalizarInstagram("https://www.instagram.com/p/ABC123/")).toBeNull();
    expect(normalizarInstagram("Ana Souza")).toBeNull();
  });
  it("linkedin só perfil ou página", () => {
    expect(normalizarLinkedin("https://br.linkedin.com/in/joao")).toBe("https://www.linkedin.com/in/joao");
    expect(normalizarLinkedin("https://www.linkedin.com/feed/")).toBeNull();
    expect(normalizarLinkedin("https://www.linkedin.com/in/joao/details/experience/")).toBe("https://www.linkedin.com/in/joao");
  });
  it("linkedin pelo nome de usuário sozinho (2026-11-27)", () => {
    expect(normalizarLinkedin("ana-souza")).toBe("https://www.linkedin.com/in/ana-souza");
    expect(normalizarLinkedin("in/ana-souza/")).toBe("https://www.linkedin.com/in/ana-souza");
    expect(normalizarLinkedin("joão-silva-123")).toBe("https://www.linkedin.com/in/joão-silva-123");
    expect(normalizarLinkedin("Ana Souza")).toBeNull();
    expect(normalizarLinkedin("https://evil.com/in/ana")).toBeNull();
  });
});

describe("token e textos", () => {
  it("token tem 43 caracteres base64url e não se repete", () => {
    const a = novoToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(a).not.toBe(novoToken());
  });
  it("sem travessão nos textos (regra de texto do site)", () => {
    expect(JSON.stringify(bolsas)).not.toMatch(/[—–]/);
  });
  it("o perfil da Academy é o do mapa da campanha", () => {
    expect(bolsas.criterios.instagram.handle).toBe("@iagenticsacademy");
    expect(bolsas.criterios.instagram.url).toBe("https://www.instagram.com/iagenticsacademy");
  });
});

describe("preço de fundador", () => {
  const reais = (c: number) => `R$ ${(c / 100).toFixed(2).replace(".", ",")}`;
  it("o texto da página bate com o valor do servidor, e o desconto é 40%", () => {
    expect(PRECO_FUNDADOR).toBe(reais(VALOR_FUNDADOR_CENTAVOS));
    expect(PRECO_MENSAL).toBe(reais(VALOR_ASSINATURA_CENTAVOS));
    expect(descontoFundador(VALOR_ASSINATURA_CENTAVOS)).toBe(40);
  });
});
