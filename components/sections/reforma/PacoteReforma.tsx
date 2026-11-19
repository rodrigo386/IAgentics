import Link from "next/link";
import { pacoteReforma as t } from "@/lib/content";

/**
 * Faixa do pacote "Reforma Tributária para Compras" (2026-11-19): fica no topo
 * da calculadora e da consulta de NCM, com as ferramentas lado a lado e a
 * página atual marcada (aria-current), para quem chega por uma ver o conjunto.
 * Componente de servidor, sem estado.
 */
export function PacoteReforma({ atual }: { atual: (typeof t.itens)[number]["id"] }) {
  return (
    <nav aria-label={t.rotulo} className="border-b border-line bg-surface">
      <div className="mx-auto max-w-[1400px] px-5 py-4 sm:px-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.nome}</p>
        <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-3 sm:gap-2">
          {t.itens.map((i) => {
            const aqui = i.id === atual;
            return (
              <li key={i.id}>
                <Link
                  href={i.rota}
                  aria-current={aqui ? "page" : undefined}
                  className={`flex h-full flex-col gap-0.5 border px-4 py-2.5 transition-colors sm:py-3 ${aqui ? "border-accent bg-accent/[0.06]" : "border-line bg-bg hover:border-fg"}`}
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="font-medium text-fg">{i.titulo}</span>
                    {aqui ? <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent-text">{t.atual}</span> : null}
                  </span>
                  <span className="hidden text-sm text-fg-muted sm:block">{i.texto}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
