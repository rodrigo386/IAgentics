"use client";

import { useEffect, useRef, useState } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";

/**
 * Uma linha (trilha) da vitrine da /cursos: os cards correm na horizontal,
 * como num streaming. No toque, o dedo arrasta; no desktop, as setas andam uma
 * tela de cards por vez, e somem do caminho (desabilitadas) nas pontas.
 *
 * A lista recebe foco (tabIndex 0) para as setas do teclado rolarem a linha:
 * os cards não são links, então sem isso quem navega por teclado não teria
 * como chegar ao fim de uma linha comprida.
 */
export function LinhaVitrine({
  id,
  titulo,
  rotulos,
  children,
}: {
  id: string;
  titulo: string;
  rotulos: { anteriores: string; proximos: string };
  children: React.ReactNode;
}) {
  const lista = useRef<HTMLUListElement | null>(null);
  const [noInicio, setNoInicio] = useState(true);
  const [noFim, setNoFim] = useState(false);

  useEffect(() => {
    const el = lista.current;
    if (!el) return;
    const medir = () => {
      setNoInicio(el.scrollLeft <= 2);
      setNoFim(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
    };
    medir();
    el.addEventListener("scroll", medir, { passive: true });
    window.addEventListener("resize", medir);
    return () => {
      el.removeEventListener("scroll", medir);
      window.removeEventListener("resize", medir);
    };
  }, []);

  const andar = (sentido: -1 | 1) => {
    const el = lista.current;
    if (!el) return;
    const suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: sentido * el.clientWidth * 0.9, behavior: suave ? "smooth" : "auto" });
  };

  const seta =
    "grid size-9 place-items-center rounded-control border border-line-strong text-fg transition-colors duration-200 hover:border-fg disabled:cursor-default disabled:opacity-30 disabled:hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text";

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <h3 id={id} className="text-xl font-medium tracking-[-0.01em] text-fg sm:text-2xl">
          {titulo}
        </h3>
        <div className="hidden gap-2 sm:flex">
          <button type="button" onClick={() => andar(-1)} disabled={noInicio} aria-label={`${rotulos.anteriores}: ${titulo}`} className={seta}>
            <CaretLeft size={16} weight="bold" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => andar(1)} disabled={noFim} aria-label={`${rotulos.proximos}: ${titulo}`} className={seta}>
            <CaretRight size={16} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </div>
      <ul
        ref={lista}
        tabIndex={0}
        aria-labelledby={id}
        className="-mx-5 mt-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text sm:-mx-8 sm:scroll-px-8 sm:gap-4 sm:px-8 [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </ul>
    </div>
  );
}
