"use client";

import { useEffect, useState } from "react";
import { bolsas } from "@/lib/content";

/**
 * Contagem regressiva até a abertura ou o fim das inscrições (2026-11-03).
 *
 * O primeiro desenho usa a hora do SERVIDOR (`agora`), a mesma que decidiu a
 * fase da página: assim o HTML do servidor e o do navegador batem, e o
 * relógio parado do e2e (BOLSAS_RELOGIO) vale aqui também. Depois de montar,
 * avança pelo relógio do navegador, corrigido pela diferença inicial.
 * Atualiza a cada 30 s: a menor unidade mostrada é o minuto.
 */
const t = bolsas.contagem;

function partes(ms: number) {
  const total = Math.max(0, Math.floor(ms / 60_000));
  return { dias: Math.floor(total / 1440), horas: Math.floor((total % 1440) / 60), minutos: total % 60 };
}

export function Contagem({ alvo, agora, rotulo, claro = false }: { alvo: number; agora: number; rotulo: "abre" | "fecha"; claro?: boolean }) {
  const [restante, setRestante] = useState(alvo - agora);

  useEffect(() => {
    const desvio = agora - Date.now();
    const tique = () => setRestante(alvo - (Date.now() + desvio));
    const id = setInterval(tique, 30_000);
    return () => clearInterval(id);
  }, [alvo, agora]);

  const p = partes(restante);
  const cor = claro ? "text-brand-paper" : "text-fg";
  const suave = claro ? "text-brand-paper/65" : "text-fg-muted";

  return (
    <div>
      <p className={`flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] ${suave}`}>
        <span aria-hidden="true" className="bolsas-ao-vivo size-2 rounded-full bg-brand-sky" />
        {t[rotulo]}
      </p>
      <p className="mt-3 flex items-baseline gap-5" aria-label={`${t[rotulo]} ${p.dias} ${t.dias}, ${p.horas} ${t.horas} e ${p.minutos} ${t.minutos}`}>
        {(
          [
            [p.dias, t.dias],
            [p.horas, t.horas],
            [p.minutos, t.minutos],
          ] as const
        ).map(([n, nome]) => (
          <span key={nome} className="flex items-baseline gap-1.5" aria-hidden="true">
            <span className={`tnum text-4xl font-medium tracking-[-0.04em] sm:text-5xl ${cor}`}>{String(n).padStart(2, "0")}</span>
            <span className={`text-sm ${suave}`}>{nome}</span>
          </span>
        ))}
      </p>
    </div>
  );
}
