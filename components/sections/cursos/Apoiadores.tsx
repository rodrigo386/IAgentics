import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { academy } from "@/lib/content";

/**
 * Mesmos apoiadores da Academy (mesmos arquivos, mesma placa clara - marca de
 * terceiro nunca recolore), mas em grade PARADA: a rolagem contínua desta
 * página já mora na estante do hero, e marquee é um por página.
 */
export function CursosApoiadores() {
  return (
    <section className="border-t border-line py-16 sm:py-20">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">
            {academy.supporters.kicker}
          </p>
          <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {academy.supporters.logos.map((logo) => (
              <li
                key={logo.name}
                className="flex h-20 items-center justify-center border border-line bg-brand-paper px-5"
              >
                <Image
                  src={logo.src}
                  alt={logo.name}
                  width={logo.w}
                  height={logo.h}
                  sizes="200px"
                  className={`w-auto max-w-full object-contain ${logo.w / logo.h > 2 ? "max-h-9" : "max-h-12"}`}
                />
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
