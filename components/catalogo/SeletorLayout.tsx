import Link from "next/link";
import { catalogo as t } from "@/lib/content";

/**
 * Faixa da prévia para alternar entre as opções de layout (2026-09-26). Só
 * existe enquanto o Rodrigo escolhe; some junto com as opções descartadas.
 */
export function SeletorLayout({ atual }: { atual: string }) {
  return (
    <nav aria-label={t.opcoes.rotulo} className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 overflow-x-auto px-5 py-3 sm:px-8">
        <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">{t.opcoes.rotulo}</span>
        {t.opcoes.lista.map((o) => (
          <Link
            key={o.href}
            href={o.href}
            aria-current={o.href === atual ? "page" : undefined}
            className={`shrink-0 rounded-control border px-4 py-1.5 text-sm transition-colors ${
              o.href === atual ? "border-accent bg-accent text-accent-on" : "border-line-strong text-fg hover:border-fg"
            }`}
          >
            {o.nome}
          </Link>
        ))}
      </div>
    </nav>
  );
}
