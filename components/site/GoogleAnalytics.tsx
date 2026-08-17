"use client";
import Script from "next/script";
import { usePathname } from "next/navigation";

const GA_ID = "G-R26J12D835";

/**
 * Google Analytics 4 (gtag.js), só nas rotas públicas: /app e /admin ficam
 * sem rastreador de terceiro, a mesma fronteira do Beacon interno. Trocas de
 * rota no cliente são reportadas pelo enhanced measurement do GA4 (history
 * change), então um gtag('config') único basta.
 */
export function GoogleAnalytics() {
  const pathname = usePathname();
  if (!pathname || /^\/(app|admin)(\/|$)/.test(pathname)) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}
