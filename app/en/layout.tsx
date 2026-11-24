import type { ReactNode } from "react";
import { Documento, metadataRaiz, viewportRaiz } from "@/components/site/Documento";

/**
 * A versão em inglês (2026-11-06). Desde 2026-11-24 é um layout RAIZ próprio,
 * com `<html lang="en">`: antes o documento inteiro dizia pt-BR e só um <div
 * lang="en"> corrigia o conteúdo (auditoria de SEO). O idioma dos textos
 * continua escolhido em cada página (`definirLingua`, lib/textos.ts).
 */
export const metadata = metadataRaiz("en");
export const viewport = viewportRaiz;

export default function LayoutIngles({ children }: { children: ReactNode }) {
  return <Documento lingua="en">{children}</Documento>;
}
