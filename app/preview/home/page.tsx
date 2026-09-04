import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { HeroPreview } from "@/components/sections/HeroPreview";
import { Problema } from "@/components/sections/Problema";
import { Solutions } from "@/components/sections/Solutions";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/Footer";
import { homePreview, solutions } from "@/lib/content";

/**
 * PRÉVIA da home alinhada ao pitch Hacktown (Fase 2 do plano), em rota
 * paralela pelo mesmo motivo da /preview/nexo: o Rodrigo aprova antes da
 * troca. Mesmas três travas (noindex aqui, /preview/ no robots.txt, fora do
 * sitemap e sem link no site) e sem canonical.
 *
 * O que muda em relação à home oficial (app/page.tsx):
 *   Hero ........ grafo do orquestrador (nove módulos) e subtexto sem
 *                 "suprimentos"; manchete, CTAs e parceiros iguais
 *   Problema .... seção NOVA, slides 3 e 4 do pitch
 *   Solutions ... só o cartão do Nexo: promessa e chips dos nove módulos
 *   Contact ..... igual
 * Sem o JSON-LD da organização: ele já é emitido pela home oficial, e uma
 * segunda URL declarando a mesma Organization só confundiria o índice.
 */
export const metadata: Metadata = {
  title: homePreview.meta.titulo,
  description: homePreview.meta.descricao,
  robots: { index: false, follow: false },
};

const itens = solutions.items.map((item) =>
  item.id === "nexo" ? { ...item, promise: homePreview.nexoCard.promise, scope: homePreview.nexoCard.scope } : item,
);

export default function Page() {
  return (
    <>
      <Nav />
      <main id="conteudo">
        <HeroPreview />
        <Problema />
        <Solutions items={itens} />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
