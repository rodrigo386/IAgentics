import Image from "next/image";
import { siAnthropic } from "simple-icons";
import { partners } from "@/lib/content";

/**
 * Partner row.
 *
 * Each partner appears EXACTLY ONCE. This deliberately replaced a marquee: a seamless
 * CSS marquee needs a duplicate copy of the track to loop, and with only five plates
 * that duplicate is on screen at the same time as the original, so Microsoft and Oracle
 * showed twice at once and read as a bug. Five logos are not a breadth problem; they
 * fit, so they are simply shown.
 *
 * Server Component on purpose: it imports simple-icons, which must never reach the
 * client bundle. It is passed into the hero as a prop and only slotted in.
 *
 * These are official partner badges the client supplied. Trademarked lockups are never
 * recoloured or redrawn, so they sit at their own colours on a neutral brand plate.
 * Logos only. No category labels underneath.
 */
export function PartnersRow() {
  const plateClass =
    "flex h-20 items-center justify-center border border-line bg-brand-paper px-4 sm:px-6";

  return (
    <ul
      aria-label={partners.label}
      className="mx-auto grid w-full max-w-[1400px] grid-cols-2 gap-3 px-5 sm:grid-cols-3 sm:px-8 lg:grid-cols-5"
    >
      {partners.logos.map((logo) => (
        <li key={logo.name} className={plateClass}>
          {/* Height steps up with the available column width, because these lockups are
              wide: Microsoft is 3.9:1, so height is really a width budget. `max-w-full`
              is the guard - at 390px the two-column plate offers 137px of content and a
              40px-tall Microsoft wants 157px, so without it the badge would run over its
              own plate. With it the image simply lands shorter where the room runs out.

              Square marks get their own, taller step. SAP is 1:1, so at the wide badges'
              height it is a 48px stamp beside a 188px lockup and reads as if it had not
              been enlarged at all. Optical weight, not measured height, is what makes a
              row of logos look even. */}
          <Image
            src={logo.src}
            alt={logo.name}
            width={logo.w}
            height={logo.h}
            className={`w-auto max-w-full object-contain ${
              logo.w / logo.h > 2
                ? "max-h-10 sm:max-h-11 lg:max-h-12"
                : "max-h-12 sm:max-h-13 lg:max-h-14"
            }`}
          />
        </li>
      ))}

      <li className={`${plateClass} gap-2`}>
        <svg
          role="img"
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-6 shrink-0 sm:size-7"
          fill="#131723"
        >
          <path d={siAnthropic.path} />
        </svg>
        <span className="text-base font-medium tracking-tight text-brand-ink sm:text-lg">
          {partners.anthropic.name}
        </span>
      </li>
    </ul>
  );
}
