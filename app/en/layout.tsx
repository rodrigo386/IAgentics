import type { ReactNode } from "react";

/**
 * A versão em inglês (2026-11-06). O <html lang="pt-BR"> é do layout raiz e
 * vale para o site todo; aqui o conteúdo declara o próprio idioma, que é o
 * que leitor de tela e tradutor automático respeitam. O idioma dos textos é
 * escolhido em cada página (`definirLingua`, lib/textos.ts).
 */
export default function LayoutIngles({ children }: { children: ReactNode }) {
  return <div lang="en">{children}</div>;
}
