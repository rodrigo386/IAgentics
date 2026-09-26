"use client";
import { useRef } from "react";
import { CaretLeft, CaretRight, Check, Plus } from "@phosphor-icons/react";
import { catalogo as t, type Tema } from "@/lib/content";
import { formatarReais } from "@/lib/catalogo/preco";
import { Capa } from "../Capa";
import { CascaLayout } from "../CascaLayout";
import type { Carrinho } from "../useCarrinho";

/**
 * Opção de layout "Vitrine" (2026-09-26): o catálogo como serviço de streaming.
 *
 * Destaque grande no topo (o curso introdutório, por onde toda trilha começa),
 * prateleiras horizontais por nível e por tema, capas que crescem sob o
 * cursor. A área inteira é escura de propósito — a classe `dark` no contêiner
 * troca os tokens só aqui dentro (DESIGN.md §5), sem mexer no tema do resto.
 */

type Curso = (typeof t.cursos)[number];
const PRATELEIRAS_TEMA: Tema[] = ["dados", "custos", "ia", "pessoas"];

type Props = { precoBaseCentavos: number; urlCheckout: string };

export function Vitrine({ precoBaseCentavos, urlCheckout }: Props) {
  const intro = t.cursos.find((c) => c.introdutorio) ?? t.cursos[0];

  return (
    <div className="dark bg-bg text-fg">
      <CascaLayout precoBaseCentavos={precoBaseCentavos} urlCheckout={urlCheckout}>
        {({ estado, abrirTrilha }) => {
          const introNoCarrinho = estado.noCarrinho.has(intro.slug);
          return (
            <>
              <section className="relative isolate flex min-h-[78dvh] items-end overflow-hidden">
                <div className="destaque-arte absolute inset-0 -z-10">
                  <Capa curso={intro} formato="paisagem" semTitulo preencher />
                </div>
                {/* Véus: texto legível à esquerda e emenda suave com a primeira prateleira. */}
                <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-bg via-bg/75 to-transparent" />
                <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-bg to-transparent" />

                <div className="mx-auto w-full max-w-[1400px] px-5 pb-16 pt-24 sm:px-8">
                  <div className="max-w-[40rem]">
                    <p className="hero-fade font-mono text-[11px] uppercase tracking-[0.24em] text-accent-text">
                      {t.vitrine.destaqueEyebrow}
                    </p>
                    <h1 className="hero-fade mt-4 text-4xl font-medium leading-[1.02] tracking-[-0.03em] text-fg sm:text-6xl" style={{ animationDelay: "80ms" }}>
                      {intro.nome}
                    </h1>
                    <p className="hero-fade mt-5 max-w-[46ch] text-lg text-fg-muted" style={{ animationDelay: "160ms" }}>
                      {t.vitrine.destaqueFrase}
                    </p>
                    <p className="hero-fade mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-fg-subtle" style={{ animationDelay: "200ms" }}>
                      {t.vitrine.destaqueNota} · {formatarReais(estado.carrinho.proximo?.precoCentavos ?? precoBaseCentavos)}
                    </p>
                    <div className="hero-fade mt-8 flex flex-wrap gap-3" style={{ animationDelay: "260ms" }}>
                      <button
                        type="button"
                        onClick={() => (introNoCarrinho ? estado.remover(intro.slug) : estado.adicionar(intro.slug))}
                        aria-pressed={introNoCarrinho}
                        className="inline-flex items-center gap-2 rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-colors hover:bg-accent-hover active:translate-y-px"
                      >
                        {introNoCarrinho ? <Check size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
                        {introNoCarrinho ? t.vitrine.noCarrinho : t.vitrine.adicionar}
                      </button>
                      <button
                        type="button"
                        onClick={abrirTrilha}
                        className="rounded-control border border-line-strong bg-bg/40 px-7 py-3.5 font-medium text-fg backdrop-blur transition-colors hover:border-fg active:translate-y-px"
                      >
                        {t.vitrine.montar}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <div className="flex flex-col gap-12 pb-16">
                {t.niveis.map((nivel, n) => (
                  <Prateleira
                    key={nivel}
                    titulo={nivel}
                    cursos={t.cursos.filter((c) => c.nivel === n && !c.introdutorio)}
                    estado={estado}
                  />
                ))}
                <p className="mx-auto w-full max-w-[1400px] px-5 pt-4 font-mono text-[11px] uppercase tracking-[0.24em] text-fg-muted sm:px-8">
                  {t.vitrine.temasTitulo}
                </p>
                {PRATELEIRAS_TEMA.map((tema) => (
                  <Prateleira key={tema} titulo={t.temas[tema]} cursos={t.cursos.filter((c) => c.temas[0] === tema && !c.introdutorio)} estado={estado} />
                ))}
              </div>
            </>
          );
        }}
      </CascaLayout>
    </div>
  );
}

function Prateleira({ titulo, cursos, estado }: { titulo: string; cursos: Curso[]; estado: Carrinho }) {
  const trilho = useRef<HTMLUListElement>(null);
  const rolar = (dir: 1 | -1) => {
    const el = trilho.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

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
          return (
            <li
              key={c.slug}
              className={`vitrine-card cascata group relative w-[72vw] shrink-0 border bg-surface sm:w-[300px] ${dentro ? "border-accent" : "border-transparent"}`}
              style={{ "--i": Math.min(i, 8) } as React.CSSProperties}
            >
              <div className="overflow-hidden">
                <Capa curso={c} formato="paisagem" />
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <p className="min-w-0 truncate text-xs text-fg-muted">{c.temas.map((tema) => t.temas[tema]).join(" · ")}</p>
                <button
                  type="button"
                  /* O nome acessível contém o texto visível (preço ou "No carrinho"), como pede o WCAG 2.5.3. */
                  aria-label={`${dentro ? t.card.remover : t.card.adicionar} ${c.nome} · ${dentro ? t.vitrine.noCarrinho : formatarReais(estado.carrinho.proximo?.precoCentavos ?? 0)}`}
                  aria-pressed={dentro}
                  onClick={() => (dentro ? estado.remover(c.slug) : estado.adicionar(c.slug))}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-control px-3.5 py-1.5 text-sm font-medium transition-colors active:translate-y-px ${
                    dentro ? "border border-accent text-fg" : "bg-accent text-accent-on hover:bg-accent-hover"
                  }`}
                >
                  {dentro ? <Check size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />}
                  {dentro ? t.vitrine.noCarrinho : formatarReais(estado.carrinho.proximo?.precoCentavos ?? 0)}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
