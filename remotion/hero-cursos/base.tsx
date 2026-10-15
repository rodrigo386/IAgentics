import type { CSSProperties } from "react";
import { cancelRender, continueRender, delayRender, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Logo } from "@/components/ui/Logo";
import { LogoSolution } from "@/components/ui/LogoSolution";
import { loadFont as carregarGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as carregarMono } from "@remotion/google-fonts/JetBrainsMono";
import { cursos } from "@/lib/content";
import { c01, entrada } from "../nexo-kit/kit";

/**
 * O que os três filmes da hero da /cursos têm em comum (2026-10-14): 4:5,
 * 18 s, mudos, em laço; fundo papel, tinta e um violeta só, como a página ao
 * lado. "Estilo Apple" aqui quer dizer uma ideia por vez, letra grande,
 * movimento lento e preciso, e o produto (as capas) como protagonista.
 *
 * Os pesos 600/700 do Space Grotesk entram só aqui: o kit dos filmes do Nexo
 * carrega 400/500, e o título de comercial precisa de mais peso.
 */
export const W = 1080;
export const H = 1350;
export const FPS = 30;
export const DURACAO = 18;

const grotesk = carregarGrotesk("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin", "latin-ext"] });
const mono = carregarMono("normal", { weights: ["500"], subsets: ["latin", "latin-ext"] });
const espera = delayRender("Carregando fontes do filme da hero");
Promise.all([grotesk.waitUntilDone(), mono.waitUntilDone()])
  .then(() => continueRender(espera))
  .catch((e) => cancelRender(e));

export const FONTE = '"Space Grotesk", sans-serif';
export const MONO = '"JetBrains Mono", monospace';
export const COR = {
  papel: "#f8f8f8",
  tinta: "#131723",
  violeta: "#7607e8",
  apagado: "#5a6070",
  linha: "rgba(19, 23, 35, 0.12)",
};

/** Segundos desde o início do filme. */
export function useT() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
}

/** 0→1 entre `ini` e `ini + dur`, com a curva de entrada do site. */
export const ent = (t: number, ini: number, dur: number) => entrada(c01((t - ini) / dur));
export const mix = (a: number, b: number, u: number) => a + (b - a) * u;

/** Entra subindo e nítido; sai subindo e embaçando. Sem `fim`, fica. */
export function aparece(t: number, ini: number, fim = Infinity, dur = 0.5): CSSProperties {
  const u = ent(t, ini, dur);
  const s = fim === Infinity ? 0 : ent(t, fim - 0.35, 0.35);
  const v = u * (1 - s);
  return {
    opacity: v,
    filter: v < 0.999 ? `blur(${(1 - v) * 10}px)` : undefined,
    translate: `0 ${(1 - u) * 40 - s * 30}px`,
  };
}

/** O preço e a frase de fecho, como na página. */
export const PRECO = cursos.assinatura.preco;
export const POR_MES = cursos.assinatura.porMes;

type Curso = (typeof cursos.vitrine.linhas)[number]["cursos"][number];
export const TODOS: Curso[] = cursos.vitrine.linhas.flatMap((l) => [...l.cursos]);
export const PUBLICADOS = TODOS.filter((c) => !("emBreve" in c));
export const curso = (nome: string) => TODOS.find((c) => c.nome.startsWith(nome))!;
export const TRILHAS = cursos.vitrine.linhas.map((l) => l.titulo);

/** Uma capa da vitrine, com o canto da plataforma. */
export function Capa({ src, largura, style }: { src: string; largura: number; style?: CSSProperties }) {
  return (
    <div
      style={{
        width: largura,
        height: (largura * 466) / 306,
        borderRadius: largura * 0.055,
        overflow: "hidden",
        background: COR.tinta,
        boxShadow: "0 30px 60px -20px rgba(19,23,35,0.35)",
        ...style,
      }}
    >
      <Img src={staticFile(src.replace(/^\//, ""))} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    </div>
  );
}

/** O fecho comum: o preço grande, em duas linhas, sobre o papel. */
export function Preco({ t, ini, tamanho = 150 }: { t: number; ini: number; tamanho?: number }) {
  return (
    <div style={{ textAlign: "center", fontFamily: FONTE, color: COR.tinta }}>
      <div style={{ fontSize: tamanho, fontWeight: 700, letterSpacing: "-0.045em", lineHeight: 0.95, ...aparece(t, ini) }}>{PRECO}</div>
      <div style={{ fontSize: tamanho * 0.36, fontWeight: 500, letterSpacing: "-0.02em", color: COR.apagado, marginTop: 18, ...aparece(t, ini + 0.25) }}>
        {POR_MES}
      </div>
    </div>
  );
}

/**
 * O lockup "IAgentics ACADEMY" (public/plataforma/academy-logo.png, 893×254),
 * nos vídeos de lançamento a pedido do Rodrigo (2026-10-15). O arquivo é
 * cinza-claro, feito para fundo escuro: vai como MÁSCARA na cor `cor`, a mesma
 * técnica do <Logo> da IAgentics no site, para ficar nítido no papel.
 */
export function LogoAcademy({ largura, cor = COR.tinta, style }: { largura: number; cor?: string; style?: CSSProperties }) {
  const mascara = `url(${staticFile("plataforma/academy-logo.png")})`;
  return (
    <div
      style={{
        width: largura,
        height: (largura * 254) / 893,
        backgroundColor: cor,
        WebkitMaskImage: mascara,
        maskImage: mascara,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        ...style,
      }}
    />
  );
}

/** As três marcas da hero da /cursos, lado a lado (fecho do filme da hero e
 *  dos posts de lançamento). Mesmos arquivos e proporções da hero; ver o
 *  comentário em components/sections/cursos/Estante.tsx. `academy`: troca o
 *  lockup da IAgentics pelo da IAgentics Academy (os posts de lançamento). */
export function Marcas({ style, academy = false }: { style?: CSSProperties; academy?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 40, color: COR.tinta, ...style }}>
      {academy ? <LogoAcademy largura={250} /> : <Logo className="w-[230px]" />}
      <span style={{ width: 2, height: 64, background: COR.linha }} />
      <Img src={staticFile("partner-pecege.png")} style={{ height: 88, width: "auto" }} />
      <span style={{ width: 2, height: 64, background: COR.linha }} />
      <LogoSolution className="w-[220px]" />
    </div>
  );
}
