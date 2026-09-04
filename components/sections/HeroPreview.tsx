import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { OrquestradorGraph } from "@/components/ui/OrquestradorGraph";
import { PartnersRow } from "@/components/ui/PartnersRow";
import { hero, homePreview, cta, partners } from "@/lib/content";

/**
 * Hero da PRÉVIA da home: a Hero oficial (Hero.tsx) com duas trocas — o grafo
 * dos cinco agentes vira o grafo do orquestrador com os nove módulos, e o
 * subtexto deixa de falar de "suprimentos". Manchete, filete, CTAs e faixa de
 * parceiros são os mesmos, com os mesmos atrasos de animação.
 *
 * O link "Nexo App" sob o grafo (que na home vive dentro do AgentGraph) é
 * reproduzido aqui, porque o OrquestradorGraph não o carrega — na /nexo ele
 * seria um link para a própria página.
 */
export function HeroPreview() {
  return (
    <section id="topo" className="relative flex min-h-[100dvh] flex-col overflow-hidden pb-14 pt-24">
      <div className="flex flex-1 items-center">
        <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 items-center gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <h1 className="font-medium tracking-[-0.03em] text-fg">
              {hero.headline.map((line, i) => (
                <span key={line} className="block overflow-hidden pb-[0.08em]">
                  <span
                    className="hero-line block whitespace-nowrap text-[min(5.6vw,1.9rem)] leading-[1.1] sm:text-[min(5vw,2.6rem)] lg:text-[min(3.5vw,3.2rem)]"
                    style={{ animationDelay: `${60 + i * 80}ms` }}
                  >
                    {line}
                  </span>
                </span>
              ))}
            </h1>

            <div
              className="hero-fade mt-8 h-px w-full max-w-[420px] bg-[linear-gradient(90deg,var(--brand-violet),var(--brand-indigo),var(--brand-periwinkle),var(--brand-blue),var(--brand-sky))]"
              style={{ animationDelay: "240ms" }}
            />

            <p className="hero-fade mt-8 max-w-[52ch] text-base leading-relaxed text-fg-muted sm:text-lg" style={{ animationDelay: "300ms" }}>
              {homePreview.hero.subtext}
            </p>

            <div className="hero-fade mt-10 flex flex-wrap items-center gap-3" style={{ animationDelay: "380ms" }}>
              <a
                href="#contato"
                className="group inline-flex items-center gap-2 rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-[background-color,transform] duration-200 hover:bg-accent-hover active:scale-[0.98]"
              >
                <span className="whitespace-nowrap">{cta.contact}</span>
                <ArrowRight size={17} weight="regular" className="transition-transform duration-300 group-hover:translate-x-1" />
              </a>
              <a
                href="#solucoes"
                className="inline-flex items-center rounded-control border border-line-strong px-7 py-3.5 font-medium text-fg transition-colors duration-200 hover:border-fg active:scale-[0.98]"
              >
                <span className="whitespace-nowrap">{cta.solutions}</span>
              </a>
            </div>
          </div>

          <div className="hero-fade relative lg:col-span-5 lg:pr-6" style={{ animationDelay: "180ms" }}>
            <OrquestradorGraph />
            {/* O nome do produto sob o grafo, como na home: link, e com cara de
                link — mesmo idioma de seta que os CTAs. Escala atrelada ao H1
                (~80%), pelo motivo documentado no AgentGraph. */}
            <div className="hero-fade mt-4 flex justify-center" style={{ animationDelay: "260ms" }}>
              <a
                href="/nexo"
                className="group inline-flex items-center gap-[0.35em] text-[min(4.5vw,1.5rem)] font-medium uppercase tracking-[0.02em] text-fg transition-colors duration-200 hover:text-accent-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-text motion-reduce:transition-none sm:text-[min(4vw,2.1rem)] lg:text-[min(2.8vw,2.6rem)]"
              >
                {hero.product}
                <ArrowRight
                  weight="regular"
                  aria-hidden="true"
                  className="size-[0.62em] shrink-0 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
                />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="hero-fade mt-8 shrink-0" style={{ animationDelay: "460ms" }}>
        <p className="mx-auto mb-4 w-full max-w-[1400px] px-5 font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted sm:px-8">
          {partners.label}
        </p>
        <PartnersRow />
      </div>
    </section>
  );
}
