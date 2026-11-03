import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, Broadcast, CalendarCheck, Tag, Ticket, WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/ui/Reveal";
import { SecaoFaq } from "@/components/sections/Faq";
import { BarraBolsas } from "@/components/sections/bolsas/BarraBolsas";
import { Contagem } from "@/components/sections/bolsas/Contagem";
import { InscricaoForm } from "@/components/sections/bolsas/InscricaoForm";
import { Vagas } from "@/components/sections/bolsas/Vagas";
import { JsonLd } from "@/components/seo/JsonLd";
import { bolsas as t } from "@/lib/content";
import { agoraBolsas, faseDasInscricoes, INSCRICOES_ABREM, INSCRICOES_FECHAM } from "@/lib/bolsas/regras";
import { faqJsonLd, ogDaPagina } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: t.meta.titulo },
  description: t.meta.descricao,
  alternates: { canonical: "/bolsas" },
  openGraph: ogDaPagina("/bolsas", t.meta.titulo, t.meta.descricao),
};

/* Dinâmica porque o formulário e a contagem dependem da hora: abre em 05/11 e
   fecha às 23h59 de 11/11. Estática, a página ficaria presa na fase do build. */
export const dynamic = "force-dynamic";

/**
 * Desafio das 50 Bolsas (2026-11-03, docs/PLANO-BOLSAS.md).
 *
 * Redesenhada no mesmo dia, a pedido do Rodrigo ("falta um botão grande para
 * cadastro, a página tá muito poluída, precisa ser mais visual e convidativa,
 * use motions"): capa escura com o botão grande, a contagem e as 50 vagas
 * desenhadas pelas cotas; cada seção com UMA imagem que diz o essencial
 * (linha do tempo, os números da entrega, a régua dos 60 segundos, as barras
 * dos pesos) e o detalhe nas perguntas frequentes e no regulamento. Um botão
 * fixo acompanha a rolagem até o formulário.
 *
 * Critérios e pesos continuam na página por inteiro: o desafio é processo
 * seletivo por mérito, e régua escondida não é mérito.
 */
const eyebrow = "font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted";
const h2 = "mt-5 max-w-[20ch] text-4xl font-medium tracking-[-0.03em] text-fg sm:text-5xl lg:text-6xl";
const ICONES_GANHA = [CalendarCheck, WhatsappLogo, Broadcast, Ticket, Tag];
const CORES_ROTEIRO = ["bg-brand-violet", "bg-brand-indigo", "bg-brand-periwinkle", "bg-brand-sky"];

export default function PaginaBolsas() {
  const agora = agoraBolsas();
  const fase = faseDasInscricoes(agora);
  const { capa } = t;
  const contagem =
    fase === "antes"
      ? { alvo: INSCRICOES_ABREM.getTime(), rotulo: "abre" as const }
      : fase === "abertas"
        ? { alvo: INSCRICOES_FECHAM.getTime(), rotulo: "fecha" as const }
        : null;
  const pesoMaximo = Math.max(...t.criterios.itens.map((c) => c.peso));
  const segundos = t.roteiro.partes.map((p) => Number.parseInt(p.tempo, 10));

  return (
    <>
      <JsonLd dados={faqJsonLd(t.faq.itens)} />
      <Nav />
      <main id="conteudo" className="pt-16">
        {/* CAPA: superfície escura nos dois temas (ver .bolsas-capa). Altura
            descontando o nav, que aqui fica ACIMA do main (CLAUDE.md). */}
        <section className="bolsas-capa relative isolate flex min-h-[calc(100dvh-4rem)] items-center overflow-hidden py-16 sm:py-20">
          <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 items-center gap-14 px-5 sm:px-8 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7">
              <p className="hero-fade font-mono text-[11px] uppercase tracking-[0.22em] text-brand-paper/70" style={{ animationDelay: "40ms" }}>
                {capa.kicker}
              </p>
              <h1 className="mt-6 text-[min(11vw,3.25rem)] font-medium leading-[1.04] tracking-[-0.045em] text-brand-paper sm:text-[min(8vw,4.25rem)] lg:text-[4.25rem] xl:text-[4.75rem]">
                <span className="block overflow-hidden pb-[0.12em]">
                  <span className="hero-line block" style={{ animationDelay: "120ms" }}>
                    {capa.titulo}
                  </span>
                </span>
              </h1>
              <p className="hero-fade mt-7 max-w-[46ch] text-lg leading-relaxed text-brand-paper/75 sm:text-xl" style={{ animationDelay: "260ms" }}>
                {capa.lead}
              </p>

              <div className="hero-fade mt-10" style={{ animationDelay: "380ms" }}>
                {fase !== "encerradas" ? (
                  <div className="flex flex-col gap-3">
                    <a
                      id="cta-bolsas"
                      href="#inscricao"
                      className="bolsas-cta group inline-flex w-full items-center justify-center gap-3 rounded-control bg-accent px-10 py-5 text-lg font-medium text-accent-on transition-[background-color,transform] duration-200 hover:bg-accent-hover active:scale-[0.98] sm:w-fit sm:px-12 sm:text-xl"
                    >
                      <span className="whitespace-nowrap">{capa.cta}</span>
                      <ArrowDown size={22} weight="bold" className="transition-transform duration-300 group-hover:translate-y-1" />
                    </a>
                    <p className="text-sm text-brand-paper/65">{capa.gratis}</p>
                  </div>
                ) : (
                  <p className="max-w-[46ch] text-lg font-medium text-brand-paper">{t.fases.encerradas}</p>
                )}
              </div>
            </div>

            {/* A contagem fica sobre as vagas: na coluna do título ela caía
                abaixo da dobra num notebook de 900 px de altura. */}
            <div className="hero-fade flex flex-col gap-10 lg:col-span-5" style={{ animationDelay: "450ms" }}>
              {contagem ? <Contagem alvo={contagem.alvo} agora={agora.getTime()} rotulo={contagem.rotulo} claro /> : null}
              <Vagas />
            </div>
          </div>
        </section>

        {/* COMO FUNCIONA: a linha do tempo se desenha com a rolagem. */}
        <section aria-labelledby="etapas" className="py-24 sm:py-32">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
            <Reveal>
              <p className={eyebrow}>{t.etapas.eyebrow}</p>
              <h2 id="etapas" className={h2}>
                {t.etapas.titulo}
              </h2>
            </Reveal>
            <div className="relative mt-16">
              <div aria-hidden="true" className="absolute top-[7px] right-0 left-0 hidden h-0.5 bg-line lg:block">
                <div className="bolsas-barra h-full bg-accent" />
              </div>
              <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
                {t.etapas.itens.map((e) => (
                  <li key={e.nome} className="relative">
                    <span aria-hidden="true" className="relative hidden size-4 rounded-full border-2 border-accent bg-bg lg:block" />
                    <Reveal className="border-l-2 border-accent pl-5 lg:mt-6 lg:border-0 lg:pl-0">
                      <p className="font-mono text-sm uppercase tracking-[0.12em] text-accent-text">{e.quando}</p>
                      <h3 className="mt-2 text-2xl font-medium tracking-[-0.02em] text-fg">{e.nome}</h3>
                      <p className="mt-2 max-w-[30ch] text-fg-muted">{e.texto}</p>
                    </Reveal>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* A TROCA: o que se entrega em três números; o que se ganha com ícones. */}
        <section aria-labelledby="trocas" className="border-t border-line bg-surface py-24 sm:py-32">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
            <Reveal>
              <p className={eyebrow}>{t.trocas.eyebrow}</p>
              <h2 id="trocas" className={h2}>
                {t.trocas.titulo}
              </h2>
            </Reveal>
            <div className="mt-16 grid gap-16 lg:grid-cols-12 lg:gap-10">
              <div className="lg:col-span-6">
                <h3 className={eyebrow}>{t.trocas.entrega.titulo}</h3>
                <ul className="mt-6 flex flex-col">
                  {t.trocas.numeros.map((n) => (
                    <li key={n.rotulo} className="border-t border-line">
                      <Reveal className="flex items-baseline gap-6 py-5">
                        <span className="tnum w-[1.2ch] text-7xl font-medium leading-none tracking-[-0.05em] text-accent-text sm:text-8xl">{n.valor}</span>
                        <span className="text-xl leading-snug text-fg">{n.rotulo}</span>
                      </Reveal>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="lg:col-span-5 lg:col-start-8">
                <h3 className={eyebrow}>{t.trocas.ganha.titulo}</h3>
                <ul className="mt-6 flex flex-col gap-5">
                  {t.trocas.ganha.itens.map((item, i) => {
                    const Icone = ICONES_GANHA[i] ?? Tag;
                    return (
                      <li key={item}>
                        <Reveal className="flex items-start gap-4">
                          <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-accent/10 text-accent-text">
                            <Icone size={22} />
                          </span>
                          <span className="pt-2 text-lg leading-snug text-fg">{item}</span>
                        </Reveal>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
            <Reveal className="mt-16 grid gap-6 border-t border-line pt-8 md:grid-cols-2 md:gap-10">
              <p className="max-w-[56ch] leading-relaxed text-fg-muted">{t.trocas.naoSelecionado}</p>
              <p className="max-w-[56ch] leading-relaxed text-fg-muted">
                <span className="font-medium text-fg">{t.quem.titulo}: </span>
                {t.quem.texto}
              </p>
            </Reveal>
          </div>
        </section>

        {/* O VÍDEO: a régua dos 60 segundos, com o cursor andando pela rolagem. */}
        <section aria-labelledby="roteiro" className="border-t border-line py-24 sm:py-32">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
            <Reveal>
              <p className={eyebrow}>{t.roteiro.eyebrow}</p>
              <h2 id="roteiro" className={h2}>
                {t.roteiro.titulo}
              </h2>
            </Reveal>
            <div className="bolsas-trilho relative mt-16">
              <div aria-hidden="true" className="flex h-16 gap-1 sm:h-20">
                {t.roteiro.partes.map((p, i) => (
                  <div key={p.nome} className={`${CORES_ROTEIRO[i]} flex items-end p-3`} style={{ flexGrow: segundos[i], flexBasis: 0 }}>
                    <span className="font-mono text-sm font-medium text-brand-paper">{p.tempo}</span>
                  </div>
                ))}
              </div>
              <span aria-hidden="true" className="bolsas-cursor absolute -top-3 -bottom-3 left-full w-0.5 bg-fg">
                <span className="absolute -top-1.5 -left-[5px] size-3 rounded-full bg-fg" />
              </span>
            </div>
            <ol aria-label={t.roteiro.regua} className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {t.roteiro.partes.map((p, i) => (
                <li key={p.nome}>
                  <Reveal>
                    <p className="flex items-center gap-2 font-mono text-sm text-fg-muted">
                      <span aria-hidden="true" className={`size-2.5 ${CORES_ROTEIRO[i]}`} />
                      {p.tempo}
                    </p>
                    <h3 className="mt-2 text-xl font-medium text-fg">{p.nome}</h3>
                    <p className="mt-1 text-fg-muted">{p.texto}</p>
                  </Reveal>
                </li>
              ))}
            </ol>
            <Reveal className="mt-14 grid gap-4 border-t border-line pt-8 md:grid-cols-2 md:gap-10">
              <p className="max-w-[56ch] leading-relaxed text-fg-muted">{t.roteiro.envio}</p>
              <p className="max-w-[56ch] font-medium leading-relaxed text-fg">{t.roteiro.cuidado}</p>
            </Reveal>
          </div>
        </section>

        {/* A BANCA: pesos como barras que crescem com a rolagem. */}
        <section aria-labelledby="criterios" className="border-t border-line bg-surface py-24 sm:py-32">
          <div className="mx-auto grid max-w-[1400px] gap-16 px-5 sm:px-8 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-5">
              <Reveal>
                <p className={eyebrow}>{t.criterios.eyebrow}</p>
                <h2 id="criterios" className={h2}>
                  {t.criterios.titulo}
                </h2>
                <p className="mt-10 border-l-2 border-accent pl-5 text-2xl leading-snug tracking-[-0.02em] text-fg">{t.criterios.seguidores}</p>
              </Reveal>
            </div>
            <ul className="flex flex-col gap-8 lg:col-span-6 lg:col-start-7">
              {t.criterios.itens.map((c) => (
                <li key={c.nome}>
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-lg font-medium text-fg">{c.nome}</h3>
                    <p className="tnum shrink-0 font-mono text-2xl font-medium text-fg">
                      <span className="sr-only">{t.criterios.pesoDe(c.peso)}</span>
                      <span aria-hidden="true">{c.peso}</span>
                    </p>
                  </div>
                  <div aria-hidden="true" className="mt-2 h-2 bg-line">
                    <div className="bolsas-barra h-full bg-accent" style={{ width: `${(c.peso / pesoMaximo) * 100}%` }} />
                  </div>
                  <p className="mt-2 text-sm text-fg-muted">{c.alta}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* O MÊS: quatro semanas, um post em cada. */}
        <section aria-labelledby="mes" className="border-t border-line py-24 sm:py-32">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
            <Reveal>
              <p className={eyebrow}>{t.mes.eyebrow}</p>
              <h2 id="mes" className={h2}>
                {t.mes.titulo}
              </h2>
              <p className="mt-5 text-lg text-fg-muted">{t.mes.periodo}</p>
            </Reveal>
            <ol className="mt-14 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
              {t.mes.semanas.map((s, i) => (
                <li key={s.prazo} className="flex flex-col gap-3 bg-bg p-6">
                  <Reveal>
                    <div className="flex items-baseline justify-between">
                      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-muted">
                        {t.mes.colunas.semana} {i + 1}
                      </p>
                      <p className="tnum font-mono text-sm text-accent-text">
                        <span className="sr-only">{t.mes.colunas.prazo}: </span>
                        {s.prazo}
                      </p>
                    </div>
                    <h3 className="mt-4 text-xl font-medium leading-snug text-fg">{s.missao}</h3>
                    <p className="mt-3 text-fg-muted">
                      <span className="sr-only">{t.mes.colunas.post}: </span>
                      {s.post}
                    </p>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* INSCRIÇÃO */}
        <section id="inscricao" aria-labelledby="inscricao-titulo" className="scroll-mt-16 border-t border-line bg-surface py-24 sm:py-32">
          <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 px-5 sm:px-8 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className={eyebrow}>{t.formulario.eyebrow}</p>
              <h2 id="inscricao-titulo" className={h2}>
                {t.formulario.titulo}
              </h2>
              <p className="mt-6 max-w-[40ch] text-lg leading-relaxed text-fg-muted">
                {fase === "abertas" ? t.formulario.lead : t.fases[fase]}
              </p>
              {contagem ? (
                <div className="mt-10">
                  <Contagem alvo={contagem.alvo} agora={agora.getTime()} rotulo={contagem.rotulo} />
                </div>
              ) : null}
              <p className="mt-10 text-sm">
                <Link href="/bolsas/regulamento" className="text-fg underline" prefetch={false}>
                  {t.regulamentoPagina.titulo}
                </Link>
              </p>
            </div>
            {fase === "abertas" ? (
              <div className="border border-line bg-bg p-6 sm:p-8 lg:col-span-6 lg:col-start-7">
                <InscricaoForm />
              </div>
            ) : null}
          </div>
        </section>

        <SecaoFaq eyebrow={t.faq.eyebrow} titulo={t.faq.titulo} itens={t.faq.itens} />
      </main>
      {fase !== "encerradas" ? <BarraBolsas /> : null}
      <Footer />
    </>
  );
}
