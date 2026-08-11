import Image from "next/image";
import { Marquee } from "@/components/ui/Marquee";
import { Reveal } from "@/components/ui/Reveal";
import { spendLab } from "@/lib/content";

/**
 * "Parceiros que fomentam e agregam".
 *
 * Ficava entre os pilares e os oito passos. No site de vocês ela vem DEPOIS do
 * vídeo "na prática" e antes do "Como funciona", e é essa a ordem agora.
 *
 * Os quatro logotipos são marcas de terceiros: nunca recoloridos, sempre nas cores
 * originais sobre placa de papel, inclusive no tema escuro.
 */
export function SpendLabPartners() {
  return (
    <section className="border-t border-line py-20 sm:py-24">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal>
          <h2 className="max-w-[20ch] text-2xl font-medium tracking-[-0.03em] text-fg sm:text-3xl">
            {spendLab.partners.title}
          </h2>
        </Reveal>
      </div>

      <Reveal className="mt-10">
        <Marquee duration="38s">
          {spendLab.partners.logos.map((logo) => (
            <div
              key={logo.name}
              className="flex h-20 w-44 shrink-0 items-center justify-center border border-line bg-brand-paper px-5 sm:w-52"
            >
              <Image
                src={logo.src}
                alt={logo.name}
                width={logo.w}
                height={logo.h}
                sizes="208px"
                /* eager: a segunda cópia da trilha nasce fora da viewport e o
                   observador do lazy nunca dispara para ela. Mesmo defeito
                   medido no Academy - metade da fileira entrava vazia. */
                loading="eager"
                className={`w-auto max-w-full object-contain ${
                  logo.w / logo.h > 2 ? "max-h-9" : "max-h-14"
                }`}
              />
            </div>
          ))}
        </Marquee>
      </Reveal>
    </section>
  );
}
