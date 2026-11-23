"use client";

import { useEffect } from "react";
import type { Evento } from "@/lib/eventos";
import { registrarEvento } from "@/lib/eventos-cliente";

/**
 * Mede o que acontece dentro de uma página (a /cursos desde 2026-10-29, a
 * /bolsas desde 2026-11-23): até onde a pessoa rola (metade e fim, uma vez
 * cada por visita) e os cliques nos dois botões que levam ao formulário (o do
 * topo e o fixo). O formulário mede o resto. Não desenha nada.
 */
export type Medicao = {
  metade: Evento;
  fim: Evento;
  /** Seletor do botão do topo e o evento do clique. */
  topo: [string, Evento];
  /** Seletor do botão fixo e o evento do clique. */
  fixo: [string, Evento];
};

export const MEDICAO_CURSOS: Medicao = { metade: "rolagem_50", fim: "rolagem_100", topo: ["#cta-hero", "cta_topo"], fixo: ["#barra-assinar a", "cta_fixo"] };
export const MEDICAO_BOLSAS: Medicao = {
  metade: "bolsas_rolagem_50",
  fim: "bolsas_rolagem_100",
  topo: ["#cta-bolsas", "bolsas_cta_topo"],
  fixo: ["#barra-bolsas a", "bolsas_cta_fixo"],
};

export function MedidorPagina({ medicao }: { medicao: Medicao }) {
  useEffect(() => {
    const vistos = new Set<Evento>();
    const umaVez = (e: Evento) => {
      if (vistos.has(e)) return;
      vistos.add(e);
      registrarEvento(e);
    };
    const aoRolar = () => {
      const fim = document.documentElement.scrollHeight - window.innerHeight;
      if (fim <= 0) return;
      const fracao = window.scrollY / fim;
      if (fracao >= 0.5) umaVez(medicao.metade);
      if (fracao >= 0.98) umaVez(medicao.fim);
    };
    const aoClicar = (ev: MouseEvent) => {
      const alvo = ev.target as Element | null;
      if (alvo?.closest(medicao.topo[0])) registrarEvento(medicao.topo[1]);
      else if (alvo?.closest(medicao.fixo[0])) registrarEvento(medicao.fixo[1]);
    };
    window.addEventListener("scroll", aoRolar, { passive: true });
    document.addEventListener("click", aoClicar);
    return () => {
      window.removeEventListener("scroll", aoRolar);
      document.removeEventListener("click", aoClicar);
    };
  }, [medicao]);
  return null;
}
