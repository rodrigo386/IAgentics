import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { bolsas } from "@/lib/content";
import { ogDaPagina } from "@/lib/seo";

const t = bolsas.regulamentoPagina;

export const metadata: Metadata = {
  title: { absolute: t.meta.titulo },
  description: t.meta.descricao,
  alternates: { canonical: "/bolsas/regulamento" },
  openGraph: ogDaPagina("/bolsas/regulamento", t.meta.titulo, t.meta.descricao),
};

/** Regulamento do Desafio das 50 Bolsas (2026-11-03). Texto em content.ts. */
export default function PaginaRegulamento() {
  return (
    <>
      <Nav />
      <main id="conteudo" className="pt-16">
        <article className="mx-auto max-w-[760px] px-5 py-20 sm:px-8 sm:py-24">
          <Link href="/bolsas" className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted hover:text-fg">
            {t.voltar}
          </Link>
          <h1 className="mt-6 text-4xl font-medium tracking-[-0.03em] text-fg sm:text-5xl">{t.titulo}</h1>
          <p className="mt-4 text-sm text-fg-muted">{t.versao}</p>
          <div className="mt-12 flex flex-col gap-10">
            {bolsas.regulamento.map((s) => (
              <section key={s.titulo}>
                <h2 className="text-xl font-medium tracking-[-0.02em] text-fg">{s.titulo}</h2>
                {s.paragrafos.map((p) => (
                  <p key={p} className="mt-3 leading-relaxed text-fg-muted">
                    {p}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
