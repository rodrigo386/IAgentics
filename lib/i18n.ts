/**
 * Versão em inglês do site (2026-11-06, pedido do Rodrigo: "uma opção para
 * trocar o idioma de todo o site para inglês"). Decisões dele: público de fora
 * (clientes, parceiros, programas), então só as páginas institucionais ganham
 * inglês, em endereço próprio (/en); /cursos, /bolsas e /diagnose-compras
 * vendem em reais para o Brasil e ficam em português. Tradução minha,
 * publicada direto.
 *
 * Os textos em inglês moram em lib/content-en/, com o MESMO formato dos de
 * lib/content.ts: `Traducao<typeof x>` faz o compilador recusar chave
 * faltando ou sobrando. Mudou um texto em português? Mude o inglês junto.
 */
export type Lingua = "pt" | "en";

/** O formato de um objeto de content.ts com as strings abertas (o `as const`
 *  do português fixa cada texto como tipo literal). */
export type Traducao<T> = T extends string
  ? string
  : T extends (...args: never[]) => unknown
    ? T
    : T extends object
      ? { readonly [K in keyof T]: Traducao<T[K]> }
      : T;

/** Páginas com versão em inglês: português → inglês. */
export const ROTAS_EN = {
  "/": "/en",
  "/nexo": "/en/nexo",
  "/spend-lab": "/en/spend-lab",
  "/academy": "/en/academy",
  "/privacidade": "/en/privacy",
} as const;

export type RotaComIngles = keyof typeof ROTAS_EN;

/** O endereço equivalente no outro idioma. Página sem versão em inglês leva
 *  à home em inglês; página em inglês sempre tem a portuguesa. */
export function rotaNoOutroIdioma(rota: string): string {
  const semBarra = rota !== "/" ? rota.replace(/\/$/, "") : rota;
  for (const [pt, en] of Object.entries(ROTAS_EN)) {
    if (semBarra === en) return pt;
  }
  return (ROTAS_EN as Record<string, string>)[semBarra] ?? "/en";
}

/** O caminho de uma página no idioma pedido (para links internos). */
export function rotaEm(lingua: Lingua, rota: RotaComIngles): string {
  return lingua === "en" ? ROTAS_EN[rota] : rota;
}
