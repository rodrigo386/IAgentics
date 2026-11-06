import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { SpendLabCover } from "@/components/sections/spend-lab/Cover";
import { SpendLabPillars } from "@/components/sections/spend-lab/Pillars";
import { SpendLabSyllabus } from "@/components/sections/spend-lab/Syllabus";
import { SpendLabPractice } from "@/components/sections/spend-lab/Practice";
import { SpendLabPartners } from "@/components/sections/spend-lab/Partners";
import { SpendLabMethod } from "@/components/sections/spend-lab/Method";
import { SpendLabComparison } from "@/components/sections/spend-lab/Comparison";
import { Contact } from "@/components/sections/Contact";
import { ArtigosRelacionados } from "@/components/sections/ArtigosRelacionados";
import { Footer } from "@/components/Footer";
import { SecaoFaq } from "@/components/sections/Faq";
import { JsonLd } from "@/components/seo/JsonLd";
import { alternatesDe, ogDaPagina, faqJsonLd } from "@/lib/seo";
import { definirLingua, textosEm } from "@/lib/textos";
import { rotaEm, type Lingua } from "@/lib/i18n";

/** /spend-lab e /en/spend-lab (2026-11-06). */
export function metadataSpendLab(lingua: Lingua): Metadata {
  const { paginas } = textosEm(lingua);
  return {
    title: paginas.spendLab.titulo,
    description: paginas.spendLab.descricao,
    alternates: alternatesDe("/spend-lab", lingua),
    openGraph: ogDaPagina(rotaEm(lingua, "/spend-lab"), paginas.spendLab.og, paginas.spendLab.descricao, lingua),
  };
}

export function PaginaSpendLab({ lingua }: { lingua: Lingua }) {
  definirLingua(lingua);
  const { spendLab } = textosEm(lingua);
  return (
    <>
      <JsonLd dados={faqJsonLd(spendLab.faq.itens)} />
      <Nav contato="#contato" />
      <main id="conteudo" className="pt-16">
        <SpendLabCover />
        <SpendLabPillars />
        <SpendLabSyllabus />
        <SpendLabPractice />
        <SpendLabPartners />
        <SpendLabMethod />
        <SpendLabComparison />
        {/* Fecha o argumento antes do contato, como no /nexo. */}
        <SecaoFaq eyebrow={spendLab.faq.eyebrow} titulo={spendLab.faq.titulo} itens={spendLab.faq.itens} />
        {lingua === "pt" ? <ArtigosRelacionados pagina="spend-lab" /> : null}
        <Contact />
      </main>
      <Footer />
    </>
  );
}
