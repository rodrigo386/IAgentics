import { Reveal } from "@/components/ui/Reveal";
import { spendLab } from "@/lib/content";

/**
 * Os quatro pilares. Vinham dentro de Method.tsx junto com os parceiros e os oito
 * passos; saíram porque a ordem do site de vocês separa os três - entre os pilares
 * e os passos existem a ementa das 8 semanas, o vídeo e os parceiros. Três seções
 * num arquivo só impediam intercalar as outras.
 *
 * A NUMERAÇÃO AQUI DIZ ALGO VERDADEIRO, e por isso fica. Nas outras páginas deste
 * site eu tirei fólios numerados de listas que eram cardápio, não sequência -
 * Cursos, Imersões, Palestras e Mentoria não têm ordem. Estes têm: não se faz
 * Transformação Digital antes da Diagnose. O número é informação, não decoração.
 */
export function SpendLabPillars() {
  return (
    <section className="border-t border-line py-24 sm:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal>
          <h2 className="max-w-[18ch] text-4xl font-medium tracking-[-0.03em] text-fg sm:text-5xl lg:text-6xl">
            {spendLab.pillars.title}
          </h2>
        </Reveal>

        <ol className="mt-14 grid grid-cols-1 gap-x-10 sm:grid-cols-2 lg:grid-cols-4">
          {spendLab.pillars.items.map((item, i) => (
            <Reveal key={item.name}>
              <li className="border-t border-line-strong py-7">
                <span className="font-mono text-[11px] text-accent-text tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-2xl font-medium tracking-[-0.02em] text-fg">
                  {item.name}
                </h3>
                <p className="mt-2 leading-relaxed text-fg-muted">{item.body}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
