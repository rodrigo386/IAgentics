import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { AcademyCover } from "@/components/sections/academy/Cover";
import { AcademyProof } from "@/components/sections/academy/Proof";
import { AcademyApproach } from "@/components/sections/academy/Approach";
import { AcademyFormats } from "@/components/sections/academy/Formats";
import { AcademyCourses } from "@/components/sections/academy/Courses";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { academyJsonLd, ogDaPagina } from "@/lib/seo";

const DESCRICAO_ACADEMY = "Escola de experiências com IA para pessoas, times e empresas.";

export const metadata: Metadata = {
  title: "Academy",
  description: DESCRICAO_ACADEMY,
  alternates: { canonical: "/academy" },
  openGraph: ogDaPagina("/academy", "IAgentics Academy", DESCRICAO_ACADEMY),
};

/**
 * Academy, com o conteúdo do site atual de vocês e o desenho deste.
 *
 * A ordem responde às perguntas de quem compra treinamento, nesta sequência:
 * o que é e para quantos já funcionou (capa com os números), quem contratou e o
 * que dizem (prova), por que vocês e de que jeito (abordagem), o que exatamente
 * eu compro (cursos), e como falo com vocês (contato).
 *
 * A prova vem ANTES do argumento de propósito. Quem decide treinamento corporativo
 * gasta a primeira dúvida em "isso já funcionou em algum lugar?", não em filosofia
 * de ensino - o mesmo raciocínio que subiu a garantia de dados no /nexo.
 */
export default function Page() {
  return (
    <>
      <JsonLd dados={academyJsonLd()} />
      <Nav />
      <main id="conteudo" className="pt-16">
        <AcademyCover />
        <AcademyProof />
        <AcademyApproach />
        <AcademyFormats />
        <AcademyCourses />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
