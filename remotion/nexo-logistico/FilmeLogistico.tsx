import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { C, CenaProva, FONTE, Frase, MONO, Pilula, Rotulo, entrada, fmt, itemNaPratica, prog, surge } from "../nexo-kit/kit";
import { CENAS, b } from "../nexo-kit/cues";

/**
 * Filme do módulo "Spend Logístico" da /nexo (2026-10-07), irmão do Spend via
 * NF: mesmo ritmo (nexo-kit/cues.ts), mesma gramática, mesmas cores do site.
 * As frases são os três passos do módulo e a prova vem de content.ts.
 *
 * Os dados das cenas saem dos dois prints do módulo: a Carga 22 (LTL, 6
 * paradas, 3.107 km, de Santa Maria das Barreiras a Paragominas, com origem a
 * 2.041 km) e a ocupação das cargas FTL (média 86,6%, ideal 95%). Os pedidos
 * da primeira cena são as cidades dessa carga.
 */
const item = itemNaPratica("logistico");
const passos = item.passos;

export function FilmeLogistico() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{ background: C.papel, fontFamily: FONTE, color: C.tinta, overflow: "hidden" }}>
      <Frase t={t} cena={CENAS.frase1} texto={passos[0].nome} destaque={1} />
      <CenaPedidos t={t} />
      <Frase t={t} cena={CENAS.frase2} texto={passos[1].nome} destaque={3} />
      <CenaRota t={t} />
      <Frase t={t} cena={CENAS.frase3} texto={passos[2].nome} destaque={2} />
      <CenaOcupacao t={t} />
      <CenaProva t={t} item={item} />
    </AbsoluteFill>
  );
}

/* --------------------------------------------- cena 1: os pedidos --- */

const pedidos = [
  { n: "4812", cidade: "Paragominas · PA", kg: 4200, sla: "5 dias" },
  { n: "4813", cidade: "Ulianópolis · PA", kg: 3150, sla: "5 dias" },
  { n: "4814", cidade: "São Geraldo do Araguaia · PA", kg: 2870, sla: "4 dias" },
  { n: "4815", cidade: "Rio Maria · PA", kg: 1940, sla: "4 dias" },
  { n: "4816", cidade: "Conceição do Araguaia · PA", kg: 2380, sla: "3 dias" },
  { n: "4817", cidade: "Santa Maria das Barreiras · PA", kg: 1610, sla: "3 dias" },
];
const COLS = [0, 200, 900, 1200];

function CenaPedidos({ t }: { t: number }) {
  const { de, ate } = CENAS.nota;
  if (t < de - 0.05 || t > ate + 0.25) return null;
  const chegada = (i: number) => de + 0.45 + i * 0.25; // uma linha por colcheia
  const chegaram = pedidos.filter((_, i) => t >= chegada(i));
  const peso = chegaram.reduce((s, p) => s + p.kg, 0);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 170, top: 170, width: 1580, display: "flex", justifyContent: "space-between", alignItems: "baseline", ...surge(t, de, ate) }}>
        <div style={{ fontSize: 40, fontWeight: 500, letterSpacing: "-0.02em" }}>Pedidos do corte</div>
        <div style={{ fontSize: 28, color: C.apagado, fontVariantNumeric: "tabular-nums" }}>
          <span style={{ color: C.tinta, fontWeight: 500 }}>{chegaram.length}</span> pedidos ·{" "}
          <span style={{ color: C.violeta, fontWeight: 500 }}>{fmt(peso)} kg</span>
        </div>
      </div>
      <div style={{ position: "absolute", left: 170, top: 260, width: 1580, background: C.superficie, border: `1px solid ${C.linha}`, ...surge(t, de + 0.1, ate) }}>
        <div style={{ position: "relative", height: 74, borderBottom: `1px solid ${C.linha}` }}>
          {["Pedido", "Cidade", "Peso", "SLA"].map((h, i) => (
            <Rotulo key={h} style={{ position: "absolute", left: COLS[i] + 32, top: 26, fontSize: 18 }}>{h}</Rotulo>
          ))}
        </div>
        {pedidos.map((p, i) => (
          <div key={p.n} style={{ position: "relative", height: 96, borderTop: i ? `1px solid ${C.linha}` : undefined }}>
            <div style={{ position: "absolute", inset: 0, ...surge(t, chegada(i), Infinity, 18) }}>
              <div style={{ position: "absolute", left: COLS[0] + 32, top: 32, fontFamily: MONO, fontSize: 24, color: C.apagado }}>#{p.n}</div>
              <div style={{ position: "absolute", left: COLS[1] + 32, top: 30, fontSize: 28 }}>{p.cidade}</div>
              <div style={{ position: "absolute", left: COLS[2] + 32, top: 30, fontSize: 28, fontVariantNumeric: "tabular-nums" }}>{fmt(p.kg)} kg</div>
              <div style={{ position: "absolute", left: COLS[3] + 32, top: 26 }}>
                <Pilula cor={C.violeta}>{p.sla}</Pilula>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
}

/* ------------------------------------------------ cena 2: a rota --- */

/* As seis paradas da Carga 22, nas posições relativas do mapa do print
   (logistico-rota.jpg), redesenhadas no painel. */
const MAPA = { x: 170, y: 190, w: 860, h: 720 };
const paradas = [
  { n: 1, cidade: "Santa Maria das Barreiras", x: 300, y: 560 },
  { n: 2, cidade: "Conceição do Araguaia", x: 345, y: 495 },
  { n: 3, cidade: "Rio Maria", x: 265, y: 400 },
  { n: 4, cidade: "São Geraldo do Araguaia", x: 420, y: 310 },
  { n: 5, cidade: "Ulianópolis", x: 525, y: 150 },
  { n: 6, cidade: "Paragominas", x: 540, y: 75 },
];
const origem = { x: 300, y: 690 };
const kms = [
  { entre: 0, km: "109 km", dx: -130, dy: -14 },
  { entre: 1, km: "178 km", dx: 40, dy: 0 },
  { entre: 2, km: "252 km", dx: -150, dy: -10 },
  { entre: 3, km: "412 km", dx: 30, dy: 0 },
];

function CenaRota({ t }: { t: number }) {
  const { de, ate } = CENAS.classifica;
  if (t < de - 0.05 || t > ate + 0.25) return null;
  const pontos = [origem, ...paradas];
  // Comprimento acumulado de cada trecho, para desenhar a linha no tempo.
  const trechos = pontos.slice(1).map((p, i) => Math.hypot(p.x - pontos[i].x, p.y - pontos[i].y));
  const total = trechos.reduce((s, v) => s + v, 0);
  const desenho = entrada(prog(t, de + 0.4, 2.2)) * total;
  let acumulado = 0;
  const chegou = trechos.map((v) => (acumulado += v) <= desenho + 0.5);
  const cenarios = 912 * entrada(prog(t, de + 0.3, 2.6));
  const pronto = t > de + 2.9;

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: MAPA.x, top: MAPA.y, width: MAPA.w, height: MAPA.h, background: C.superficie, border: `1px solid ${C.linha}`, ...surge(t, de, ate) }}>
        <Rotulo style={{ position: "absolute", left: 32, top: 28, fontSize: 18 }}>Malha desenhada pelo motor</Rotulo>
        <svg width={MAPA.w} height={MAPA.h} style={{ position: "absolute", inset: 0 }}>
          {/* Grade de pontos: o papel do mapa, calmo atrás da rota. */}
          {Array.from({ length: 15 }).flatMap((_, i) =>
            Array.from({ length: 13 }).map((__, j) => <circle key={`${i}-${j}`} cx={50 + i * 55} cy={90 + j * 50} r={2} fill={C.linha} />),
          )}
          <polyline
            points={pontos.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke={C.violeta}
            strokeWidth={5}
            strokeLinejoin="round"
            strokeDasharray={total}
            strokeDashoffset={total - desenho}
          />
          <circle cx={origem.x} cy={origem.y} r={9} fill={C.tinta} />
          {paradas.map((p, i) =>
            chegou[i] ? (
              <g key={p.n}>
                <circle cx={p.x} cy={p.y} r={22} fill={C.violeta} />
                <text x={p.x} y={p.y + 8} textAnchor="middle" fontFamily={FONTE} fontSize={22} fontWeight={500} fill={C.papel}>
                  {p.n}
                </text>
              </g>
            ) : null,
          )}
        </svg>
        {paradas.map((p, i) =>
          chegou[i] ? (
            <div key={p.n} style={{ position: "absolute", left: p.x + 34, top: p.y - 16, fontFamily: MONO, fontSize: 17, letterSpacing: "0.08em", textTransform: "uppercase", color: C.tinta, whiteSpace: "nowrap" }}>
              {p.cidade}
            </div>
          ) : null,
        )}
        {kms.map((k) =>
          chegou[k.entre + 1] ? (
            <div key={k.km} style={{ position: "absolute", left: (paradas[k.entre].x + paradas[k.entre + 1].x) / 2 + k.dx, top: (paradas[k.entre].y + paradas[k.entre + 1].y) / 2 + k.dy, fontSize: 20, color: C.apagado, background: C.superficie, padding: "2px 8px", whiteSpace: "nowrap" }}>
              {k.km}
            </div>
          ) : null,
        )}
        <div style={{ position: "absolute", left: origem.x + 22, top: origem.y - 14, fontSize: 20, color: C.apagado }}>Origem · 2.041 km</div>
      </div>

      {/* À direita: o motor comparando cenários até escolher. */}
      <div style={{ position: "absolute", left: 1090, top: 190, width: 660, display: "grid", gap: 28 }}>
        <div style={{ background: C.superficie, border: `1px solid ${C.linha}`, padding: "30px 36px", ...surge(t, de + 0.15, ate) }}>
          <Rotulo style={{ fontSize: 18 }}>Cenários comparados</Rotulo>
          <div style={{ marginTop: 10, fontSize: 96, fontWeight: 500, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums", color: pronto ? C.violeta : C.tinta }}>
            {fmt(cenarios)}
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
            {["Rota", "Veículo", "FTL × LTL", "Ocupação"].map((r, i) => (
              <div key={r} style={surge(t, de + 0.5 + i * 0.25, Infinity, 10)}>
                <Pilula cor={C.violeta}>{r}</Pilula>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: C.superficie, border: `1px solid ${C.linha}`, borderLeft: `6px solid ${C.violeta}`, padding: "30px 36px", ...surge(t, de + 2.9, ate) }}>
          <Rotulo style={{ fontSize: 18, color: C.violeta }}>Escolhido pelo menor custo total</Rotulo>
          <div style={{ marginTop: 14, fontSize: 40, fontWeight: 500, letterSpacing: "-0.02em" }}>Carga 22 · LTL</div>
          <div style={{ marginTop: 8, fontSize: 28, color: C.apagado }}>6 paradas · 3.107 km</div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

/* -------------------------------------------- cena 3: a ocupação --- */

const cargas = [
  { n: "Carga 5", p: 100.0 },
  { n: "Carga 1", p: 99.9 },
  { n: "Carga 4", p: 99.7 },
  { n: "Carga 7", p: 98.9 },
  { n: "Carga 2", p: 98.1 },
  { n: "Carga 3", p: 96.9 },
  { n: "Carga 6", p: 94.1 },
];
const BARRA = { esq: 380, larg: 1000 }; // 0% a 100%

function CenaOcupacao({ t }: { t: number }) {
  const { de, ate } = CENAS.recomenda;
  if (t < de - 0.05 || t > ate + 0.25) return null;
  const media = 86.6 * entrada(prog(t, b(7, 3), 1.2));
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 170, top: 170, width: 1580, display: "flex", justifyContent: "space-between", alignItems: "baseline", ...surge(t, de, ate) }}>
        <div style={{ fontSize: 40, fontWeight: 500, letterSpacing: "-0.02em" }}>Ocupação das cargas FTL</div>
        <div style={{ fontSize: 28, color: C.apagado }}>
          média <span style={{ color: C.violeta, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{media.toFixed(1).replace(".", ",")}%</span>
        </div>
      </div>
      <div style={{ position: "absolute", left: 170, top: 260, width: 1580, height: 660, background: C.superficie, border: `1px solid ${C.linha}`, ...surge(t, de + 0.1, ate) }}>
        {cargas.map((c, i) => {
          const u = entrada(prog(t, de + 0.4 + i * 0.12, 0.9));
          return (
            <div key={c.n} style={{ position: "absolute", left: 0, top: 50 + i * 80, width: "100%", height: 50 }}>
              <div style={{ position: "absolute", left: 40, width: BARRA.esq - 80, top: 8, textAlign: "right", fontSize: 26, color: C.apagado }}>{c.n}</div>
              <div style={{ position: "absolute", left: BARRA.esq, top: 6, height: 38, width: (BARRA.larg * c.p * u) / 100, background: c.p >= 95 ? C.violeta : C.azul }} />
              <div style={{ position: "absolute", left: BARRA.esq + (BARRA.larg * c.p * u) / 100 + 18, top: 8, fontSize: 26, fontWeight: 500, fontVariantNumeric: "tabular-nums", opacity: u }}>
                {(c.p * u).toFixed(1).replace(".", ",")}%
              </div>
            </div>
          );
        })}
        {/* A linha da preferência operacional, 95%. Tracejado em SVG, em passo
            fixo (dica da skill: borda tracejada em CSS "anda"). */}
        <svg style={{ position: "absolute", left: BARRA.esq + BARRA.larg * 0.95 - 2, top: 30, ...surge(t, de + 0.3, Infinity, 0) }} width={4} height={580}>
          <line x1={2} y1={0} x2={2} y2={580} stroke={C.tinta} strokeWidth={3} strokeDasharray="10 10" />
        </svg>
        <div style={{ position: "absolute", left: BARRA.esq + BARRA.larg * 0.95 - 60, top: 612, fontSize: 22, color: C.apagado, ...surge(t, de + 0.3, Infinity, 0) }}>ideal 95%</div>
      </div>
    </AbsoluteFill>
  );
}
