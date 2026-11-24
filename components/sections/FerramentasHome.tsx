import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { ferramentasHome as t } from "@/lib/content";

/**
 * As ferramentas gratuitas na home (2026-11-24): calculadora da Reforma,
 * consulta de NCM e Diagnose de Compras. A página mais forte do site passa a
 * apontar para as que trazem busca orgânica. Mesmo desenho dos artigos
 * relacionados, logo abaixo. Só na versão em português.
 */
export function FerramentasHome() {
  return (
    <section aria-labelledby="ferramentas-home" className="border-t border-line py-20 sm:py-24">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.eyebrow}</p>
        <h2 id="ferramentas-home" className="mt-4 max-w-[28ch] text-2xl font-medium tracking-[-0.03em] text-fg sm:text-3xl">
          {t.titulo}
        </h2>
        <ul className="mt-10 grid grid-cols-1 gap-x-8 md:grid-cols-3">
          {t.itens.map((f) => (
            <li key={f.rota} className="border-t border-line-strong">
              <Link href={f.rota} className="group flex h-full flex-col gap-3 py-8">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent-text">{f.etiqueta}</p>
                <h3 className="text-xl font-medium tracking-[-0.02em] text-fg transition-colors duration-200 group-hover:text-accent-text">
                  {f.titulo}
                </h3>
                <p className="text-fg-muted">{f.texto}</p>
                <p className="mt-auto inline-flex items-center gap-2 pt-2 text-base font-medium text-accent-text">
                  {t.abrir}
                  <ArrowRight size={18} aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1" />
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
