import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { CursosEstante } from "@/components/sections/cursos/Estante";
import { CursosFormacoes } from "@/components/sections/cursos/Formacoes";
import { JsonLd } from "@/components/seo/JsonLd";
import { cursos as t } from "@/lib/content";
import { cursosJsonLd, ogDaPagina } from "@/lib/seo";

export const metadata: Metadata = {
  title: t.meta.titulo,
  description: t.meta.descricao,
  alternates: { canonical: "/cursos" },
  openGraph: ogDaPagina("/cursos", `${t.meta.titulo} · IAgentics`, t.meta.descricao),
};

/**
 * /cursos — aviso de "em breve" da parceria IAgentics + Pecege (2026-08-28).
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
export default function PaginaCursos() {
  return (
    <>
      <JsonLd
        dados={cursosJsonLd(
          "/cursos",
          t.formacoes.itens
            .filter((f) => f.descricao)
            .map((f) => ({ nome: f.nome, descricao: f.descricao!, horas: f.cargaHoraria, formato: f.formato })),
        )}
      />
      <Nav />
      <main id="conteudo" className="pt-16">
        <CursosEstante />
        <CursosFormacoes />
      </main>
      <Footer />
    </>
  );
}
