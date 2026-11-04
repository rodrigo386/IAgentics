import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { artigosRelacionados } from "@/lib/artigos";
import { artigos as t } from "@/lib/content";

/**
 * Três artigos no pé das páginas de solução e da home (2026-11-04). Os links
 * das páginas mais fortes do site são o que leva o Google aos artigos e à
 * /artigos; o critério de escolha está em `artigosRelacionados`.
 */
export function ArtigosRelacionados({ pagina }: { pagina: keyof typeof t.relacionados.titulos }) {
  const lista = artigosRelacionados(pagina === "home" ? undefined : pagina);
  if (lista.length === 0) return null;
  return (
    <section aria-labelledby="artigos-relacionados" className="border-t border-line py-20 sm:py-24">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.relacionados.eyebrow}</p>
            <h2 id="artigos-relacionados" className="mt-4 max-w-[28ch] text-2xl font-medium tracking-[-0.03em] text-fg sm:text-3xl">
              {t.relacionados.titulos[pagina]}
            </h2>
          </div>
          <Link href="/artigos" className="group inline-flex items-center gap-2 text-base font-medium text-accent-text">
            {t.relacionados.todos}
            <ArrowRight size={18} aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
        <ul className="mt-10 grid grid-cols-1 gap-x-8 md:grid-cols-3">
          {lista.map((a) => (
            <li key={a.slug} className="border-t border-line-strong">
              <Link href={`/artigos/${a.slug}`} className="group flex h-full flex-col gap-3 py-8">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent-text">{a.categoria}</p>
                <h3 className="text-xl font-medium tracking-[-0.02em] text-fg transition-colors duration-200 group-hover:text-accent-text">
                  {a.titulo}
                </h3>
                <p className="line-clamp-3 text-fg-muted">{a.descricao}</p>
                <p className="mt-auto pt-2 font-mono text-sm text-fg-subtle">
                  {a.leitura} {t.rotulos.leitura}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
