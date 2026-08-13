import Image from "next/image";
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
 * The band now carries two things: the claim, and the proof under it. The claim is
 * IAgentics' sentence about where the data stays; the certifications belong to Desk
 * Manager, the platform the claim is actually made about, so they sit as evidence
 * right beneath it rather than as a competing headline. Same section, same band -
 * the certifications are the receipts for the sentence above them, not a new topic.
 *
 * Colour is set in globals.css (.assurance-band) rather than with utilities, because
 * the two themes need different grounds: brand ink reads as a solid block against the
 * light page, but in dark mode the page is ALREADY brand ink, so the band would vanish.
 * There it lifts to --surface instead. The certification intro text below inherits that
 * same colour (no text-fg class, just opacity) for the same reason the ShieldCheck icon
 * does - it has to read on both band grounds, not just one theme's token.
 *
 * The seal plates are always a light plate (bg-brand-paper), never inverted for dark
 * mode: both seals are supplied as light-ground artwork (black-on-white ISO mark,
 * lilac-on-pale-grey ITIL mark), so a dark plate would either invert their colours or
 * force a background fill they weren't designed for. A fixed light plate keeps the
 * client's official artwork intact in both themes, the same call already made for the
 * Desk Manager badge in AgentsIndex.tsx.
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

        {/* Desk Manager's information-security certifications, offered as evidence for
            the claim above rather than as their own headline. */}
        <Reveal className="mt-12 sm:mt-16">
          <p className="max-w-[46ch] text-base leading-relaxed opacity-80 sm:text-lg">
            {nexo.certificacoes.intro}
          </p>
          <ul className="mt-6 flex flex-wrap items-center gap-4">
            {nexo.certificacoes.selos.map((selo) => {
              const isPortrait = selo.h > selo.w;
              return (
                <li
                  key={selo.name}
                  className="flex items-center justify-center border border-line bg-brand-paper px-6 py-5 sm:px-8"
                >
                  <Image
                    src={selo.src}
                    alt={selo.name}
                    width={selo.w}
                    height={selo.h}
                    className={
                      isPortrait
                        ? "h-24 w-auto object-contain"
                        : "h-16 w-auto object-contain"
                    }
                  />
                </li>
              );
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
