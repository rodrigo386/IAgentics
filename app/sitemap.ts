import type { MetadataRoute } from "next";
import { site } from "@/lib/content";
import { ROTAS_SITEMAP, PRIORIDADE_SITEMAP, PRIORIDADE_ARTIGO } from "@/lib/seo";
import { todosOsArtigos } from "@/lib/artigos";
import { dataDoGit } from "@/lib/datas-git";

/* Os arquivos de cada página fixa: a última mudança neles é o `lastmod`. */
const ARQUIVOS_DA_ROTA: Record<string, string[]> = {
  "/": ["app/page.tsx", "components/sections/Hero.tsx", "components/sections/Problema.tsx", "components/sections/Solutions.tsx", "public/solucoes"],
  "/nexo": ["app/nexo", "components/sections/nexo", "public/nexo"],
  "/academy": ["app/academy", "components/sections/academy"],
  "/cursos": ["app/cursos", "components/sections/cursos"],
  "/spend-lab": ["app/spend-lab", "components/sections/spend-lab"],
  "/privacidade": ["app/privacidade"],
};

/**
 * O sitemap: as páginas públicas, e só elas. /admin, /api e /preview ficam de
 * fora. (/app e /certificados não existem desde 2026-08-28.)
 *
 * `lastmod` em TODA URL (2026-10-09, Prompt 1 de SEO): páginas fixas pela data
 * do último commit nos arquivos delas; artigos pelo último commit no .md
 * (cai na data de publicação se o git não responder). Ver lib/datas-git.ts.
 *
 * `force-static` porque a lista não depende de request nenhum; assim o
 * arquivo é gerado no build e servido sem custo. Os artigos entram no build
 * junto, lidos do disco por lib/artigos.ts.
 */
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const fixas = ROTAS_SITEMAP.map((rota) => ({
    url: rota === "/" ? site.url : `${site.url}${rota}`,
    lastModified: dataDoGit(...(ARQUIVOS_DA_ROTA[rota] ?? [])),
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
      /* A listagem muda quando um artigo muda: a data mais recente entre eles. */
      lastModified: [dataDoGit("app/artigos/page.tsx"), ...artigos.map((a) => a.atualizado)].sort().at(-1),
      /* Semanal, não mensal: é a única página do site cujo conteúdo muda a
         cada publicação. */
      changeFrequency: "weekly" as const,
      priority: PRIORIDADE_SITEMAP["/artigos"] ?? 0.7,
    },
    ...artigos.map((artigo) => ({
      url: `${site.url}/artigos/${artigo.slug}`,
      /* A última mudança real no .md (git), nunca a hora do build: carimbar o
         build faria todo artigo parecer atualizado a cada deploy - sinal
         falso, que o Google aprende a ignorar. */
      lastModified: artigo.atualizado,
      changeFrequency: "yearly" as const,
      priority: PRIORIDADE_ARTIGO,
    })),
  ];
}
