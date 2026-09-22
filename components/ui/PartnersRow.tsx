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
/**
 * DUAS VARIANTES, porque a fileira vive em dois lugares de largura muito
 * diferente desde 2026-09-22.
 *
 * `faixa` é a original: largura total da página, com a calha do site. É a da
 * /nexo, e segue sendo o padrão.
 *
 * `coluna` é a da home, onde as parcerias subiram para dentro da coluna da
 * hero, logo abaixo dos CTAs. Ali não cabem cinco placas numa linha: a coluna
 * dá ~766px, cinco placas sobram ~116px de conteúdo cada, e o lockup da
 * Microsoft (3,9:1) encolhe até 30px de altura — ilegível, que é o oposto do
 * motivo de tê-las subido. Em três colunas cada placa ganha ~224px e o badge
 * volta a render inteiro. As duas linhas (3+2) custam ~60px a mais de altura
 * e entregam logotipos que dá para ler.
 *
 * `max-w` e `px` só aparecem na variante `faixa`: dentro da coluna, a grade do
 * pai já aplicou os dois, e repeti-los seria padding em cima de padding.
 */
const VARIANTES = {
  faixa: {
    grade: "mx-auto grid w-full max-w-[1400px] grid-cols-2 gap-3 px-5 sm:grid-cols-3 sm:px-8 lg:grid-cols-5",
    placa: "flex h-20 items-center justify-center border border-line bg-brand-paper px-4 sm:px-6",
    largo: "max-h-10 sm:max-h-11 lg:max-h-12",
    quadrado: "max-h-12 sm:max-h-13 lg:max-h-14",
  },
  coluna: {
    grade: "grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3",
    placa: "flex h-[4.5rem] items-center justify-center border border-line bg-brand-paper px-4",
    largo: "max-h-9 sm:max-h-10",
    quadrado: "max-h-11 sm:max-h-12",
  },
} as const;

export function PartnersRow({ variante = "faixa" }: { variante?: keyof typeof VARIANTES }) {
  const v = VARIANTES[variante];
  const plateClass = v.placa;

  return (
    <ul
      aria-label={partners.label}
      className={v.grade}
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
              logo.w / logo.h > 2 ? v.largo : v.quadrado
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
