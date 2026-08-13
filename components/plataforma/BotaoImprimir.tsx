"use client";
import { plataforma } from "@/lib/content-plataforma";

export function BotaoImprimir() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-control border border-line-strong px-6 py-2.5 text-sm font-medium transition-colors hover:border-fg"
    >
      {plataforma.certificado.imprimir}
    </button>
  );
}
