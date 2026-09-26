import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SeletorLayout } from "@/components/catalogo/SeletorLayout";
import { Jornada } from "@/components/catalogo/layouts/Jornada";
import { catalogo as t } from "@/lib/content";
import { PRECO_TESTE_CENTAVOS } from "@/lib/catalogo/preco";

/* Opção de layout da prévia (2026-09-26). Mesmas travas de /preview/catalogo:
   noindex, fora do sitemap, sem link no site. Mesmo checkout e mesmo preço de
   teste — a opção muda só a vitrine. */
export const metadata: Metadata = {
  title: `${t.meta.titulo} · Jornada`,
  description: t.meta.descricao,
  robots: { index: false, follow: false },
};

export default function PaginaCatalogoJornada() {
  return (
    <>
      <Nav />
      <main id="conteudo" className="pt-16">
        <SeletorLayout atual="/preview/catalogo/jornada" />
        <Jornada precoBaseCentavos={PRECO_TESTE_CENTAVOS} urlCheckout="/preview/catalogo/checkout" />
      </main>
      <Footer />
    </>
  );
}
