import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { AutoplayVideo } from "@/components/ui/AutoplayVideo";
import { spendLab } from "@/lib/content";

/**
 * Capa do IA Spend Lab, com o vídeo de cabeçalho de vocês ao fundo.
 *
 * Semântica corrigida em relação ao site atual: lá o <h1> é "IA Spend Lab" e a
 * frase "Implemente IA com Mente, Método e Cultura" não é cabeçalho nenhum.
 * Aqui o nome do produto é kicker e a frase é o h1 - é ela que diz o que a
 * página oferece.
 *
 * O vídeo é decoração: sem controles, fora da árvore de acessibilidade, com véu
 * de ink por cima. Sem o véu, o texto claro dependeria do quadro que estivesse
 * passando, e contraste não é loteria.
 */
export function SpendLabCover() {
  const { hero } = spendLab;

  return (
    <section className="relative isolate flex min-h-[calc(100dvh-4rem)] flex-col justify-center overflow-hidden border-b border-line py-16 lg:py-20">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <AutoplayVideo
          src={hero.videoSrc}
          poster={hero.videoPoster}
          label=""
          hideControls
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-brand-ink/[0.9]" />
      </div>

      <div className="mx-auto w-full max-w-[1400px] px-5 text-brand-paper sm:px-8">
        {/* O lockup da Academy, como no site de vocês: o Spend Lab é um produto da
            Academy e a capa diz isso antes de qualquer outra coisa. Vai como
            máscara e não como <img>, então assume a cor do texto - o arquivo é
            cinza-claro sobre transparência e sobre o véu escuro ele precisa ser
            papel cheio, não cinza. */}
        <span
          role="img"
          aria-label="IAgentics Academy"
          className="hero-fade block aspect-[893/254] w-[150px] sm:w-[180px]"
          style={{
            animationDelay: "40ms",
            WebkitMaskImage: `url(${hero.logo})`,
            maskImage: `url(${hero.logo})`,
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "left center",
            maskPosition: "left center",
            backgroundColor: "currentColor",
          }}
        />

        <p
          className="hero-fade mt-8 font-mono text-[11px] uppercase tracking-[0.2em] opacity-70"
          style={{ animationDelay: "60ms" }}
        >
          {hero.kicker}
        </p>

        <h1 className="mt-6 max-w-[18ch] text-[min(10vw,3.25rem)] font-medium leading-[1.06] tracking-[-0.04em] sm:text-[min(8vw,4.75rem)] lg:text-[min(5.5vw,5.5rem)]">
          <span className="block overflow-hidden pb-[0.14em]">
            <span className="hero-line block" style={{ animationDelay: "140ms" }}>
              {hero.headline}
            </span>
          </span>
        </h1>

        <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">
          <p
            className="hero-fade text-lg leading-relaxed opacity-90 sm:text-xl lg:col-span-6"
            style={{ animationDelay: "300ms" }}
          >
            {hero.subtext}
          </p>

          <div
            className="hero-fade flex flex-wrap items-start gap-3 lg:col-span-5 lg:col-start-8"
            style={{ animationDelay: "380ms" }}
          >
            <a
              href="#contato"
              className="group inline-flex items-center gap-2 rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-[background-color,transform] duration-200 hover:bg-accent-hover active:scale-[0.98]"
            >
              <span className="whitespace-nowrap">{hero.ctaPrimary}</span>
              <ArrowRight
                size={17}
                weight="regular"
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </a>
            <a
              href="#contato"
              className="inline-flex items-center rounded-control border px-7 py-3.5 font-medium transition-colors duration-200 active:scale-[0.98]"
              style={{ borderColor: "rgb(248 248 248 / 0.4)" }}
            >
              <span className="whitespace-nowrap">{hero.ctaSecondary}</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
