import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { NexoCover } from "@/components/sections/nexo/Cover";
import { NexoFluxoCompras } from "@/components/sections/nexo/FluxoCompras";
import { NexoAssurance } from "@/components/sections/nexo/Assurance";
import { NexoDifferentiators } from "@/components/sections/nexo/Differentiators";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/Footer";
import { NexoFaq } from "@/components/sections/nexo/Faq";
import { JsonLd } from "@/components/seo/JsonLd";
import { nexoPage } from "@/lib/content";
import { ogDaPagina, faqJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Nexo",
  description: nexoPage.hero.subtext,
  alternates: { canonical: "/nexo" },
  openGraph: ogDaPagina("/nexo", "Nexo · IAgentics", nexoPage.hero.subtext),
};

/**
 * Nexo, laid out as an editorial dossier.
 *
 * The device is print: a typographic cover, plates that run edge to edge with their
 * captions in the margin, oversized folios, wide measures and no cards anywhere. The
 * frames belong to the plates alone, so every other section is set with hairlines and
 * hanging headings.
 *
 * Four content sections, four distinct layout families:
 *   Cover ............. full-height type, indented second line
 *   AgentsIndex ....... contents index, code in the margin
 *   Plates ............ full-bleed media sequence  (RESERVED slots)
 *   Differentiators ... hanging headings
 *   Contact ........... form split
 *
 * Note there is no pinned scroll sequence here: the pan was dropped with the previous
 * layout, because a scroll hijack is agency language and this page is a dossier.
 */
export default function Page() {
  return (
    <>
      <JsonLd dados={faqJsonLd(nexoPage.faq.itens)} />
      <Nav />
      <main id="conteudo" className="pt-16">
        <NexoCover />
        {/* Onde os dados ficam vem ANTES dos agentes: para quem compra, isso é
            pré-requisito, não diferencial. Não faz sentido apresentar cinco agentes
            operando sobre os dados de compras da empresa e só depois dizer onde
            esses dados moram. */}
        <NexoAssurance />
        <NexoFluxoCompras />
        <NexoDifferentiators />
        {/* O FAQ fecha o argumento, logo antes do contato: são as objeções que
            sobram depois de ver o processo e os diferenciais - e é o bloco que
            um assistente de IA cita quando alguém pergunta sobre o Nexo. */}
        <NexoFaq />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
