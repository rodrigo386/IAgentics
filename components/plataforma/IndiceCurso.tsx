"use client";
import Link from "next/link";
import { plataforma } from "@/lib/content-plataforma";
import type { Modulo } from "@/lib/plataforma/tipos";

function formatarDuracao(segundos: number): string {
  return `${Math.round(segundos / 60)} min`;
}

/** Índice do curso: módulos como <section>/<h2>, aulas como lista de links.
 *  Recebe `concluidas` como array — não Set — porque Set não serializa de
 *  Server para Client Component; reconstruído aqui, uma vez, para lookup O(1).
 *  Reusado pela página do curso (Task 6) e pela página da aula (Task 7, índice
 *  com `aulaAtualId` aceso). */
export function IndiceCurso({
  cursoSlug,
  modulos,
  concluidas,
  aulaAtualId,
  lateral = false,
}: {
  cursoSlug: string;
  modulos: Modulo[];
  concluidas: string[];
  aulaAtualId?: string;
  lateral?: boolean;
}) {
  const feitas = new Set(concluidas);
  const t = plataforma.curso;

  return (
    <div className="flex flex-col gap-8">
      {[...modulos]
        .sort((a, b) => a.ordem - b.ordem)
        .map((modulo) => (
          <section key={modulo.id}>
            <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">{modulo.titulo}</h2>
            <ul className="mt-3 flex flex-col divide-y divide-line border-y border-line">
              {[...modulo.aulas]
                .sort((a, b) => a.ordem - b.ordem)
                .map((aula) => {
                  const concluida = feitas.has(aula.id);
                  const atual = aula.id === aulaAtualId;
                  return (
                    <li key={aula.id}>
                      <Link
                        href={`/app/curso/${cursoSlug}/${aula.slug}`}
                        aria-current={atual ? "true" : undefined}
                        aria-label={concluida ? `${aula.titulo} — ${plataforma.aula.concluida}` : undefined}
                        className={`flex items-center justify-between gap-4 px-1 py-3 transition-colors hover:bg-surface ${
                          atual ? (lateral ? "border-l-2 border-accent bg-surface pl-3" : "bg-surface") : lateral ? "border-l-2 border-transparent pl-3" : ""
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-2 text-sm text-fg">
                          {concluida ? (
                            <span aria-hidden className="shrink-0 text-accent-text">
                              ✓
                            </span>
                          ) : null}
                          <span className="truncate">{aula.titulo}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-3 font-mono text-[11px] text-fg-muted">
                          {aula.gratuita ? <span className="uppercase tracking-[0.14em] text-accent-text">{t.gratis}</span> : null}
                          <span>{formatarDuracao(aula.duracaoSeg)}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
    </div>
  );
}
