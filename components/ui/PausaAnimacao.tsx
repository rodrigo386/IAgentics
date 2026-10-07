"use client";

import { useState, type ReactNode } from "react";
import { Pause, Play } from "@phosphor-icons/react";

/**
 * Moldura com botão de pausa para animação em laço feita em CSS (2026-10-07).
 *
 * Movimento automático que dura mais de 5 s precisa de um jeito de parar
 * (WCAG 2.2.2). A animação continua sendo CSS puro: este componente só
 * carimba `data-pausado` na moldura, e o globals.css congela tudo lá dentro
 * com `animation-play-state: paused`. Sem JavaScript, o botão não funciona,
 * mas a animação também respeita prefers-reduced-motion — e o conteúdo,
 * parado ou não, está inteiro no DOM.
 */
export function PausaAnimacao({
  children,
  textos,
  className = "",
}: {
  children: ReactNode;
  textos: { pausar: string; continuar: string };
  className?: string;
}) {
  const [pausado, setPausado] = useState(false);
  return (
    <div className={`animacao-laco relative ${className}`} data-pausado={pausado || undefined}>
      {children}
      <button
        type="button"
        onClick={() => setPausado((p) => !p)}
        aria-label={pausado ? textos.continuar : textos.pausar}
        className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-full border border-line-strong bg-surface text-fg transition-colors hover:border-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:hidden"
      >
        {pausado ? <Play size={14} weight="fill" aria-hidden="true" /> : <Pause size={14} weight="fill" aria-hidden="true" />}
      </button>
    </div>
  );
}
