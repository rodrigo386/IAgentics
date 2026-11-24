import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { site } from "@/lib/content";
import { site as siteEn } from "@/lib/content-en/geral";
import { Beacon } from "@/components/site/Beacon";
import { GoogleAnalytics } from "@/components/site/GoogleAnalytics";
import { MetricoolPixel } from "@/components/site/MetricoolPixel";
import { PularConteudo } from "@/components/site/PularConteudo";
import type { Lingua } from "@/lib/i18n";
import { IMAGEM_OG_COMPLETA } from "@/lib/seo";
import "@/app/globals.css";

/**
 * O documento HTML do site, dividido pelos DOIS layouts raiz (2026-11-24):
 * app/(pt)/layout.tsx e app/en/layout.tsx. Existe porque o `<html lang>` é do
 * layout raiz, e com um raiz só as páginas em inglês saíam `lang="pt-BR"`
 * (auditoria de SEO). Ler o idioma do pedido no layout deixaria TODAS as
 * páginas dinâmicas; dois layouts raiz mantêm as estáticas estáticas. O preço
 * é que ir do português para o inglês recarrega a página inteira, o que só
 * acontece no seletor de idioma.
 *
 * Space Grotesk matches the geometric grotesque of the IAgentics wordmark, so the page
 * type and the logo speak the same language. JetBrains Mono carries agent codes and
 * figures only. Two families, no serif.
 */
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
  weight: ["400", "500"],
});

/** O metadata base de cada idioma. Canonical e og:url continuam declarados
 *  página a página (ogDaPagina): metadata do layout é herdada. */
export function metadataRaiz(lingua: Lingua): Metadata {
  const s = lingua === "en" ? siteEn : site;
  return {
    metadataBase: new URL(site.url),
    title: { default: s.titulo, template: `%s · ${site.name}` },
    description: s.description,
    openGraph: {
      title: s.titulo,
      description: s.description,
      url: site.url,
      siteName: site.name,
      locale: lingua === "en" ? "en_US" : "pt_BR",
      type: "website",
      images: [IMAGEM_OG_COMPLETA],
    },
    twitter: { card: "summary_large_image", images: [IMAGEM_OG_COMPLETA] },
    /* Sem `icons` aqui de propósito. O favicon era o lockup horizontal
       (1135x267, proporção 4,25:1) espremido num quadrado de 16px - ilegível na
       aba. Agora vale a convenção de arquivo do Next, app/icon.png e
       app/apple-icon.png, que são quadrados de verdade. Declarar `icons` no
       metadata voltaria a sobrescrever os dois. */
  };
}

export const viewportRaiz: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8F8F8" },
    { media: "(prefers-color-scheme: dark)", color: "#131723" },
  ],
};

/**
 * Resolves the theme before first paint so there is no flash. Respects the system
 * preference by default and honors an explicit choice once the user makes one.
 */
const themeScript = `
(function(){
  try {
    var stored = localStorage.getItem("iagentics-theme");
    var dark = stored ? stored === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();
`;

export function Documento({ lingua, children }: { lingua: Lingua; children: ReactNode }) {
  return (
    <html
      lang={lingua === "en" ? "en" : "pt-BR"}
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <PularConteudo />
        {children}
        {/* Contador de visitas do site (só rotas públicas; ver o componente). */}
        <Beacon />
        {/* GA4, também só nas rotas públicas (ver o componente). */}
        <GoogleAnalytics />
        {/* Pixel da Metricool, mesma fronteira (ver o componente). */}
        <MetricoolPixel />
      </body>
    </html>
  );
}
