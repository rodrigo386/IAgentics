import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/ui/Reveal";
import { nexo } from "@/lib/content";

/**
 * Where the data stays - the first thing after the cover.
 *
 * It used to sit below the agent index, which put it in the wrong order for the person
 * it is written for. A procurement buyer does not read "where does my data live" as a
 * feature; they read it as a precondition. Placed after the index, the page introduced
 * five AI agents working over the company's purchasing data BEFORE answering where that
 * data goes. Now the sequence is: what it is, where your data stays, what the agents do.
 *
 * It is a full-bleed band rather than another column of text because it is the only
 * sentence on the page that has to survive being skimmed. The band also does the
 * structural job of separating the cover from the index.
 *
 * Colour is set in globals.css (.assurance-band) rather than with utilities, because
 * the two themes need different grounds: brand ink reads as a solid block against the
 * light page, but in dark mode the page is ALREADY brand ink, so the band would vanish.
 * There it lifts to --surface instead.
 */
export function NexoAssurance() {
  return (
    <section className="assurance-band py-20 sm:py-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal>
          <p className="flex max-w-[20ch] items-start gap-5 text-4xl font-medium leading-[1.1] tracking-[-0.03em] sm:text-5xl lg:max-w-[24ch] lg:text-6xl">
            <ShieldCheck
              size={44}
              weight="regular"
              aria-hidden="true"
              className="mt-2 shrink-0 opacity-70"
            />
            {nexo.assurance}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
