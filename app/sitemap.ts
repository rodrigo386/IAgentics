import type { MetadataRoute } from "next";
import { site } from "@/lib/content";
import { ROTAS_SITEMAP, PRIORIDADE_SITEMAP } from "@/lib/seo";

/**
 * O sitemap: as páginas públicas, e só elas. /app, /admin e /api ficam de
 * fora (o robots.ts também os barra), e /certificados/[codigo] fica de fora
 * porque é URL infinita com nome de aluno - ver a nota em lib/seo.ts.
 *
 * `force-static` porque a lista não depende de request nenhum; assim o
 * arquivo é gerado no build e servido sem custo.
 */
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return ROTAS_SITEMAP.map((rota) => ({
    url: rota === "/" ? site.url : `${site.url}${rota}`,
    changeFrequency: "monthly" as const,
    priority: PRIORIDADE_SITEMAP[rota] ?? 0.5,
  }));
}
