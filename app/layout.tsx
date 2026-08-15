import type { Metadata, Viewport } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { site } from "@/lib/content";
import { Beacon } from "@/components/site/Beacon";
import "./globals.css";

/**
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

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} · ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  openGraph: {
    title: `${site.name} · ${site.tagline}`,
    description: site.description,
    url: site.url,
    siteName: site.name,
    locale: "pt_BR",
    type: "website",
  },
  /* Sem `icons` aqui de propósito. O favicon era o lockup horizontal
     (1135x267, proporção 4,25:1) espremido num quadrado de 16px - ilegível na
     aba. Agora vale a convenção de arquivo do Next, app/icon.png e
     app/apple-icon.png, que são quadrados de verdade. Declarar `icons` no
     metadata voltaria a sobrescrever os dois. */
};

export const viewport: Viewport = {
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-accent focus:px-5 focus:py-3 focus:text-accent-on"
        >
          Ir para o conteúdo
        </a>
        {children}
        {/* Contador de visitas do site (só rotas públicas; ver o componente). */}
        <Beacon />
      </body>
    </html>
  );
}
