import { AbsoluteFill, staticFile } from "remotion";
import { C, FONTE, MONO } from "../nexo-kit/kit";

/**
 * Capa 600×900 genérica dos cursos da IAgentics que ainda não têm capa nem foto
 * de professor (2026-10-14, pedido do Rodrigo: "capa gerada no padrão"). Mesmo
 * formato da capa do Fundamentos (remotion/capas/CapaFundamentos.tsx): fundo
 * escuro, marca no topo, título grande embaixo. No lugar da foto, um campo de
 * pontos com o brilho na cor da área (Compras, Vendas, Dados...), para os
 * cursos se distinguirem lado a lado.
 *
 * Gerada com `npx remotion still capa-curso <saida.jpg> --props='{"titulo":"...","area":"..."}'`.
 */
export type PropsCapaCurso = { titulo: string; area: string };

const COR_DA_AREA: Record<string, string> = {
  Compras: C.violeta,
  "Supply Chain": C.indigo,
  Vendas: C.pervinca,
  Dados: C.azul,
  Estratégia: C.indigo,
  Liderança: C.violeta,
  Gestão: C.pervinca,
  Processos: C.ceu,
  Produtividade: C.azul,
};

export function CapaCurso({ titulo, area }: PropsCapaCurso) {
  const cor = COR_DA_AREA[area] ?? C.violeta;
  const tamanho = titulo.length > 34 ? 56 : titulo.length > 24 ? 64 : 76;
  /* A linha muda com o título (determinística): capas vizinhas não repetem o
     mesmo desenho. Sobe no geral, porque é capa de curso, não de prejuízo. */
  let semente = [...titulo].reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 7);
  const sorteio = () => ((semente = (semente * 1103515245 + 12345) >>> 0) % 1000) / 1000;
  const pontos = [84, 192, 300, 408, 516].map((x, i) => [x, Math.round(470 - i * 80 + (sorteio() - 0.5) * 150)] as const);
  return (
    <AbsoluteFill style={{ background: C.tinta, fontFamily: FONTE, overflow: "hidden" }}>
      {/* O brilho da área e um campo de pontos: textura calma, sem foto. */}
      <div style={{ position: "absolute", left: -120, right: -120, top: 40, height: 620, background: `radial-gradient(ellipse 50% 45% at 55% 45%, ${cor}cc, transparent 70%)`, filter: "blur(10px)" }} />
      <svg width={600} height={600} style={{ position: "absolute", top: 60, left: 0, opacity: 0.55 }}>
        {Array.from({ length: 11 }).flatMap((_, i) =>
          Array.from({ length: 11 }).map((__, j) => (
            <circle key={`${i}-${j}`} cx={30 + i * 54} cy={30 + j * 54} r={(i + j) % 4 === 0 ? 3.5 : 1.8} fill="rgba(248,248,248,0.55)" />
          )),
        )}
        <polyline points={pontos.map((p) => p.join(",")).join(" ")} fill="none" stroke="rgba(248,248,248,0.85)" strokeWidth={3} />
        {pontos.map(([x, y]) => (
          <circle key={`${x}`} cx={x} cy={y} r={9} fill={C.tinta} stroke="rgba(248,248,248,0.9)" strokeWidth={3} />
        ))}
      </svg>
      {/* A marca, como máscara branca (o arquivo é o lockup oficial). */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 40,
          width: 190,
          height: 45,
          backgroundColor: C.papel,
          WebkitMaskImage: `url(${staticFile("iagentics-lockup.png")})`,
          maskImage: `url(${staticFile("iagentics-lockup.png")})`,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
        }}
      />
      <div style={{ position: "absolute", left: 40, right: 40, bottom: 56 }}>
        <div style={{ display: "inline-block", padding: "6px 14px", background: cor, color: C.papel, fontFamily: MONO, fontSize: 18, letterSpacing: "0.14em", textTransform: "uppercase" }}>
          {area}
        </div>
        <div style={{ marginTop: 18, fontSize: tamanho, fontWeight: 500, lineHeight: 1.0, letterSpacing: "-0.03em", color: C.papel, textWrap: "balance" }}>{titulo}</div>
      </div>
    </AbsoluteFill>
  );
}
