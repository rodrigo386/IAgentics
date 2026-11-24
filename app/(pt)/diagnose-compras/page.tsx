import type { Metadata } from "next";
import { ArrowDown } from "@phosphor-icons/react/dist/ssr";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Diagnose } from "@/components/sections/diagnose/Diagnose";
import { diagnose } from "@/lib/content";
import { ogDaPagina } from "@/lib/seo";

export const metadata: Metadata = {
  title: diagnose.meta.titulo,
  description: diagnose.meta.descricao,
  alternates: { canonical: "/diagnose-compras" },
  openGraph: ogDaPagina("/diagnose-compras", `${diagnose.meta.titulo} · IAgentics`, diagnose.meta.descricao),
};

/**
 * Diagnose de Compras (2026-10-31, pedido do Rodrigo): o questionário de
 * maturidade da Academy, em página própria do site.
 *
 * A capa é servidor e diz o que é e quanto leva; a ferramenta é um client
 * component só, porque cada etapa depende das respostas da anterior. Sem
 * vídeo na capa: quem chega aqui veio para responder, e o botão leva direto à
 * primeira etapa. As respostas vão por e-mail para a equipe (/api/diagnose).
 */
export default function Page() {
  const { capa } = diagnose;
  return (
    <>
      <Nav />
      <main id="conteudo" className="pt-16">
        <section className="border-b border-line py-20 sm:py-24">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
            <p className="hero-fade font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted" style={{ animationDelay: "40ms" }}>
              {capa.kicker}
            </p>
            <h1 className="mt-6 max-w-[20ch] text-[min(10vw,3.25rem)] font-medium leading-[1.06] tracking-[-0.04em] text-fg sm:text-[min(8vw,4.5rem)] lg:text-[5rem]">
              <span className="block overflow-hidden pb-[0.14em]">
                <span className="hero-line block" style={{ animationDelay: "120ms" }}>
                  {capa.titulo}
                </span>
              </span>
            </h1>
            <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">
              <p className="hero-fade text-lg leading-relaxed text-fg-muted sm:text-xl lg:col-span-6" style={{ animationDelay: "260ms" }}>
                {capa.lead}
              </p>
              <div className="hero-fade flex flex-col gap-8 lg:col-span-5 lg:col-start-8" style={{ animationDelay: "340ms" }}>
                <dl className="grid grid-cols-3 gap-4">
                  {capa.fatos.map((f) => (
                    <div key={f.rotulo} className="flex flex-col-reverse gap-1 border-t-2 border-accent pt-3">
                      <dt className="text-sm text-fg-muted">{f.rotulo}</dt>
                      <dd className="font-mono text-2xl font-medium tabular-nums text-fg sm:text-3xl">{f.valor}</dd>
                    </div>
                  ))}
                </dl>
                <div>
                  <a
                    href="#diagnose"
                    className="group inline-flex items-center gap-2 rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-[background-color,transform] duration-200 hover:bg-accent-hover active:scale-[0.98]"
                  >
                    <span className="whitespace-nowrap">{capa.cta}</span>
                    <ArrowDown size={17} className="transition-transform duration-300 group-hover:translate-y-0.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="diagnose" className="scroll-mt-16 py-16 sm:py-24">
          <div className="mx-auto max-w-[860px] px-5 sm:px-8">
            <Diagnose />
            <p className="mt-12 text-center text-sm text-fg-muted">{diagnose.rodape}</p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
