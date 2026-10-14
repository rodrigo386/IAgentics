import { AbsoluteFill, Img, staticFile } from "remotion";
import { C, FONTE, MONO } from "../nexo-kit/kit";

/**
 * Capa 612×932 (o dobro do card, 306×466) dos cursos da vitrine da /cursos
 * que não têm capa da plataforma (2026-10-14, pedido do Rodrigo: "faça capas
 * com estilo para os cursos em breve"). Segue o desenho das capas da Solution
 * que estão ao lado: fundo escuro, ícone de salvar no canto, título grande
 * embaixo e uma linha de crédito no pé.
 *
 * Duas formas:
 *  - em breve: sem foto. Brilho numa das cores da marca e um de seis desenhos
 *    (rede, blocos, gráfico, anéis, fluxo, onda), alternados no Root para
 *    capas vizinhas nunca repetirem; dentro do desenho, os detalhes mudam com
 *    o título (determinístico). A primeira versão usava um desenho por
 *    trilha e a linha de Compras virou nove gráficos de barra iguais. O selo
 *    "Em breve" vai DESENHADO: a página vende a assinatura.
 *  - com foto (Marketing com IA): o professor em destaque, com a vinheta da
 *    capa do Fundamentos.
 *
 * As props saem de `cursos.vitrine` (lib/content.ts) no Root: uma composição
 * `capa-vitrine-<slug>` por curso marcado `gerada`. `npm run capas:vitrine`
 * gera todas no caminho de `capa`.
 */
export type Motivo = "rede" | "linha" | "fluxo" | "aneis" | "blocos" | "onda";
export const MOTIVOS: Motivo[] = ["rede", "blocos", "linha", "aneis", "fluxo", "onda"];
export type PropsCapaVitrine = {
  titulo: string;
  cor: string;
  motivo: Motivo;
  emBreve: boolean;
  rodape: string;
  foto?: string;
  enquadre?: string;
};

export const LARGURA_CAPA_VITRINE = 612;
export const ALTURA_CAPA_VITRINE = 932;
const W = LARGURA_CAPA_VITRINE;

function sorteador(texto: string) {
  let semente = [...texto].reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 7);
  return () => ((semente = (semente * 1103515245 + 12345) >>> 0) % 1000) / 1000;
}

/** O desenho da capa em breve, na metade de cima. */
function Desenho({ motivo, titulo, cor }: { motivo: Motivo; titulo: string; cor: string }) {
  const r = sorteador(titulo);
  const branco = "rgba(248,248,248,0.85)";
  if (motivo === "rede") {
    const nos = Array.from({ length: 9 }).map((_, i) => {
      const ang = (i / 9) * Math.PI * 2 + r() * 0.6;
      const raio = 120 + r() * 120;
      return [W / 2 + Math.cos(ang) * raio, 300 + Math.sin(ang) * raio * 0.85] as const;
    });
    return (
      <svg width={W} height={620} style={{ position: "absolute", top: 0, left: 0 }}>
        {nos.map(([x, y], i) => (
          <line key={`c${i}`} x1={W / 2} y1={300} x2={x} y2={y} stroke="rgba(248,248,248,0.35)" strokeWidth={2} />
        ))}
        {nos.map(([x, y], i) => {
          const [x2, y2] = nos[(i + 2) % nos.length];
          return <line key={`v${i}`} x1={x} y1={y} x2={x2} y2={y2} stroke="rgba(248,248,248,0.18)" strokeWidth={1.5} />;
        })}
        {nos.map(([x, y], i) => (
          <circle key={`n${i}`} cx={x} cy={y} r={i % 3 === 0 ? 13 : 8} fill={C.tinta} stroke={branco} strokeWidth={3} />
        ))}
        <circle cx={W / 2} cy={300} r={44} fill={cor} stroke={branco} strokeWidth={3} />
        <circle cx={W / 2} cy={300} r={16} fill={C.papel} />
      </svg>
    );
  }
  if (motivo === "fluxo") {
    // Etapas em cadeia (fornecedor → estoque → cliente), com alturas sorteadas.
    const n = 4;
    const caixas = Array.from({ length: n }).map((_, i) => ({ x: 70 + i * 128, h: 90 + Math.round(r() * 150) }));
    return (
      <svg width={W} height={620} style={{ position: "absolute", top: 0, left: 0 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`g${i}`} x1={0} y1={120 + i * 36} x2={W} y2={120 + i * 36} stroke="rgba(248,248,248,0.07)" strokeWidth={1} />
        ))}
        {caixas.map((c, i) => (
          <g key={i}>
            <rect x={c.x} y={460 - c.h} width={88} height={c.h} fill={i === n - 1 ? cor : "rgba(248,248,248,0.08)"} stroke={branco} strokeWidth={3} />
            {i < n - 1 ? (
              <path d={`M ${c.x + 96} 400 L ${c.x + 120} 400 M ${c.x + 112} 392 L ${c.x + 120} 400 L ${c.x + 112} 408`} stroke={branco} strokeWidth={3} fill="none" />
            ) : null}
          </g>
        ))}
      </svg>
    );
  }
  if (motivo === "aneis") {
    const cx = W / 2 + (r() - 0.5) * 120;
    return (
      <svg width={W} height={620} style={{ position: "absolute", top: 0, left: 0 }}>
        {[60, 110, 160, 210, 260].map((raio, i) => {
          const volta = 2 * Math.PI * raio;
          const arco = volta * (0.35 + r() * 0.5);
          return (
            <circle key={raio} cx={cx} cy={300} r={raio} fill="none" stroke={i === 2 ? cor : "rgba(248,248,248,0.75)"} strokeWidth={i === 2 ? 10 : 3}
              strokeDasharray={`${arco} ${volta}`} strokeLinecap="round" transform={`rotate(${Math.round(r() * 360)} ${cx} 300)`} />
          );
        })}
        <circle cx={cx} cy={300} r={18} fill={C.papel} />
      </svg>
    );
  }
  if (motivo === "blocos") {
    const lado = 60;
    return (
      <svg width={W} height={620} style={{ position: "absolute", top: 0, left: 0 }}>
        {Array.from({ length: 7 }).flatMap((_, i) =>
          Array.from({ length: 6 }).map((__, j) => {
            const v = r();
            const x = 50 + i * 76;
            const y = 100 + j * 76;
            return v > 0.82 ? (
              <rect key={`${i}-${j}`} x={x} y={y} width={lado} height={lado} fill={cor} />
            ) : v > 0.45 ? (
              <rect key={`${i}-${j}`} x={x} y={y} width={lado} height={lado} fill="none" stroke="rgba(248,248,248,0.55)" strokeWidth={2.5} />
            ) : (
              <circle key={`${i}-${j}`} cx={x + lado / 2} cy={y + lado / 2} r={3} fill="rgba(248,248,248,0.45)" />
            );
          }),
        )}
      </svg>
    );
  }
  if (motivo === "onda") {
    const fase = r() * Math.PI * 2;
    const ondas = [0, 1, 2, 3, 4, 5, 6, 7];
    return (
      <svg width={W} height={620} style={{ position: "absolute", top: 0, left: 0 }}>
        {ondas.map((k) => {
          const pts = Array.from({ length: 41 }).map((_, i) => {
            const x = (i / 40) * W;
            const y = 170 + k * 42 + Math.sin(i / 6 + fase + k * 0.45) * (30 + k * 5);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          });
          return <polyline key={k} points={pts.join(" ")} fill="none" stroke={k === 4 ? cor : "rgba(248,248,248,0.6)"} strokeWidth={k === 4 ? 7 : 2.5} />;
        })}
      </svg>
    );
  }
  const pontos = [70, 188, 306, 424, 542].map((x, i) => [x, Math.round(480 - i * 70 + (r() - 0.5) * 160)] as const);
  return (
    <svg width={W} height={620} style={{ position: "absolute", top: 0, left: 0 }}>
      {Array.from({ length: 12 }).flatMap((_, i) =>
        Array.from({ length: 11 }).map((__, j) => (
          <circle key={`${i}-${j}`} cx={26 + i * 51} cy={110 + j * 48} r={(i + j) % 4 === 0 ? 3.2 : 1.6} fill="rgba(248,248,248,0.4)" />
        )),
      )}
      <polygon points={`70,560 ${pontos.map((p) => p.join(",")).join(" ")} 542,560`} fill="rgba(248,248,248,0.08)" />
      <polyline points={pontos.map((p) => p.join(",")).join(" ")} fill="none" stroke={branco} strokeWidth={4} />
      {pontos.map(([x, y], i) => (
        <circle key={x} cx={x} cy={y} r={i === pontos.length - 1 ? 14 : 9} fill={i === pontos.length - 1 ? cor : C.tinta} stroke={branco} strokeWidth={3} />
      ))}
    </svg>
  );
}

/** O ícone de salvar das capas da plataforma: aro branco com o marcador. */
function Salvar() {
  return (
    <svg width={64} height={64} viewBox="0 0 64 64" style={{ position: "absolute", top: 26, right: 26 }}>
      <circle cx={32} cy={32} r={29} fill="none" stroke="rgba(248,248,248,0.95)" strokeWidth={2.5} />
      <path d="M23 18h18v28l-9-6.5-9 6.5z" fill="none" stroke="rgba(248,248,248,0.95)" strokeWidth={3} strokeLinejoin="round" />
    </svg>
  );
}

export function CapaVitrine({ titulo, cor, motivo, emBreve, rodape, foto, enquadre }: PropsCapaVitrine) {
  const tamanho = titulo.length > 38 ? 54 : titulo.length > 26 ? 62 : titulo.length > 16 ? 72 : 84;
  return (
    <AbsoluteFill style={{ background: C.tinta, fontFamily: FONTE, overflow: "hidden" }}>
      {foto ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 640 }}>
          <Img src={staticFile(foto.replace(/^\//, ""))} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: enquadre ?? "50% 20%" }} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse 60% 62% at 50% 36%, transparent 30%, rgb(19 23 35 / 0.55) 70%, rgb(19 23 35) 100%), linear-gradient(to bottom, rgb(19 23 35 / 0.35) 0%, transparent 18%, transparent 55%, rgb(19 23 35) 98%)",
            }}
          />
        </div>
      ) : (
        <>
          <div style={{ position: "absolute", left: -140, right: -140, top: 0, height: 700, background: `radial-gradient(ellipse 48% 44% at 50% 44%, ${cor}d9, transparent 72%)`, filter: "blur(12px)" }} />
          <Desenho motivo={motivo} titulo={titulo} cor={cor} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 380, height: 300, background: "linear-gradient(to bottom, transparent, rgb(19 23 35))" }} />
        </>
      )}
      <Salvar />
      <div style={{ position: "absolute", left: 34, right: 34, bottom: 92, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        {emBreve ? (
          <div style={{ padding: "9px 24px", background: C.papel, borderRadius: 999, fontFamily: MONO, fontSize: 26, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: C.tinta }}>
            Em breve
          </div>
        ) : null}
        <div style={{ fontSize: tamanho, fontWeight: 600, lineHeight: 0.98, letterSpacing: "-0.03em", color: C.papel, textWrap: "balance", textTransform: "uppercase" }}>{titulo}</div>
      </div>
      <div style={{ position: "absolute", bottom: 36, left: 0, right: 0, textAlign: "center", fontSize: 28, color: "rgba(248,248,248,0.9)" }}>{rodape}</div>
    </AbsoluteFill>
  );
}
