import type { ComponentType } from "react";
import type { IdExplicador } from "@/lib/explicadores";
import { ExplicadorMapaCotacao } from "./ExplicadorMapaCotacao";

/**
 * O componente de cada explicação animada (ids em lib/explicadores.ts). O
 * markdown continua puro: o marcador é um comentário HTML, invisível para quem
 * lê o arquivo cru e para o markdown servido a agentes.
 */
export const EXPLICADORES: Record<IdExplicador, ComponentType> = {
  "mapa-de-cotacao": ExplicadorMapaCotacao,
};
