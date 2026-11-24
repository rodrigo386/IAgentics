import type { ReactNode } from "react";
import { Documento, metadataRaiz, viewportRaiz } from "@/components/site/Documento";

/**
 * Layout raiz do site em português. Desde 2026-11-24 há dois layouts raiz:
 * este, para tudo que não é /en, e app/en/layout.tsx, cada um com o próprio
 * `<html lang>` (ver components/site/Documento.tsx).
 */
export const metadata = metadataRaiz("pt");
export const viewport = viewportRaiz;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <Documento lingua="pt">{children}</Documento>;
}
