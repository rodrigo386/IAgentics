import type { MetadataRoute } from "next";
import { site } from "@/lib/content";
import { ROTAS_SITEMAP } from "@/lib/seo";
import { todosOsArtigos } from "@/lib/artigos";
import { dataDoGit } from "@/lib/datas-git";
import { ROTAS_EN } from "@/lib/i18n";

/* As páginas em português moram em app/(pt)/ desde 2026-11-24 (dois layouts
   raiz). `pt()` dá o caminho novo E o antigo: a história anterior à mudança
   continua valendo, e a mudança em si (só renomeação) não conta como
   alteração (ver dataDoGit). */
const pt = (caminho: string) => [`app/(pt)/${caminho}`, `app/${caminho}`];

/* Os arquivos de cada página fixa: a última mudança neles é o `lastmod`. */
const ARQUIVOS_DA_ROTA: Record<string, string[]> = {
  "/": [...pt("page.tsx"), "components/paginas/Home.tsx", "components/sections/Hero.tsx", "components/sections/Problema.tsx", "components/sections/Solutions.tsx", "public/solucoes"],
  "/nexo": [...pt("nexo"), "components/paginas/Nexo.tsx", "components/sections/nexo", "public/nexo"],
  "/academy": [...pt("academy"), "components/paginas/Academy.tsx", "components/sections/academy"],
  "/cursos": [...pt("cursos"), "components/sections/cursos"],
  "/spend-lab": [...pt("spend-lab"), "components/paginas/SpendLab.tsx", "components/sections/spend-lab"],
  "/diagnose-compras": [...pt("diagnose-compras"), "components/sections/diagnose"],
  "/reforma-tributaria-compras": [...pt("reforma-tributaria-compras"), "components/sections/reforma", "lib/reforma.ts"],
  "/consulta-ncm-cclasstrib": [...pt("consulta-ncm-cclasstrib"), "components/sections/reforma/PacoteReforma.tsx", "lib/consulta-ncm.ts", "lib/receita/tabela-ncm.json"],
  "/bolsas": [...pt("bolsas"), "components/sections/bolsas"],
  "/privacidade": [...pt("privacidade"), "components/paginas/Privacidade.tsx"],
};

/**
 * O sitemap: as páginas públicas, e só elas. /admin, /api e /preview ficam de
 * fora. (/app e /certificados não existem desde 2026-08-28.)
 *
 * Só `url`, `lastmod` e os idiomas: `changefreq` e `priority` saíram em
 * 2026-11-24 (auditoria de SEO), o Google ignora os dois.
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
  const absoluta = (rota: string) => (rota === "/" ? site.url : `${site.url}${rota}`);
  /* Página com versão em inglês declara as duas (hreflang), dos dois lados
     (2026-11-06). A versão em inglês herda o lastmod e a prioridade da
     portuguesa, um degrau abaixo: o público principal do site é o Brasil. */
  const idiomas = (rota: string) => {
    const en = (ROTAS_EN as Record<string, string>)[rota];
    return en ? { alternates: { languages: { "pt-BR": absoluta(rota), en: absoluta(en) } } } : {};
  };
  const portuguesas = ROTAS_SITEMAP.map((rota) => ({
    url: absoluta(rota),
    lastModified: dataDoGit(...(ARQUIVOS_DA_ROTA[rota] ?? [])),
    ...idiomas(rota),
  }));
  const inglesas = Object.entries(ROTAS_EN).map(([rotaPt, en]) => ({
    url: absoluta(en),
    lastModified: dataDoGit(...(ARQUIVOS_DA_ROTA[rotaPt] ?? []), "lib/content-en"),
    ...idiomas(rotaPt),
  }));
  const fixas = [...portuguesas, ...inglesas];

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
      lastModified: [dataDoGit(...pt("artigos/page.tsx")), ...artigos.map((a) => a.atualizado)].sort().at(-1),
    },
    ...artigos.map((artigo) => ({
      url: `${site.url}/artigos/${artigo.slug}`,
      /* A última mudança real no .md (git), nunca a hora do build: carimbar o
         build faria todo artigo parecer atualizado a cada deploy - sinal
         falso, que o Google aprende a ignorar. */
      lastModified: artigo.atualizado,
    })),
  ];
}
