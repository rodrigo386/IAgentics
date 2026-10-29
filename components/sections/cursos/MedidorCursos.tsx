"use client";

import { useEffect } from "react";
import { registrarEvento } from "@/lib/eventos-cliente";

/**
 * Mede o que acontece dentro da /cursos (2026-10-29, item 1 da análise de
 * performance): até onde a pessoa rola (metade e fim, uma vez cada por
 * visita) e os cliques nos dois botões de assinar (o do topo, #cta-hero, e o
 * fixo, #barra-assinar). O formulário mede o resto (AssinaturaForm).
 * Não desenha nada.
 */
export function MedidorCursos() {
  useEffect(() => {
    const vistos = new Set<string>();
    const umaVez = (e: "rolagem_50" | "rolagem_100") => {
      if (vistos.has(e)) return;
      vistos.add(e);
      registrarEvento(e);
    };
    const aoRolar = () => {
      const fim = document.documentElement.scrollHeight - window.innerHeight;
      if (fim <= 0) return;
      const fracao = window.scrollY / fim;
      if (fracao >= 0.5) umaVez("rolagem_50");
      if (fracao >= 0.98) umaVez("rolagem_100");
    };
    const aoClicar = (ev: MouseEvent) => {
      const alvo = ev.target as Element | null;
      if (alvo?.closest("#cta-hero")) registrarEvento("cta_topo");
      else if (alvo?.closest("#barra-assinar a")) registrarEvento("cta_fixo");
    };
    window.addEventListener("scroll", aoRolar, { passive: true });
    document.addEventListener("click", aoClicar);
    return () => {
      window.removeEventListener("scroll", aoRolar);
      document.removeEventListener("click", aoClicar);
    };
  }, []);
  return null;
}
