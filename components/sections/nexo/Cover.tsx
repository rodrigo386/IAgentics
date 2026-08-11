import Image from "next/image";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { MediaSlot } from "@/components/ui/MediaSlot";
import { nexoPage, cta } from "@/lib/content";

/**
 * Editorial cover, now carrying the demo.
 *
 * The type was the whole artwork here: two lines set at up to 120px across the full
 * width, the way a magazine sets a feature title. Bringing the video up to the cover
 * costs some of that, and the trade is worth naming rather than hiding.
 *
 * THE ARITHMETIC. The clip is 9:16. At the 420px width it had in its own section it
 * stands 747px tall, and the cover only has 676px of usable height at 1440x900 once
 * padding is removed. So a portrait video and a full-width 120px headline cannot both
 * fit above the fold - one of them has to give. The headline gives: it moves into a
 * 7-column left field and drops to min(6.5vw, 5.5rem), which still reads as a cover
 * line while leaving the right field for the clip.
 *
 * Below lg the two stack, the headline gets the full width back at its original size,
 * and the portrait cut is exactly the right shape for the screen it was authored for.
 *
 * The video is capped by VIEWPORT HEIGHT in globals.css (.cover-video), the same
 * technique the home hero uses for its graph: on a short laptop the clip shrinks so
 * the cover keeps holding one screen instead of pushing its own CTA under the fold.
 */
export function NexoCover() {
  const { video } = nexoPage;

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

          {/* The demo. Its own aspect, so nothing is cropped, and never wider than the
              576px source - past that it would be stretched rather than scaled down. */}
          <div
            className="hero-fade lg:col-span-5"
            style={{ animationDelay: "500ms" }}
          >
            <div className="cover-video mx-auto w-full max-w-[380px] lg:mr-0">
              <MediaSlot slot={video.slot} aspect="aspect-[9/16]" />
              <p className="mt-3 flex flex-wrap items-baseline gap-3 font-mono text-[11px] text-fg-muted">
                <span className="text-accent-text">Vídeo</span>
                {video.slot.label}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
