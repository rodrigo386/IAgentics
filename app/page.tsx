import { Nav } from "@/components/Nav";
import { Hero } from "@/components/sections/Hero";
import { Solutions } from "@/components/sections/Solutions";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/Footer";

/**
 * Landing page, kept deliberately short: the value prop, the three solutions, and the
 * way to start a conversation. Each solution is detailed on its own route
 * (/nexo, /academy, /spend-lab) rather than inline, so this page stays scannable.
 *
 * Three content sections, three distinct layout families:
 *   Hero ........ agent graph + partner band
 *   Solutions ... editorial index, image on hover
 *   Contact ..... form split
 */
/* cache-bust 2026-08-12: o build cache do Railway reaproveitava o módulo
   compilado da home do deploy original (que redirecionava para /app/entrar).
   Conteúdo novo neste arquivo força a recompilação da rota raiz. */
export default function Home() {
  return (
    <>
      <Nav />
      <main id="conteudo">
        <Hero />
        <Solutions />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
