import Image from "next/image";
import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/ui/Reveal";
import { nexo } from "@/lib/content";

/**
 * Where the data stays - the first thing after the cover.
 *
 * The band carries the WHOLE trust story in one place: the claim, the platform
 * the claim is made about, and that platform's information-security
 * certifications. The Desk Manager badge used to sit in the agents index;
 * split across two sections the story read as three mismatched plates in two
 * homes (escolha de layout 2026-08-13: colofão editorial, opção C).
 *
 * Right column is a spec-sheet colophon: mono labels (PLATAFORMA /
 * CERTIFICAÇÕES) with hairline rules. Desk Manager is the section's trust
 * anchor, so its plate takes the full row width, the tallest artwork and the
 * periodic sheen (.selo-plataforma) — the seals below sit smaller, as the
 * receipts for the sentence, not competing with it.
 *
 * Colour is set in globals.css (.assurance-band): brand ink in light mode,
 * --surface in dark (the page is already ink there). Hairlines use
 * border-current/20 so they read on both grounds. Seal plates are always a
 * light plate (bg-brand-paper): the seals and the DM lockup are light-ground
 * artwork and never get inverted or recoloured.
 */
export function NexoAssurance() {
  const dm = nexo.platforms[0];
  const [iso, itil] = nexo.certificacoes.selos;

  return (
    <section className="assurance-band py-20 sm:py-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10">
          <Reveal className="lg:col-span-6">
            <p className="flex max-w-[20ch] items-start gap-5 text-4xl font-medium leading-[1.1] tracking-[-0.03em] sm:text-5xl lg:text-6xl">
              <ShieldCheck size={44} weight="regular" aria-hidden="true" className="mt-2 shrink-0 opacity-70" />
              {nexo.assurance}
            </p>
            <p className="mt-10 max-w-[46ch] text-base leading-relaxed opacity-80 sm:text-lg">
              {nexo.certificacoes.intro}
            </p>
          </Reveal>
          <Reveal className="lg:col-span-6 lg:self-center">
            <div className="grid grid-cols-1 items-center gap-4 border-t border-current/20 py-8 sm:grid-cols-[9rem_1fr] sm:gap-8 sm:py-10">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] opacity-60">Plataforma</span>
              <div className="selo-plataforma flex items-center justify-center border border-line bg-brand-paper px-8 py-10 shadow-[0_8px_30px_rgb(123_94_237/0.12)] sm:py-12">
                <Image src={dm.src} alt={dm.name} width={dm.w} height={dm.h} className="max-h-14 w-auto object-contain sm:max-h-20" />
              </div>
            </div>
            <div className="grid grid-cols-1 items-center gap-4 border-y border-current/20 py-8 sm:grid-cols-[9rem_1fr] sm:gap-8">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] opacity-60">Certificações</span>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center justify-center border border-line bg-brand-paper px-6 py-4">
                  <Image src={iso.src} alt={iso.name} width={iso.w} height={iso.h} className="h-20 w-auto object-contain" />
                </div>
                <div className="flex items-center justify-center border border-line bg-brand-paper px-6 py-4">
                  <Image src={itil.src} alt={itil.name} width={itil.w} height={itil.h} className="h-11 w-auto object-contain" />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
