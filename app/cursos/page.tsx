import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { CursosEstante } from "@/components/sections/cursos/Estante";
import { cursos as t } from "@/lib/content";
import { ogDaPagina } from "@/lib/seo";

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
 * build do Railway não alcança o Postgres. Some também o JSON-LD de catálogo —
 * anunciar cursos que não estão à venda é exatamente o tipo de dado
 * estruturado que não bate com a página.
 */
export default function PaginaCursos() {
  return (
    <>
      <Nav />
      <main id="conteudo" className="pt-16">
        <CursosEstante />
      </main>
      <Footer />
    </>
  );
}
