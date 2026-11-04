import { Quotes } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/ui/Reveal";
import { cursos } from "@/lib/content";

/**
 * Depoimento escrito de quem concluiu um curso (2026-11-04). Um só, grande,
 * em <figure> com <blockquote>: na /cursos fica antes de "Como funciona" e na
 * /bolsas antes da inscrição, perto da decisão.
 */
const t = cursos.depoimentoAluna;

export function DepoimentoAluna() {
  return (
    <section aria-label={`${t.eyebrow}: ${t.nome}, ${t.cargo} na ${t.empresa}`} className="border-t border-line py-20 sm:py-28">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 px-5 sm:px-8 lg:grid-cols-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-fg-muted lg:col-span-3">{t.eyebrow}</p>
        <Reveal className="lg:col-span-9">
          <figure>
            <Quotes size={44} weight="fill" aria-hidden="true" className="text-accent-text" />
            <blockquote className="mt-6 max-w-[48ch] text-xl font-medium leading-snug tracking-[-0.02em] text-fg sm:text-2xl lg:text-3xl">
              <p>{t.citacao}</p>
            </blockquote>
            <figcaption className="mt-8 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-lg font-medium text-fg">{t.nome}</span>
              <span className="text-fg-muted">
                {t.cargo} · {t.empresa}
              </span>
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
