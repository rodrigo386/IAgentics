import Image from "next/image";
import { Quotes } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/ui/Reveal";
import { cursos } from "@/lib/content";

/**
 * A foto vai em preto e branco: o recorte da arte traz o fundo azul das redes,
 * que brigaria com o violeta.
 *
 * Depoimento de quem concluiu um curso (2026-11-04). Na /cursos fica antes de
 * "Como funciona" e na /bolsas antes da inscrição, perto da decisão.
 *
 * Faixa violeta de ponta a ponta nos dois temas (pedido do Rodrigo: "mais
 * ousado e chamativo", com a arte das redes como referência): é a única faixa
 * cheia de acento nas duas páginas, e é isso que a faz parar a rolagem. Texto
 * em papel sobre o violeta (#f8f8f8 sobre #7607e8, 6,9:1).
 */
const t = cursos.depoimentoAluna;

/** "**trecho**" vira negrito; o resto fica como está. */
function comDestaques(texto: string) {
  return texto.split(/\*\*(.+?)\*\*/g).map((parte, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-accent-on [background:linear-gradient(transparent_62%,rgb(248_248_248/0.22)_62%)]">
        {parte}
      </strong>
    ) : (
      parte
    ),
  );
}

export function DepoimentoAluna() {
  return (
    <section
      aria-label={`${t.eyebrow}: ${t.nome}, ${t.cargo} no ${t.empresa}`}
      className="relative isolate overflow-hidden bg-accent py-20 text-accent-on sm:py-28"
    >
      {/* As aspas gigantes, cortadas pelas bordas da faixa. */}
      <Quotes
        aria-hidden="true"
        weight="fill"
        className="pointer-events-none absolute -left-6 -top-10 -z-10 size-48 rotate-180 opacity-15 sm:size-72 lg:-left-10 lg:-top-16 lg:size-[26rem]"
      />
      <Quotes
        aria-hidden="true"
        weight="fill"
        className="pointer-events-none absolute -bottom-16 -right-8 -z-10 size-40 opacity-15 sm:size-64"
      />
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:items-end">
        <Reveal className="lg:col-span-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] opacity-80">{t.eyebrow}</p>
          <blockquote className="mt-8 space-y-5 text-xl font-normal leading-snug tracking-[-0.015em] sm:text-2xl lg:text-[1.9rem] lg:leading-[1.3]">
            {t.paragrafos.map((p) => (
              <p key={p} className="max-w-[46ch]">
                {comDestaques(p)}
              </p>
            ))}
          </blockquote>
        </Reveal>
        <Reveal className="lg:col-span-4">
          <figure className="flex items-end gap-5 lg:flex-col lg:items-start">
            <Image
              src={t.foto}
              alt={t.fotoAlt}
              width={100}
              height={146}
              className="h-32 w-auto shrink-0 border-2 border-accent-on/80 object-cover grayscale contrast-110 sm:h-36 lg:h-44"
            />
            <figcaption>
              <span className="inline-block bg-accent-on px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-brand-violet">
                {t.selo}
              </span>
              <span className="mt-3 block text-3xl font-semibold leading-none tracking-[-0.03em] sm:text-4xl lg:text-5xl">{t.nome}</span>
              <span className="mt-2 block text-base opacity-90 sm:text-lg">
                {t.cargo} · {t.empresa}
              </span>
              <span className="mt-4 block font-mono text-[11px] uppercase tracking-[0.18em] opacity-75">{t.curso}</span>
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
