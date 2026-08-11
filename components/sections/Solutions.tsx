import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/ui/Reveal";
import { solutions } from "@/lib/content";

/**
 * Editorial index. Three full-width rows separated by hairlines, no cards.
 *
 * Chosen to harmonise with the hero, which is typographic and line-drawn with no
 * photography at all. Three photo cards immediately below it would jump tone; rows of
 * large type with a hairline between them continue the hero's reading pattern, and the
 * photograph arrives only on hover, as a reward rather than a competitor.
 *
 * Deliberately distinct from the Academy section, which is also hairline-and-type: these
 * rows carry display type, an arrow affordance and an image reveal, while Academy is
 * short lists in narrow columns.
 *
 * Motion motivation: the image fade is feedback - it marks which row the pointer owns.
 * On hover the row becomes a dark photographic band, so every piece of text in it flips
 * to the fixed paper token; the scrim keeps that legible over any part of the image.
 */
export function Solutions() {
  return (
    <section id="solucoes" className="py-24 sm:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal>
          {/* The page's only eyebrow. */}
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent-text">
            {solutions.eyebrow}
          </p>
          <h2 className="mt-5 max-w-[18ch] text-3xl font-medium tracking-[-0.02em] text-fg sm:text-4xl lg:text-5xl">
            {solutions.headline}
          </h2>
        </Reveal>

        <div className="mt-16">
          {solutions.items.map((item) => (
            <Reveal key={item.id}>
              <Link
                href={item.href}
                className="group relative isolate block border-t border-line-strong last:border-b"
              >
                {/* Image reveal, behind everything in the row. */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100"
                >
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    sizes="100vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(13_16_23/0.94),rgb(13_16_23/0.62))]" />
                </div>

                <div className="grid grid-cols-1 items-baseline gap-y-5 px-0 py-10 transition-[padding] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:lg:px-8 lg:grid-cols-12 lg:gap-8 lg:py-14">
                  <h3 className="text-4xl font-medium tracking-[-0.03em] text-fg transition-colors duration-300 group-hover:text-brand-paper sm:text-5xl lg:col-span-4 lg:text-6xl">
                    {item.name}
                  </h3>

                  <div className="lg:col-span-5">
                    <p className="text-lg text-fg transition-colors duration-300 group-hover:text-brand-paper sm:text-xl">
                      {item.promise}
                    </p>
                    <p className="mt-2 text-sm text-fg-muted transition-colors duration-300 group-hover:text-[rgb(248_248_248/0.72)]">
                      {item.platform}
                    </p>
                  </div>

                  <ul className="flex flex-wrap gap-2 lg:col-span-2">
                    {item.scope.map((s) => (
                      <li
                        key={s}
                        className="border border-line-strong px-2.5 py-1 font-mono text-[11px] text-fg-muted transition-colors duration-300 group-hover:border-[rgb(248_248_248/0.34)] group-hover:text-brand-paper"
                      >
                        {s}
                      </li>
                    ))}
                  </ul>

                  <div className="lg:col-span-1 lg:flex lg:justify-end">
                    <ArrowUpRight
                      size={28}
                      weight="regular"
                      className="text-fg transition-[transform,color] duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-brand-paper"
                    />
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
