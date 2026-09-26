"use client";
import { useState } from "react";
import { catalogo as t } from "@/lib/content";
import { formatarReais } from "@/lib/catalogo/preco";
import { PainelCarrinho } from "./PainelCarrinho";
import { Trilha } from "./Trilha";
import { useCarrinho } from "./useCarrinho";

/**
 * Catálogo em grade + carrinho lateral (2026-09-22) — o layout "atual" da
 * prévia. O estado do carrinho vem de useCarrinho e o carrinho/checkout de
 * PainelCarrinho, compartilhados com os layouts Vitrine, Jornada e Mural.
 */

const ROTULO = "font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted";
const BOTAO_CHEIO =
  "rounded-control bg-accent px-6 py-3 font-medium text-accent-on transition-colors hover:bg-accent-hover active:translate-y-px disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none";
const BOTAO_CONTORNO =
  "rounded-control border border-line-strong px-6 py-3 font-medium text-fg transition-colors hover:border-fg active:translate-y-px motion-reduce:transition-none";

type Props = { precoBaseCentavos: number; urlCheckout: string };

export function Catalogo({ precoBaseCentavos, urlCheckout }: Props) {
  const estado = useCarrinho(precoBaseCentavos);
  const { carrinho, noCarrinho } = estado;
  // null = todos os níveis. Com 63 cursos, a grade inteira não se navega.
  const [nivel, setNivel] = useState<number | null>(null);

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="flex flex-col gap-8 lg:col-span-8 lg:self-start">
        <Trilha precoBaseCentavos={precoBaseCentavos} aoAplicar={estado.aplicarTrilha} />

        <div role="group" aria-label={t.filtro.rotulo} className="flex flex-wrap gap-2">
          {[null, 0, 1, 2, 3].map((n) => (
            <button
              key={String(n)}
              type="button"
              aria-pressed={nivel === n}
              onClick={() => setNivel(n)}
              className={`rounded-control border px-4 py-2 text-sm transition-colors motion-reduce:transition-none ${
                nivel === n ? "border-accent bg-accent text-accent-on" : "border-line-strong text-fg hover:border-fg"
              }`}
            >
              {n === null ? t.filtro.todos : t.niveis[n]}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {t.cursos
            .filter((c) => nivel === null || c.nivel === nivel)
            .map((c) => {
              const dentro = noCarrinho.has(c.slug);
              return (
                /* Borda violeta como indicador de estado — uso sancionado da trava
                   de cor; o fundo do card não muda, então o acento continua único. */
                <article
                  key={c.slug}
                  className={`flex flex-col border bg-surface p-5 transition-colors duration-300 motion-reduce:transition-none ${
                    dentro ? "border-accent" : "border-line"
                  }`}
                >
                  {/* O introdutório leva o selo no lugar do nível: é por ele que toda trilha começa. */}
                  <p className={c.introdutorio ? `${ROTULO} text-accent-text` : ROTULO}>
                    {c.introdutorio ? t.introdutorio : t.niveis[c.nivel]}
                  </p>
                  <h3 className="mt-2 text-lg font-medium tracking-[-0.01em] text-fg">{c.nome}</h3>
                  <p className="mt-2 text-sm text-fg-muted">{c.temas.map((tema) => t.temas[tema]).join(" · ")}</p>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
                    {dentro ? (
                      <button
                        type="button"
                        aria-label={`${t.card.remover} ${c.nome}`}
                        onClick={() => estado.remover(c.slug)}
                        className={`${BOTAO_CONTORNO} px-4 py-2 text-sm`}
                      >
                        {t.card.remover}
                      </button>
                    ) : (
                      <>
                        <span className="tnum text-sm text-fg">
                          {t.card.entraPor(formatarReais(carrinho.proximo!.precoCentavos))}
                        </span>
                        <button
                          type="button"
                          aria-label={`${t.card.adicionar} ${c.nome}`}
                          onClick={() => estado.adicionar(c.slug)}
                          className={`${BOTAO_CHEIO} px-4 py-2 text-sm`}
                        >
                          {t.card.adicionar}
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
        </div>
      </div>

      <aside
        aria-label={t.carrinho.titulo}
        className="border border-line bg-surface p-6 lg:sticky lg:top-24 lg:col-span-4 lg:self-start"
      >
        <PainelCarrinho estado={estado} precoBaseCentavos={precoBaseCentavos} urlCheckout={urlCheckout} />
      </aside>
    </div>
  );
}
