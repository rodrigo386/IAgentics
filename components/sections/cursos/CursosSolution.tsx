import Image from "next/image";
import { cursos } from "@/lib/content";

/**
 * As capas dos cursos da plataforma Solution (2026-10-14). Grade simples, na
 * proporção das capas (2:3), com o nome embaixo de cada uma: a capa já traz o
 * título, mas como imagem — o nome em texto é o que leitor de tela e buscador
 * alcançam.
 */
const t = cursos.catalogoSolution;

export function CursosSolution() {
  return (
    <section aria-labelledby="cursos-solution" className="border-t border-line py-20 sm:py-24">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <h2 id="cursos-solution" className="text-3xl font-medium tracking-[-0.02em] text-fg sm:text-4xl">
          {t.titulo}
        </h2>
        <p className="mt-4 max-w-[52ch] text-lg leading-relaxed text-fg-muted">{t.lead}</p>
        <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
          {t.itens.map((c) => (
            <li key={c.src}>
              <div className="relative aspect-[2/3] overflow-hidden border border-line bg-surface">
                <Image src={c.src} alt="" fill sizes="(min-width: 1024px) 220px, (min-width: 640px) 30vw, 45vw" className="object-cover" />
              </div>
              <p className="mt-3 text-sm leading-snug text-fg">{c.nome}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
