import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { C, CenaProva, FONTE, Frase, MONO, Pilula, Rotulo, entrada, itemNaPratica, prog, surge } from "../nexo-kit/kit";
import { CENAS, b } from "../nexo-kit/cues";

/**
 * Filme do módulo "Benchmarking Preços Varejo" da /nexo (2026-10-07), irmão do
 * Spend via NF e do Spend Logístico (mesmo ritmo, mesma gramática).
 *
 * Os números de mercado saem dos dois prints do módulo: a lavadora de alta
 * pressão J6600 127V com 5 ofertas em 2 lojas, menor R$ 652,03, mediana
 * R$ 956,13, maior R$ 1.530,00, economia possível R$ 304,10 e dispersão de
 * 28,0%, e as faixas de preço dos outros produtos. O PREÇO DE COMPRA da
 * primeira cena é ilustrativo (os prints não mostram o custo do cliente), e as
 * lojas não têm nome: os prints também não nomeiam.
 */
const item = itemNaPratica("varejo");
const passos = item.passos;

export function FilmeVarejo() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{ background: C.papel, fontFamily: FONTE, color: C.tinta, overflow: "hidden" }}>
      <Frase t={t} cena={CENAS.frase1} texto={passos[0].nome} destaque={2} />
      <CenaCompra t={t} />
      <Frase t={t} cena={CENAS.frase2} texto={passos[1].nome} destaque={2} />
      <CenaVarredura t={t} />
      <Frase t={t} cena={CENAS.frase3} texto={passos[2].nome} destaque={1} />
      <CenaGanho t={t} />
      <CenaProva t={t} item={item} />
    </AbsoluteFill>
  );
}

const reais = (n: number) => `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/* ------------------------------------- cena 1: o preço de compra --- */

const produtos = [
  { nome: "Lavadora alta pressão J6600 127V", sku: "LAV-J6600", custo: 980 },
  { nome: "Chave de impacto 1/2\" bateria 20V", sku: "CHI-20V", custo: 2940 },
  { nome: "Lavadora alta pressão J6000", sku: "LAV-J6000", custo: 960 },
  { nome: "Pulverizador costal PJH", sku: "PUL-PJH", custo: 610 },
  { nome: "Esmerilhadeira angular 4 1/2\"", sku: "ESM-412", custo: 540 },
];
const COLS = [0, 300, 1220];

function CenaCompra({ t }: { t: number }) {
  const { de, ate } = CENAS.nota;
  if (t < de - 0.05 || t > ate + 0.25) return null;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 170, top: 170, width: 1580, display: "flex", justifyContent: "space-between", alignItems: "baseline", ...surge(t, de, ate) }}>
        <div style={{ fontSize: 40, fontWeight: 500, letterSpacing: "-0.02em" }}>Preço de compra do cliente</div>
        <Rotulo>Custo de aquisição por SKU</Rotulo>
      </div>
      <div style={{ position: "absolute", left: 170, top: 260, width: 1580, background: C.superficie, border: `1px solid ${C.linha}`, ...surge(t, de + 0.1, ate) }}>
        <div style={{ position: "relative", height: 74, borderBottom: `1px solid ${C.linha}` }}>
          {["SKU", "Produto", "Preço de compra"].map((h, i) => (
            <Rotulo key={h} style={{ position: "absolute", left: COLS[i] + 32, top: 26, fontSize: 18 }}>{h}</Rotulo>
          ))}
        </div>
        {produtos.map((p, i) => {
          const ini = de + 0.45 + i * 0.3;
          return (
            <div key={p.sku} style={{ position: "relative", height: 104, borderTop: i ? `1px solid ${C.linha}` : undefined, background: i === 0 && t > de + 2.6 ? "rgba(118,7,232,0.05)" : undefined }}>
              <div style={{ position: "absolute", inset: 0, ...surge(t, ini, Infinity, 18) }}>
                <div style={{ position: "absolute", left: COLS[0] + 32, top: 36, fontFamily: MONO, fontSize: 22, color: C.apagado }}>{p.sku}</div>
                <div style={{ position: "absolute", left: COLS[1] + 32, top: 34, fontSize: 30 }}>{p.nome}</div>
                <div style={{ position: "absolute", left: COLS[2] + 32, top: 34, fontSize: 30, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{reais(p.custo)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

/* --------------------------------------- cena 2: a varredura --- */

/* As 5 ofertas da J6600 em 2 lojas: menor, mediana e maior batem com o print. */
const ofertas = [
  { loja: "Loja A", v: 1530.0 },
  { loja: "Loja B", v: 799.9 },
  { loja: "Loja A", v: 956.13 },
  { loja: "Loja B", v: 652.03 },
  { loja: "Loja B", v: 1249.0 },
];
const kpis = [
  { r: "Menor preço", v: 652.03, sub: "melhor oferta do recorte", cor: C.azul },
  { r: "Mediana", v: 956.13, sub: "referência de mercado", cor: C.violeta },
  { r: "Maior preço", v: 1530.0, sub: "teto do recorte", cor: C.tinta },
];

function CenaVarredura({ t }: { t: number }) {
  const { de, ate } = CENAS.classifica;
  if (t < de - 0.05 || t > ate + 0.25) return null;
  const virada = de + 2.1;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 170, top: 170, width: 1580, display: "flex", justifyContent: "space-between", alignItems: "baseline", ...surge(t, de, ate) }}>
        <div style={{ fontSize: 40, fontWeight: 500, letterSpacing: "-0.02em" }}>{produtos[0].nome}</div>
        <Rotulo>
          {Math.min(ofertas.length, Math.max(0, Math.floor((t - de - 0.3) / 0.3) + 1))} ofertas · 2 lojas
        </Rotulo>
      </div>
      {/* As ofertas chegando, uma por colcheia. */}
      <div style={{ position: "absolute", left: 170, top: 260, width: 1580, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 24 }}>
        {ofertas.map((o, i) => (
          <div key={i} style={{ background: C.superficie, border: `1px solid ${C.linha}`, padding: "26px 28px", ...surge(t, de + 0.3 + i * 0.3, ate, 30) }}>
            <Rotulo style={{ fontSize: 17 }}>{o.loja}</Rotulo>
            <div style={{ marginTop: 10, fontSize: 38, fontWeight: 500, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{reais(o.v)}</div>
          </div>
        ))}
      </div>
      {/* E o motor resume: menor, mediana e maior. */}
      <div style={{ position: "absolute", left: 170, top: 520, width: 1580, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 30 }}>
        {kpis.map((k, i) => {
          const n = k.v * entrada(prog(t, virada + i * 0.15, 0.9));
          return (
            <div key={k.r} style={{ background: C.superficie, border: `1px solid ${C.linha}`, borderTop: `6px solid ${k.cor}`, padding: "30px 36px", ...surge(t, virada + i * 0.15, ate) }}>
              <Rotulo style={{ fontSize: 18 }}>{k.r}</Rotulo>
              <div style={{ marginTop: 12, fontSize: 60, fontWeight: 500, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{reais(n)}</div>
              <div style={{ marginTop: 4, fontSize: 24, color: C.apagado }}>{k.sub}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

/* ----------------------------------------- cena 3: onde está o ganho --- */

/* Faixas de preço do print varejo-faixa.jpg (menor, mediana, maior). */
const faixas = [
  { nome: "Lavadora alta pressão J6600 127V", min: 652.03, med: 956.13, max: 1530.0, destaque: true },
  { nome: "Pulverizador costal PJH", min: 495.0, med: 520.0, max: 708.1 },
  { nome: "Esmerilhadeira angular 4 1/2\"", min: 475.0, med: 489.0, max: 589.0 },
];
const ESCALA = { esq: 560, larg: 720, de: 400, ate: 1600 };
const xDe = (v: number) => ESCALA.esq + ((v - ESCALA.de) / (ESCALA.ate - ESCALA.de)) * ESCALA.larg;

function CenaGanho({ t }: { t: number }) {
  const { de, ate } = CENAS.recomenda;
  if (t < de - 0.05 || t > ate + 0.25) return null;
  const economia = 304.1 * entrada(prog(t, b(7, 3), 1.0));
  const dispersao = 28.0 * entrada(prog(t, b(7, 3.5), 1.0));
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 170, top: 170, width: 1580, display: "flex", justifyContent: "space-between", alignItems: "baseline", ...surge(t, de, ate) }}>
        <div style={{ fontSize: 40, fontWeight: 500, letterSpacing: "-0.02em" }}>Faixa de preço por produto</div>
        <div style={{ display: "flex", gap: 14 }}>
          <Pilula cor={C.azul}>menor</Pilula>
          <Pilula cor={C.violeta}>mediana</Pilula>
          <Pilula cor={C.tinta}>maior</Pilula>
        </div>
      </div>
      <div style={{ position: "absolute", left: 170, top: 260, width: 1580, height: 400, background: C.superficie, border: `1px solid ${C.linha}`, ...surge(t, de + 0.1, ate) }}>
        {faixas.map((f, i) => {
          const u = entrada(prog(t, de + 0.4 + i * 0.2, 0.9));
          const y = 80 + i * 110;
          const a = xDe(f.min);
          const z = a + (xDe(f.max) - a) * u;
          return (
            <div key={f.nome} style={{ position: "absolute", left: 0, top: y - 170, width: "100%" }}>
              <div style={{ position: "absolute", left: 40, top: 152, width: 480, fontSize: 26, color: f.destaque ? C.tinta : C.apagado, fontWeight: f.destaque ? 500 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.nome}</div>
              <div style={{ position: "absolute", left: a, top: 166, width: z - a, height: 6, background: C.linhaForte }} />
              <div style={{ position: "absolute", left: a - 12, top: 157, width: 24, height: 24, borderRadius: 9999, background: C.azul, opacity: u }} />
              <div style={{ position: "absolute", left: xDe(f.med) - 12, top: 157, width: 24, height: 24, borderRadius: 9999, background: C.violeta, opacity: prog(t, de + 0.9 + i * 0.2, 0.2) }} />
              <div style={{ position: "absolute", left: z - 12, top: 157, width: 24, height: 24, borderRadius: 9999, background: C.tinta, opacity: u }} />
              <div style={{ position: "absolute", left: xDe(f.max) + 30, top: 152, fontSize: 24, color: C.apagado, whiteSpace: "nowrap", opacity: u, fontVariantNumeric: "tabular-nums" }}>
                {reais(f.min)} – {reais(f.max)}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 170, top: 700, width: 1580, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 }}>
        <div style={{ background: C.superficie, border: `1px solid ${C.linha}`, borderLeft: `6px solid ${C.violeta}`, padding: "28px 36px", ...surge(t, b(7, 3), ate) }}>
          <Rotulo style={{ fontSize: 18, color: C.violeta }}>Economia possível</Rotulo>
          <div style={{ marginTop: 10, fontSize: 64, fontWeight: 500, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{reais(economia)}</div>
          <div style={{ marginTop: 4, fontSize: 24, color: C.apagado }}>mediana menos melhor oferta, por unidade</div>
        </div>
        <div style={{ background: C.superficie, border: `1px solid ${C.linha}`, padding: "28px 36px", ...surge(t, b(7, 3.5), ate) }}>
          <Rotulo style={{ fontSize: 18 }}>Dispersão</Rotulo>
          <div style={{ marginTop: 10, fontSize: 64, fontWeight: 500, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{dispersao.toFixed(1).replace(".", ",")}%</div>
          <div style={{ marginTop: 4, fontSize: 24, color: C.apagado }}>variação dos preços no mesmo produto</div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

