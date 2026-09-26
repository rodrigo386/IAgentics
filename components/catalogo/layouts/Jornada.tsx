"use client";
import { Check, Plus } from "@phosphor-icons/react";
import { catalogo as t } from "@/lib/content";
import { formatarReais } from "@/lib/catalogo/preco";
import { DEGRAUS } from "../BarraCarrinho";
import { Capa } from "../Capa";
import { CascaLayout } from "../CascaLayout";

/**
 * Opção de layout "Jornada" (2026-09-26): o catálogo como uma subida.
 *
 * Duas escadas contam a mesma história. No topo, a ESCADA DO DESCONTO: seis
 * degraus com o preço de cada curso, e o próximo marcado — adicionar um curso
 * acende o degrau na hora. Embaixo, os quatro níveis como colunas que sobem da
 * esquerda para a direita (no desktop), do Iniciante ao Avançado.
 */
type Props = { precoBaseCentavos: number; urlCheckout: string };

/* Deslocamento de cada coluna no desktop: a primeira desce mais, a última fica
   no topo — é o desenho da escada. No celular as colunas empilham sem degrau. */
const DEGRAU_COLUNA = ["lg:mt-36", "lg:mt-24", "lg:mt-12", "lg:mt-0"];

export function Jornada({ precoBaseCentavos, urlCheckout }: Props) {
  return (
    <CascaLayout precoBaseCentavos={precoBaseCentavos} urlCheckout={urlCheckout}>
      {({ estado, abrirTrilha }) => {
        const n = estado.carrinho.itens.length;
        return (
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
            <section className="grid gap-12 py-14 lg:grid-cols-12 lg:items-end lg:py-20">
              <div className="lg:col-span-5">
                <p className="hero-fade font-mono text-[11px] uppercase tracking-[0.24em] text-fg-muted">{t.jornada.eyebrow}</p>
                <h1 className="hero-fade mt-4 text-4xl font-medium leading-[1.02] tracking-[-0.03em] text-fg sm:text-6xl [text-wrap:balance]" style={{ animationDelay: "80ms" }}>
                  {t.jornada.titulo}
                </h1>
                <p className="hero-fade mt-5 max-w-[46ch] text-lg text-fg-muted" style={{ animationDelay: "160ms" }}>
                  {t.jornada.texto}
                </p>
                <button
                  type="button"
                  onClick={abrirTrilha}
                  className="hero-fade mt-8 rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-colors hover:bg-accent-hover active:translate-y-px"
                  style={{ animationDelay: "240ms" }}
                >
                  {t.vitrine.montar}
                </button>
              </div>

              {/* A escada do desconto, grande. Cada degrau é um curso a mais. */}
              <figure className="lg:col-span-7" aria-label={t.jornada.escada}>
                <figcaption className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">{t.jornada.escada}</figcaption>
                <ol className="mt-4 grid h-64 grid-cols-6 items-end gap-2 sm:h-72 sm:gap-3">
                  {DEGRAUS.map((pct, i) => {
                    const aceso = i < n;
                    const proximo = i === n;
                    const preco = Math.round((precoBaseCentavos * (100 - pct)) / 100);
                    return (
                      <li key={pct} className="flex h-full flex-col justify-end">
                        <div className="mb-2 min-h-[2.5rem]">
                          <p className={`tnum text-sm font-medium sm:text-base ${aceso || proximo ? "text-fg" : "text-fg-subtle"}`}>{formatarReais(preco)}</p>
                          <p className={`font-mono text-[10px] uppercase tracking-[0.12em] ${proximo ? "text-accent-text" : "text-fg-subtle"}`}>
                            {proximo ? t.jornada.voce : pct === 0 ? t.jornada.degrau(1) : `-${pct}%`}
                          </p>
                        </div>
                        <div
                          key={aceso ? "on" : "off"}
                          className={`degrau w-full origin-bottom ${aceso ? "degrau-aceso bg-accent" : proximo ? "border-2 border-accent bg-transparent" : "bg-line"}`}
                          style={{ height: `${18 + i * 10}%` }}
                        />
                        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-fg-subtle">{t.jornada.degrau(i + 1)}</p>
                      </li>
                    );
                  })}
                </ol>
              </figure>
            </section>

            <div className="grid gap-10 pb-16 lg:grid-cols-4 lg:gap-6">
              {t.niveis.map((nivel, nv) => {
                const cursos = t.cursos.filter((c) => c.nivel === nv);
                return (
                  <section key={nivel} aria-label={nivel} className={`${DEGRAU_COLUNA[nv]} border-t-2 border-fg pt-4`}>
                    <p className="text-6xl font-medium leading-none tracking-[-0.04em] text-fg-subtle">{String(nv + 1).padStart(2, "0")}</p>
                    <h2 className="mt-2 text-2xl font-medium tracking-[-0.02em] text-fg">{nivel}</h2>
                    <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">{t.vitrine.contagem(cursos.length)}</p>
                    <ul className="mt-5 divide-y divide-line border-y border-line">
                      {cursos.map((c, i) => {
                        const dentro = estado.noCarrinho.has(c.slug);
                        return (
                          <li key={c.slug} className="cascata group flex items-center gap-3 py-2.5" style={{ "--i": Math.min(i, 10) } as React.CSSProperties}>
                            <div className={`w-12 shrink-0 overflow-hidden border ${dentro ? "border-accent" : "border-transparent"}`}>
                              <Capa curso={c} semTitulo />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm leading-snug text-fg">{c.nome}</p>
                              {c.introdutorio ? (
                                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent-text">{t.introdutorio}</p>
                              ) : null}
                            </div>
                            <button
                              type="button"
                              aria-label={`${dentro ? t.card.remover : t.card.adicionar} ${c.nome}`}
                              aria-pressed={dentro}
                              onClick={() => (dentro ? estado.remover(c.slug) : estado.adicionar(c.slug))}
                              className={`shrink-0 rounded-control p-2 transition-colors active:translate-y-px ${
                                dentro ? "bg-accent text-accent-on" : "border border-line-strong text-fg hover:border-fg"
                              }`}
                            >
                              {dentro ? <Check size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
            </div>
          </div>
        );
      }}
    </CascaLayout>
  );
}
