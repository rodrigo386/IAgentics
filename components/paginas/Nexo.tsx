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
import { ArtigosRelacionados } from "@/components/sections/ArtigosRelacionados";
import { Footer } from "@/components/Footer";
import { SecaoFaq } from "@/components/sections/Faq";
import { JsonLd } from "@/components/seo/JsonLd";
import { alternatesDe, ogDaPagina, faqJsonLd } from "@/lib/seo";
import { definirLingua, textosEm } from "@/lib/textos";
import { rotaEm, type Lingua } from "@/lib/i18n";

/** /nexo e /en/nexo (2026-11-06). */
export function metadataNexo(lingua: Lingua): Metadata {
  const { paginas, nexoPage } = textosEm(lingua);
  return {
    title: paginas.nexo.titulo,
    description: nexoPage.hero.subtext,
    alternates: alternatesDe("/nexo", lingua),
    openGraph: ogDaPagina(rotaEm(lingua, "/nexo"), paginas.nexo.og, nexoPage.hero.subtext, lingua),
  };
}

export function PaginaNexo({ lingua }: { lingua: Lingua }) {
  definirLingua(lingua);
  const { nexoPage } = textosEm(lingua);
  return (
    <>
      <JsonLd dados={faqJsonLd(nexoPage.faq.itens)} />
      <Nav contato="#contato" />
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
        {lingua === "pt" ? <ArtigosRelacionados pagina="nexo" /> : null}
        <Contact />
      </main>
      <Footer />
    </>
  );
}
