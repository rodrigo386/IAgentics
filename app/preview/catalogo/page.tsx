import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Vitrine } from "@/components/catalogo/layouts/Vitrine";
import { catalogo as t } from "@/lib/content";

/* Prévia: noindex, sem canonical (a página oficial ainda é outra), fora do
   sitemap e sem link no site. Sem senha desde 2026-09-22, a pedido do Rodrigo. */
export const metadata: Metadata = {
  title: t.meta.titulo,
  description: t.meta.descricao,
  robots: { index: false, follow: false },
};

/**
 * Prévia do catálogo com checkout — layout Vitrine (escolhido em 2026-09-26).
 * Desde 2026-10-02 com os PREÇOS REAIS (pedido do Rodrigo, para ver o que o
 * cliente vai ver): a cobrança no Asaas é de verdade e no valor de verdade.
 */
export default function PaginaCatalogoPrevia() {
  return (
    <>
      <Nav />
      <main id="conteudo" className="pt-16">
        <Vitrine
          precoBaseCentavos={t.precoBaseCentavos}
          modo="real"
          urlCheckout="/preview/catalogo/checkout"
        />
      </main>
      <Footer />
    </>
  );
}
