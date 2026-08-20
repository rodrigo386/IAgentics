import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { artigos as t } from "@/lib/content";
import { ogDaPagina } from "@/lib/seo";
import { todosOsArtigos, dataPorExtenso } from "@/lib/artigos";

export const metadata: Metadata = {
  title: t.meta.titulo,
  description: t.meta.descricao,
  alternates: { canonical: "/artigos" },
  openGraph: ogDaPagina("/artigos", `${t.meta.titulo} · IAgentics`, t.meta.descricao),
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
 */
export default function Page() {
  const lista = todosOsArtigos();

  return (
    <>
      <Nav />
      <main id="conteudo" className="pt-16">
        <div className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 sm:py-32">
          <header className="max-w-[46ch]">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.hero.eyebrow}</p>
            <h1 className="mt-6 text-4xl font-medium tracking-[-0.03em] text-fg sm:text-5xl lg:text-6xl">
              {t.hero.titulo}
            </h1>
            <p className="mt-8 text-lg leading-relaxed text-fg-muted">{t.hero.lead}</p>
          </header>

          {lista.length === 0 ? (
            <p className="mt-20 border-t border-line-strong pt-10 text-lg text-fg-muted">{t.vazio}</p>
          ) : (
            <ul className="mt-20 flex flex-col">
              {lista.map((artigo) => (
                <li key={artigo.slug} className="border-t border-line-strong">
                  {/* O link envolve a linha inteira: alvo grande é o que faz
                      uma listagem funcionar no toque. `prefetch={false}` pela
                      razão de sempre (armadilha 8) — são N links numa página
                      só, e prefetch aqui dispararia uma rajada por rolagem. */}
                  <Link
                    href={`/artigos/${artigo.slug}`}
                    prefetch={false}
                    className="group grid grid-cols-1 gap-4 py-10 transition-colors duration-200 lg:grid-cols-12 lg:gap-8 lg:py-12"
                  >
                    <div className="lg:col-span-4">
                      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-text">
                        {artigo.categoria}
                      </p>
                      <p className="mt-3 font-mono text-sm text-fg-subtle">
                        {dataPorExtenso(artigo.data)} · {artigo.leitura} {t.rotulos.leitura}
                      </p>
                    </div>

                    <div className="lg:col-span-7 lg:col-start-6">
                      <h2 className="max-w-[30ch] text-2xl font-medium tracking-[-0.02em] text-fg transition-colors duration-200 group-hover:text-accent-text sm:text-3xl">
                        {artigo.titulo}
                      </h2>
                      <p className="mt-4 max-w-[62ch] text-lg leading-relaxed text-fg-muted">{artigo.descricao}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
