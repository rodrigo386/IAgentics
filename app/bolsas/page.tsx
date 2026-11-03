import type { Metadata } from "next";
import { ArrowDown } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SecaoFaq } from "@/components/sections/Faq";
import { InscricaoForm } from "@/components/sections/bolsas/InscricaoForm";
import { JsonLd } from "@/components/seo/JsonLd";
import { bolsas as t } from "@/lib/content";
import { agoraBolsas, faseDasInscricoes } from "@/lib/bolsas/regras";
import { faqJsonLd, ogDaPagina } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: t.meta.titulo },
  description: t.meta.descricao,
  alternates: { canonical: "/bolsas" },
  openGraph: ogDaPagina("/bolsas", t.meta.titulo, t.meta.descricao),
};

/* Dinâmica porque o formulário depende da hora: abre em 05/11 e fecha às
   23h59 de 11/11. Estática, a página ficaria presa na fase do build. */
export const dynamic = "force-dynamic";

/**
 * Desafio das 50 Bolsas (2026-11-03, docs/PLANO-BOLSAS.md): página da campanha
 * da IAgentics Academy, com a inscrição.
 *
 * A ordem segue a pergunta de quem chega pelo link da bio: o que eu ganho, se
 * eu posso, como é escolhido, o que preciso gravar, como é o mês, e só então
 * o formulário. Critérios e pesos ficam na página, por inteiro: o desafio é
 * um processo seletivo por mérito, e mérito com régua escondida não é mérito.
 */
const eyebrow = "font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted";
const h2 = "mt-6 max-w-[22ch] text-4xl font-medium tracking-[-0.03em] text-fg sm:text-5xl";

export default function PaginaBolsas() {
  const fase = faseDasInscricoes(agoraBolsas());
  const { capa } = t;

  return (
    <>
      <JsonLd dados={faqJsonLd(t.faq.itens)} />
      <Nav />
      <main id="conteudo" className="pt-16">
        <section className="border-b border-line py-20 sm:py-24">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
            <p className="hero-fade font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted" style={{ animationDelay: "40ms" }}>
              {capa.kicker}
            </p>
            <h1 className="mt-6 max-w-[22ch] text-[min(10vw,3.25rem)] font-medium leading-[1.06] tracking-[-0.04em] text-fg sm:text-[min(8vw,4.5rem)] lg:text-[4.75rem]">
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
                {fase === "abertas" ? (
                  <div className="flex flex-col gap-3">
                    <a
                      href="#inscricao"
                      className="group inline-flex w-fit items-center gap-2 rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-[background-color,transform] duration-200 hover:bg-accent-hover active:scale-[0.98]"
                    >
                      <span className="whitespace-nowrap">{capa.cta}</span>
                      <ArrowDown size={17} className="transition-transform duration-300 group-hover:translate-y-0.5" />
                    </a>
                    <p className="text-sm text-fg-muted">{capa.gratis}</p>
                  </div>
                ) : (
                  <p className="max-w-[44ch] text-base font-medium text-fg">{t.fases[fase]}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="trocas" className="py-20 sm:py-24">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
            <p className={eyebrow}>{t.trocas.eyebrow}</p>
            <h2 id="trocas" className={h2}>
              {t.trocas.titulo}
            </h2>
            <div className="mt-12 grid gap-10 md:grid-cols-2 md:gap-8">
              {[t.trocas.ganha, t.trocas.entrega].map((bloco) => (
                <div key={bloco.titulo} className="border-t-2 border-line pt-5">
                  <h3 className="text-xl font-medium tracking-[-0.02em] text-fg">{bloco.titulo}</h3>
                  <ul className="mt-4 flex flex-col gap-3">
                    {bloco.itens.map((item) => (
                      <li key={item} className="flex gap-3 leading-relaxed text-fg-muted">
                        <span aria-hidden="true" className="mt-[0.6em] size-1.5 shrink-0 bg-accent" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-10 max-w-[70ch] leading-relaxed text-fg-muted">{t.trocas.naoSelecionado}</p>
            <div className="mt-12 border-l-2 border-accent pl-5">
              <h3 className="text-lg font-medium text-fg">{t.quem.titulo}</h3>
              <p className="mt-2 max-w-[70ch] leading-relaxed text-fg-muted">{t.quem.texto}</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="etapas" className="border-t border-line bg-surface py-20 sm:py-24">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
            <p className={eyebrow}>{t.etapas.eyebrow}</p>
            <h2 id="etapas" className={h2}>
              {t.etapas.titulo}
            </h2>
            <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {t.etapas.itens.map((e, i) => (
                <li key={e.nome} className="border-t-2 border-line pt-5">
                  <p className="tnum text-4xl font-medium leading-none tracking-[-0.04em] text-fg-subtle">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="mt-4 text-xl font-medium tracking-[-0.02em] text-fg">{e.nome}</h3>
                  <p className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-accent-text">{e.quando}</p>
                  <p className="mt-3 max-w-[34ch] text-fg-muted">{e.texto}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="criterios" className="border-t border-line py-20 sm:py-24">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
            <p className={eyebrow}>{t.criterios.eyebrow}</p>
            <h2 id="criterios" className={h2}>
              {t.criterios.titulo}
            </h2>
            <div className="mt-12 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line-strong font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">
                    <th scope="col" className="py-3 pr-4 font-normal">{t.criterios.colunas.criterio}</th>
                    <th scope="col" className="py-3 pr-4 text-right font-normal">{t.criterios.colunas.peso}</th>
                    <th scope="col" className="py-3 font-normal">{t.criterios.colunas.alta}</th>
                  </tr>
                </thead>
                <tbody>
                  {t.criterios.itens.map((c) => (
                    <tr key={c.nome} className="border-b border-line align-top">
                      <th scope="row" className="py-4 pr-4 font-medium text-fg">{c.nome}</th>
                      <td className="py-4 pr-4 text-right font-mono tabular-nums text-fg">{c.peso}</td>
                      <td className="py-4 text-fg-muted">{c.alta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-10 grid gap-6 lg:grid-cols-2 lg:gap-8">
              <p className="max-w-[60ch] leading-relaxed text-fg">{t.criterios.seguidores}</p>
              <p className="max-w-[60ch] leading-relaxed text-fg-muted">{t.criterios.cotas}</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="roteiro" className="border-t border-line bg-surface py-20 sm:py-24">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
            <p className={eyebrow}>{t.roteiro.eyebrow}</p>
            <h2 id="roteiro" className={h2}>
              {t.roteiro.titulo}
            </h2>
            <ol className="mt-12 grid gap-px border border-line bg-line sm:grid-cols-4">
              {t.roteiro.partes.map((p) => (
                <li key={p.nome} className="flex flex-col gap-2 bg-surface p-5">
                  <p className="font-mono text-sm tabular-nums text-accent-text">{p.tempo}</p>
                  <h3 className="text-lg font-medium text-fg">{p.nome}</h3>
                  <p className="text-fg-muted">{p.texto}</p>
                </li>
              ))}
            </ol>
            <p className="mt-8 max-w-[70ch] leading-relaxed text-fg-muted">{t.roteiro.envio}</p>
            <p className="mt-3 max-w-[70ch] font-medium leading-relaxed text-fg">{t.roteiro.cuidado}</p>
          </div>
        </section>

        <section aria-labelledby="mes" className="border-t border-line py-20 sm:py-24">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
            <p className={eyebrow}>{t.mes.eyebrow}</p>
            <h2 id="mes" className={h2}>
              {t.mes.titulo}
            </h2>
            <p className="mt-4 text-fg-muted">{t.mes.periodo}</p>
            {/* Lista, não tabela: no celular as quatro colunas pediam rolagem
                lateral; aqui cada semana empilha e, a partir do sm, vira linha. */}
            <ol className="mt-10 border-t border-line-strong">
              {t.mes.semanas.map((s, i) => (
                <li key={s.prazo} className="grid grid-cols-[2.5rem_1fr] gap-x-4 gap-y-1 border-b border-line py-4 sm:grid-cols-[3rem_1fr_1fr_4rem]">
                  <p className="font-mono tabular-nums text-fg">
                    <span className="sr-only">{t.mes.colunas.semana} </span>
                    {i + 1}
                  </p>
                  <p className="text-fg">{s.missao}</p>
                  <p className="col-start-2 text-fg-muted sm:col-start-auto">
                    <span className="sr-only">{t.mes.colunas.post}: </span>
                    {s.post}
                  </p>
                  <p className="col-start-2 font-mono text-sm tabular-nums text-accent-text sm:col-start-auto sm:text-right sm:text-base sm:text-fg">
                    <span className="sr-only">{t.mes.colunas.prazo}: </span>
                    {s.prazo}
                  </p>
                </li>
              ))}
            </ol>
            <p className="mt-8 max-w-[70ch] leading-relaxed text-fg-muted">{t.mes.publi}</p>
            <p className="mt-3 max-w-[70ch] leading-relaxed text-fg-muted">{t.mes.final}</p>
          </div>
        </section>

        <section id="inscricao" aria-labelledby="inscricao-titulo" className="scroll-mt-20 border-t border-line py-20 sm:py-24">
          <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 px-5 sm:px-8 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className={eyebrow}>{t.formulario.eyebrow}</p>
              <h2 id="inscricao-titulo" className="mt-6 text-3xl font-medium tracking-[-0.02em] text-fg sm:text-4xl">
                {t.formulario.titulo}
              </h2>
              <p className="mt-6 max-w-[40ch] text-lg leading-relaxed text-fg-muted">
                {fase === "abertas" ? t.formulario.lead : t.fases[fase]}
              </p>
              <p className="mt-6 text-sm">
                <Link href="/bolsas/regulamento" className="text-fg underline" prefetch={false}>
                  {t.regulamentoPagina.titulo}
                </Link>
              </p>
            </div>
            {fase === "abertas" ? (
              <div className="border border-line bg-surface p-6 sm:p-8 lg:col-span-6 lg:col-start-7">
                <InscricaoForm />
              </div>
            ) : null}
          </div>
        </section>

        <SecaoFaq eyebrow={t.faq.eyebrow} titulo={t.faq.titulo} itens={t.faq.itens} />
      </main>
      <Footer />
    </>
  );
}
