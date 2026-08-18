import { describe, it, expect } from "vitest";
import { site } from "@/lib/content";
import { ROTAS_SITEMAP, organizacaoJsonLd, academyJsonLd, cursosJsonLd } from "@/lib/seo";
import type { Curso } from "@/lib/plataforma/tipos";

const curso = (over: Partial<Curso> = {}): Curso => ({
  id: "1",
  slug: "fundamentos",
  titulo: "Fundamentos de IA",
  descricao: "Do zero ao primeiro agente.",
  capaUrl: "/capa.jpg",
  nivel: "Iniciante",
  cargaHoras: 12,
  ordem: 1,
  ...over,
});

describe("endereço canônico", () => {
  it("é o apex, sem www e sem barra no fim", () => {
    expect(site.url).toBe("https://iagentics.com.br");
    expect(site.url).not.toContain("www.");
    expect(site.url.endsWith("/")).toBe(false);
  });
});

describe("rotas do sitemap", () => {
  it("lista as páginas públicas", () => {
    expect([...ROTAS_SITEMAP]).toEqual(["/", "/nexo", "/academy", "/cursos", "/spend-lab"]);
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

describe("JSON-LD da Academy", () => {
  it("se declara parte da organização", () => {
    const dados = academyJsonLd();
    expect(dados["@type"]).toBe("EducationalOrganization");
    expect(dados.parentOrganization.name).toBe(site.name);
  });
});

describe("JSON-LD do catálogo", () => {
  it("gera um Course por curso publicado, na ordem", () => {
    const dados = cursosJsonLd([curso(), curso({ id: "2", titulo: "Agentes", ordem: 2 })], 39.9);
    expect(dados.numberOfItems).toBe(2);
    expect(dados.itemListElement.map((e) => e.position)).toEqual([1, 2]);
    expect(dados.itemListElement[1].item.name).toBe("Agentes");
  });

  it("declara o preço da assinatura em BRL com duas casas", () => {
    const [primeiro] = cursosJsonLd([curso()], 39.9).itemListElement;
    expect(primeiro.item.offers.price).toBe("39.90");
    expect(primeiro.item.offers.priceCurrency).toBe("BRL");
  });

  it("converte a carga horária para duração ISO 8601", () => {
    const [primeiro] = cursosJsonLd([curso({ cargaHoras: 8 })], 39.9).itemListElement;
    expect(primeiro.item.hasCourseInstance.courseWorkload).toBe("PT8H");
  });

  it("com catálogo vazio, gera lista vazia em vez de quebrar", () => {
    const dados = cursosJsonLd([], 39.9);
    expect(dados.numberOfItems).toBe(0);
    expect(dados.itemListElement).toEqual([]);
  });

  it("serializa título hostil sem fechar a tag script", () => {
    // O título vem do banco (o admin digita). Este é o escape que o
    // componente JsonLd aplica; sem ele, o "</script>" encerraria o bloco.
    const dados = cursosJsonLd([curso({ titulo: "Ataque </script><script>alert(1)</script>" })], 39.9);
    const json = JSON.stringify(dados).replace(/</g, "\\u003c");
    expect(json).not.toContain("</script>");
    expect(JSON.parse(json).itemListElement[0].item.name).toContain("alert(1)");
  });
});
