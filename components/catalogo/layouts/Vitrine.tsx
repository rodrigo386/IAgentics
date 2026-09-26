"use client";
import { useRef } from "react";
import Image from "next/image";
import { CaretLeft, CaretRight, Check, Plus } from "@phosphor-icons/react";
import { Logo } from "@/components/ui/Logo";
import { LogoSolution } from "@/components/ui/LogoSolution";
import { catalogo as t, type Tema } from "@/lib/content";
import { formatarReais } from "@/lib/catalogo/preco";
import { Capa } from "../Capa";
import { CascaLayout } from "../CascaLayout";
import type { Carrinho } from "../useCarrinho";

/**
 * Catálogo "Vitrine" (2026-09-26) — o layout escolhido pelo Rodrigo entre as
 * quatro opções da prévia, em versão CLARA (acompanha o tema do site).
 *
 * Ordem da página, e por quê:
 *   1. Hero no conceito da /cursos: as três marcas (quem produz, com quem, onde
 *      estuda) e a estante viva — agora com as capas do próprio catálogo.
 *   2. "Como funciona": quatro passos que se acendem em sequência, explicando
 *      a plataforma e o desconto antes de a pessoa ver preço.
 *   3. Packs por jornada: a oferta mais forte vem primeiro.
 *   4. Prateleiras por nível e por tema, como num serviço de streaming.
 */

type Curso = (typeof t.cursos)[number];
const PRATELEIRAS_TEMA: Tema[] = ["dados", "custos", "ia", "pessoas"];
const DURACOES = ["70s", "86s", "78s"];
const h = t.vitrine.hero;

type Props = { precoBaseCentavos: number; precoPackCentavos: number; urlCheckout: string };

export function Vitrine({ precoBaseCentavos, precoPackCentavos, urlCheckout }: Props) {
  return (
    <CascaLayout precoBaseCentavos={precoBaseCentavos} precoPackCentavos={precoPackCentavos} urlCheckout={urlCheckout}>
      {({ estado, abrirTrilha }) => (
        <>
          <Hero abrirTrilha={abrirTrilha} />
          <ComoFunciona />
          <Packs estado={estado} precoBaseCentavos={precoBaseCentavos} precoPackCentavos={precoPackCentavos} />

          <div id="cursos" className="flex scroll-mt-20 flex-col gap-12 py-16">
            {t.niveis.map((nivel, n) => (
              <Prateleira key={nivel} titulo={nivel} cursos={t.cursos.filter((c) => c.nivel === n)} estado={estado} />
            ))}
            <p className="mx-auto w-full max-w-[1400px] px-5 pt-4 font-mono text-[11px] uppercase tracking-[0.24em] text-fg-muted sm:px-8">
              {t.vitrine.temasTitulo}
            </p>
            {PRATELEIRAS_TEMA.map((tema) => (
              <Prateleira key={tema} titulo={t.temas[tema]} cursos={t.cursos.filter((c) => c.temas[0] === tema && !c.introdutorio)} estado={estado} />
            ))}
          </div>
        </>
      )}
    </CascaLayout>
  );
}

function Hero({ abrirTrilha }: { abrirTrilha: () => void }) {
  // Um curso a cada três, espalhado entre níveis e temas: a estante mostra a
  // variedade do catálogo sem pôr 63 capas (126 com a cópia do laço) na página.
  const colunas: Curso[][] = [[], [], []];
  t.cursos.filter((_, i) => i % 3 === 0).forEach((c, i) => colunas[i % 3].push(c));

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
          <div className="hero-fade mt-8 flex flex-wrap gap-3" style={{ animationDelay: "260ms" }}>
            <button
              type="button"
              onClick={abrirTrilha}
              className="rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-colors hover:bg-accent-hover active:translate-y-px"
            >
              {h.montar}
            </button>
            <a
              href="#packs"
              className="rounded-control border border-line-strong px-7 py-3.5 font-medium text-fg transition-colors hover:border-fg active:translate-y-px"
            >
              {h.verCursos}
            </a>
          </div>
          <p className="hero-fade mt-6 inline-block border border-line bg-surface px-3 py-1.5 text-sm text-fg" style={{ animationDelay: "320ms" }}>
            {t.avisoTeste}
          </p>
        </div>

        {/* A estante viva da /cursos, com as capas do catálogo. Decorativa: o
            leitor de tela ouve o rótulo, não 21 títulos em loop. */}
        <div role="img" aria-label={h.estanteAlt} className="relative h-[360px] sm:h-[460px] lg:col-span-6 lg:h-[620px]">
          <div className="grid h-full grid-cols-3 gap-4" aria-hidden="true">
            {colunas.map((coluna, i) => (
              <div key={i} className="overflow-hidden">
                <div
                  className={`flex flex-col gap-4 ${i === 1 ? "estante-rolagem estante-rolagem-inversa" : "estante-rolagem"}`}
                  style={{ "--estante-dur": DURACOES[i] } as React.CSSProperties}
                >
                  {/* Conteúdo duplicado: o keyframe percorre -50% e o loop emenda. */}
                  {[0, 1].map((copia) =>
                    coluna.map((c) => (
                      <div key={`${copia}-${c.slug}`} className="shrink-0 border border-line">
                        <Capa curso={c} />
                      </div>
                    )),
                  )}
                </div>
              </div>
            ))}
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-16" style={{ background: "linear-gradient(to bottom, var(--bg), transparent)" }} />
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-16" style={{ background: "linear-gradient(to top, var(--bg), transparent)" }} />
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

function Packs({ estado, precoBaseCentavos, precoPackCentavos }: { estado: Carrinho; precoBaseCentavos: number; precoPackCentavos: number }) {
  return (
    <section id="packs" aria-labelledby="packs-titulo" className="scroll-mt-20 border-b border-line">
      <div className="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 lg:py-20">
        <div className="max-w-[46rem]">
          <h2 id="packs-titulo" className="text-3xl font-medium tracking-[-0.03em] text-fg sm:text-5xl">
            {t.pack.titulo}
          </h2>
          <p className="mt-4 text-lg text-fg-muted">{t.pack.texto}</p>
        </div>

        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {t.packs.map((p, i) => {
            const cursos = t.cursos.filter((c) => c.nivel === p.nivel);
            const cheio = cursos.length * precoBaseCentavos;
            const dentro = estado.noCarrinho.has(p.slug);
            const nome = t.pack.nome(t.niveis[p.nivel]);
            return (
              <li
                key={p.slug}
                className={`pack-card cascata group flex flex-col border bg-surface ${dentro ? "border-accent" : "border-line"}`}
                style={{ "--i": i } as React.CSSProperties}
              >
                {/* Leque de capas: três cursos do nível, abrindo no hover. */}
                <div className="relative h-56 overflow-hidden border-b border-line bg-brand-ink" aria-hidden="true">
                  {cursos.slice(0, 3).map((c, k) => (
                    <div key={c.slug} className={`pack-leque pack-leque-${k} absolute top-6 w-[42%]`}>
                      <Capa curso={c} semTitulo />
                    </div>
                  ))}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">{t.pack.cursos(cursos.length)}</p>
                  <h3 className="mt-2 text-2xl font-medium tracking-[-0.02em] text-fg">{nome}</h3>
                  <p className="mt-2 text-sm text-fg-muted">
                    {cursos
                      .slice(0, 4)
                      .map((c) => c.nome)
                      .join(" · ")}
                    …
                  </p>
                  <div className="mt-auto pt-6">
                    <p className="flex items-baseline gap-3">
                      <span className="tnum text-4xl font-medium tracking-[-0.03em] text-fg">{formatarReais(precoPackCentavos)}</span>
                      <s className="tnum text-sm text-fg-subtle">{t.pack.cheio(formatarReais(cheio))}</s>
                    </p>
                    <p className="mt-1 text-sm text-accent-text">{t.pack.economia(formatarReais(cheio - precoPackCentavos))}</p>
                    <button
                      type="button"
                      aria-pressed={dentro}
                      /* Texto curto para caber numa linha no celular; o nível vai no nome
                         acessível, que começa pelo texto visível (WCAG 2.5.3). */
                      aria-label={`${dentro ? t.pack.noCarrinho : t.pack.adicionar} ${t.niveis[p.nivel]}`}
                      onClick={() => (dentro ? estado.remover(p.slug) : estado.adicionar(p.slug))}
                      className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-control px-6 py-3 font-medium transition-colors active:translate-y-px ${
                        dentro ? "border border-accent text-fg" : "bg-accent text-accent-on hover:bg-accent-hover"
                      }`}
                    >
                      {dentro ? <Check size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
                      {dentro ? t.pack.noCarrinho : t.pack.adicionar}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function Prateleira({ titulo, cursos, estado }: { titulo: string; cursos: Curso[]; estado: Carrinho }) {
  const trilho = useRef<HTMLUListElement>(null);
  const rolar = (dir: 1 | -1) => {
    const el = trilho.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };
  const preco = formatarReais(estado.carrinho.proximo?.precoCentavos ?? 0);

  return (
    <section aria-label={titulo} className="mx-auto w-full max-w-[1400px]">
      <div className="flex items-end justify-between gap-4 px-5 sm:px-8">
        <h2 className="text-xl font-medium tracking-[-0.02em] text-fg sm:text-2xl">
          {titulo}
          <span className="ml-3 font-mono text-[11px] uppercase tracking-[0.16em] text-fg-subtle">{t.vitrine.contagem(cursos.length)}</span>
        </h2>
        <div className="hidden gap-2 md:flex">
          <button type="button" onClick={() => rolar(-1)} aria-label={`${t.vitrine.anterior}: ${titulo}`} className="rounded-control border border-line-strong p-2 text-fg transition-colors hover:border-fg">
            <CaretLeft size={18} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => rolar(1)} aria-label={`${t.vitrine.seguinte}: ${titulo}`} className="rounded-control border border-line-strong p-2 text-fg transition-colors hover:border-fg">
            <CaretRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
      {/* py e px folgados: o card cresce no hover e não pode ser cortado pela rolagem. */}
      <ul ref={trilho} className="prateleira mt-2 flex gap-3 overflow-x-auto px-5 py-5 sm:px-8">
        {cursos.map((c, i) => {
          const dentro = estado.noCarrinho.has(c.slug);
          const noPack = estado.coberto(c.slug);
          const rotulo = noPack ? t.pack.coberto : dentro ? t.vitrine.noCarrinho : preco;
          return (
            <li
              key={c.slug}
              className={`vitrine-card cascata group relative w-[72vw] shrink-0 border bg-surface sm:w-[300px] ${dentro || noPack ? "border-accent" : "border-line"}`}
              style={{ "--i": Math.min(i, 8) } as React.CSSProperties}
            >
              <div className="overflow-hidden">
                <Capa curso={c} formato="paisagem" />
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <p className="min-w-0 truncate text-xs text-fg-muted">{c.temas.map((tema) => t.temas[tema]).join(" · ")}</p>
                <button
                  type="button"
                  /* O nome acessível contém o texto visível (preço, "No carrinho" ou "No pack"), como pede o WCAG 2.5.3. */
                  aria-label={`${dentro ? t.card.remover : t.card.adicionar} ${c.nome} · ${rotulo}`}
                  aria-pressed={dentro}
                  disabled={noPack}
                  onClick={() => (dentro ? estado.remover(c.slug) : estado.adicionar(c.slug))}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-control px-3.5 py-1.5 text-sm font-medium transition-colors active:translate-y-px disabled:pointer-events-none ${
                    dentro || noPack ? "border border-accent text-fg" : "bg-accent text-accent-on hover:bg-accent-hover"
                  }`}
                >
                  {dentro || noPack ? <Check size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />}
                  {rotulo}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
