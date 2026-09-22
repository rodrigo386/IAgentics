import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Catalogo } from "@/components/catalogo/Catalogo";
import { catalogo as t } from "@/lib/content";
import { formatarReais, PRECO_TESTE_CENTAVOS } from "@/lib/catalogo/preco";

/* Prévia: noindex, sem canonical (a página oficial ainda é outra), fora do
   sitemap e atrás do Basic Auth do middleware. */
export const metadata: Metadata = {
  title: t.meta.titulo,
  description: t.meta.descricao,
  robots: { index: false, follow: false },
};

/**
 * Prévia do catálogo com checkout (2026-09-22). O preço é o de TESTE
 * (PRECO_TESTE_CENTAVOS): a cobrança é real, pequena, para o Rodrigo testar o
 * fluxo inteiro antes de o catálogo substituir a /cursos.
 */
export default function PaginaCatalogoPrevia() {
  return (
    <>
      <Nav />
      <main id="conteudo" className="pt-16">
        <section className="mx-auto max-w-[1400px] px-5 pb-24 pt-12 sm:px-8 sm:pt-16">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-fg-muted">{t.eyebrow}</p>
          <h1 className="mt-4 text-4xl font-medium leading-[1.05] tracking-[-0.03em] text-fg sm:text-5xl lg:text-6xl">
            {t.titulo}
          </h1>
          <p className="mt-6 max-w-[60ch] text-lg leading-relaxed text-fg-muted">
            {t.lead(formatarReais(PRECO_TESTE_CENTAVOS))}
          </p>
          <p className="mt-5 inline-block border border-line bg-surface px-3 py-1.5 text-sm text-fg">{t.avisoTeste}</p>
          <div className="mt-12">
            <Catalogo precoBaseCentavos={PRECO_TESTE_CENTAVOS} urlCheckout="/preview/catalogo/checkout" />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
