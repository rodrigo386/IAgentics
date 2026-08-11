import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { AutoplayVideo } from "@/components/ui/AutoplayVideo";
import { Reveal } from "@/components/ui/Reveal";
import { academy } from "@/lib/content";

/**
 * Pilares e a faixa "Para Empresas". Os formatos saíram para Formats.tsx quando
 * viraram tipografia cinética e passaram a precisar de estado. O manifesto
 * também não está aqui: corre no hero. Houve um período em que aparecia nos dois lugares - eu criei o
 * marquee e esqueci de apagar a lista empilhada que existia antes.
 *
 * Duas correções de conteúdo: "Prazer em ensinar" é uma LISTA de cinco itens no
 * original (eu havia colado tudo numa frase), e "Desenhe junto conosco a solução"
 * é o título da seção PARA EMPRESAS, não o dos formatos - os formatos têm título
 * próprio, "Uma experiência para transformar pessoas, processos & negócios".
 *
 * "PARA EMPRESAS" é uma FAIXA COM VÍDEO no site de vocês - o `empresas-bg.mp4`,
 * cujo nome se refere a esta seção e não à faixa de clientes, onde eu o tinha
 * posto por dedução. Medi a posição dele no site real e trouxe para cá.
 *
 * O vídeo é decoração: sem controles, `aria-hidden`, com véu de ink por cima.
 * Sem o véu o texto claro cairia sobre uma cena de palestra bem iluminada e o
 * contraste dependeria do quadro que estivesse passando.
 */
export function AcademyApproach() {
  return (
    <>
      <section className="border-t border-line py-24 sm:py-32">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">
              {academy.pillars.kicker}
            </p>
            <h2 className="mt-6 max-w-[16ch] text-4xl font-medium tracking-[-0.03em] text-fg sm:text-5xl lg:text-6xl">
              {academy.pillars.title}
            </h2>
          </Reveal>

          <ul className="mt-14 grid grid-cols-1 gap-x-12 sm:grid-cols-2">
            {academy.pillars.items.map((pillar) => (
              <Reveal key={pillar.name}>
                <li className="border-t border-line-strong py-7">
                  <h3 className="text-2xl font-medium tracking-[-0.02em] text-fg">
                    {pillar.name}
                  </h3>
                  {pillar.body ? (
                    <p className="mt-2 max-w-[46ch] leading-relaxed text-fg-muted">
                      {pillar.body}
                    </p>
                  ) : null}
                  {pillar.list ? (
                    <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-fg-muted">
                      {pillar.list.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              </Reveal>
            ))}
          </ul>

        </div>
      </section>

      {/* A faixa com vídeo. Full bleed, como no site de vocês. */}
      <section className="relative isolate overflow-hidden py-24 sm:py-32">
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <AutoplayVideo
            src="/academy/empresas-bg.mp4"
            label=""
            hideControls
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-brand-ink/[0.82]" />
        </div>

        <div className="mx-auto max-w-[1400px] px-5 text-brand-paper sm:px-8">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] opacity-70">
              {academy.enterprise.kicker}
            </p>
            <h2 className="mt-6 max-w-[16ch] text-4xl font-medium tracking-[-0.03em] sm:text-5xl lg:text-6xl">
              {academy.enterprise.title}
            </h2>
            <a
              href="#contato"
              className="group mt-10 inline-flex items-center gap-2 rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-[background-color,transform] duration-200 hover:bg-accent-hover active:scale-[0.98]"
            >
              <span className="whitespace-nowrap">{academy.enterprise.cta}</span>
              <ArrowRight
                size={17}
                weight="regular"
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </a>
          </Reveal>
        </div>
      </section>

    </>
  );
}
