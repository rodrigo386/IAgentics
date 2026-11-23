import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import { Logo } from "@/components/ui/Logo";
import { pacoteReforma, reforma } from "@/lib/content";
import { buscar, consultar, formatarNcm } from "@/lib/consulta-ncm";
import { calcular, reais } from "@/lib/reforma";
import { aparece, COR, ent, FONTE, mix, MONO, useT } from "../hero-cursos/base";

/**
 * Filme do pacote "Reforma Tributária para Compras" (2026-11-19, pedido do
 * Rodrigo: "vídeo em motion com o design system da IAgentics explicando as
 * duas soluções e discurso para o comprador"). Instagram e LinkedIn, 9:16 e
 * 4:5 (a mesma composição; tudo fica na faixa central de 1350 px, que é o que
 * a grade do perfil mostra), mudo, 30 s. Pele dos vídeos de lançamento:
 * papel, tinta, um violeta, Space Grotesk, entrada embaçada subindo.
 *
 * Nenhum número é digitado: o exemplo passa por `calcular` (lib/reforma.ts) e
 * o NCM por `consultar`/`buscar` (lib/consulta-ncm.ts), o mesmo código das
 * páginas. Mudou a regra ou a tabela, renderize de novo:
 *   npx remotion bundle --out-dir=out/bundle-reforma && npx remotion render
 *   out/bundle-reforma social-reforma-<vertical|feed> out/social/iagentics-reforma-<…>.mp4
 *   --codec=h264 --crf=20 --pixel-format=yuv420p --color-space=bt709 --muted
 *
 *   0-3,6   gancho: "Duas cotações. Qual sai mais barata?"
 *   3,6-12,4  01 calculadora: a nota (B mais barato), o crédito (7), o custo
 *             líquido contando (7,6), A vence (8,8), diferença no ano (9,8)
 *  12,4-14,8  ponte: "E se o item tiver redução? O NCM responde."
 *  14,8-22,4  02 consulta: busca digitada, NCM, 60%, levar para a calculadora
 *  22,4-26,2  discurso ao comprador e as três provas
 *  26,2-30    fecho: logo, nome do pacote, endereço
 */
export const DURACAO_REFORMA = 30;
const f = reforma.filme;

const conta = calcular({
  ano: 2033,
  reducao: 0,
  compradorCredita: true,
  cbsRef: 11.3,
  ibsRef: 18.7,
  vezesPorAno: 12,
  cotacoes: [
    { nome: f.fornecedorA, regime: "regular", valor: 10000, percentualSimples: null },
    { nome: f.fornecedorB, regime: "simples_das", valor: 9000, percentualSimples: 4 },
  ],
});
const [A, B] = conta.resultados;

const ACHADO = buscar(f.busca).achados.find((a) => a.codigo === "34011190")!;
const NCM = consultar(ACHADO.codigo)!;
const TRAT = NCM.tratamentos[0];
const NIVEIS = NCM.caminho.slice(-2).map((n) => n.descricao.replace(/:$/, ""));

/** O número que conta de `de` para `ate` entre `ini` e `ini + dur`. */
const conte = (t: number, de: number, ate: number, ini: number, dur: number) => reais(Math.round(mix(de, ate, ent(t, ini, dur)) * 100) / 100);

function Chip({ numero, titulo, style }: { numero: string; titulo: string; style?: CSSProperties }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 22, ...style }}>
      <span style={{ fontFamily: MONO, fontWeight: 500, fontSize: 34, color: COR.violeta }}>{numero}</span>
      <span style={{ width: 2, height: 40, background: COR.linha }} />
      <span style={{ fontSize: 44, fontWeight: 600, letterSpacing: "-0.025em" }}>{titulo}</span>
    </div>
  );
}

/** Superfície reta (raio 0), linha fina, como os cartões do site. */
function Cartao({ children, destaque = 0, style }: { children: ReactNode; destaque?: number; style?: CSSProperties }) {
  return (
    <div
      style={{
        background: "#fcfcfd",
        border: `2px solid ${destaque > 0.5 ? COR.violeta : COR.linha}`,
        boxShadow: `0 30px 60px -30px rgba(118, 7, 232, ${0.35 * destaque})`,
        padding: "34px 36px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Rotulo({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ fontFamily: MONO, fontSize: 24, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: COR.apagado, ...style }}>{children}</div>;
}

/** Duas frases que se trocam no mesmo lugar. */
function Troca({ t, a, b, ini, troca, fim, tamanho }: { t: number; a: string; b: string; ini: number; troca: number; fim: number; tamanho: number }) {
  const estilo: CSSProperties = { position: "absolute", inset: 0, fontSize: tamanho, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.04, textWrap: "balance" };
  return (
    <div style={{ position: "relative", height: tamanho * 2.2, width: "100%" }}>
      <div style={{ ...estilo, ...aparece(t, ini, troca) }}>{a}</div>
      <div style={{ ...estilo, color: COR.violeta, ...aparece(t, troca, fim) }}>{b}</div>
    </div>
  );
}

function CartaoCotacao({ t, r, regime, perde }: { t: number; r: typeof A; regime: string; perde: boolean }) {
  const virou = ent(t, 7.4, 0.4);
  const melhor = r.melhor ? ent(t, 8.8, 0.4) : 0;
  return (
    <Cartao destaque={melhor} style={{ flex: 1, opacity: perde ? mix(1, 0.55, ent(t, 8.8, 0.5)) : 1 }}>
      <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-0.02em" }}>{r.nome}</div>
      <div style={{ fontSize: 28, color: COR.apagado, marginTop: 6 }}>{regime}</div>
      <div style={{ position: "relative", height: 40, marginTop: 40 }}>
        <Rotulo style={{ position: "absolute", opacity: 1 - virou }}>{f.nota}</Rotulo>
        <Rotulo style={{ position: "absolute", opacity: virou, color: COR.tinta }}>{f.liquido}</Rotulo>
      </div>
      <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums", marginTop: 6 }}>
        {conte(t, r.valor, r.liquido, 7.6, 1.2)}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 26, color: COR.violeta, marginTop: 10, ...aparece(t, 6.8) }}>− {reais(r.credito)}</div>
      <div
        style={{
          marginTop: 24,
          display: "inline-block",
          background: COR.violeta,
          color: "#fff",
          borderRadius: 999,
          padding: "10px 22px",
          fontSize: 24,
          fontWeight: 600,
          visibility: r.melhor ? "visible" : "hidden",
          ...aparece(t, 8.9),
        }}
      >
        {f.melhor}
      </div>
    </Cartao>
  );
}

const coluna: CSSProperties = { display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 80px" };

export function Reforma() {
  const t = useT();
  const digitado = f.busca.slice(0, Math.round(f.busca.length * ent(t, 15.6, 1.2)));
  const cursor = Math.floor(t * 2.5) % 2 === 0 && t < 17.4;
  const aperta = 1 - 0.04 * Math.sin(Math.PI * Math.min(1, Math.max(0, (t - 20.8) / 0.3)));
  return (
    <AbsoluteFill style={{ background: COR.papel, fontFamily: FONTE, color: COR.tinta, overflow: "hidden" }}>
      {/* Gancho */}
      <AbsoluteFill style={{ ...coluna, alignItems: "flex-start", gap: 30 }}>
        <div style={{ fontFamily: MONO, fontSize: 30, fontWeight: 500, color: COR.violeta, letterSpacing: "0.04em", ...aparece(t, 0.05, 3.6) }}>{f.kicker}</div>
        <div style={{ fontSize: 150, fontWeight: 700, letterSpacing: "-0.055em", lineHeight: 0.95, ...aparece(t, 0.2, 3.6) }}>{f.gancho[0]}</div>
        <div style={{ fontSize: 100, fontWeight: 600, letterSpacing: "-0.045em", lineHeight: 1, color: COR.apagado, ...aparece(t, 1.0, 3.6) }}>{f.gancho[1]}</div>
      </AbsoluteFill>

      {/* 01 Calculadora */}
      {t > 3.4 && t < 12.6 ? (
        <AbsoluteFill style={{ ...coluna, gap: 44, ...aparece(t, 3.6, 12.4) }}>
          <Chip numero={f.passo1.numero} titulo={f.passo1.titulo} />
          <Troca t={t} a={f.naNota} b={f.depois} ini={4.2} troca={7.6} fim={Infinity} tamanho={64} />
          <div style={{ display: "flex", gap: 28, ...aparece(t, 4.4) }}>
            <CartaoCotacao t={t} r={A} regime={f.regimeA} perde={!A.melhor} />
            <CartaoCotacao t={t} r={B} regime={f.regimeB} perde={!B.melhor} />
          </div>
          <div style={{ ...aparece(t, 9.8) }}>
            <div style={{ fontSize: 34, color: COR.apagado, letterSpacing: "-0.01em" }}>{f.noAno}</div>
            <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: "-0.045em", color: COR.violeta, fontVariantNumeric: "tabular-nums" }}>
              {conte(t, 0, conta.diferencaAnual ?? 0, 9.9, 1.2)}
            </div>
          </div>
          <div style={{ fontSize: 22, color: COR.apagado, ...aparece(t, 4.6) }}>{f.exemplo}</div>
        </AbsoluteFill>
      ) : null}

      {/* Ponte */}
      <AbsoluteFill style={{ ...coluna, gap: 26 }}>
        <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: "-0.045em", lineHeight: 1, textWrap: "balance", ...aparece(t, 12.6, 14.8) }}>{f.ponte[0]}</div>
        <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: "-0.045em", lineHeight: 1, color: COR.violeta, ...aparece(t, 13.3, 14.8) }}>{f.ponte[1]}</div>
      </AbsoluteFill>

      {/* 02 Consulta de NCM */}
      {t > 14.6 && t < 22.6 ? (
        <AbsoluteFill style={{ ...coluna, gap: 40, ...aparece(t, 14.8, 22.4) }}>
          <Chip numero={f.passo2.numero} titulo={f.passo2.titulo} />
          <div style={{ display: "flex", alignItems: "center", gap: 20, border: `2px solid ${COR.tinta}`, borderRadius: 999, padding: "24px 36px", fontSize: 44, background: "#fcfcfd" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={COR.apagado} strokeWidth="2.2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>
            <span>{digitado}</span>
            <span style={{ width: 3, height: 50, background: COR.violeta, opacity: cursor ? 1 : 0, marginLeft: -12 }} />
          </div>
          <div style={{ ...aparece(t, 17.2) }}>
            <div style={{ fontFamily: MONO, fontSize: 44, fontWeight: 500 }}>{formatarNcm(NCM.codigo)}</div>
            <div style={{ fontSize: 30, color: COR.apagado, marginTop: 6 }}>{NIVEIS.join(" › ")}</div>
          </div>
          <Cartao destaque={ent(t, 18.0, 0.4)} style={{ ...aparece(t, 18.0) }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
              <span style={{ fontSize: 150, fontWeight: 700, letterSpacing: "-0.055em", lineHeight: 0.9, color: COR.violeta }}>{TRAT.reducao.cbs}%</span>
              <span style={{ fontSize: 36, fontWeight: 500, lineHeight: 1.15, textWrap: "balance" }}>{f.reducao}</span>
            </div>
            <div style={{ display: "flex", gap: 40, marginTop: 30, ...aparece(t, 18.5) }}>
              {[
                ["cClassTrib", TRAT.cClassTrib],
                ["Anexo", TRAT.anexo ?? ""],
                ["LC 214", TRAT.fundamento[0]?.referencia ?? ""],
              ].map(([r, v]) => (
                <div key={r}>
                  <Rotulo style={{ textTransform: "none" }}>{r}</Rotulo>
                  <div style={{ fontFamily: MONO, fontSize: 34, fontWeight: 500, marginTop: 6 }}>{v}</div>
                </div>
              ))}
            </div>
          </Cartao>
          <div
            style={{
              alignSelf: "flex-start",
              background: COR.tinta,
              color: COR.papel,
              borderRadius: 999,
              padding: "24px 40px",
              fontSize: 34,
              fontWeight: 600,
              scale: String(aperta),
              ...aparece(t, 19.6),
            }}
          >
            {f.levar} →
          </div>
        </AbsoluteFill>
      ) : null}

      {/* Discurso ao comprador */}
      <AbsoluteFill style={{ ...coluna, gap: 18 }}>
        <div style={{ fontSize: 84, fontWeight: 600, letterSpacing: "-0.045em", lineHeight: 1.02, color: COR.apagado, ...aparece(t, 22.6, 26.2) }}>{f.discurso[0]}</div>
        <div style={{ fontSize: 112, fontWeight: 700, letterSpacing: "-0.055em", lineHeight: 0.98, textWrap: "balance", ...aparece(t, 23.1, 26.2) }}>{f.discurso[1]}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 50 }}>
          {f.provas.map((p, i) => (
            <div key={p} style={{ display: "flex", gap: 20, alignItems: "baseline", fontSize: 38, fontWeight: 500, letterSpacing: "-0.015em", ...aparece(t, 23.9 + i * 0.35, 26.2) }}>
              <span style={{ color: COR.violeta, fontFamily: MONO }}>✓</span>
              <span>{p}</span>
            </div>
          ))}
        </div>
      </AbsoluteFill>

      {/* Fecho */}
      <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 44, textAlign: "center", padding: "0 70px" }}>
        <div style={{ color: COR.tinta, ...aparece(t, 26.4) }}>
          <Logo className="w-[420px]" />
        </div>
        <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: "-0.045em", lineHeight: 1.02, textWrap: "balance", ...aparece(t, 26.8) }}>{pacoteReforma.nome}</div>
        <div style={{ fontSize: 36, fontWeight: 500, color: COR.apagado, ...aparece(t, 27.1) }}>
          {pacoteReforma.itens[0].titulo} · {pacoteReforma.itens[1].titulo}
        </div>
        <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 34, color: COR.violeta, whiteSpace: "nowrap", ...aparece(t, 27.5) }}>{f.endereco}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
