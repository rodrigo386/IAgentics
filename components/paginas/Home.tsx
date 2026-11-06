import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/sections/Hero";
import { Problema } from "@/components/sections/Problema";
import { Solutions } from "@/components/sections/Solutions";
import { Contact } from "@/components/sections/Contact";
import { ArtigosRelacionados } from "@/components/sections/ArtigosRelacionados";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { alternatesDe, organizacaoJsonLd, ogDaPagina } from "@/lib/seo";
import { definirLingua, textosEm } from "@/lib/textos";
import type { Lingua } from "@/lib/i18n";

/* A home nos dois idiomas (/ e /en, 2026-11-06). Canonical e og:url são
   declarados PÁGINA A PÁGINA, nunca no layout: metadata do Next é herdada. */
export function metadataHome(lingua: Lingua): Metadata {
  const { site, hero } = textosEm(lingua);
  return {
    ...(lingua === "en" ? { title: { absolute: `${site.name} · ${site.tagline}` } } : {}),
    description: hero.descricao,
    alternates: alternatesDe("/", lingua),
    openGraph: ogDaPagina(lingua === "en" ? "/en" : "/", `${site.name} · ${site.tagline}`, hero.descricao, lingua),
  };
}

export function PaginaHome({ lingua }: { lingua: Lingua }) {
  definirLingua(lingua);
  return (
    <>
      {/* O Organization sai do português (lib/seo.ts); só na versão principal. */}
      {lingua === "pt" ? <JsonLd dados={organizacaoJsonLd()} /> : null}
      <Nav contato="#contato" />
      <main id="conteudo">
        <Hero />
        <Problema />
        <Solutions />
        {/* Os artigos são em português: o bloco fica só na versão em português. */}
        {lingua === "pt" ? <ArtigosRelacionados pagina="home" /> : null}
        <Contact />
      </main>
      <Footer />
    </>
  );
}
