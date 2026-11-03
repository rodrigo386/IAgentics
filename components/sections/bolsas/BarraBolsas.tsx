"use client";

import { useEffect, useState } from "react";
import { bolsas } from "@/lib/content";

/**
 * O botão de inscrição que acompanha a rolagem (2026-11-03), no molde da
 * BarraAssinar da /cursos: aparece quando o botão da capa (#cta-bolsas) sai
 * da tela e some quando a inscrição (#inscricao) entra. Escondido fica
 * `inert`. Barra no pé no celular, botão no canto no desktop.
 */
export function BarraBolsas() {
  const [capaNaTela, setCapaNaTela] = useState(true);
  const [formNaTela, setFormNaTela] = useState(false);

  useEffect(() => {
    const capa = document.getElementById("cta-bolsas");
    const form = document.getElementById("inscricao");
    const obs: IntersectionObserver[] = [];
    if (capa) {
      const io = new IntersectionObserver(([e]) => setCapaNaTela(e.isIntersecting));
      io.observe(capa);
      obs.push(io);
    }
    if (form) {
      const io = new IntersectionObserver(([e]) => setFormNaTela(e.isIntersecting), { rootMargin: "0px 0px -15% 0px" });
      io.observe(form);
      obs.push(io);
    }
    return () => obs.forEach((io) => io.disconnect());
  }, []);

  const visivel = !capaNaTela && !formNaTela;

  return (
    <div
      inert={!visivel}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/90 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur transition-[translate,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none sm:inset-x-auto sm:right-6 sm:bottom-6 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none ${
        visivel ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0 sm:translate-y-4"
      }`}
    >
      <a
        href="#inscricao"
        className="bolsas-cta block rounded-control bg-accent px-8 py-4 text-center text-lg font-medium text-accent-on transition-colors hover:bg-accent-hover active:translate-y-px"
      >
        {bolsas.capa.cta}
      </a>
    </div>
  );
}
