/**
 * Normalização de rota para o contador de visitas do site.
 *
 * A regra existe por CARDINALIDADE: page_views tem PK (dia, rota), então o que
 * entra aqui define quantas linhas o banco ganha por dia. Só as seções
 * conhecidas do site viram rota própria; qualquer outro caminho público cai no
 * balde "/outras". Admin e API nunca são contados — o beacon já pula, mas o
 * normalizador é a garantia no servidor (defesa em profundidade: o endpoint é
 * público e qualquer um pode fazer POST).
 *
 * ARTIGOS SÃO A EXCEÇÃO, e ela é deliberada (2026-08-31): cada artigo
 * publicado vira rota própria, porque saber QUAL texto traz tráfego é o que
 * decide a próxima pauta — agregado em "/artigos" isso ficaria invisível, e
 * dentro de "/outras" (onde estava) pior ainda.
 *
 * O preço é a cardinalidade, e por isso a lista de slugs é INJETADA pelo
 * chamador em vez de aceita do visitante: sem essa validação, um POST forjado
 * com "/artigos/qualquer-coisa" criaria uma linha nova por chute, e o endpoint
 * é público. Slug desconhecido cai em "/outras" como qualquer caminho estranho.
 */
export const ROTAS_RASTREADAS = ["/", "/nexo", "/academy", "/cursos", "/spend-lab", "/artigos", "/privacidade"] as const;

export const ROTA_OUTRAS = "/outras";

export function normalizarRota(bruta: unknown, slugsDeArtigo: readonly string[] = []): string | null {
  if (typeof bruta !== "string" || bruta.length === 0 || bruta.length > 200) return null;
  if (!bruta.startsWith("/")) return null;

  const semSufixo = bruta.split(/[?#]/, 1)[0];
  const partes = semSufixo.split("/");
  const primeiroSegmento = "/" + (partes[1] ?? "");

  /* /preview não conta: é página em construção, e quem a visita é quem a
     está aprovando — não é tráfego. */
  if (["/app", "/admin", "/api", "/preview"].includes(primeiroSegmento)) return null;

  /* Artigo publicado vira rota própria; qualquer outro slug sob /artigos cai em
     "/outras". A checagem vem ANTES da lista de seções porque "/artigos"
     sozinho (o índice) também é rota válida e precisa continuar sendo. */
  if (primeiroSegmento === "/artigos") {
    const slug = partes[2] ?? "";
    if (!slug) return "/artigos";
    return slugsDeArtigo.includes(slug) ? `/artigos/${slug}` : ROTA_OUTRAS;
  }

  if ((ROTAS_RASTREADAS as readonly string[]).includes(primeiroSegmento)) return primeiroSegmento;
  return ROTA_OUTRAS;
}
