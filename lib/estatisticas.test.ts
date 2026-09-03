import { describe, expect, it } from "vitest";
import { normalizarRota, ROTA_OUTRAS } from "./estatisticas";

describe("normalizarRota", () => {
  it("mantém as seções conhecidas pelo primeiro segmento", () => {
    expect(normalizarRota("/")).toBe("/");
    expect(normalizarRota("/nexo")).toBe("/nexo");
    expect(normalizarRota("/academy")).toBe("/academy");
    expect(normalizarRota("/cursos")).toBe("/cursos");
    expect(normalizarRota("/spend-lab")).toBe("/spend-lab");
    expect(normalizarRota("/privacidade")).toBe("/privacidade");
    /* /certificados saiu da lista em 2026-08-31: a rota morreu com a
       plataforma, e manter uma seção rastreada que ninguém pode visitar só
       gera linha vazia no relatório. */
    expect(normalizarRota("/certificados/ABC123")).toBe("/outras");
  });

  it("descarta querystring e hash antes de decidir", () => {
    expect(normalizarRota("/cursos?utm_source=zap#assinar")).toBe("/cursos");
    expect(normalizarRota("/?ref=linkedin")).toBe("/");
  });

  it("agrupa caminho público desconhecido em /outras", () => {
    expect(normalizarRota("/planos")).toBe(ROTA_OUTRAS);
    expect(normalizarRota("/qualquer-coisa/funda")).toBe(ROTA_OUTRAS);
  });

  /* A exceção dos artigos: cada texto publicado é rota própria, porque saber
     QUAL artigo traz tráfego decide a próxima pauta. E a lista branca é o que
     impede o endpoint público de virar gerador de linhas. */
  it("artigo publicado vira rota própria; slug desconhecido cai em /outras", () => {
    const slugs = ["tail-spend-guia-em-portugues", "prompts-para-compras"];
    expect(normalizarRota("/artigos/tail-spend-guia-em-portugues", slugs)).toBe("/artigos/tail-spend-guia-em-portugues");
    expect(normalizarRota("/artigos/prompts-para-compras", slugs)).toBe("/artigos/prompts-para-compras");
    expect(normalizarRota("/artigos/inventado-por-atacante", slugs)).toBe("/outras");
    // Sem lista, nenhum slug é aceito — o padrão é o seguro.
    expect(normalizarRota("/artigos/tail-spend-guia-em-portugues")).toBe("/outras");
  });

  it("o índice /artigos continua sendo rota própria", () => {
    expect(normalizarRota("/artigos", ["qualquer"])).toBe("/artigos");
    expect(normalizarRota("/artigos/", ["qualquer"])).toBe("/artigos");
  });

  it("nunca conta área logada, admin ou api", () => {
    expect(normalizarRota("/app")).toBeNull();
    expect(normalizarRota("/app/curso/x")).toBeNull();
    expect(normalizarRota("/admin")).toBeNull();
    // /preview é página em construção: quem a visita está aprovando, não visitando.
    expect(normalizarRota("/preview/nexo")).toBeNull();
    expect(normalizarRota("/api/estatisticas")).toBeNull();
  });

  it("rejeita lixo: não-string, vazio, sem barra, gigante", () => {
    expect(normalizarRota(42)).toBeNull();
    expect(normalizarRota(null)).toBeNull();
    expect(normalizarRota("")).toBeNull();
    expect(normalizarRota("nexo")).toBeNull();
    expect(normalizarRota("/" + "a".repeat(300))).toBeNull();
  });
});
