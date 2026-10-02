"use client";
import Image from "next/image";
import { Check, Plus } from "@phosphor-icons/react";
import { Logo } from "@/components/ui/Logo";
import { LogoSolution } from "@/components/ui/LogoSolution";
import { catalogo as t } from "@/lib/content";
import { formatarReais } from "@/lib/catalogo/preco";
import { Capa } from "../Capa";
import { CascaLayout } from "../CascaLayout";
import type { Carrinho } from "../useCarrinho";

/**
 * Catálogo "Vitrine" (escolhido pelo Rodrigo em 2026-09-26; enxugado em
 * 2026-10-02, quando o catálogo virou dois cursos e saíram packs, prateleiras
 * e o questionário "Monte sua trilha").
 *
 * Ordem da página:
 *   1. Hero no conceito da /cursos — as três marcas (quem produz, com quem,
 *      onde se estuda) — com os pôsteres dos cursos no lugar da estante viva:
 *      com dois cursos, a estante só repetiria as mesmas duas capas.
 *   2. "Como funciona": quatro passos que se acendem em sequência.
 *   3. A grade de cursos, com preço e botão.
 */

type Props = { precoBaseCentavos: number; modo: "teste" | "real"; urlCheckout: string };
const h = t.vitrine.hero;

export function Vitrine({ precoBaseCentavos, modo, urlCheckout }: Props) {
  return (
    <CascaLayout precoBaseCentavos={precoBaseCentavos} modo={modo} urlCheckout={urlCheckout}>
      {(estado) => (
        <>
          <Hero />
          <ComoFunciona />
          <Cursos estado={estado} />
        </>
      )}
    </CascaLayout>
  );
}

function Hero() {
  return (
    <section className="overflow-hidden border-b border-line">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-12 px-5 py-14 sm:px-8 lg:grid-cols-12 lg:gap-10 lg:py-20">
        <div className="lg:col-span-6">
          {/* As três marcas, na ordem que conta a frase: quem produz, com quem,
              onde se estuda. Medidas e motivo em components/sections/cursos/Estante.tsx. */}
          <div className="hero-fade flex flex-wrap items-center gap-x-6 gap-y-5 sm:gap-x-5">
            <Logo label={h.logoIagenticsAlt} className="w-[124px] sm:w-[136px]" />
            <span aria-hidden="true" className="hidden h-9 w-px shrink-0 bg-line-strong sm:block" />
            <Image src="/partner-pecege.png" alt={h.logoPecegeAlt} width={500} height={269} priority className="h-12 w-auto sm:h-[52px]" />
            <span aria-hidden="true" className="hidden h-9 w-px shrink-0 bg-line-strong sm:block" />
            <LogoSolution label={h.logoSolutionAlt} className="w-[118px] sm:w-[130px]" />
          </div>

          <p className="hero-fade mt-10 font-mono text-[11px] uppercase tracking-[0.24em] text-fg-muted" style={{ animationDelay: "80ms" }}>
            {h.eyebrow}
          </p>
          <h1 className="hero-fade mt-4 max-w-[18ch] text-4xl font-medium leading-[1.04] tracking-[-0.03em] text-fg [text-wrap:balance] sm:text-5xl lg:text-6xl" style={{ animationDelay: "140ms" }}>
            {h.titulo}
          </h1>
          <p className="hero-fade mt-6 max-w-[52ch] text-lg leading-relaxed text-fg-muted" style={{ animationDelay: "200ms" }}>
            {h.lead}
          </p>
          <div className="hero-fade mt-8" style={{ animationDelay: "260ms" }}>
            <a
              href="#cursos"
              className="inline-block rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-colors hover:bg-accent-hover active:translate-y-px"
            >
              {h.verCursos}
            </a>
          </div>
          <p className="hero-fade mt-6 inline-block border border-line bg-surface px-3 py-1.5 text-sm text-fg" style={{ animationDelay: "320ms" }}>
            {t.avisoTeste}
          </p>
        </div>

        {/* Os pôsteres, desencontrados como cartazes numa parede. Decorativos
            para leitor de tela: os cursos aparecem com nome e preço logo abaixo. */}
        <div role="img" aria-label={h.postersAlt} className="lg:col-span-6">
          <div className="grid grid-cols-2 items-start gap-5 sm:gap-6" aria-hidden="true">
            {t.cursos.slice(0, 2).map((c, i) => (
              <div key={c.slug} className={`poster-flutua border border-line ${i === 1 ? "mt-12 sm:mt-16" : ""}`} style={{ "--i": i } as React.CSSProperties}>
                <Capa curso={c} sizes="(min-width: 1024px) 320px, 45vw" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * "Como funciona": os quatro passos se acendem um de cada vez, em laço, com a
 * barra de cada um enchendo enquanto ele está em foco (CSS puro, .conceito-*
 * em globals.css). Sem animação — reduced motion, JS fora — os quatro ficam
 * acesos e legíveis ao mesmo tempo: o conteúdo não depende do movimento.
 */
function ComoFunciona() {
  return (
    <section aria-labelledby="como-funciona" className="border-b border-line bg-surface">
      <div className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 lg:py-16">
        <h2 id="como-funciona" className="font-mono text-[11px] uppercase tracking-[0.24em] text-fg-muted">
          {h.conceitoRotulo}
        </h2>
        <ol className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {h.passos.map((p, i) => (
            <li key={p.titulo} className="conceito-passo border-t-2 border-line pt-5" style={{ "--i": i } as React.CSSProperties}>
              <div className="relative -mt-[calc(1.25rem+2px)] mb-5 h-0.5 overflow-hidden" aria-hidden="true">
                <span className="conceito-barra absolute inset-0 origin-left bg-accent" />
              </div>
              <p className="tnum text-5xl font-medium leading-none tracking-[-0.04em] text-fg-subtle">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-4 text-xl font-medium tracking-[-0.02em] text-fg">{p.titulo}</h3>
              <p className="mt-2 max-w-[34ch] text-fg-muted">{p.texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Cursos({ estado }: { estado: Carrinho }) {
  return (
    <section id="cursos" aria-labelledby="cursos-titulo" className="mx-auto max-w-[1400px] scroll-mt-20 px-5 py-14 sm:px-8 lg:py-20">
      <h2 id="cursos-titulo" className="text-3xl font-medium tracking-[-0.03em] text-fg sm:text-5xl">
        {t.vitrine.cursosTitulo}
      </h2>
      <ul className="mt-10 grid gap-6 md:grid-cols-2">
        {t.cursos.map((c, i) => {
          const dentro = estado.noCarrinho.has(c.slug);
          const fixo = estado.fixos.get(c.slug);
          const preco = fixo?.precoCentavos ?? estado.precoCursoCentavos;
          const promocao = fixo && fixo.cheioCentavos > fixo.precoCentavos;
          const rotulo = dentro ? t.vitrine.noCarrinho : formatarReais(preco);
          return (
            <li
              key={c.slug}
              className={`vitrine-card cascata group relative border bg-surface ${dentro ? "border-accent" : "border-line"}`}
              style={{ "--i": i } as React.CSSProperties}
            >
              <div className="overflow-hidden">
                <Capa curso={c} formato="paisagem" sizes="(min-width: 768px) 680px, 100vw" />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                <p className="flex items-baseline gap-3">
                  {promocao ? (
                    <>
                      <s className="tnum text-sm text-fg-subtle">{formatarReais(fixo.cheioCentavos)}</s>
                      <span className="text-sm text-accent-text">{t.lancamento}</span>
                    </>
                  ) : null}
                </p>
                <button
                  type="button"
                  /* O nome acessível contém o texto visível (preço ou "No carrinho"), como pede o WCAG 2.5.3. */
                  aria-label={`${dentro ? t.card.remover : t.card.adicionar} ${c.nome} · ${rotulo}`}
                  aria-pressed={dentro}
                  onClick={() => (dentro ? estado.remover(c.slug) : estado.adicionar(c.slug))}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-control px-5 py-2.5 font-medium transition-colors active:translate-y-px ${
                    dentro ? "border border-accent text-fg" : "bg-accent text-accent-on hover:bg-accent-hover"
                  }`}
                >
                  {dentro ? <Check size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
                  <span className="tnum">{rotulo}</span>
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
