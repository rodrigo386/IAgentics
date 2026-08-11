import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { Marquee } from "@/components/ui/Marquee";
import { AcademyHeroCarousel } from "@/components/sections/academy/HeroCarousel";
import { academy } from "@/lib/content";

/**
 * Capa do Academy. Título, subtítulo e kicker são os do site de vocês, verbatim.
 *
 * O hero gira os três títulos, como no site de vocês. O carrossel em si vive em
 * HeroCarousel.tsx porque precisa de estado; esta seção é o que fica ao redor -
 * o fundo e os três números.
 *
 * Sem kicker acima do título, a pedido do time.
 *
 * O MANIFESTO CORRE NO PÉ DO HERO. As quatro frases vieram da seção de prova,
 * onde já corriam, para dar movimento à primeira tela. É o único elemento em
 * movimento contínuo aqui - o carrossel troca a cada 7s e o resto está parado -
 * então ele carrega a vida da capa sem competir com o título.
 *
 * O RESPIRO DESTA SEÇÃO FOI CORTADO PARA ELE CABER. Uma faixa que corre abaixo
 * da dobra não dá movimento a primeira tela nenhuma - só existe para quem já
 * rolou. Medido: com o respiro anterior a capa ia a 936px numa janela de 900 e
 * o manifesto ficava fora. Quem mexer no py daqui, remeça a dobra.
 *
 * Regra que este arquivo aprendeu na marra e que vale para o carrossel também:
 * `max-w` em `ch` e `text-` precisam viver no MESMO elemento, porque `ch` resolve
 * contra o font-size do próprio nó. Separados, o título quebra no meio das palavras.
 */
export function AcademyCover() {
  return (
    <section className="academy-cover relative isolate flex min-h-[calc(100dvh-4rem)] flex-col justify-center overflow-hidden border-b border-line py-10 lg:py-14">
      <div className="cover-aurora -z-10" aria-hidden="true" />
      <div className="cover-grain -z-10" aria-hidden="true" />

      <div className="mx-auto w-full max-w-[1400px] px-5 sm:px-8">
        <div>
          <AcademyHeroCarousel />
        </div>

        {/* CTA da plataforma, no lugar dos três números. Uma faixa com filete em
            cima e embaixo: o mesmo recurso de agrupar por régua que o resto do
            site usa, sem virar um card solto na capa. */}
        <div
          className="hero-fade mt-10 flex flex-col gap-5 border-y border-line-strong py-7 sm:flex-row sm:items-center sm:justify-between"
          style={{ animationDelay: "460ms" }}
        >
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent-text">
              {academy.platform.label}
            </p>
            <p className="mt-3 max-w-[42ch] text-lg text-fg sm:text-xl">
              {academy.platform.body}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <a
              href={academy.platform.href}
              className="group inline-flex items-center gap-2 rounded-control border border-line-strong px-7 py-3.5 font-medium text-fg transition-colors duration-200 hover:border-fg active:scale-[0.98]"
            >
              <span className="whitespace-nowrap">{academy.platform.cta}</span>
              <ArrowRight
                size={17}
                weight="regular"
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </a>

            {/* Sem endereço ainda. Um <button disabled> em vez de um link morto:
                botão que parece clicável e não faz nada é o mesmo defeito do
                formulário que não envia. A marca "em breve" diz o porquê, e o
                cursor `not-allowed` confirma antes do clique. Preencher
                `appHref` em content.ts troca isto por um link de verdade. */}
            {academy.platform.appHref ? (
              <a
                href={academy.platform.appHref}
                className="group inline-flex items-center gap-2 rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-[background-color,transform] duration-200 hover:bg-accent-hover active:scale-[0.98]"
              >
                <span className="whitespace-nowrap">{academy.platform.appLabel}</span>
                <ArrowUpRight
                  size={17}
                  weight="regular"
                  className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex cursor-not-allowed items-center gap-3 rounded-control border border-line px-7 py-3.5 font-medium text-fg-muted"
              >
                <span className="whitespace-nowrap">{academy.platform.appLabel}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em]">
                  em breve
                </span>
              </button>
            )}
          </div>
        </div>

        {/* O manifesto, correndo no pé da capa. */}
        <div className="hero-manifesto hero-fade mt-10" style={{ animationDelay: "540ms" }}>
          <Marquee duration="34s" gap="gap-0" className="border-y border-line-strong py-5">
            {academy.manifesto.map((frase) => (
              <span
                key={frase}
                className="flex shrink-0 items-center gap-10 whitespace-nowrap pr-10 text-xl font-medium tracking-[-0.02em] text-fg sm:text-2xl lg:text-3xl"
              >
                {frase}
                <span aria-hidden="true" className="text-accent-text">
                  ·
                </span>
              </span>
            ))}
          </Marquee>
        </div>
      </div>
    </section>
  );
}
