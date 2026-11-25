import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SecaoFaq } from "@/components/sections/Faq";
import { JsonLd } from "@/components/seo/JsonLd";
import { PaginaTrilha } from "@/components/sections/cursos/PaginaTrilha";
import { BASE_TRILHAS, PERGUNTAS_DA_TRILHA, dadosDaTrilha } from "@/lib/cursos-trilhas";
import { cursos } from "@/lib/content";
import { faqJsonLd, trilhaJsonLd } from "@/lib/seo";

/**
 * PRÉVIA das páginas por trilha (2026-11-25, pedido do Rodrigo, plano de SEO
 * da /cursos). As travas de toda prévia: noindex aqui, /preview/ no Disallow
 * do robots.txt, fora do sitemap, sem link no site e fora do contador de
 * visitas. Sem canonical: a URL definitiva (/cursos/<slug>) ainda não existe.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return cursos.paginasTrilha.itens.map((i) => ({ trilha: i.slug }));
}

const faq = PERGUNTAS_DA_TRILHA.flatMap((p) => cursos.assinatura.faq.itens.filter((i) => i.pergunta === p));

type Props = { params: Promise<{ trilha: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = dadosDaTrilha((await params).trilha);
  if (!d) return {};
  return {
    title: { absolute: d.pagina.metaTitulo },
    description: cursos.paginasTrilha.descricao(d.pagina.tema, d.cursos.length),
    robots: { index: false, follow: false },
  };
}

export default async function PreviaTrilha({ params }: Props) {
  const { trilha } = await params;
  const d = dadosDaTrilha(trilha);
  if (!d) notFound();
  return (
    <>
      <JsonLd
        dados={trilhaJsonLd([
          { nome: cursos.paginasTrilha.migalha, caminho: "/cursos" },
          { nome: d.pagina.linha, caminho: `${BASE_TRILHAS}/${d.pagina.slug}` },
        ])}
      />
      <JsonLd dados={faqJsonLd(faq)} />
      <Nav />
      <main id="conteudo" className="pt-16">
        <PaginaTrilha slug={trilha} />
        <SecaoFaq eyebrow={cursos.assinatura.faq.eyebrow} titulo={cursos.paginasTrilha.faqTitulo} itens={faq} />
      </main>
      <Footer />
    </>
  );
}
