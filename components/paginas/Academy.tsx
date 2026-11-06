import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { AcademyCover } from "@/components/sections/academy/Cover";
import { AcademyProof, AcademyClients } from "@/components/sections/academy/Proof";
import { AcademyApproach } from "@/components/sections/academy/Approach";
import { AcademyFormats } from "@/components/sections/academy/Formats";
import { AcademyAssinatura } from "@/components/sections/academy/Assinatura";
import { AcademyCourses } from "@/components/sections/academy/Courses";
import { AcademyConvite } from "@/components/sections/academy/Convite";
import { Contact } from "@/components/sections/Contact";
import { ArtigosRelacionados } from "@/components/sections/ArtigosRelacionados";
import { Footer } from "@/components/Footer";
import { SecaoFaq } from "@/components/sections/Faq";
import { JsonLd } from "@/components/seo/JsonLd";
import { academyJsonLd, alternatesDe, ogDaPagina, faqJsonLd, cursosJsonLd } from "@/lib/seo";
import { definirLingua, textosEm } from "@/lib/textos";
import { rotaEm, type Lingua } from "@/lib/i18n";

/** /academy e /en/academy (2026-11-06). */
export function metadataAcademy(lingua: Lingua): Metadata {
  const { paginas } = textosEm(lingua);
  return {
    title: paginas.academy.titulo,
    description: paginas.academy.descricao,
    alternates: alternatesDe("/academy", lingua),
    openGraph: ogDaPagina(rotaEm(lingua, "/academy"), paginas.academy.og, paginas.academy.descricao, lingua),
  };
}

export function PaginaAcademy({ lingua }: { lingua: Lingua }) {
  definirLingua(lingua);
  const { academy } = textosEm(lingua);
  return (
    <>
      {/* O EducationalOrganization sai do português (lib/seo.ts); só na versão principal. */}
      {lingua === "pt" ? <JsonLd dados={academyJsonLd()} /> : null}
      {/* Os cursos que a página mostra em "Cursos em destaque" (2026-10-09). */}
      <JsonLd
        dados={cursosJsonLd(
          rotaEm(lingua, "/academy"),
          academy.courses.items.map((c) => ({ nome: c.name, descricao: c.body, horas: c.hours, formato: c.mode })),
        )}
      />
      <JsonLd dados={faqJsonLd(academy.faq.itens)} />
      <Nav contato="#contato" />
      <main id="conteudo" className="pt-16">
        <AcademyCover />
        {/* O convite em vídeo vem LOGO ABAIXO DA CAPA, a pedido do Rodrigo
            (2026-09-09); fora da capa, que é medida para caber em 100dvh. */}
        <AcademyConvite />
        <AcademyProof />
        <AcademyClients />
        <AcademyApproach />
        <AcademyFormats />
        <AcademyCourses />
        <AcademyAssinatura />
        {/* O FAQ antes do contato: as objeções de quem compra treinamento
            corporativo, respondidas em texto que um assistente de IA cita. */}
        <SecaoFaq eyebrow={academy.faq.eyebrow} titulo={academy.faq.titulo} itens={academy.faq.itens} />
        {lingua === "pt" ? <ArtigosRelacionados pagina="academy" /> : null}
        <Contact />
      </main>
      <Footer />
    </>
  );
}
