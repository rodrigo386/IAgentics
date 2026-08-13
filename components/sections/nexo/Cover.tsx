import Image from "next/image";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { nexoPage, cta } from "@/lib/content";

/**
 * Editorial cover, now carrying the product stage.
 *
 * The type was the whole artwork here: two lines set at up to 120px across the full
 * width, the way a magazine sets a feature title. Bringing product screens up to the
 * cover costs some of that, and the trade is worth naming rather than hiding.
 *
 * THE ARITHMETIC. Three screens stacked in perspective need real width to read as
 * depth rather than a pile - a full-width 120px headline and that stage cannot both
 * fit above the fold. The headline gives: it moves into a 7-column left field and
 * drops to min(6.5vw, 5.5rem), which still reads as a cover line while leaving the
 * right field (5 columns) for the stage.
 *
 * Below lg the two stack, the headline gets the full width back at its original size,
 * and the stage drops under it at a smaller, capped height (.palco-nexo's wrapper) so
 * it never pushes the CTA far down the page.
 *
 * No dark stage here - the decision that shaped this cover was explicit: the FintechX
 * reference composes its layered screens over a dark plinth, but this page keeps the
 * page's own theme (light in light, dark in dark) rather than an inverted section. The
 * gradient glow behind the stage (.palco-nexo-glow, the Nexo violet-to-blue ramp) is
 * what stands in for that staged darkness - present in both themes, tuned to be
 * discreet on paper and legible on ink.
 */
export function NexoCover() {
  const { heroStage } = nexoPage;

  return (
    <section className="relative isolate flex min-h-[calc(100dvh-4rem)] flex-col justify-center overflow-hidden border-b border-line py-16 lg:py-20">
      {/* Abstract ground, built from the brand ramp. */}
      <div className="cover-aurora -z-10" aria-hidden="true" />
      <div className="cover-grain -z-10" aria-hidden="true" />

      <div className="mx-auto w-full max-w-[1400px] px-5 sm:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <div
              className="hero-fade flex items-center gap-4"
              style={{ animationDelay: "60ms" }}
            >
              <Image
                src="/nexo-app-icon.svg"
                alt="Nexo"
                width={64}
                height={64}
                priority
                className="size-12 sm:size-14"
              />
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">
                Nexo
              </span>
            </div>

            <h1 className="mt-8 font-medium tracking-[-0.045em] text-fg">
              <span className="block overflow-hidden pb-[0.16em]">
                <span
                  className="hero-line block whitespace-nowrap text-[min(13vw,4.5rem)] leading-[1.08] sm:text-[min(11vw,6rem)] lg:text-[min(6.5vw,5.5rem)]"
                  style={{ animationDelay: "140ms" }}
                >
                  Agentes de IA
                </span>
              </span>
              {/* The indent is the editorial move: the second line hangs off the first. */}
              <span className="block overflow-hidden pb-[0.16em] lg:pl-[16%]">
                <span
                  className="hero-line block whitespace-nowrap text-[min(13vw,4.5rem)] leading-[1.08] sm:text-[min(11vw,6rem)] lg:text-[min(6.5vw,5.5rem)]"
                  style={{ animationDelay: "230ms" }}
                >
                  para Compras
                </span>
              </span>
            </h1>

            <p
              className="hero-fade mt-10 max-w-[46ch] text-xl leading-snug text-fg sm:text-2xl"
              style={{ animationDelay: "340ms" }}
            >
              {nexoPage.hero.subtext}
            </p>

            <div
              className="hero-fade mt-10 flex flex-col items-start gap-4"
              style={{ animationDelay: "420ms" }}
            >
              <a
                href="#contato"
                className="group inline-flex items-center gap-2 rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-[background-color,transform] duration-200 hover:bg-accent-hover active:scale-[0.98]"
              >
                <span className="whitespace-nowrap">{cta.contact}</span>
                <ArrowRight
                  size={17}
                  weight="regular"
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </a>
              <p className="text-sm text-fg-muted">{nexoPage.hero.platform}</p>
            </div>
          </div>

          {/* The stage. Three product screens in perspective, drifting slowly - see
              .palco-nexo in globals.css. Decorative: the headline already carries the
              meaning, so the whole stage is aria-hidden and every alt stays empty. */}
          <div
            className="hero-fade lg:col-span-5"
            style={{ animationDelay: "500ms" }}
            aria-hidden
          >
            <div className="palco-nexo relative mx-auto h-[300px] w-full max-w-[520px] sm:h-[360px] lg:mr-0 lg:h-[420px]">
              <div className="palco-nexo-glow inset-x-[-10%] bottom-[-18%] top-[30%]" />

              {/* fundo: lista de classificação */}
              <div
                className="palco-nexo-prancha right-0 top-0 w-[78%] shadow-[0_24px_80px_rgb(123_94_237/0.28)]"
                style={
                  {
                    "--pose": "rotateY(-13deg) rotateX(4deg)",
                    animationDelay: "-8s",
                  } as React.CSSProperties
                }
              >
                <Image
                  src={heroStage.prints[0].src}
                  alt={heroStage.prints[0].alt}
                  width={1917}
                  height={1078}
                  sizes="(min-width:1024px) 420px, 80vw"
                  className="block h-auto w-full"
                  priority
                />
              </div>

              {/* meio: central de cotações (RFQ) */}
              <div
                className="palco-nexo-prancha left-[4%] top-[26%] w-[64%] shadow-[0_20px_60px_rgb(57_124_239/0.26)]"
                style={
                  {
                    "--pose": "rotateY(-10deg) rotateX(3deg) translateZ(40px)",
                    animationDelay: "-4s",
                  } as React.CSSProperties
                }
              >
                <Image
                  src={heroStage.prints[1].src}
                  alt={heroStage.prints[1].alt}
                  width={1917}
                  height={1078}
                  sizes="(min-width:1024px) 340px, 64vw"
                  className="block h-auto w-full"
                />
              </div>

              {/* frente: relatório com a recomendação */}
              <div
                className="palco-nexo-prancha bottom-0 right-[6%] w-[56%] shadow-[0_16px_48px_rgb(123_94_237/0.3)]"
                style={
                  {
                    "--pose": "rotateY(-8deg) rotateX(2deg) translateZ(80px)",
                    animationDelay: "0s",
                  } as React.CSSProperties
                }
              >
                <Image
                  src={heroStage.prints[2].src}
                  alt={heroStage.prints[2].alt}
                  width={1917}
                  height={1078}
                  sizes="(min-width:1024px) 300px, 56vw"
                  className="block h-auto w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
