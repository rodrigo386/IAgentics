import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { NexoCoverOrquestrador } from "@/components/sections/nexo/CoverOrquestrador";
import { NexoVideoComercial } from "@/components/sections/nexo/VideoComercial";
import { NexoCamadas } from "@/components/sections/nexo/Camadas";
import { NexoAssurance } from "@/components/sections/nexo/Assurance";
import { NexoFluxoCompras } from "@/components/sections/nexo/FluxoCompras";
import { NexoNaPratica } from "@/components/sections/nexo/NaPratica";
import { NexoDifferentiators } from "@/components/sections/nexo/Differentiators";
import { NexoComparativo } from "@/components/sections/nexo/Comparativo";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/Footer";
import { SecaoFaq } from "@/components/sections/Faq";
import { JsonLd } from "@/components/seo/JsonLd";
import { nexoPage } from "@/lib/content";
import { ogDaPagina, faqJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  /* "Nexo" sozinho dava 16 caracteres com o sufixo do template, e o Bing
     marcou como título curto demais (2026-09-14). Título curto não é só
     penalidade de checklist: é a linha que a pessoa lê no resultado da busca,
     e "Nexo · IAgentics" não diz a ninguém o que o produto faz. */
  title: "Nexo: agentes de IA para Compras e gestão de gastos",
  description: nexoPage.hero.subtext,
  alternates: { canonical: "/nexo" },
  openGraph: ogDaPagina("/nexo", "Nexo · IAgentics", nexoPage.hero.subtext),
};

/**
 * Nexo como dossiê editorial, alinhado ao pitch Hacktown em 2026-09-04 depois
 * de aprovado em /preview/nexo (docs/PLANO-ALINHAMENTO-PITCH.md, Fases 1 e 2).
 *
 * Ordem do argumento:
 *   Cover ............ o orquestrador: manchete + grafo dos nove módulos
 *   VideoComercial ... o Nexo Compras em um minuto (vídeo mudo em loop)
 *   Camadas .......... o que o Nexo É (agentes → orquestração → ambiente)
 *   Assurance ........ onde os dados ficam — pré-requisito, antes de operar
 *   FluxoCompras ..... o módulo de Compras, passo a passo, com as telas
 *   NaPratica ........ os outros quatro módulos com prova, no formato do pitch
 *   Differentiators .. por que é diferente
 *   Comparativo ...... contra o que se mede ("SaaS de Compras", sem nomes)
 *   FAQ .............. as objeções que sobram — e o bloco citável por IA
 *   Contact
 */
export default function Page() {
  return (
    <>
      <JsonLd dados={faqJsonLd(nexoPage.faq.itens)} />
      <Nav />
      <main id="conteudo" className="pt-16">
        <NexoCoverOrquestrador />
        <NexoVideoComercial />
        <NexoCamadas />
        <NexoAssurance />
        <div id="fluxo-compras">
          <NexoFluxoCompras />
        </div>
        <NexoNaPratica />
        <NexoDifferentiators />
        <NexoComparativo />
        <SecaoFaq eyebrow={nexoPage.faq.eyebrow} titulo={nexoPage.faq.titulo} itens={nexoPage.faq.itens} />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
