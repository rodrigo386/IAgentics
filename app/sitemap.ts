import type { MetadataRoute } from "next";
import { site } from "@/lib/content";
import { ROTAS_SITEMAP, PRIORIDADE_SITEMAP, PRIORIDADE_ARTIGO } from "@/lib/seo";
import { todosOsArtigos } from "@/lib/artigos";

/**
 * O sitemap: as páginas públicas, e só elas. /app, /admin e /api ficam de
 * fora (o robots.ts também os barra), e /certificados/[codigo] fica de fora
 * porque é URL infinita com nome de aluno - ver a nota em lib/seo.ts.
 *
 * `force-static` porque a lista não depende de request nenhum; assim o
 * arquivo é gerado no build e servido sem custo. Os artigos entram no build
 * junto, lidos do disco por lib/artigos.ts.
 */
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const fixas = ROTAS_SITEMAP.map((rota) => ({
    url: rota === "/" ? site.url : `${site.url}${rota}`,
    changeFrequency: "monthly" as const,
    priority: PRIORIDADE_SITEMAP[rota] ?? 0.5,
  }));

  const artigos = todosOsArtigos();

  /* Sem artigo publicado, /artigos nem aparece: uma listagem vazia anunciada
     ao Google é rastreamento gasto à toa, e uma página sem conteúdo no índice
     é pior que página nenhuma. O índice entra junto com o primeiro artigo. */
  if (artigos.length === 0) return fixas;

  return [
    ...fixas,
    {
      url: `${site.url}/artigos`,
      /* Semanal, não mensal: é a única página do site cujo conteúdo muda a
         cada publicação. */
      changeFrequency: "weekly" as const,
      priority: PRIORIDADE_SITEMAP["/artigos"] ?? 0.7,
    },
    ...artigos.map((artigo) => ({
      url: `${site.url}/artigos/${artigo.slug}`,
      /* `lastModified` aqui é honesto: é a data de publicação declarada no
         frontmatter, não a hora do build. Carimbar o build faria todo artigo
         parecer atualizado a cada deploy - sinal falso, que o Google aprende
         a ignorar. */
      lastModified: artigo.data,
      changeFrequency: "yearly" as const,
      priority: PRIORIDADE_ARTIGO,
    })),
  ];
}
