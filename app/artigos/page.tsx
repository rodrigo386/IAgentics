import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { artigos as t } from "@/lib/content";
import { JsonLd } from "@/components/seo/JsonLd";
import { colecaoArtigosJsonLd, ogDaPagina } from "@/lib/seo";
import { todosOsArtigos, dataPorExtenso } from "@/lib/artigos";

export const metadata: Metadata = {
  /* `absolute`: o título já traz a marca ("| IAgentics"), e o template do
     layout somaria " · IAgentics" de novo. */
  title: { absolute: t.meta.titulo },
  description: t.meta.descricao,
  alternates: { canonical: "/artigos" },
  openGraph: ogDaPagina("/artigos", t.meta.titulo, t.meta.descricao),
};

/**
 * A listagem de artigos.
 *
 * Layout editorial de índice, não grade de cards: cada artigo é uma linha
 * separada por fio, com a categoria e a data à esquerda e o texto à direita.
 * Card aqui não comunicaria hierarquia nenhuma (DESIGN.md §7) — todos os
 * artigos têm o mesmo peso, e o que o leitor faz nesta página é varrer
 * títulos.
 *
 * Sem Reveal: mesma razão da /privacidade. Índice é para ser lido de imediato,
 * não para aparecer conforme rola.
 *
 * Desde 2026-10-09 (Prompt 2 de SEO) a página é conteúdo, não só lista: dois
 * parágrafos de introdução, os artigos agrupados nas quatro categorias de
 * `artigos.categorias` (um h2 por categoria, o título do artigo vira h3) e um
 * JSON-LD de CollectionPage com a lista. Categoria sem artigo não aparece.
 */
export default function Page() {
  const lista = todosOsArtigos();
  const grupos = t.categorias
    .map((categoria) => ({ categoria, artigos: lista.filter((a) => a.categoria === categoria) }))
    .filter((g) => g.artigos.length > 0);
  // A ordem do JSON-LD é a ordem da tela: por categoria, e dentro dela por data.
  const naOrdemDaTela = grupos.flatMap((g) => g.artigos);

  return (
    <>
      <JsonLd dados={colecaoArtigosJsonLd(t.meta, naOrdemDaTela)} />
      <Nav />
      <main id="conteudo" className="pt-16">
        <div className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 sm:py-32">
          <header className="max-w-[62ch]">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.hero.eyebrow}</p>
            <h1 className="mt-6 text-4xl font-medium tracking-[-0.03em] text-fg sm:text-5xl lg:text-6xl">
              {t.hero.titulo}
            </h1>
            {t.hero.intro.map((p) => (
              <p key={p} className="mt-6 text-lg leading-relaxed text-fg-muted first-of-type:mt-8">
                {p}
              </p>
            ))}
          </header>

          {lista.length === 0 ? (
            <p className="mt-20 border-t border-line-strong pt-10 text-lg text-fg-muted">{t.vazio}</p>
          ) : (
            <div className="mt-20 flex flex-col gap-20">
              {grupos.map((g) => (
                <section key={g.categoria} aria-labelledby={`cat-${g.categoria}`}>
                  <h2 id={`cat-${g.categoria}`} className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent-text">
                    {g.categoria}
                  </h2>
                  <ul className="mt-6 flex flex-col">
                    {g.artigos.map((artigo) => (
                      <li key={artigo.slug} className="border-t border-line-strong">
                        {/* O link envolve a linha inteira: alvo grande é o que faz
                            uma listagem funcionar no toque. `prefetch={false}` pela
                            razão de sempre (armadilha 8). */}
                        <Link
                          href={`/artigos/${artigo.slug}`}
                          prefetch={false}
                          className="group grid grid-cols-1 gap-4 py-10 transition-colors duration-200 lg:grid-cols-12 lg:gap-8 lg:py-12"
                        >
                          <div className="lg:col-span-4">
                            <p className="font-mono text-sm text-fg-subtle">
                              <time dateTime={artigo.data}>{dataPorExtenso(artigo.data)}</time> · {artigo.leitura} {t.rotulos.leitura}
                            </p>
                          </div>

                          <div className="lg:col-span-7 lg:col-start-6">
                            <h3 className="max-w-[30ch] text-2xl font-medium tracking-[-0.02em] text-fg transition-colors duration-200 group-hover:text-accent-text sm:text-3xl">
                              {artigo.titulo}
                            </h3>
                            <p className="mt-4 max-w-[62ch] text-lg leading-relaxed text-fg-muted">{artigo.descricao}</p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
