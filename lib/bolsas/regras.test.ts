import { describe, expect, it } from "vitest";
import { bolsas, PRECO_FUNDADOR, PRECO_MENSAL } from "@/lib/content";
import { VALOR_ASSINATURA_CENTAVOS } from "@/lib/assinatura/regras";
import {
  faseDasInscricoes,
  descontoFundador,
  grupoDoNivel,
  VALOR_FUNDADOR_CENTAVOS,
  normalizarInstagram,
  normalizarLinkedin,
  novoToken,
  tokenValido,
  validarInscricao,
  validarVideo,
  videoAberto,
} from "./regras";

const base = {
  nome: "Ana Souza",
  email: "Ana@Empresa.com",
  whatsapp: "(11) 98888-7777",
  cargo: "Compradora",
  nivel: "analista",
  empresa: "Empresa X",
  area: "compras",
  tamanhoTime: "4-10",
  instagram: "@ana.compras",
  linkedin: "",
  problema: "Levo 3 horas por semana montando o comparativo de cotações do frete.",
  regulamento: true,
  cienciaDados: true,
};

describe("janela das inscrições", () => {
  it("abre em 05/11 e fecha às 23h59 de 11/11, horário de SP", () => {
    expect(faseDasInscricoes(new Date("2026-11-04T23:59:00-03:00"))).toBe("antes");
    expect(faseDasInscricoes(new Date("2026-11-05T00:00:00-03:00"))).toBe("abertas");
    expect(faseDasInscricoes(new Date("2026-11-11T23:59:00-03:00"))).toBe("abertas");
    // 00h30 de 12/11 em SP já é 03h30 em UTC: encerrada nos dois relógios.
    expect(faseDasInscricoes(new Date("2026-11-12T03:30:00Z"))).toBe("encerradas");
  });
  it("o vídeo vai até 15/11", () => {
    expect(videoAberto(new Date("2026-11-15T23:00:00-03:00"))).toBe(true);
    expect(videoAberto(new Date("2026-11-16T00:01:00-03:00"))).toBe(false);
  });
  it("as datas escritas na página batem com as do servidor", () => {
    expect(bolsas.etapas.itens[0].quando).toBe("5 a 11 de novembro");
    expect(bolsas.etapas.itens[1].quando).toBe("até 15 de novembro");
    expect(bolsas.capa.fatos[2].valor).toBe("11/11");
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
    }
  });
  it("exige pelo menos um perfil, e válido", () => {
    expect(validarInscricao({ ...base, instagram: "" })).toEqual({ ok: false, motivo: "perfis" });
    expect(validarInscricao({ ...base, linkedin: "meu linkedin" })).toEqual({ ok: false, motivo: "perfis" });
    const so = validarInscricao({ ...base, instagram: "", linkedin: "linkedin.com/in/ana-souza/" });
    expect(so.ok && so.dados.linkedin).toBe("https://www.linkedin.com/in/ana-souza");
  });
  it("recusa as duas caixas obrigatórias desmarcadas e os campos fora da lista", () => {
    expect(validarInscricao({ ...base, regulamento: false })).toEqual({ ok: false, motivo: "regulamento" });
    expect(validarInscricao({ ...base, cienciaDados: "on" })).toEqual({ ok: false, motivo: "cienciaDados" });
    expect(validarInscricao({ ...base, nivel: "ceo" })).toEqual({ ok: false, motivo: "nivel" });
    expect(validarInscricao({ ...base, area: "rh" })).toEqual({ ok: false, motivo: "area" });
    expect(validarInscricao({ ...base, nome: "Ana" })).toEqual({ ok: false, motivo: "nome" });
    expect(validarInscricao({ ...base, problema: "curto" })).toEqual({ ok: false, motivo: "problema" });
    expect(validarInscricao({ ...base, problema: "x".repeat(601) })).toEqual({ ok: false, motivo: "problema" });
  });
});

describe("perfis", () => {
  it("instagram por @, nome ou endereço", () => {
    expect(normalizarInstagram("ana_b")).toBe("https://www.instagram.com/ana_b");
    expect(normalizarInstagram("https://instagram.com/ana_b/?hl=pt")).toBe("https://www.instagram.com/ana_b");
    expect(normalizarInstagram("https://evil.com/instagram.com/x")).toBeNull();
  });
  it("linkedin só perfil ou página", () => {
    expect(normalizarLinkedin("https://br.linkedin.com/in/joao")).toBe("https://www.linkedin.com/in/joao");
    expect(normalizarLinkedin("https://www.linkedin.com/feed/")).toBeNull();
  });
});

describe("validarVideo", () => {
  it("aceita as quatro redes, só em https", () => {
    expect(validarVideo("https://www.instagram.com/reel/abc123/")).toBeTruthy();
    expect(validarVideo("https://youtu.be/abc")).toBeTruthy();
    expect(validarVideo("https://drive.google.com/file/d/1x/view")).toBeTruthy();
    expect(validarVideo("http://youtu.be/abc")).toBeNull();
    expect(validarVideo("https://instagram.com.evil.com/x")).toBeNull();
    expect(validarVideo("javascript:alert(1)")).toBeNull();
  });
});

describe("cotas e token", () => {
  it("nível vira grupo de cota", () => {
    expect(grupoDoNivel("coordenador")).toBe("praticantes");
    expect(grupoDoNivel("diretor")).toBe("gestores");
    expect(grupoDoNivel("voz")).toBe("vozes");
    expect(grupoDoNivel("outro")).toBe("geral");
  });
  it("token tem 43 caracteres base64url e não se repete", () => {
    const a = novoToken();
    expect(tokenValido(a)).toBe(true);
    expect(a).not.toBe(novoToken());
    expect(tokenValido("../x")).toBe(false);
  });
  it("sem travessão nos textos (regra de texto do site)", () => {
    expect(JSON.stringify(bolsas)).not.toMatch(/[—–]/);
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
