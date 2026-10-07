import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { C, CenaProva, FONTE, Frase, MONO, Pilula, Rotulo, entrada, itemNaPratica, prog, surge } from "../nexo-kit/kit";
import { CENAS, b } from "../nexo-kit/cues";

/**
 * Filme do módulo "Orçamento" da /nexo (2026-10-07, pedido do Rodrigo): o
 * orçamento anual saindo do Excel para o sistema — a área preenche, vai para
 * aprovação, e Finanças recebe tudo consolidado, sem juntar planilhas.
 * Mesmo ritmo e kit dos outros três filmes (remotion/nexo-kit).
 *
 * O módulo NÃO TEM PRINTS, então todos os números aqui são ILUSTRATIVOS. Eles
 * fecham entre si: as linhas de Marketing somam o orçado da área, as cinco
 * áreas somam R$ 18,42 mi, contra R$ 16,96 mi em 2026 (+8,6%), e Marketing
 * cresce 22% — o desvio que a IA aponta.
 */
const item = itemNaPratica("orcamento");
const passos = item.passos;

export function FilmeOrcamento() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{ background: C.papel, fontFamily: FONTE, color: C.tinta, overflow: "hidden" }}>
      <Frase t={t} cena={CENAS.frase1} texto={passos[0].nome} destaque={2} />
      <CenaPreenche t={t} />
      <Frase t={t} cena={CENAS.frase2} texto={passos[1].nome} destaque={1} />
      <CenaAprova t={t} />
      <Frase t={t} cena={CENAS.frase3} texto={passos[2].nome} destaque={2} />
      <CenaFinancas t={t} />
      <CenaProva t={t} item={item} />
    </AbsoluteFill>
  );
}

const reais = (n: number) => `R$ ${Math.round(n).toLocaleString("pt-BR")}`;
const mi = (n: number) => `R$ ${(n / 1_000_000).toFixed(2).replace(".", ",")} mi`;

/* ------------------------ cena 1: das planilhas para o formulário --- */

const planilhas = ["Orcamento_MKT_v3_FINAL.xlsx", "Orc_TI_rev2 (1).xlsx", "Budget_Operacoes_NOVO.xlsx", "RH_orcamento_ok_ok.xlsx"];
const linhasMkt = [
  { conta: "Mídia paga", v: 1_850_000 },
  { conta: "Eventos e feiras", v: 720_000 },
  { conta: "Ferramentas e licenças", v: 410_000 },
  { conta: "Produção de conteúdo", v: 260_000 },
];

function CenaPreenche({ t }: { t: number }) {
  const { de, ate } = CENAS.nota;
  if (t < de - 0.05 || t > ate + 0.25) return null;
  // As planilhas entram, são riscadas e saem para a direita, rumo ao formulário.
  const saem = de + 1.0;
  const form = de + 1.1;
  const preenche = (i: number) => form + 0.45 + i * 0.35;
  const somado = linhasMkt.reduce((s, l, i) => s + l.v * entrada(prog(t, preenche(i), 0.4)), 0);
  const enviou = t > de + 3.1;
  return (
    <AbsoluteFill>
      {/* As planilhas soltas, uma por área */}
      <div style={{ position: "absolute", left: 170, top: 250, width: 560, display: "grid", gap: 18 }}>
        <Rotulo style={{ ...surge(t, de, saem + 0.4) }}>Antes: uma planilha por área</Rotulo>
        {planilhas.map((p, i) => {
          const fora = entrada(prog(t, saem + i * 0.08, 0.45));
          return (
            <div
              key={p}
              style={{
                ...surge(t, de + 0.1 + i * 0.15, Infinity, 20),
                opacity: Math.min(1, prog(t, de + 0.1 + i * 0.15, 0.35)) * (1 - fora),
                translate: `${fora * 520}px 0`,
                scale: `${1 - fora * 0.25}`,
                filter: fora > 0 ? `blur(${fora * 10}px)` : undefined,
                display: "flex",
                alignItems: "center",
                gap: 18,
                background: C.superficie,
                border: `1px solid ${C.linha}`,
                padding: "18px 22px",
              }}
            >
              {/* Ícone de grade genérico: planilha, sem marca de produto. */}
              <svg width={34} height={34} viewBox="0 0 34 34" aria-hidden>
                <rect x={1} y={1} width={32} height={32} fill="none" stroke={C.apagado} strokeWidth={2} />
                <line x1={1} y1={12} x2={33} y2={12} stroke={C.apagado} strokeWidth={2} />
                <line x1={1} y1={22} x2={33} y2={22} stroke={C.apagado} strokeWidth={2} />
                <line x1={13} y1={1} x2={13} y2={33} stroke={C.apagado} strokeWidth={2} />
              </svg>
              <span style={{ fontFamily: MONO, fontSize: 22, color: C.apagado, textDecoration: t > saem - 0.3 ? "line-through" : undefined }}>{p}</span>
            </div>
          );
        })}
      </div>

      {/* O formulário no sistema */}
      <div style={{ position: "absolute", left: 830, top: 190, width: 920, background: C.superficie, border: `1px solid ${C.linha}`, padding: "34px 40px", boxSizing: "border-box", ...surge(t, form, ate, 30) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <Rotulo style={{ fontSize: 18 }}>Orçamento 2027 · Marketing</Rotulo>
            <div style={{ marginTop: 8, fontSize: 24, color: C.apagado }}>Centro de custo 4100 · prazo 15/11</div>
          </div>
          <Pilula cor={enviou ? C.violeta : C.sutil}>{enviou ? "Enviado à gestora" : "Rascunho"}</Pilula>
        </div>
        <div style={{ marginTop: 26, borderTop: `1px solid ${C.linha}` }}>
          {linhasMkt.map((l, i) => {
            const u = entrada(prog(t, preenche(i), 0.4));
            return (
              <div key={l.conta} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 84, borderBottom: `1px solid ${C.linha}` }}>
                <span style={{ fontSize: 30 }}>{l.conta}</span>
                <span
                  style={{
                    minWidth: 300,
                    textAlign: "right",
                    fontSize: 30,
                    fontVariantNumeric: "tabular-nums",
                    padding: "8px 16px",
                    border: `1px solid ${t > preenche(i) && t < preenche(i) + 0.5 ? C.violeta : C.linha}`,
                    color: u > 0 ? C.tinta : C.sutil,
                  }}
                >
                  {u > 0 ? reais(l.v * u) : "R$ 0"}
                </span>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 30 }}>
            Total da área <span style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums", marginLeft: 12 }}>{reais(somado)}</span>
          </div>
          <span
            style={{
              borderRadius: 9999,
              padding: "16px 30px",
              fontSize: 26,
              fontWeight: 500,
              background: C.violeta,
              color: C.papel,
              scale: t > de + 2.95 && t < de + 3.1 ? "0.96" : "1",
            }}
          >
            Enviar para aprovação
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
}

/* ---------------------- cena 2: aprovação e consolidação automática --- */

const areas = [
  { nome: "Marketing", v27: 3_240_000, v26: 2_650_000 },
  { nome: "TI", v27: 4_180_000, v26: 3_920_000 },
  { nome: "Operações", v27: 6_350_000, v26: 5_980_000 },
  { nome: "RH", v27: 1_870_000, v26: 1_790_000 },
  { nome: "Comercial", v27: 2_780_000, v26: 2_620_000 },
];
const TOTAL_27 = areas.reduce((s, a) => s + a.v27, 0); // 18,42 mi
const TOTAL_26 = areas.reduce((s, a) => s + a.v26, 0); // 16,96 mi

function CenaAprova({ t }: { t: number }) {
  const { de, ate } = CENAS.classifica;
  if (t < de - 0.05 || t > ate + 0.25) return null;
  const etapas = ["Marketing preencheu", "Gestora aprovou", "Diretoria aprovou"];
  const aprova = (i: number) => de + 1.2 + i * 0.3;
  const consolidado = areas.reduce((s, a, i) => s + a.v27 * entrada(prog(t, aprova(i), 0.5)), 0);
  return (
    <AbsoluteFill>
      {/* A cadeia de aprovação */}
      <div style={{ position: "absolute", left: 170, top: 170, width: 1580, display: "flex", alignItems: "center", gap: 18, ...surge(t, de, ate) }}>
        {etapas.map((e, i) => {
          const feito = t > de + 0.2 + i * 0.3;
          return (
            <div key={e} style={{ display: "flex", alignItems: "center", gap: 18 }}>
              {i ? <div style={{ width: 60, height: 3, background: feito ? C.violeta : C.linha }} /> : null}
              <Pilula cor={C.violeta} cheia={feito} style={{ fontSize: 24, padding: "10px 22px" }}>
                {feito ? "✓ " : ""}
                {e}
              </Pilula>
            </div>
          );
        })}
      </div>

      {/* A tabela que Finanças antes montava à mão */}
      <div style={{ position: "absolute", left: 170, top: 270, width: 1580, background: C.superficie, border: `1px solid ${C.linha}`, ...surge(t, de + 0.3, ate) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "26px 36px", borderBottom: `1px solid ${C.linha}` }}>
          <div style={{ fontSize: 32, fontWeight: 500 }}>Orçamento 2027 · consolidado</div>
          <Rotulo style={{ color: C.violeta }}>Consolidado automaticamente · 0 planilhas</Rotulo>
        </div>
        {areas.map((a, i) => {
          const ok = t > aprova(i);
          return (
            <div key={a.nome} style={{ display: "grid", gridTemplateColumns: "1fr 320px 300px", alignItems: "center", height: 86, padding: "0 36px", borderTop: i ? `1px solid ${C.linha}` : undefined }}>
              <span style={{ fontSize: 30 }}>{a.nome}</span>
              <span>
                <Pilula cor={ok ? C.violeta : C.sutil}>{ok ? "Aprovado" : "Em aprovação"}</Pilula>
              </span>
              <span style={{ fontSize: 30, textAlign: "right", fontVariantNumeric: "tabular-nums", color: ok ? C.tinta : C.sutil }}>{reais(a.v27)}</span>
            </div>
          );
        })}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 96, padding: "0 36px", borderTop: `2px solid ${C.linhaForte}` }}>
          <span style={{ fontSize: 30, fontWeight: 500 }}>Total da empresa</span>
          <span style={{ fontSize: 40, fontWeight: 500, fontVariantNumeric: "tabular-nums", color: C.violeta }}>{reais(consolidado)}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
}

/* ------------------------------- cena 3: Finanças com o painel pronto --- */

function CenaFinancas({ t }: { t: number }) {
  const { de, ate } = CENAS.recomenda;
  if (t < de - 0.05 || t > ate + 0.25) return null;
  const variacao = ((TOTAL_27 / TOTAL_26 - 1) * 100) * entrada(prog(t, de + 0.3, 1));
  const maximo = 6_500_000;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 170, top: 170, width: 1580, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 30 }}>
        {[
          { r: "Orçamento 2027", v: mi(TOTAL_27 * entrada(prog(t, de + 0.2, 1))), sub: "5 de 5 áreas aprovadas" },
          { r: "Contra 2026", v: `+${variacao.toFixed(1).replace(".", ",")}%`, sub: `realizado de ${mi(TOTAL_26)}` },
          { r: "Planilhas consolidadas à mão", v: "0", sub: "o dado já chega pronto" },
        ].map((k, i) => (
          <div key={k.r} style={{ background: C.superficie, border: `1px solid ${C.linha}`, padding: "28px 34px", ...surge(t, de + i * 0.15, ate) }}>
            <Rotulo style={{ fontSize: 18 }}>{k.r}</Rotulo>
            <div style={{ marginTop: 10, fontSize: 56, fontWeight: 500, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{k.v}</div>
            <div style={{ marginTop: 4, fontSize: 24, color: C.apagado }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Orçado 2027 contra realizado 2026, por área */}
      <div style={{ position: "absolute", left: 170, top: 420, width: 1000, height: 500, background: C.superficie, border: `1px solid ${C.linha}`, padding: "28px 34px", boxSizing: "border-box", ...surge(t, de + 0.4, ate) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontSize: 30, fontWeight: 500 }}>Por área</div>
          <div style={{ display: "flex", gap: 12 }}>
            <Pilula cor={C.linhaForte}>2026</Pilula>
            <Pilula cor={C.violeta}>2027</Pilula>
          </div>
        </div>
        <div style={{ marginTop: 30, display: "grid", gap: 26 }}>
          {areas.map((a, i) => {
            const u = entrada(prog(t, de + 0.6 + i * 0.1, 0.8));
            return (
              <div key={a.nome} style={{ display: "grid", gridTemplateColumns: "170px 1fr", alignItems: "center", gap: 18 }}>
                <div style={{ fontSize: 24, color: a.nome === "Marketing" ? C.tinta : C.apagado, fontWeight: a.nome === "Marketing" ? 500 : 400 }}>{a.nome}</div>
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ height: 18, width: `${(a.v26 / maximo) * 100 * u}%`, background: C.linhaForte }} />
                  <div style={{ height: 28, width: `${(a.v27 / maximo) * 100 * u}%`, background: C.violeta }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* O alerta da IA: o desvio que a liderança precisa ver */}
      <div style={{ position: "absolute", left: 1200, top: 420, width: 550, height: 500, background: C.superficie, border: `1px solid ${C.linha}`, borderLeft: `6px solid ${C.violeta}`, padding: "30px 34px", boxSizing: "border-box", ...surge(t, b(8, 1), ate, 30) }}>
        <Rotulo style={{ fontSize: 18, color: C.violeta }}>Insight da IA</Rotulo>
        <div style={{ marginTop: 18, fontSize: 34, fontWeight: 500, lineHeight: 1.2, letterSpacing: "-0.01em" }}>Marketing cresce 22% contra 2026</div>
        <div style={{ marginTop: 16, fontSize: 26, lineHeight: 1.4, color: C.apagado }}>
          Bem acima da média da empresa (+8,6%). A maior parte está em mídia paga: vale revisar antes do fechamento.
        </div>
      </div>
    </AbsoluteFill>
  );
}
