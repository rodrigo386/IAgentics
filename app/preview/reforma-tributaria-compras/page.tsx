import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Calculadora } from "@/components/sections/reforma/Calculadora";
import { reforma } from "@/lib/content";
import { ANOS, aliquotasDoAno, pct } from "@/lib/reforma";

/**
 * PRÉVIA da calculadora da Reforma Tributária para Compras (2026-11-18,
 * proposta A aprovada pelo Rodrigo). Mesmas travas das outras prévias:
 * noindex, /preview/ no Disallow, fora do sitemap, sem link no site e sem
 * canonical. Aprovada (e revisada por um contador), vira
 * /reforma-tributaria-compras: trocar ROTA_REFORMA, pôr canonical, og,
 * FAQPage, sitemap, ARQUIVOS_DA_ROTA, contador de visitas, llms.txt e a
 * política de privacidade (item da calculadora) juntos.
 */
export const metadata: Metadata = {
  title: { absolute: reforma.meta.titulo },
  description: reforma.meta.descricao,
  robots: { index: false, follow: false },
};

export default function Page() {
  const { capa, guia, tabela, checklist, faq, fontes, nexo } = reforma;
  return (
    <>
      <Nav />
      <main id="conteudo" className="pt-16">
        <section className="border-b border-line py-20 sm:py-24">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
            <p className="hero-fade font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted" style={{ animationDelay: "40ms" }}>
              {capa.kicker}
            </p>
            <h1 className="mt-6 max-w-[22ch] text-[min(9vw,3rem)] font-medium leading-[1.08] tracking-[-0.04em] text-fg sm:text-[min(7vw,4rem)] lg:text-[4.5rem]">
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
                    href="#calculadora"
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

        <section id="calculadora" className="scroll-mt-16 border-b border-line py-16 sm:py-24">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
            <Calculadora />
          </div>
        </section>

        <section className="border-b border-line py-16 sm:py-24">
          <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-14 px-5 sm:px-8 lg:grid-cols-12 lg:gap-8">
            <div className="flex flex-col gap-12 lg:col-span-7">
              {guia.map((g) => (
                <article key={g.id} id={g.id} className="flex scroll-mt-24 flex-col gap-4">
                  <h2 className="text-2xl font-medium tracking-[-0.03em] text-fg sm:text-3xl">{g.titulo}</h2>
                  {g.paragrafos.map((p, i) => (
                    <p key={i} className="max-w-[65ch] leading-relaxed text-fg-muted">
                      {p}
                    </p>
                  ))}
                  {g.id === "calendario" ? (
                    <div className="flex flex-col gap-3">
                      <table className="w-full max-w-[560px] border-collapse text-left">
                        <caption className="mb-3 text-left font-medium text-fg">{tabela.titulo}</caption>
                        <thead>
                          <tr className="border-b-2 border-fg">
                            {Object.values(tabela.colunas).map((c) => (
                              <th key={c} scope="col" className="py-2 pr-4 font-mono text-[11px] uppercase tracking-[0.14em] text-fg-muted">
                                {c}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {ANOS.map((a) => {
                            const { cbs, ibs } = aliquotasDoAno(a);
                            return (
                              <tr key={a} className="border-b border-line">
                                <th scope="row" className="py-2 pr-4 font-mono font-medium text-fg">
                                  {a}
                                </th>
                                <td className="py-2 pr-4 font-mono tabular-nums text-fg">{pct(cbs)}</td>
                                <td className="py-2 pr-4 font-mono tabular-nums text-fg">{pct(ibs)}</td>
                                <td className="py-2 pr-4 font-mono tabular-nums text-fg">{pct(Math.round((cbs + ibs) * 100) / 100)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <p className="max-w-[60ch] text-sm text-fg-muted">{tabela.nota}</p>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
            <aside className="lg:col-span-4 lg:col-start-9">
              <div className="flex flex-col gap-5 border border-line bg-surface p-6 sm:p-8 lg:sticky lg:top-24">
                <h2 className="text-xl font-medium tracking-[-0.02em] text-fg">{checklist.titulo}</h2>
                <ol className="flex flex-col gap-3">
                  {checklist.itens.map((item, i) => (
                    <li key={i} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-2 text-sm leading-relaxed text-fg">
                      <b className="font-mono font-medium text-accent-text">{i + 1}</b>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </aside>
          </div>
        </section>

        <section className="border-b border-line py-16 sm:py-24">
          <div className="mx-auto max-w-[860px] px-5 sm:px-8">
            <h2 className="text-3xl font-medium tracking-[-0.03em] text-fg sm:text-4xl">{reforma.faqTitulo}</h2>
            <div className="mt-8 flex flex-col">
              {faq.map((f) => (
                <details key={f.pergunta} className="group border-b border-line py-5">
                  <summary className="cursor-pointer list-none text-lg font-medium text-fg">{f.pergunta}</summary>
                  <p className="mt-3 leading-relaxed text-fg-muted">{f.resposta}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-8">
            <div className="flex flex-col gap-4 lg:col-span-6">
              <h2 className="text-2xl font-medium tracking-[-0.03em] text-fg">{fontes.titulo}</h2>
              <ul className="flex flex-col gap-2">
                {fontes.itens.map((f) => (
                  <li key={f.url}>
                    <a href={f.url} className="text-fg underline underline-offset-4 hover:text-accent-text" target="_blank" rel="noopener noreferrer">
                      {f.rotulo}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="max-w-[60ch] text-sm text-fg-muted">{fontes.conferencia}</p>
              <p className="max-w-[60ch] text-sm text-fg-muted">{fontes.aviso}</p>
            </div>
            <div className="flex flex-col gap-4 border border-line bg-surface p-6 sm:p-8 lg:col-span-5 lg:col-start-8">
              <h2 className="text-2xl font-medium tracking-[-0.03em] text-fg">{nexo.titulo}</h2>
              <p className="leading-relaxed text-fg-muted">{nexo.texto}</p>
              <div>
                <Link
                  href="/nexo"
                  className="group inline-flex items-center gap-2 rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-[background-color,transform] duration-200 hover:bg-accent-hover active:scale-[0.98]"
                >
                  <span className="whitespace-nowrap">{nexo.cta}</span>
                  <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
