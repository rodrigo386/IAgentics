import { describe, expect, it } from "vitest";
import { normalizarOrigem, normalizarRota, ORIGENS, ROTA_OUTRAS } from "./estatisticas";

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

describe("normalizarOrigem", () => {
  it("sem referrer é entrada direta", () => {
    expect(normalizarOrigem("")).toBe("direto");
    expect(normalizarOrigem(undefined)).toBe("direto");
    expect(normalizarOrigem(null)).toBe("direto");
  });

  it("reconhece busca, inclusive os domínios de país do Google", () => {
    expect(normalizarOrigem("google.com")).toBe("busca");
    expect(normalizarOrigem("www.google.com.br")).toBe("busca");
    expect(normalizarOrigem("news.google.com")).toBe("busca");
    expect(normalizarOrigem("duckduckgo.com")).toBe("busca");
    expect(normalizarOrigem("bing.com")).toBe("busca");
  });

  /* A asserção que justifica a ordem das listas: gemini.google.com termina em
     google.com e cairia em "busca", apagando o número que este site tem motivo
     para querer ver — se o trabalho de prontidão para agentes traz alguém. */
  it("assistente de IA vence busca quando o domínio é do Google", () => {
    expect(normalizarOrigem("gemini.google.com")).toBe("ia");
    expect(normalizarOrigem("chatgpt.com")).toBe("ia");
    expect(normalizarOrigem("claude.ai")).toBe("ia");
    expect(normalizarOrigem("www.perplexity.ai")).toBe("ia");
  });

  it("reconhece redes sociais, inclusive os encurtadores", () => {
    expect(normalizarOrigem("linkedin.com")).toBe("social");
    expect(normalizarOrigem("lnkd.in")).toBe("social");
    expect(normalizarOrigem("t.co")).toBe("social");
    expect(normalizarOrigem("l.instagram.com")).toBe("social");
  });

  it("o próprio site não é indicação de terceiro", () => {
    expect(normalizarOrigem("iagentics.com.br")).toBe("site");
    expect(normalizarOrigem("www.iagentics.com.br")).toBe("site");
    expect(normalizarOrigem("localhost")).toBe("site");
  });

  it("qualquer outro host vira indicação, e nunca um balde novo", () => {
    expect(normalizarOrigem("blog.qualquercoisa.com")).toBe("indicacao");
    expect(normalizarOrigem("exemplo.org")).toBe("indicacao");
  });

  /* A trava de cardinalidade: o endpoint é público, e o que ele aceita define
     quantas linhas a tabela ganha por dia. Nenhuma entrada pode escapar da
     lista fechada. */
  it("host malformado ou forjado cai na lista fechada", () => {
    const forjados = ["'; drop table entradas;--", "a".repeat(300), "não-é-host", "<script>", "  ", "http://x.com/y?z=1"];
    for (const bruto of forjados) {
      expect(ORIGENS, bruto).toContain(normalizarOrigem(bruto));
    }
    expect(normalizarOrigem(42)).toBe("direto");
    expect(normalizarOrigem({})).toBe("direto");
  });
});
