import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { SpendLabCover } from "@/components/sections/spend-lab/Cover";
import { SpendLabPillars } from "@/components/sections/spend-lab/Pillars";
import { SpendLabSyllabus } from "@/components/sections/spend-lab/Syllabus";
import { SpendLabPractice } from "@/components/sections/spend-lab/Practice";
import { SpendLabPartners } from "@/components/sections/spend-lab/Partners";
import { SpendLabMethod } from "@/components/sections/spend-lab/Method";
import { SpendLabComparison } from "@/components/sections/spend-lab/Comparison";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/Footer";
import { ogDaPagina } from "@/lib/seo";

const DESCRICAO_SPEND_LAB =
  "Implemente IA com Mente, Método e Cultura. Diagnóstico de maturidade, consultoria e formação aplicada em 8 semanas.";

export const metadata: Metadata = {
  title: "IA Spend Lab",
  description: DESCRICAO_SPEND_LAB,
  alternates: { canonical: "/spend-lab" },
  openGraph: ogDaPagina("/spend-lab", "IA Spend Lab · IAgentics", DESCRICAO_SPEND_LAB),
};

/**
 * IA Spend Lab, com o conteúdo do site atual de vocês e o desenho deste.
 *
 * A ORDEM AGORA É A DO SITE DE VOCÊS, e antes não era. Eu tinha reagrupado as
 * seções por um raciocínio próprio de venda e o resultado divergia da referência em
 * três pontos: a ementa das 8 semanas vinha depois de todo o método, os parceiros
 * apareciam entre os pilares e os passos, e a seção do vídeo "Veja o IA Spend Lab
 * na prática" simplesmente não existia. Medi a posição vertical de cada marco na
 * página de vocês e a sequência é esta:
 *
 *   capa (vídeo) -> pilares -> 8 semanas -> vídeo na prática -> parceiros ->
 *   como funciona -> comparação -> para quem nasceu -> contato
 *
 * A comparação continua depois do método, e isso agora é acordo com a referência e
 * não escolha minha: ela só convence quem já sabe o que está sendo comparado.
 */
export default function Page() {
  return (
    <>
      <Nav />
      <main id="conteudo" className="pt-16">
        <SpendLabCover />
        <SpendLabPillars />
        <SpendLabSyllabus />
        <SpendLabPractice />
        <SpendLabPartners />
        <SpendLabMethod />
        <SpendLabComparison />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
