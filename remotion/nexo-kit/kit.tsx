import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Easing, cancelRender, continueRender, delayRender } from "remotion";
import { loadFont as carregarGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as carregarMono } from "@remotion/google-fonts/JetBrainsMono";
import { nexoPage } from "@/lib/content";
import { CENAS } from "./cues";

/**
 * O que os filmes dos módulos do Nexo têm em comum (2026-10-07): fontes e
 * tokens do site, a gramática de movimento (surge embaçado, mola), as frases
 * palavra por palavra, as peças de interface e a cena final da prova. Cada
 * filme (remotion/nexo-nf, nexo-logistico, nexo-varejo) só escreve as três
 * cenas do meio. A folha de tempo também é comum (cues.ts): os três filmes têm
 * o mesmo ritmo, então lado a lado na página respiram igual.
 */

export type ItemNaPratica = (typeof nexoPage.naPratica.itens)[number];
export const itemNaPratica = (id: string) => nexoPage.naPratica.itens.find((i) => i.id === id)!;

const grotesk = carregarGrotesk("normal", { weights: ["400", "500"], subsets: ["latin", "latin-ext"] });
const mono = carregarMono("normal", { weights: ["400", "500"], subsets: ["latin", "latin-ext"] });
const espera = delayRender("Carregando Space Grotesk e JetBrains Mono");
Promise.all([grotesk.waitUntilDone(), mono.waitUntilDone()])
  .then(() => continueRender(espera))
  .catch((e) => cancelRender(e));

/* Tokens do site (app/globals.css, modo claro) em hex: cor que anima precisa
   ser hex. Raio 0 nas superfícies e pílula nos controles, como no site. */
export const C = {
  papel: "#f8f8f8",
  superficie: "#fcfcfd",
  tinta: "#131723",
  apagado: "#5a6070",
  sutil: "#767c8c",
  linha: "rgba(19, 23, 35, 0.14)",
  linhaForte: "rgba(19, 23, 35, 0.28)",
  violeta: "#7607e8",
  indigo: "#6020ee",
  pervinca: "#6c66f3",
  azul: "#6693f8",
  ceu: "#55afed",
};
export const FONTE = '"Space Grotesk", sans-serif';
export const MONO = '"JetBrains Mono", monospace';

/** A curva de entrada do site (bezier 0.16, 1, 0.3, 1). */
export const entrada = Easing.bezier(0.16, 1, 0.3, 1);
export const c01 = (v: number) => Math.min(1, Math.max(0, v));
export const prog = (t: number, ini: number, dur: number) => c01((t - ini) / dur);
export const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(Math.round(n));

/** Mola criticamente amortecida, em forma fechada (kit da skill). */
export function mola(t: number, resposta = 9) {
  if (t <= 0) return 0;
  return 1 - Math.exp(-resposta * t) * (1 + resposta * t);
}

/** Entra embaçado e subindo; sai embaçado. É a gramática de toda a peça. */
export function surge(t: number, ini: number, fim = Infinity, sobe = 28): CSSProperties {
  const u = entrada(prog(t, ini, 0.35));
  const s = fim === Infinity ? 0 : prog(t, fim - 0.2, 0.2);
  const v = u * (1 - s);
  return {
    opacity: v,
    filter: v < 1 ? `blur(${(1 - v) * 12}px)` : undefined,
    translate: `0 ${(1 - u) * sobe - s * 12}px`,
  };
}

/* ------------------------------------------------------------- frases --- */

/**
 * Frase entre cenas, palavra por palavra no tempo (kit punchlines): cada
 * palavra já tem seu lugar desde o início, então a linha nunca recentraliza.
 * As últimas `destaque` palavras vão no violeta.
 */
export function Frase({ t, cena, texto, destaque }: { t: number; cena: { de: number; ate: number }; texto: string; destaque: number }) {
  if (t < cena.de - 0.05 || t > cena.ate + 0.25) return null;
  const palavras = texto.split(" ");
  const saida = prog(t, cena.ate, 0.2);
  const passo = Math.min(0.25, (cena.ate - cena.de - 0.7) / palavras.length);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.26em",
        // Frase longa encolhe para caber em uma linha (largura média de 0,55 em por caractere no Space Grotesk).
        fontSize: Math.min(132, 1620 / (texto.length * 0.55)),
        fontWeight: 500,
        letterSpacing: "-0.03em",
        whiteSpace: "nowrap",
        opacity: 1 - saida,
        filter: saida > 0 ? `blur(${saida * 12}px)` : undefined,
      }}
    >
      {palavras.map((p, i) => {
        const u = entrada(prog(t, cena.de + 0.1 + i * passo, 0.3));
        return (
          <span
            key={i}
            style={{
              color: i >= palavras.length - destaque ? C.violeta : C.tinta,
              opacity: u,
              filter: u < 1 ? `blur(${(1 - u) * 16}px)` : undefined,
              translate: `0 ${(1 - u) * 36 - saida * 16}px`,
            }}
          >
            {p}
          </span>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------- peças da interface --- */

export function Rotulo({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: "0.16em", textTransform: "uppercase", color: C.apagado, ...style }}>
      {children}
    </div>
  );
}

export function Pilula({ cor, children, cheia = false, style }: { cor: string; children: ReactNode; cheia?: boolean; style?: CSSProperties }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        borderRadius: 9999,
        padding: "6px 16px",
        fontSize: 22,
        whiteSpace: "nowrap",
        background: cheia ? cor : C.superficie,
        color: cheia ? C.papel : C.tinta,
        border: cheia ? "none" : `1px solid ${C.linhaForte}`,
        ...style,
      }}
    >
      {cheia ? null : <span style={{ width: 10, height: 10, borderRadius: 9999, background: cor }} />}
      {children}
    </span>
  );
}

/* ------------------------------------------------ cena 4: a prova --- */

export function CenaProva({ t, item }: { t: number; item: ItemNaPratica }) {
  const { de, ate } = CENAS.prova;
  if (t < de - 0.05 || t > ate + 0.25) return null;
  // "$216k" vira número + sufixo, para contar só o número.
  const m = item.prova.numero.match(/^(\D*)(\d+)(\D*)$/)!;
  const n = Number(m[2]) * entrada(prog(t, de + 0.15, 1.0));
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}>
      <Rotulo style={{ fontSize: 24, color: C.violeta, ...surge(t, de, ate) }}>{item.prova.rotulo}</Rotulo>
      <div style={{ marginTop: 10, fontSize: 300, fontWeight: 500, letterSpacing: "-0.05em", lineHeight: 1, color: C.tinta, fontVariantNumeric: "tabular-nums", ...surge(t, de + 0.05, ate, 40) }}>
        {m[1]}
        {Math.round(n)}
        {m[3]}
      </div>
      <div style={{ marginTop: 26, maxWidth: 1100, fontSize: 44, lineHeight: 1.25, color: C.apagado, ...surge(t, de + 0.7, ate) }}>{item.prova.unidade}</div>
    </AbsoluteFill>
  );
}

