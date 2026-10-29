import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { academy } from "@/lib/content";

/**
 * Faixa da assinatura no fim da /academy (2026-10-29, item 2 da análise de
 * performance da /cursos): a página vende formação in company, e quem chega
 * até aqui querendo estudar sozinho não tinha caminho para a assinatura além
 * do botão da capa.
 */
export function AcademyAssinatura() {
  const t = academy.assinatura;
  return (
    <section aria-labelledby="academy-assinatura" className="border-t border-line py-16 sm:py-20">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 id="academy-assinatura" className="text-2xl font-medium tracking-[-0.02em] text-fg sm:text-3xl">
            {t.titulo}
          </h2>
          <p className="mt-3 max-w-[60ch] text-lg leading-relaxed text-fg-muted">{t.texto}</p>
        </div>
        <Link
          href="/cursos"
          className="group inline-flex shrink-0 items-center gap-2 self-start rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-colors hover:bg-accent-hover lg:self-center"
        >
          {t.cta}
          <ArrowRight size={17} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}
