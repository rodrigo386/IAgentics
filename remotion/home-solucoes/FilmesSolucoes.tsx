import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { solutions } from "@/lib/content";
import { C, FONTE, MONO, entrada, prog } from "../nexo-kit/kit";

/**
 * Os três loops do palco das soluções na home (2026-10-07, pedido do Rodrigo:
 * "palco fixo" com filmes novos). 8 s cada, mudos, 4:3, claros, nas cores do
 * site, SEM frase: no palco quem fala é o texto ao lado; o filme só dá
 * movimento à ideia de cada solução.
 *
 * Laço sem emenda: o quadro final é igual ao 0. Tudo é função de `t mod 8`, e
 * cada ciclo de dentro (pulso, onda, subida) fecha exatamente em 8 s.
 *
 * Os rótulos vêm de lib/content.ts (o `scope` de cada solução na home, e o
 * "resultado" do Spend Lab vem de "Da maturidade ao resultado").
 */
export const DURACAO_SOLUCAO = 8;
const W = 1440;
const H = 1080;

function useT() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (frame / fps) % DURACAO_SOLUCAO;
}

const sol = (id: string) => solutions.items.find((s) => s.id === id)!;

/* ------------------------------------------------------------ Nexo --- */

/** O orquestrador: o pulso sai do centro e acende um módulo por vez. */
export function FilmeSolucaoNexo() {
  const t = useT();
  const modulos = sol("nexo").scope;
  const n = modulos.length;
  const passo = DURACAO_SOLUCAO / n; // ~0,89 s por módulo: fecha certinho em 8 s
  const cx = W / 2;
  const cy = H / 2;
  const R = 380;
  const pontos = modulos.map((nome, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return { nome, x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R, a };
  });
  const atual = Math.floor(t / passo);
  const fase = (t - atual * passo) / passo; // 0..1 dentro do módulo
  // Respiração do hub: um seno que fecha o período em 8 s.
  const respira = 1 + 0.03 * Math.sin((t / DURACAO_SOLUCAO) * Math.PI * 2 * 2);

  return (
    <AbsoluteFill style={{ background: C.papel, fontFamily: FONTE }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {pontos.map((p, i) => (
          <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={i === atual ? C.violeta : C.linhaForte} strokeWidth={i === atual ? 4 : 2} />
        ))}
        {/* O pulso: vai do hub ao módulo na primeira metade da fase. */}
        {(() => {
          const p = pontos[atual];
          const u = entrada(Math.min(1, fase / 0.5));
          return <circle cx={cx + (p.x - cx) * u} cy={cy + (p.y - cy) * u} r={12} fill={C.violeta} opacity={fase < 0.55 ? 1 : 0} />;
        })()}
        {pontos.map((p, i) => {
          // O módulo acende quando o pulso chega e apaga no fim da sua fase.
          const aceso = i === atual ? Math.min(1, Math.max(0, (fase - 0.45) / 0.15)) * (1 - Math.max(0, (fase - 0.9) / 0.1)) : 0;
          return (
            <g key={p.nome}>
              <circle cx={p.x} cy={p.y} r={34 + aceso * 8} fill={C.superficie} stroke={aceso > 0 ? C.violeta : C.linhaForte} strokeWidth={3} />
              <circle cx={p.x} cy={p.y} r={14} fill={aceso > 0 ? C.violeta : C.linhaForte} opacity={0.3 + aceso * 0.7} />
            </g>
          );
        })}
      </svg>
      {pontos.map((p, i) => {
        const aceso = i === atual && fase > 0.45 && fase < 1;
        // Rótulo para fora do anel; nas laterais o texto é largo, então afasta mais no eixo x.
        const dx = Math.cos(p.a) * 72 + Math.sign(Math.round(Math.cos(p.a) * 10)) * 70;
        const dy = Math.sin(p.a) * 66;
        return (
          <div
            key={p.nome}
            style={{
              position: "absolute",
              left: p.x + dx,
              top: p.y + dy,
              translate: "-50% -50%",
              fontFamily: MONO,
              fontSize: 26,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: aceso ? C.violeta : C.apagado,
              whiteSpace: "nowrap",
            }}
          >
            {p.nome}
          </div>
        );
      })}
      {/* O hub: o ícone real do app, sobre um disco de papel que esconde o
          encontro das linhas (o ícone tem fundo transparente). */}
      <div style={{ position: "absolute", left: cx, top: cy, translate: "-50% -50%", width: 240, height: 240, borderRadius: 9999, background: C.papel }} />
      <div style={{ position: "absolute", left: cx, top: cy, translate: "-50% -50%", scale: `${respira}` }}>
        <Img src={staticFile("nexo-icone.svg")} style={{ width: 190, height: 190 }} />
      </div>
    </AbsoluteFill>
  );
}

/* --------------------------------------------------------- Academy --- */

/** A empresa se capacitando: cada área da empresa (um cartão com ícone de
 *  pessoa e o nome da área) enche a barra de progresso em onda e ganha o
 *  "concluído"; os formatos acendem um por vez. A onda enche até 6 s e
 *  esvazia até 8 s. Eram iniciais de pessoas (AR, CP…) — o Rodrigo apontou
 *  que sigla solta não diz nada a quem vê, e área diz. */
const AREAS = ["Compras", "Financeiro", "RH", "Jurídico", "Comercial", "Marketing", "Operações", "TI", "Diretoria"];

export function FilmeSolucaoAcademy() {
  const t = useT();
  const formatos = sol("academy").scope;
  const colunas = 3;
  const fmt = Math.floor((t / DURACAO_SOLUCAO) * formatos.length) % formatos.length;
  const largura = 380;
  const gap = 28;

  return (
    <AbsoluteFill style={{ background: C.papel, fontFamily: FONTE }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 230, display: "flex", justifyContent: "center", gap: 22 }}>
        {formatos.map((f, i) => (
          <div
            key={f}
            style={{
              borderRadius: 9999,
              padding: "14px 32px",
              fontSize: 32,
              border: `2px solid ${i === fmt ? C.violeta : C.linhaForte}`,
              background: i === fmt ? C.violeta : C.superficie,
              color: i === fmt ? C.papel : C.apagado,
            }}
          >
            {f}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: (W - colunas * largura - (colunas - 1) * gap) / 2, top: 400, display: "grid", gridTemplateColumns: `repeat(${colunas}, ${largura}px)`, gap }}>
        {AREAS.map((area, i) => {
          const col = i % colunas;
          const lin = Math.floor(i / colunas);
          const atraso = (col + lin) * 0.6;
          const enche = entrada(prog(t, 0.3 + atraso, 2.0));
          const esvazia = prog(t, 6.6, 1.2);
          const u = enche * (1 - esvazia);
          const completo = u > 0.98;
          return (
            <div
              key={area}
              style={{
                background: C.superficie,
                border: `2px solid ${completo ? C.violeta : C.linha}`,
                padding: "34px 30px",
                display: "flex",
                alignItems: "center",
                gap: 22,
              }}
            >
              {/* Ícone de pessoa: cabeça e ombros. */}
              <svg width={64} height={64} viewBox="0 0 64 64" style={{ flex: "none" }}>
                <circle cx={32} cy={32} r={31} fill={completo ? C.violeta : C.papel} stroke={completo ? C.violeta : C.linhaForte} strokeWidth={2} />
                <circle cx={32} cy={25} r={9} fill={completo ? C.papel : C.apagado} />
                <path d="M15 51c2.5-9 9-13 17-13s14.5 4 17 13" fill={completo ? C.papel : C.apagado} />
              </svg>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 34, fontWeight: 500, color: C.tinta }}>{area}</span>
                  <span style={{ fontSize: 30, color: C.violeta, opacity: completo ? 1 : 0 }}>✓</span>
                </div>
                <div style={{ marginTop: 14, height: 10, background: C.linha }}>
                  <div style={{ height: "100%", width: `${u * 100}%`, background: C.violeta }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

/* ------------------------------------------------------- Spend Lab --- */

/** Da maturidade ao resultado: o marcador sobe a escada, um degrau por vez,
 *  e volta ao pé no fim do laço. */
export function FilmeSolucaoSpendLab() {
  const t = useT();
  const s = sol("spend-lab");
  // "Da maturidade ao resultado" → o último degrau é "Resultado".
  const degraus = [...s.scope, s.platform.split(" ").at(-1)!.replace(/^./, (c) => c.toUpperCase())];
  const n = degraus.length;
  const largura = 270;
  const altura = 150;
  const x0 = (W - n * largura) / 2;
  const base = 900;
  // Sobe um degrau a cada 1,5 s (0,5 → 6,5 s); de 6,8 a 7,8 s volta ao pé.
  const subida = Math.min(n - 1, Math.max(0, (t - 0.5) / 1.5));
  const nivel = Math.floor(subida) + entrada(subida - Math.floor(subida));
  const volta = entrada(prog(t, 6.8, 1.0));
  const pos = nivel * (1 - volta);
  const mx = x0 + largura / 2 + pos * largura;
  const my = base - (pos + 1) * altura - 60;
  const alcancado = (i: number) => pos >= i - 0.05;

  return (
    <AbsoluteFill style={{ background: C.papel, fontFamily: FONTE }}>
      {degraus.map((d, i) => (
        <div
          key={d}
          style={{
            position: "absolute",
            left: x0 + i * largura,
            top: base - (i + 1) * altura,
            width: largura - 14,
            height: (i + 1) * altura,
            background: alcancado(i) ? (i === n - 1 ? C.violeta : "rgba(118,7,232,0.14)") : C.superficie,
            border: `2px solid ${alcancado(i) ? C.violeta : C.linhaForte}`,
            boxSizing: "border-box",
            padding: "22px 20px",
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: "0.14em", color: i === n - 1 && alcancado(i) ? C.papel : C.apagado }}>{String(i + 1).padStart(2, "0")}</div>
          <div style={{ marginTop: 8, fontSize: 34, fontWeight: 500, letterSpacing: "-0.01em", color: i === n - 1 && alcancado(i) ? C.papel : C.tinta }}>{d}</div>
        </div>
      ))}
      {/* O marcador: um ponto que salta de degrau em degrau. */}
      <div style={{ position: "absolute", left: mx, top: my, translate: "-50% -50%", width: 46, height: 46, borderRadius: 9999, background: C.tinta, boxShadow: `0 0 0 10px rgba(118,7,232,0.18)` }} />
    </AbsoluteFill>
  );
}

export const DIMENSOES_SOLUCAO = { width: W, height: H };
