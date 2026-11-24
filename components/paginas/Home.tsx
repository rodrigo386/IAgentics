import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/sections/Hero";
import { Problema } from "@/components/sections/Problema";
import { Solutions } from "@/components/sections/Solutions";
import { Contact } from "@/components/sections/Contact";
import { ArtigosRelacionados } from "@/components/sections/ArtigosRelacionados";
import { FerramentasHome } from "@/components/sections/FerramentasHome";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { alternatesDe, faqJsonLd, organizacaoJsonLd, ogDaPagina, solucoesJsonLd, websiteJsonLd } from "@/lib/seo";
import { SecaoFaq } from "@/components/sections/Faq";
import { definirLingua, textosEm } from "@/lib/textos";
import type { Lingua } from "@/lib/i18n";

/* A home nos dois idiomas (/ e /en, 2026-11-06). Canonical e og:url são
   declarados PÁGINA A PÁGINA, nunca no layout: metadata do Next é herdada. */
export function metadataHome(lingua: Lingua): Metadata {
  const { site, hero } = textosEm(lingua);
  return {
    /* Até 60 caracteres (site.titulo): "nome · tagline" dava 67 e era cortado. */
    title: { absolute: site.titulo },
    description: hero.descricao,
    alternates: alternatesDe("/", lingua),
    openGraph: ogDaPagina(lingua === "en" ? "/en" : "/", site.titulo, hero.descricao, lingua),
  };
}

/**
 * A FAQ da home (2026-11-24, auditoria de SEO): o que um comprador pergunta
 * antes da primeira conversa, tirado das FAQs das páginas de solução, sem
 * pergunta nem resposta nova. A mesma escolha vale para o inglês (as listas
 * têm a mesma ordem). Mudou a ordem de uma FAQ? O e2e da home confere as
 * perguntas.
 */
const PERGUNTAS_DA_HOME = { nexoPage: [0, 2, 7], spendLab: [0], academy: [0, 5] } as const;

export function faqDaHome(lingua: Lingua) {
  const t = textosEm(lingua);
  return [
    ...PERGUNTAS_DA_HOME.nexoPage.map((i) => t.nexoPage.faq.itens[i]),
    ...PERGUNTAS_DA_HOME.spendLab.map((i) => t.spendLab.faq.itens[i]),
    ...PERGUNTAS_DA_HOME.academy.map((i) => t.academy.faq.itens[i]),
  ];
}

export function PaginaHome({ lingua }: { lingua: Lingua }) {
  definirLingua(lingua);
  const { solutions } = textosEm(lingua);
  const faq = faqDaHome(lingua);
  return (
    <>
      <JsonLd dados={solucoesJsonLd(solutions.items, lingua)} />
      <JsonLd dados={faqJsonLd(faq)} />
      {/* O Organization sai do português (lib/seo.ts); só na versão principal. */}
      {lingua === "pt" ? <JsonLd dados={organizacaoJsonLd()} /> : null}
      {lingua === "pt" ? <JsonLd dados={websiteJsonLd()} /> : null}
      <Nav contato="#contato" />
      <main id="conteudo">
        <Hero />
        <Problema />
        <Solutions />
        {/* As ferramentas e os artigos são em português: só na versão em português. */}
        {lingua === "pt" ? <FerramentasHome /> : null}
        {lingua === "pt" ? <ArtigosRelacionados pagina="home" limite={6} /> : null}
        <SecaoFaq eyebrow={solutions.faq.eyebrow} titulo={solutions.faq.titulo} itens={faq} />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
