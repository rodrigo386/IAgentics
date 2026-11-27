import { describe, it, expect } from "vitest";
import { site } from "@/lib/content";
import { ROTAS_SITEMAP, organizacaoJsonLd, academyJsonLd, faqJsonLd, websiteJsonLd, trilhaDaPagina, nexoServicoJsonLd, assinaturaJsonLd, calculadoraJsonLd, ORGANIZACAO_ID } from "@/lib/seo";
import { nav, cursos, PRECO_MENSAL } from "@/lib/content";
import { VALOR_ASSINATURA_CENTAVOS } from "@/lib/assinatura/regras";
import { nexoPage, academy, spendLab } from "@/lib/content";

describe("endereço canônico", () => {
  it("é o apex, sem www e sem barra no fim", () => {
    expect(site.url).toBe("https://iagentics.com.br");
    expect(site.url).not.toContain("www.");
    expect(site.url.endsWith("/")).toBe(false);
  });
});

describe("rotas do sitemap", () => {
  it("lista as páginas públicas", () => {
    expect([...ROTAS_SITEMAP]).toEqual(["/", "/nexo", "/academy", "/cursos", "/spend-lab", "/diagnose-compras", "/reforma-tributaria-compras", "/consulta-ncm-cclasstrib", "/bolsas", "/privacidade"]);
  });

  it("não inclui área logada, admin nem certificados", () => {
    for (const rota of ROTAS_SITEMAP) {
      expect(rota).not.toMatch(/^\/(app|admin|api|certificados)/);
    }
  });
});

describe("JSON-LD da organização", () => {
  it("aponta para o apex e traz os perfis sociais", () => {
    const dados = organizacaoJsonLd();
    expect(dados["@type"]).toBe("Organization");
    expect(dados.url).toBe("https://iagentics.com.br");
    expect(dados.logo.startsWith("https://iagentics.com.br/")).toBe(true);
    expect(dados.sameAs.length).toBeGreaterThan(0);
    for (const perfil of dados.sameAs) expect(perfil.startsWith("https://")).toBe(true);
  });
});

describe("JSON-LD do site, das trilhas, do Nexo e da assinatura (2026-11-24)", () => {
  it("o WebSite aponta para a organização e não promete busca", () => {
    const dados = websiteJsonLd();
    expect(dados.publisher["@id"]).toBe(ORGANIZACAO_ID);
    expect(organizacaoJsonLd()["@id"]).toBe(ORGANIZACAO_ID);
    expect(dados).not.toHaveProperty("potentialAction");
  });

  it("a trilha começa na home e usa o rótulo do menu", () => {
    const dados = trilhaDaPagina(nav.links, "/nexo", "pt");
    expect(dados.itemListElement.map((i) => [i.position, i.name, i.item])).toEqual([
      [1, "Início", "https://iagentics.com.br"],
      [2, "Nexo", "https://iagentics.com.br/nexo"],
    ]);
    expect(() => trilhaDaPagina(nav.links, "/sorteio", "pt")).toThrow();
  });

  it("o Nexo é um serviço da IAgentics, sem preço inventado", () => {
    const dados = nexoServicoJsonLd({ titulo: "t", descricao: "d" }, "en");
    expect(dados.url).toBe("https://iagentics.com.br/en/nexo");
    expect(dados.provider["@id"]).toBe(ORGANIZACAO_ID);
    expect(dados).not.toHaveProperty("offers");
  });

  it("a oferta da assinatura é o valor que o checkout cobra, por mês", () => {
    const dados = assinaturaJsonLd({ nome: "n", descricao: "d", centavos: VALOR_ASSINATURA_CENTAVOS, imagem: cursos.filmeHero.poster });
    expect(dados.offers.price).toBe("49.90");
    expect(PRECO_MENSAL).toBe(`R$ ${dados.offers.price.replace(".", ",")}`);
    expect(dados.offers.priceCurrency).toBe("BRL");
    expect(dados.offers.priceSpecification.referenceQuantity.unitCode).toBe("MON");
    expect(dados.image.startsWith("https://iagentics.com.br/")).toBe(true);
  });
});

describe("JSON-LD da calculadora da Reforma", () => {
  it("é uma WebApplication gratuita, da organização", () => {
    const dados = calculadoraJsonLd({ nome: "n", descricao: "d", caminho: "/reforma-tributaria-compras" });
    expect(dados["@type"]).toBe("WebApplication");
    expect(dados.isAccessibleForFree).toBe(true);
    expect(dados.offers.price).toBe("0");
    expect(dados.url).toBe("https://iagentics.com.br/reforma-tributaria-compras");
    expect(dados.provider["@id"]).toBe(ORGANIZACAO_ID);
  });
});

describe("JSON-LD da Academy", () => {
  it("se declara parte da organização", () => {
    const dados = academyJsonLd();
    expect(dados["@type"]).toBe("EducationalOrganization");
    expect(dados.parentOrganization.name).toBe(site.name);
  });
});

describe("JSON-LD do FAQ", () => {
  it("vira FAQPage com uma Question por item", () => {
    const dados = faqJsonLd([{ pergunta: "Roda onde?", resposta: "Dentro da Desk Manager." }]);
    expect(dados["@type"]).toBe("FAQPage");
    expect(dados.mainEntity[0].name).toBe("Roda onde?");
    expect(dados.mainEntity[0].acceptedAnswer.text).toBe("Dentro da Desk Manager.");
  });

  /* As três páginas com FAQ. Passar por aqui é o que garante que uma página
     nova não entre no ar com pergunta sem "?" ou resposta longa demais para
     ser citada — o formato é a razão de o bloco existir. */
  const paginasComFaq = [
    { rota: "/nexo", faq: nexoPage.faq },
    { rota: "/academy", faq: academy.faq },
    { rota: "/spend-lab", faq: spendLab.faq },
  ];

  for (const { rota, faq } of paginasComFaq) {
    it(`${rota}: toda pergunta publicada vira uma Question no schema`, () => {
      const dados = faqJsonLd(faq.itens);
      expect(dados.mainEntity).toHaveLength(faq.itens.length);
      expect(faq.itens.length).toBeGreaterThanOrEqual(5);
    });

    it(`${rota}: cada resposta se sustenta sozinha e cabe numa citação`, () => {
      for (const item of faq.itens) {
        expect(item.pergunta.endsWith("?")).toBe(true);
        expect(item.resposta.length).toBeLessThanOrEqual(260);
        expect(item.resposta.trim().length).toBeGreaterThan(0);
      }
    });

    it(`${rota}: nenhuma pergunta repetida — duplicata vira item duplicado no schema`, () => {
      const perguntas = faq.itens.map((i) => i.pergunta);
      expect(new Set(perguntas).size).toBe(perguntas.length);
    });
  }
});
