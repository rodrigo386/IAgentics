import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/ui/Reveal";
import { spendLab } from "@/lib/content";

/**
 * "Como funciona IA Spend Lab?" - os oito passos e o CTA do diagnóstico.
 *
 * Este arquivo carregava três seções (pilares, parceiros e passos). Elas foram
 * separadas em Pillars.tsx e Partners.tsx porque a ordem do site de vocês intercala
 * outras duas seções entre elas.
 *
 * A numeração fica pelo mesmo motivo dos pilares: é sequência de verdade. Ninguém
 * monta o comitê de priorização antes do diagnóstico.
 */
export function SpendLabMethod() {
  return (
    <section className="border-t border-line py-24 sm:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal>
          <h2 className="max-w-[16ch] text-4xl font-medium tracking-[-0.03em] text-fg sm:text-5xl lg:text-6xl">
            {spendLab.method.title}
          </h2>
        </Reveal>

        <ol className="mt-16">
          {spendLab.method.items.map((item, i) => (
            <Reveal key={item.name}>
              <li className="grid grid-cols-1 gap-2 border-t border-line-strong py-7 lg:grid-cols-12 lg:gap-8 lg:py-8">
                <span className="font-mono text-[11px] text-accent-text tabular-nums lg:col-span-1">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-xl font-medium tracking-[-0.02em] text-fg sm:text-2xl lg:col-span-4">
                  {item.name}
                </h3>
                <p className="max-w-[62ch] leading-relaxed text-fg-muted lg:col-span-7">
                  {item.body}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>

        <Reveal className="mt-12 border-t border-line-strong pt-12">
          {/* Largura total no celular, pílula inline a partir de sm.
              MEDIDO: "Quero o diagnóstico da minha empresa" com whitespace-nowrap
              dava 382px de botão numa coluna de 350px, e os 12px de sobra faziam a
              PÁGINA INTEIRA rolar de lado - o scrollWidth do documento ia a 402 em
              390 de tela. Defeito antigo, não veio da reorganização, mas está numa
              seção que eu mexi e um botão que empurra a página não fica.
              Deixar quebrar em duas linhas é feio; rolagem horizontal é pior. */}
          <a
            href="#contato"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-control bg-accent px-7 py-3.5 text-center font-medium text-accent-on transition-[background-color,transform] duration-200 hover:bg-accent-hover active:scale-[0.98] sm:w-auto"
          >
            <span className="sm:whitespace-nowrap">{spendLab.method.cta}</span>
            <ArrowRight
              size={17}
              weight="regular"
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
