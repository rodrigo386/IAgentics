"use client";
import { usePathname } from "next/navigation";

const METRICOOL_HASH = "8acd77f0d981da5af46364590d7cd7b2";

/**
 * Pixel de rastreamento da Metricool, só nas rotas públicas: a mesma fronteira
 * do GoogleAnalytics e do Beacon (/app e /admin sem rastreador de terceiro).
 * É uma imagem 1x1 carregada uma vez por documento, então conta chegadas ao
 * site, não cada troca de rota feita no cliente.
 */
export function MetricoolPixel() {
  const pathname = usePathname();
  /* /bolsas/video/[token] também fica de fora (2026-11-03): o token no
     endereço é a chave da inscrição, e o rastreador registraria a URL inteira. */
  if (!pathname || /^\/(app|admin)(\/|$)/.test(pathname) || pathname.startsWith("/bolsas/video/")) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://tracker.metricool.com/c3po.jpg?hash=${METRICOOL_HASH}`}
      alt=""
      aria-hidden="true"
      width={1}
      height={1}
      style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
    />
  );
}
