"use client";
import { ShoppingBagOpen } from "@phosphor-icons/react";
import { catalogo as t } from "@/lib/content";
import { DESCONTO_MAXIMO_PCT, formatarReais } from "@/lib/catalogo/preco";
import type { Carrinho } from "./useCarrinho";

/**
 * Barra fixa do carrinho nos layouts da prévia (2026-09-26).
 *
 * O que ela vende é a ESCADA DO DESCONTO: seis degraus, do 1º curso (preço
 * cheio) ao 6º (25% off). Cada curso adicionado acende um degrau — o gatilho
 * "mais um e sai mais barato" fica visível o tempo todo, não só no carrinho.
 */
export const DEGRAUS = [0, 5, 10, 15, 20, 25];

type Props = { estado: Carrinho; aoVerCarrinho: () => void; aoMontarTrilha: () => void };

export function BarraCarrinho({ estado, aoVerCarrinho, aoMontarTrilha }: Props) {
  const { carrinho } = estado;
  // A escada é dos avulsos; o total de cursos soma também os que vêm nos packs.
  const n = carrinho.itens.length;
  const totalCursos = n + carrinho.packs.reduce((s, p) => s + p.cursos, 0);

  return (
    <aside
      aria-label={t.barra.rotulo}
      className="fixed inset-x-0 bottom-0 z-[var(--z-overlay)] border-t border-line bg-bg/90 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-5 py-3 sm:gap-6 sm:px-8">
        {/* Escada do desconto em miniatura: degraus crescem da esquerda para a direita. */}
        <div className="hidden items-end gap-1 sm:flex" aria-hidden="true">
          {DEGRAUS.map((pct, i) => (
            <span
              key={pct}
              className={`degrau block w-3 ${i < n ? "degrau-aceso bg-accent" : "bg-line-strong"}`}
              style={{ height: `${10 + i * 5}px` }}
            />
          ))}
        </div>

        <div className="min-w-0 flex-1">
          {totalCursos === 0 ? (
            <p className="truncate text-sm text-fg">{t.barra.vazio}</p>
          ) : (
            <>
              <p className="text-sm text-fg">
                <span className="font-medium">{t.barra.cursos(totalCursos)}</span>
                <span className="tnum ml-3 text-fg-muted">{formatarReais(carrinho.totalCentavos)}</span>
              </p>
              <p className="truncate text-xs text-accent-text" aria-live="polite">
                {carrinho.proximo && carrinho.proximo.descontoPct > (carrinho.itens.at(-1)?.descontoPct ?? 0)
                  ? t.barra.proximo(carrinho.proximo.descontoPct)
                  : carrinho.itens.at(-1)?.descontoPct === DESCONTO_MAXIMO_PCT
                    ? t.barra.teto
                    : null}
              </p>
            </>
          )}
        </div>

        {totalCursos === 0 ? (
          <button
            type="button"
            onClick={aoMontarTrilha}
            className="shrink-0 rounded-control bg-accent px-5 py-2.5 text-sm font-medium text-accent-on transition-colors hover:bg-accent-hover active:translate-y-px"
          >
            {t.barra.montar}
          </button>
        ) : (
          <button
            type="button"
            onClick={aoVerCarrinho}
            className="inline-flex shrink-0 items-center gap-2 rounded-control bg-accent px-5 py-2.5 text-sm font-medium text-accent-on transition-colors hover:bg-accent-hover active:translate-y-px"
          >
            <ShoppingBagOpen size={18} weight="regular" aria-hidden="true" />
            {t.barra.ver}
          </button>
        )}
      </div>
    </aside>
  );
}
