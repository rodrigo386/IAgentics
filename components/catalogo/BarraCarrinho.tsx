"use client";
import { ShoppingBagOpen } from "@phosphor-icons/react";
import { catalogo as t } from "@/lib/content";
import { formatarReais } from "@/lib/catalogo/preco";
import type { Carrinho } from "./useCarrinho";

/**
 * Barra fixa do carrinho da Vitrine (2026-09-26): quantos cursos, quanto custa
 * e quanto a pessoa economiza (promoção de lançamento). Até 2026-10-02 ela
 * mostrava também a escada de desconto e os packs, que saíram.
 */

type Props = { estado: Carrinho; aoVerCarrinho: () => void };

export function BarraCarrinho({ estado, aoVerCarrinho }: Props) {
  const { carrinho } = estado;
  const totalCursos = carrinho.itens.length;

  return (
    <aside
      aria-label={t.barra.rotulo}
      className="fixed inset-x-0 bottom-0 z-[var(--z-overlay)] border-t border-line bg-bg/90 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-5 py-3 sm:gap-6 sm:px-8">
        <div className="min-w-0 flex-1">
          {totalCursos === 0 ? (
            <p className="truncate text-sm text-fg">{t.barra.vazio}</p>
          ) : (
            <>
              <p className="text-sm text-fg">
                <span className="font-medium">{t.barra.cursos(totalCursos)}</span>
                <span className="tnum ml-3 text-fg-muted">{formatarReais(carrinho.totalCentavos)}</span>
              </p>
              {carrinho.cheioCentavos > carrinho.totalCentavos ? (
                <p className="truncate text-xs text-accent-text" aria-live="polite">
                  {t.carrinho.economia(formatarReais(carrinho.cheioCentavos - carrinho.totalCentavos))}
                </p>
              ) : null}
            </>
          )}
        </div>

        {/* Sem curso no carrinho não há o que ver: a barra só convida a escolher. */}
        {totalCursos === 0 ? null : (
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
