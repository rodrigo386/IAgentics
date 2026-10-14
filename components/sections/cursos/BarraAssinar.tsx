"use client";

import { useEffect, useState } from "react";
import { cursos } from "@/lib/content";

/**
 * O botão de assinar que acompanha a rolagem na /cursos (2026-10-14, pedido
 * do Rodrigo: "o botão de assine tem que continuar aparecendo quando faço
 * scroll"). Aparece quando o botão da hero (#cta-hero) sai da tela e some
 * quando o formulário (#assinar) entra: com o formulário à vista, um segundo
 * botão para ele só disputaria atenção. No celular é uma barra no pé, na
 * largura toda; no desktop, um botão no canto.
 *
 * Escondido, sai da ordem de tabulação e da árvore de acessibilidade
 * (`inert`), porque um botão invisível alcançável pelo Tab é armadilha.
 * Sob reduced motion aparece e some sem deslizar.
 */
export function BarraAssinar() {
  const [heroNaTela, setHeroNaTela] = useState(true);
  const [formNaTela, setFormNaTela] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("cta-hero");
    const form = document.getElementById("assinar");
    const observadores: IntersectionObserver[] = [];
    if (hero) {
      const io = new IntersectionObserver(([e]) => setHeroNaTela(e.isIntersecting));
      io.observe(hero);
      observadores.push(io);
    }
    if (form) {
      // Some um pouco antes do formulário encostar no pé da tela.
      const io = new IntersectionObserver(([e]) => setFormNaTela(e.isIntersecting), { rootMargin: "0px 0px -15% 0px" });
      io.observe(form);
      observadores.push(io);
    }
    return () => observadores.forEach((io) => io.disconnect());
  }, []);

  const visivel = !heroNaTela && !formNaTela;

  return (
    <div
      id="barra-assinar"
      inert={!visivel}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/90 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur transition-[translate,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none sm:inset-x-auto sm:right-6 sm:bottom-6 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none ${
        visivel ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0 sm:translate-y-4"
      }`}
    >
      <a
        href="#assinar"
        className="block rounded-control bg-accent px-7 py-3.5 text-center font-medium text-accent-on shadow-[0_12px_30px_-10px_rgba(118,7,232,0.55)] transition-colors hover:bg-accent-hover active:translate-y-px"
      >
        {cursos.assinatura.cta}
      </a>
    </div>
  );
}
