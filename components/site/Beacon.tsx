"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Contador de visitas do site: um POST por troca de rota, via sendBeacon
 * (não disputa banda com a navegação e sobrevive à página fechando).
 *
 * Privacidade por construção: manda SÓ o pathname - sem cookie, sem id, sem
 * user-agent - e o servidor agrega por dia+seção (lib/estatisticas.ts).
 * /app e /admin são pulados aqui E revalidados no servidor.
 */
export function Beacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || /^\/(app|admin)(\/|$)/.test(pathname)) return;
    const corpo = JSON.stringify({ rota: pathname });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/estatisticas", new Blob([corpo], { type: "application/json" }));
    } else {
      fetch("/api/estatisticas", { method: "POST", body: corpo, keepalive: true }).catch(() => {});
    }
  }, [pathname]);

  return null;
}
