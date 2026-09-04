import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/sections/Hero";
import { Problema } from "@/components/sections/Problema";
import { Solutions } from "@/components/sections/Solutions";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizacaoJsonLd, ogDaPagina } from "@/lib/seo";
import { site, hero } from "@/lib/content";

/* Canonical e og:url são declarados PÁGINA A PÁGINA, nunca no layout:
   metadata do Next é herdada, então um valor no layout faria toda rota sem
   valor próprio se declarar como sendo a home. */
export const metadata: Metadata = {
  description: hero.descricao,
  alternates: { canonical: "/" },
  openGraph: ogDaPagina("/", `${site.name} · ${site.tagline}`, hero.descricao),
};

/**
 * Landing page: a proposta de valor, o problema que ela ataca, as três
 * soluções e o caminho para uma conversa. Cada solução tem a própria rota
 * (/nexo, /academy, /spend-lab); esta página fica escaneável.
 *
 * Quatro seções, quatro famílias de layout:
 *   Hero ........ grafo do orquestrador + faixa de parceiros
 *   Problema .... dois painéis numéricos com fonte (pitch Hacktown, slides 3–4)
 *   Solutions ... índice editorial, imagem no hover
 *   Contact ..... formulário em duas colunas
 *
 * Alinhada ao pitch Hacktown em 2026-09-04 (docs/PLANO-ALINHAMENTO-PITCH.md),
 * depois de aprovada em /preview/home.
 */
export default function Home() {
  return (
    <>
      <JsonLd dados={organizacaoJsonLd()} />
      <Nav />
      <main id="conteudo">
        <Hero />
        <Problema />
        <Solutions />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
