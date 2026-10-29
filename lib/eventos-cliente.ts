import { naoContarEsteNavegador } from "@/lib/nao-contar";
import type { EventoCursos } from "@/lib/eventos";

/**
 * Registra um evento da /cursos (lib/eventos.ts). Mesmo jeito do contador de
 * visitas (components/site/Beacon.tsx): sendBeacon, nada além do nome do
 * evento, e quem marcou "não contar" no /admin fica de fora.
 */
export function registrarEvento(evento: EventoCursos): void {
  if (typeof window === "undefined" || naoContarEsteNavegador()) return;
  const dados = JSON.stringify({ evento });
  try {
    if (navigator.sendBeacon) navigator.sendBeacon("/api/eventos", new Blob([dados], { type: "application/json" }));
    else void fetch("/api/eventos", { method: "POST", body: dados, keepalive: true }).catch(() => {});
  } catch {
    /* Medição nunca atrapalha a página. */
  }
}
