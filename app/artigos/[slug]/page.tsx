import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { artigos as t } from "@/lib/content";
import { ogDoArtigo, artigoJsonLd, trilhaArtigoJsonLd } from "@/lib/seo";
import { todosOsArtigos, artigoPorSlug, dataPorExtenso } from "@/lib/artigos";
import { EXPLICADORES } from "@/components/artigos/explicadores";
import { MARCADOR_EXPLICADOR, IDS_EXPLICADORES, type IdExplicador } from "@/lib/explicadores";

/**
 * Um artigo.
 *
 * Estático no build: `generateStaticParams` lista os slugs publicados e cada
 * página vira HTML no `next build`. Artigo é o conteúdo mais estático que
 * existe no site — não há razão para tocar o banco ou o servidor a cada
 * leitura.
 */
export function generateStaticParams() {
  return todosOsArtigos().map((artigo) => ({ slug: artigo.slug }));
}

/* Slug fora da lista publicada responde 404 em vez de ser renderizado sob
   demanda. Sem isto, um rascunho ficaria acessível por URL adivinhada. */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const artigo = artigoPorSlug(slug);
  if (!artigo) return {};

  return {
    title: artigo.titulo,
    description: artigo.descricao,
    alternates: { canonical: `/artigos/${artigo.slug}` },
    openGraph: ogDoArtigo(
      `/artigos/${artigo.slug}`,
      `${artigo.titulo} · IAgentics`,
      artigo.descricao,
      artigo.data,
      artigo.atualizado,
    ),
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artigo = artigoPorSlug(slug);
  if (!artigo) notFound();

  return (
    <>
      <JsonLd dados={artigoJsonLd(artigo)} />
      <JsonLd dados={trilhaArtigoJsonLd(artigo)} />
      <Nav />
      <main id="conteudo" className="pt-16">
        <article className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 sm:py-32">
          <header className="max-w-[52ch]">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-text">{artigo.categoria}</p>
            <h1 className="mt-6 text-4xl font-medium tracking-[-0.03em] text-fg sm:text-5xl">{artigo.titulo}</h1>
            <p className="mt-8 text-lg leading-relaxed text-fg-muted">{artigo.descricao}</p>
          </header>

          {/* Trilho de metadados à esquerda, corpo à direita — a mesma coluna
              assimétrica da /privacidade e do resto do site (DESIGN.md §7).
              Não é só estética: num contêiner de 1400px, texto corrido de 62ch
              alinhado à esquerda deixa metade da tela vazia, e a tabela larga
              flutua sem nada ao lado.

              O trilho é `sticky` no desktop: em texto de seis minutos, a
              referência de quem escreveu e quando sai de vista no primeiro
              scroll — e é justamente o que dá (ou tira) autoridade do que
              está sendo lido. */}
          <div className="mt-20 grid grid-cols-1 gap-10 border-t border-line-strong pt-16 lg:grid-cols-12 lg:gap-8">
            <aside className="lg:col-span-3">
              <div className="lg:sticky lg:top-28">
                <dl className="flex flex-col gap-5 font-mono text-sm">
                  <div>
                    <dt className="text-[11px] uppercase tracking-[0.16em] text-fg-subtle">{t.rotulos.por}</dt>
                    <dd className="mt-1.5 text-fg">{artigo.autor}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-[0.16em] text-fg-subtle">
                      {t.rotulos.publicadoEm}
                    </dt>
                    <dd className="mt-1.5 text-fg-muted">{dataPorExtenso(artigo.data)}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-[0.16em] text-fg-subtle">{artigo.categoria}</dt>
                    <dd className="mt-1.5 text-fg-muted">
                      {artigo.leitura} {t.rotulos.leitura}
                    </dd>
                  </div>
                </dl>

                <Link
                  href="/artigos"
                  prefetch={false}
                  className="mt-8 inline-block rounded-control border border-line-strong px-5 py-2.5 text-sm text-fg transition-colors duration-200 hover:border-fg"
                >
                  {t.rotulos.voltar}
                </Link>
              </div>
            </aside>

            {/* O HTML vem de `content/artigos/*.md`, arquivo commitado no
                repositório — não de campo digitado por usuário. A estilização
                mora em `.artigo-corpo` (globals.css) porque markdown
                renderizado não passa por className: as tags nascem do parser. */}
            <div className="lg:col-span-8 lg:col-start-5">
              {/* O corpo é partido nos marcadores `<!-- explicador:id -->`:
                  as partes ímpares do split são os ids, as pares são HTML. */}
              {artigo.html.split(new RegExp(MARCADOR_EXPLICADOR.source, "g")).map((parte, i) => {
                if (i % 2 === 0) {
                  return parte.trim() ? <div key={i} className="artigo-corpo mt-6 first:mt-0" dangerouslySetInnerHTML={{ __html: parte }} /> : null;
                }
                const Explicador = (IDS_EXPLICADORES as readonly string[]).includes(parte) ? EXPLICADORES[parte as IdExplicador] : null;
                return Explicador ? (
                  <div key={i} className="my-12">
                    <Explicador />
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
