"use client";

import { useState } from "react";
import { cursos } from "@/lib/content";
import { FilmeHero } from "./FilmeHero";

/**
 * Só da prévia /preview/cursos (2026-10-14): os conceitos de filme no
 * lugar da estante, com um seletor em cima para o Rodrigo comparar. Aprovado
 * um, a hero oficial recebe o FilmeHero direto e isto some com a prévia.
 */
const t = cursos.filmesHero.previa;

export function PreviaFilmes() {
  const [id, setId] = useState<string>(t.conceitos[0].id);
  const atual = t.conceitos.find((c) => c.id === id)!;
  return (
    <div>
      <div role="group" aria-label={t.titulo} className="mx-auto flex max-w-[520px] flex-wrap gap-2">
        {t.conceitos.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setId(c.id)}
            aria-pressed={c.id === id}
            className={`rounded-control border px-4 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text ${
              c.id === id ? "border-accent bg-accent text-accent-on" : "border-line-strong text-fg hover:border-fg"
            }`}
          >
            {c.nome}
          </button>
        ))}
      </div>
      <p className="mx-auto mt-3 max-w-[520px] text-sm leading-relaxed text-fg-muted">{atual.ideia}</p>
      <div className="mt-5">
        <FilmeHero
          key={id}
          src={atual.video}
          poster={atual.poster}
          rotulos={{ pausar: t.pausar, continuar: t.continuar }}
        />
      </div>
    </div>
  );
}
