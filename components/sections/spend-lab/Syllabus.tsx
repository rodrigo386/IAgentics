import { Reveal } from "@/components/ui/Reveal";
import { spendLab } from "@/lib/content";

/**
 * A ementa das oito semanas.
 *
 * O entregável de cada semana ganha destaque próprio, em placa com filete, em vez
 * de virar mais uma linha do parágrafo. É o que responde a pergunta que um
 * comprador de treinamento faz de verdade: "no fim de cada semana eu saio com o
 * quê na mão?". Enterrar isso no corpo do texto desperdiça o melhor argumento
 * desta página.
 *
 * A numeração fica porque é sequência real - semana 3 vem depois da 2.
 */
export function SpendLabSyllabus() {
  return (
    <section className="border-t border-line py-24 sm:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">
            {spendLab.syllabus.kicker}
          </p>
          <h2 className="mt-6 max-w-[16ch] text-4xl font-medium tracking-[-0.03em] text-fg sm:text-5xl lg:text-6xl">
            {spendLab.syllabus.title}
          </h2>
          <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-fg-muted">
            {spendLab.syllabus.lead}
          </p>
        </Reveal>

        <ol className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2">
          {spendLab.syllabus.items.map((item, i) => (
            <Reveal key={item.name}>
              <li className="flex h-full flex-col border border-line bg-surface p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-text">
                  Semana {i + 1}
                </p>
                <h3 className="mt-3 text-xl font-medium leading-snug tracking-[-0.02em] text-fg">
                  {item.name}
                </h3>
                <p className="mt-3 leading-relaxed text-fg-muted">{item.body}</p>
                <p className="mt-auto flex flex-wrap items-baseline gap-2 border-t border-line pt-5 text-sm">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-fg-muted">
                    Entregável
                  </span>
                  <span className="font-medium text-fg">{item.deliverable}</span>
                </p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
