import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { AgentGraph } from "@/components/ui/AgentGraph";
import { PartnersRow } from "@/components/ui/PartnersRow";
import { hero, cta, partners } from "@/lib/content";

/**
 * Hero built around the agent graph. Server Component - no client JavaScript at all.
 *
 * Motion motivation: the headline arrives line by line from behind a mask so the eye is
 * pulled through the value proposition in reading order on arrival. It plays once.
 * The animation is CSS with `backwards` fill, so the resting state is fully visible:
 * the H1 is present in the static HTML and remains readable if JS never runs.
 * Under prefers-reduced-motion nothing animates.
 *
 * Text elements: headline, subtext, CTAs. Three, under the cap of four. No eyebrow and
 * no tagline beneath the CTAs.
 *
 * The partner strip sits in its own band pinned to the foot of the frame, never mixed
 * into the value-prop stack. Each partner appears exactly once, never repeated.
 *
 * Type scale is planned against the asset column so the headline holds at exactly two
 * lines from 360px up; the lines never wrap, they scale.
 */
export function Hero() {
  return (
    <section
      id="topo"
      className="relative flex min-h-[100dvh] flex-col overflow-hidden pb-14 pt-24"
    >
      {/* Value prop takes the free space; the partner band keeps the floor. */}
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

          {/* The one place the official brand ramp is used as a gradient. */}
          <div
            className="hero-fade mt-8 h-px w-full max-w-[420px] bg-[linear-gradient(90deg,var(--brand-violet),var(--brand-indigo),var(--brand-periwinkle),var(--brand-blue),var(--brand-sky))]"
            style={{ animationDelay: "240ms" }}
          />

          <p
            className="hero-fade mt-8 max-w-[52ch] text-base leading-relaxed text-fg-muted sm:text-lg"
            style={{ animationDelay: "300ms" }}
          >
            {hero.subtext}
          </p>

          <div
            className="hero-fade mt-10 flex flex-wrap items-center gap-3"
            style={{ animationDelay: "380ms" }}
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

            <a
              href="#solucoes"
              className="inline-flex items-center rounded-control border border-line-strong px-7 py-3.5 font-medium text-fg transition-colors duration-200 hover:border-fg active:scale-[0.98]"
            >
              <span className="whitespace-nowrap">{cta.solutions}</span>
            </a>
          </div>
        </div>

        {/* Visual column: the agent graph, derived from the IAgentics mark. */}
        <div
          className="hero-fade relative lg:col-span-5"
          style={{ animationDelay: "180ms" }}
        >
          <AgentGraph />
        </div>
        </div>
      </div>

      {/* PARTNER BAND - its own strip at the foot of the frame. Each partner shows
          exactly once; see PartnersRow for why this is not a marquee. */}
      <div
        className="hero-fade mt-8 shrink-0"
        style={{ animationDelay: "460ms" }}
      >
        <p className="mx-auto mb-4 w-full max-w-[1400px] px-5 font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted sm:px-8">
          {partners.label}
        </p>
        <PartnersRow />
      </div>
    </section>
  );
}
