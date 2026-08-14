import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { cursos as t } from "@/lib/content";
import type { Curso } from "@/lib/plataforma/tipos";

/**
 * O catálogo com nome e dado, uma vez só: a estante do hero mostra as capas,
 * aqui cada formação ganha título, nível e carga horária (dados reais do
 * banco, os mesmos do /app). Grade calma de 3 colunas - contraste deliberado
 * com o movimento do hero.
 */
export function CursosCatalogo({ cursos }: { cursos: Curso[] }) {
  return (
    <section id="cursos" className="py-20 sm:py-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal>
          <h2 className="max-w-[22ch] text-4xl font-medium tracking-[-0.03em] text-fg sm:text-5xl">
            {t.catalogo.titulo}
          </h2>
          <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-fg-muted">{t.catalogo.lead}</p>
        </Reveal>
        <ul className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:mt-16 lg:gap-x-8">
          {cursos.map((curso) => (
            <li key={curso.id}>
              <Reveal>
                <div
                  data-testid="capa-curso"
                  className="relative aspect-[3/4] overflow-hidden border border-line bg-surface"
                >
                  <Image
                    src={curso.capaUrl}
                    alt={curso.titulo}
                    fill
                    sizes="(min-width: 1024px) 420px, (min-width: 640px) 33vw, 50vw"
                    style={{ objectPosition: "center top" }}
                    className="object-cover"
                  />
                </div>
                <h3 className="mt-4 text-base font-medium tracking-[-0.01em] text-fg sm:text-lg">
                  {curso.titulo}
                </h3>
                <p className="tnum mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">
                  {curso.nivel} · {curso.cargaHoras}
                  {t.catalogo.horas}
                </p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
