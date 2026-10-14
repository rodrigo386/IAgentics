import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { CursosEstante } from "@/components/sections/cursos/Estante";
import { CursosFormacoes } from "@/components/sections/cursos/Formacoes";
import { CursosVitrine } from "@/components/sections/cursos/Vitrine";
import { CursosAssinar, CursosComoFunciona } from "@/components/sections/cursos/Assinatura";
import { BarraAssinar } from "@/components/sections/cursos/BarraAssinar";
import { SecaoFaq } from "@/components/sections/Faq";
import { JsonLd } from "@/components/seo/JsonLd";
import { cursos as t } from "@/lib/content";
import { cursosJsonLd, faqJsonLd, ogDaPagina } from "@/lib/seo";
import { VALOR_ASSINATURA_CENTAVOS } from "@/lib/assinatura/regras";

export const metadata: Metadata = {
  /* O título já traz a marca: `absolute`, sem o sufixo do template. */
  title: { absolute: t.meta.titulo },
  description: t.meta.descricao,
  alternates: { canonical: "/cursos" },
  openGraph: ogDaPagina("/cursos", t.meta.titulo, t.meta.descricao),
};

/**
 * /cursos — desde 2026-10-14 vende a ASSINATURA da plataforma Solution
 * (R$ 49,90 por mês; checkout em /cursos/assinar, retorno em
 * /cursos/assinatura/[id]). Foi o aviso de "em breve" da parceria IAgentics +
 * Pecege de 2026-08-28 até então.
 *
 * A URL sobreviveu ao desligamento da plataforma própria de propósito: tinha
 * acabado de ser indexada, e um 404 jogaria fora a autoridade recém-ganha.
 *
 * Estática agora, e isso é consequência, não estilo: a página não consulta
 * mais banco nem sessão, então cai o `force-dynamic` que existia só porque o
 * build do Railway não alcança o Postgres.
 *
 * Desde 2026-10-09 (Prompt 4 de SEO) a página lista as formações com o que se
 * sabe de cada uma (CursosFormacoes), e o JSON-LD de Course volta, derivado
 * da MESMA lista e só para formação com descrição: decisão do Rodrigo, sabendo
 * que foi removido em 2026-08-28 por anunciar curso fora da página. Agora o
 * curso anunciado é o curso mostrado.
 */
const formacoesDescritas = t.formacoes.itens.flatMap((f) =>
  f.descricao ? [{ nome: f.nome, descricao: f.descricao, horas: f.cargaHoraria, formato: f.formato }] : [],
);

export default function PaginaCursos() {
  return (
    <>
      {/* Course só para formação com descrição NA PÁGINA. Desde 2026-10-14 nenhuma
          tem (o Rodrigo tirou a do Fundamentos), e lista vazia não se anuncia. */}
      {formacoesDescritas.length > 0 ? (
        <JsonLd
          dados={cursosJsonLd("/cursos", formacoesDescritas, {
            preco: (VALOR_ASSINATURA_CENTAVOS / 100).toFixed(2),
            categoria: "Subscription",
          })}
        />
      ) : null}
      <JsonLd dados={faqJsonLd(t.assinatura.faq.itens)} />
      <Nav />
      <main id="conteudo" className="pt-16">
        <CursosEstante />
        {/* As formações da IAgentics vêm antes dos cursos do Pecege (pedido do
            Rodrigo, 2026-10-14). */}
        <CursosFormacoes />
        <CursosVitrine />
        {/* "Como funciona" logo antes do formulário, depois do que se compra
            (pedido do Rodrigo, 2026-10-14). */}
        <CursosComoFunciona />
        <CursosAssinar />
        <SecaoFaq eyebrow={t.assinatura.faq.eyebrow} titulo={t.assinatura.faq.titulo} itens={t.assinatura.faq.itens} />
      </main>
      <BarraAssinar />
      <Footer />
    </>
  );
}
