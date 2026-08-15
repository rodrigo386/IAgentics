/**
 * Normalização de rota para o contador de visitas do site.
 *
 * A regra existe por CARDINALIDADE: page_views tem PK (dia, rota), então o que
 * entra aqui define quantas linhas o banco ganha por dia. Só as seções
 * conhecidas do site viram rota própria; qualquer outro caminho público cai no
 * balde "/outras". Área logada (/app), admin e API nunca são contados - o
 * beacon já pula, mas o normalizador é a garantia no servidor (defesa em
 * profundidade: o endpoint é público e qualquer um pode fazer POST).
 */
export const ROTAS_RASTREADAS = ["/", "/nexo", "/academy", "/cursos", "/spend-lab", "/certificados"] as const;

export const ROTA_OUTRAS = "/outras";

export function normalizarRota(bruta: unknown): string | null {
  if (typeof bruta !== "string" || bruta.length === 0 || bruta.length > 200) return null;
  if (!bruta.startsWith("/")) return null;

  const semSufixo = bruta.split(/[?#]/, 1)[0];
  const primeiroSegmento = "/" + (semSufixo.split("/")[1] ?? "");

  if (primeiroSegmento === "/app" || primeiroSegmento === "/admin" || primeiroSegmento === "/api") return null;
  if ((ROTAS_RASTREADAS as readonly string[]).includes(primeiroSegmento)) return primeiroSegmento;
  return ROTA_OUTRAS;
}
