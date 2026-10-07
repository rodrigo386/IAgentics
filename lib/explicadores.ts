/**
 * Os ids das explicações animadas que um artigo pode chamar pelo marcador
 * `<!-- explicador:<id> -->` numa linha própria do markdown (2026-10-07).
 * Arquivo sem JSX de propósito: o teste dos artigos importa daqui, e o
 * componente de cada id mora em components/artigos/explicadores.tsx.
 */
export const IDS_EXPLICADORES = ["mapa-de-cotacao"] as const;
export type IdExplicador = (typeof IDS_EXPLICADORES)[number];

/** O marcador, com o id capturado. */
export const MARCADOR_EXPLICADOR = /<!--\s*explicador:([a-z0-9-]+)\s*-->/;
