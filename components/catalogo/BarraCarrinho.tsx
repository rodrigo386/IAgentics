"use client";
import { ShoppingBagOpen } from "@phosphor-icons/react";
import { catalogo as t } from "@/lib/content";
import { formatarReais } from "@/lib/catalogo/preco";
import type { Carrinho } from "./useCarrinho";

/**
 * Barra fixa do carrinho da Vitrine (2026-09-26): quantos cursos, quanto custa
 * e quanto a pessoa economiza (pack e promoção de lançamento). Até 2026-10-02
 * ela mostrava a escada de desconto por quantidade, que saiu com a regra.
 */

type Props = { estado: Carrinho; aoVerCarrinho: () => void; aoMontarTrilha: () => void };

export function BarraCarrinho({ estado, aoVerCarrinho, aoMontarTrilha }: Props) {
  const { carrinho } = estado;
  // O total de cursos soma os avulsos e os que vêm nos packs.
  const totalCursos = carrinho.itens.length + carrinho.packs.reduce((s, p) => s + p.cursos, 0);

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
