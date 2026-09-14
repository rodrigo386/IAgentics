import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { AcademyCover } from "@/components/sections/academy/Cover";
import { AcademyProof, AcademyClients } from "@/components/sections/academy/Proof";
import { AcademyApproach } from "@/components/sections/academy/Approach";
import { AcademyFormats } from "@/components/sections/academy/Formats";
import { AcademyCourses } from "@/components/sections/academy/Courses";
import { AcademyConvite } from "@/components/sections/academy/Convite";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/Footer";
import { academy } from "@/lib/content";
import { SecaoFaq } from "@/components/sections/Faq";
import { JsonLd } from "@/components/seo/JsonLd";
import { academyJsonLd, ogDaPagina, faqJsonLd } from "@/lib/seo";

/* Reescrita em 2026-09-14: a anterior tinha 61 caracteres e o Bing marcou
   como curta. O tamanho importa porque é o texto que o buscador exibe abaixo
   do título — curta demais, ele inventa um trecho da página no lugar. */
const DESCRICAO_ACADEMY =
  "A escola de IA aplicada da IAgentics: trilhas in company, workshops e mentoria executiva para times e lideranças, com projeto aplicado ao fim de cada formação.";

export const metadata: Metadata = {
  title: "Academy: capacitação em IA para times e lideranças",
  description: DESCRICAO_ACADEMY,
  alternates: { canonical: "/academy" },
  openGraph: ogDaPagina("/academy", "IAgentics Academy", DESCRICAO_ACADEMY),
};

/**
 * Academy, com o conteúdo do site atual de vocês e o desenho deste.
 *
 * A ordem responde às perguntas de quem compra treinamento, nesta sequência:
 * o que é (capa, que termina na faixa da plataforma online), quem é a escola
 * pela própria voz (o convite em vídeo), quem chancela (apoiadores), quem
 * contratou e o que dizem (clientes e depoimentos, com o vídeo da Gabriela),
 * por que vocês e de que jeito (abordagem), o que exatamente eu compro (cursos),
 * e como falo com vocês (contato).
 *
 * A prova vem ANTES do argumento de propósito. Quem decide treinamento corporativo
 * gasta a primeira dúvida em "isso já funcionou em algum lugar?", não em filosofia
 * de ensino - o mesmo raciocínio que subiu a garantia de dados no /nexo.
 */
export default function Page() {
  return (
    <>
      <JsonLd dados={academyJsonLd()} />
      <JsonLd dados={faqJsonLd(academy.faq.itens)} />
      <Nav />
      <main id="conteudo" className="pt-16">
        <AcademyCover />
        {/* O convite em vídeo vem LOGO ABAIXO DA CAPA, a pedido do Rodrigo
            (2026-09-09): a faixa da plataforma online é o último bloco do hero,
            e ele pediu o vídeo imediatamente depois dela. Fica FORA da capa e
            não dentro: o hero é medido para caber em 100dvh (ver Cover.tsx), e
            um vídeo lá dentro empurraria o manifesto para fora da dobra.

            Ele ficava colado ao contato porque termina com "contate a gente";
            esse encaixe foi trocado pela primeira dobra. */}
        <AcademyConvite />
        <AcademyProof />
        <AcademyClients />
        <AcademyApproach />
        <AcademyFormats />
        <AcademyCourses />
        {/* O FAQ antes do contato: as objeções de quem compra treinamento
            corporativo, respondidas em texto que um assistente de IA cita. */}
        <SecaoFaq eyebrow={academy.faq.eyebrow} titulo={academy.faq.titulo} itens={academy.faq.itens} />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
