import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { NexoCoverOrquestrador } from "@/components/sections/nexo/CoverOrquestrador";
import { NexoCamadas } from "@/components/sections/nexo/Camadas";
import { NexoAssurance } from "@/components/sections/nexo/Assurance";
import { NexoFluxoCompras } from "@/components/sections/nexo/FluxoCompras";
import { NexoNaPratica } from "@/components/sections/nexo/NaPratica";
import { NexoDifferentiators } from "@/components/sections/nexo/Differentiators";
import { NexoComparativo } from "@/components/sections/nexo/Comparativo";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/Footer";
import { SecaoFaq } from "@/components/sections/Faq";
import { nexoPage } from "@/lib/content";

/**
 * PRÉVIA da /nexo alinhada ao pitch Hacktown (Fase 1 do plano).
 *
 * Existe em rota paralela por pedido do Rodrigo (2026-09-02): "não substitua
 * a atual, crie uma paralela para eu visualizar antes". Três travas para ela
 * não vazar enquanto é prévia:
 *   - `robots: noindex` aqui;
 *   - `/preview/` no Disallow do robots.txt;
 *   - fora de ROTAS_SITEMAP e de qualquer link do site.
 * Sem canonical de propósito: apontá-lo para /nexo diria ao Google que esta
 * URL é a mesma página, e ela ainda não é.
 *
 * Quando aprovada, o conteúdo desta página vira o de app/nexo/page.tsx e esta
 * rota some. Ordem das seções em relação à atual: a capa passa a SER o mapa
 * do orquestrador (pedido do Rodrigo em 2026-09-02 — mesmo layout e animação
 * da home, texto sobre o orquestrador e não só sobre Compras); Camadas entra
 * logo depois (o que É o Nexo, antes de como ele protege e como ele opera);
 * Na prática entra depois do fluxo de Compras, porque os quatro módulos são a
 * continuação do "o que ele faz".
 */
export const metadata: Metadata = {
  title: "Prévia · Nexo",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <>
      <Nav />
      <main id="conteudo" className="pt-16">
        <NexoCoverOrquestrador />
        <NexoCamadas />
        <NexoAssurance />
        <div id="fluxo-compras">
          <NexoFluxoCompras />
        </div>
        <NexoNaPratica />
        <NexoDifferentiators />
        {/* Comparativo depois dos diferenciais: primeiro o que o Nexo é, depois
            contra o que ele se mede. Só aqui, não na home (decisão 2026-09-04). */}
        <NexoComparativo />
        <SecaoFaq eyebrow={nexoPage.faq.eyebrow} titulo={nexoPage.faq.titulo} itens={nexoPage.faq.itens} />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
