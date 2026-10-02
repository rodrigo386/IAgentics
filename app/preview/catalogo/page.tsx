import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Vitrine } from "@/components/catalogo/layouts/Vitrine";
import { catalogo as t } from "@/lib/content";
import { PRECO_TESTE_CENTAVOS, PRECO_TESTE_PACK_CENTAVOS } from "@/lib/catalogo/preco";

/* Prévia: noindex, sem canonical (a página oficial ainda é outra), fora do
   sitemap e sem link no site. Sem senha desde 2026-09-22, a pedido do Rodrigo. */
export const metadata: Metadata = {
  title: t.meta.titulo,
  description: t.meta.descricao,
  robots: { index: false, follow: false },
};

/**
 * Prévia do catálogo com checkout — layout Vitrine (escolhido em 2026-09-26).
 * Os preços são os de TESTE (curso e pack a R$ 5): a cobrança é real, pequena,
 * para o Rodrigo testar o fluxo inteiro antes de o catálogo substituir a /cursos.
 */
export default function PaginaCatalogoPrevia() {
  return (
    <>
      <Nav />
      <main id="conteudo" className="pt-16">
        <Vitrine
          precoBaseCentavos={PRECO_TESTE_CENTAVOS}
          precoPackCentavos={PRECO_TESTE_PACK_CENTAVOS}
          modo="teste"
          urlCheckout="/preview/catalogo/checkout"
        />
      </main>
      <Footer />
    </>
  );
}
