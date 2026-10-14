import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { CursosEstante } from "@/components/sections/cursos/Estante";
import { PreviaFilmes } from "@/components/sections/cursos/PreviaFilmes";
import { cursos as t } from "@/lib/content";

/**
 * Prévia dos três filmes da hero da /cursos (2026-10-14, pedido do Rodrigo:
 * "faça os 3, aí eu decido"). A hero de verdade, com o filme no lugar da
 * estante e um seletor entre os conceitos. As três travas de toda prévia:
 * noindex aqui, /preview/ no Disallow do robots.txt, fora do sitemap e sem
 * link no site. Sem canonical: ainda não é a mesma página que a /cursos.
 */
export const metadata: Metadata = {
  title: t.filmesHero.previa.titulo,
  robots: { index: false, follow: false },
};

export default function PreviaCursos() {
  return (
    <>
      <Nav />
      <main id="conteudo" className="pt-16">
        <CursosEstante palco={<PreviaFilmes />} />
      </main>
      <Footer />
    </>
  );
}
