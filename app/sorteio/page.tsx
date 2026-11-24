import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Redes } from "@/components/sections/sorteio/Redes";
import { SorteioForm } from "@/components/sections/sorteio/SorteioForm";
import { sorteio as t } from "@/lib/content";
import { agoraSorteio, cadastroAberto } from "@/lib/sorteio/regras";

/* Página de evento, aberta pelo QR code do estande: fora do Google e do
   sitemap. Dinâmica porque o formulário some sozinho às 18h de 26/11. */
export const metadata: Metadata = {
  title: { absolute: t.meta.titulo },
  description: t.meta.descricao,
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/**
 * No celular a ordem é título, prêmio, formulário, passos e redes: quem leu o
 * QR code chega ao formulário sem passar pelos passos. No desktop o
 * formulário fica preso à direita.
 *
 * Sorteio no Case 2026 (/sorteio, 2026-11-23). Desenhada para o celular de
 * quem leu o QR code: título, prêmio e formulário na primeira rolagem; depois
 * do cadastro, o número da sorte, o botão para a /cursos e as redes. LinkedIn
 * e Instagram ficam visíveis também no pé da página (pedido do Rodrigo).
 */
export default function PaginaSorteio() {
  const aberto = cadastroAberto(agoraSorteio());
  return (
    <>
      <Nav />
      <main id="conteudo" className="pt-16">
        <section className="mx-auto grid max-w-[1100px] gap-10 px-5 py-10 sm:px-8 sm:py-16 lg:grid-cols-[1fr_1fr] lg:gap-x-16">
          <div className="flex flex-col gap-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.eyebrow}</p>
            <h1 className="max-w-[16ch] text-4xl font-medium tracking-[-0.03em] text-fg sm:text-5xl">{t.titulo}</h1>
            <p className="max-w-[46ch] leading-relaxed text-fg-muted">{t.lead}</p>
            <figure className="flex flex-col gap-2">
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface lg:aspect-[4/5]">
                <Image
                  src="/sorteio/porta-lata-moletom-v1.jpg"
                  alt={t.premio.alt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 520px, 100vw"
                  className="object-cover object-[50%_55%]"
                />
              </div>
              <figcaption className="text-xs text-fg-muted">{t.premio.legenda}</figcaption>
            </figure>
          </div>
          <div id="cadastro" className="flex flex-col gap-6 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
            <div className="border border-line bg-surface p-6 sm:p-8">
              {aberto ? (
                <SorteioForm />
              ) : (
                <div className="flex flex-col gap-3">
                  <h2 className="text-2xl font-medium tracking-[-0.02em] text-fg">{t.encerrado.titulo}</h2>
                  <p className="leading-relaxed text-fg-muted">{t.encerrado.texto}</p>
                  <Link href={t.ok.plataformaHref} className="mt-2 self-start rounded-control bg-accent px-6 py-3 font-medium text-accent-on">
                    {t.ok.plataformaBotao}
                  </Link>
                </div>
              )}
            </div>
            <Redes />
            <Link href="/sorteio/regulamento" className="text-sm text-fg-muted underline hover:text-fg">
              {t.regulamentoPagina.titulo}
            </Link>
          </div>
          <ol className="grid gap-4 sm:grid-cols-3 lg:col-start-1 lg:row-start-2">
            {t.passos.map((p, i) => (
              <li key={p.titulo} className="flex flex-col gap-1 border-t border-line pt-3">
                <span className="font-mono text-xs text-accent">0{i + 1}</span>
                <span className="font-medium text-fg">{p.titulo}</span>
                <span className="text-sm text-fg-muted">{p.texto}</span>
              </li>
            ))}
          </ol>
        </section>
      </main>
      <Footer />
    </>
  );
}
