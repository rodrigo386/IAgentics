import { AbsoluteFill, useVideoConfig } from "remotion";
import { cursos } from "@/lib/content";
import { Capa, COR, FONTE, LogoAcademy, POR_MES, PRECO, PUBLICADOS, TODOS } from "../hero-cursos/base";

/**
 * Miniatura (capa) dos vídeos de lançamento (2026-10-15, pedido do Rodrigo).
 * Um quadro parado que precisa funcionar pequeno, no meio do feed: logo, a
 * frase de cada vídeo em letra grande, o preço num selo violeta e um leque de
 * capas reais saindo do pé.
 *
 * No 9:16 o Instagram mostra a miniatura do Reels cortada em 4:5 na grade do
 * perfil: todo o texto fica na faixa central de 1350 px, e as capas ocupam o
 * que sobra embaixo.
 */
export type PropsMiniatura = { video: "lancamento" | "dentro" };
const f = cursos.filmesSocial;
const LEQUE = ["Fundamentos de IA para Negócios", "Power BI na Prática", "Marketing com IA", "Design Thinking", "Estratégias de Negociação"];

export function Miniatura({ video }: PropsMiniatura) {
  const { height: H } = useVideoConfig();
  const sobra = (H - 1350) / 2; // 0 no 4:5; 285 em cima e embaixo no 9:16
  const capas = LEQUE.map((nome) => TODOS.find((c) => c.nome === nome)!);
  const larg = 330;
  // Altura aproximada do bloco de texto de cada vídeo: o leque começa logo
  // abaixo dele (preso ao pé do quadro, sobrava um vão vazio no meio).
  const topoTexto = sobra > 0 ? sobra + 40 : 80;
  const alturaTexto = video === "lancamento" ? 640 : 480;
  const topoLeque = topoTexto + alturaTexto + (video === "lancamento" ? 70 : 110);
  return (
    <AbsoluteFill style={{ background: COR.papel, fontFamily: FONTE, color: COR.tinta, overflow: "hidden" }}>
      {/* Brilho violeta atrás do leque: dá profundidade sem competir com o texto. */}
      <div style={{ position: "absolute", left: -200, right: -200, bottom: -300, height: 900, background: "radial-gradient(ellipse 45% 50% at 50% 60%, rgba(118,7,232,0.28), transparent 70%)" }} />

      {/* No 9:16 o conjunto cresce 12% a partir do topo do texto, para ocupar
          a tela cheia do Reels sem sair da faixa central da grade. */}
      <AbsoluteFill style={{ scale: `${sobra > 0 ? 1.12 : 1}`, transformOrigin: `50% ${topoTexto}px` }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: topoTexto, display: "flex", flexDirection: "column", alignItems: "center", gap: 34, padding: "0 70px", textAlign: "center" }}>
        <LogoAcademy largura={400} />
        {video === "lancamento" ? (
          <>
            <div style={{ fontSize: 230, fontWeight: 700, letterSpacing: "-0.06em", lineHeight: 0.9, marginTop: 10 }}>{f.lancamento.chegou}</div>
            <div style={{ fontSize: 70, fontWeight: 600, letterSpacing: "-0.035em", lineHeight: 1.04, textWrap: "balance", maxWidth: 900 }}>{f.lancamento.linha}</div>
          </>
        ) : (
          <div style={{ fontSize: 118, fontWeight: 700, letterSpacing: "-0.05em", lineHeight: 1.0, marginTop: 10 }}>
            <div>
              <span style={{ color: COR.violeta }}>{cursos.vitrine.linhas.length}</span> {f.dentro.trilhas}
            </div>
            <div>
              <span style={{ color: COR.violeta }}>{PUBLICADOS.length}</span> {f.dentro.noAr}
            </div>
          </div>
        )}
        <div style={{ marginTop: 8, padding: "18px 40px", borderRadius: 999, background: COR.violeta, color: COR.papel, fontSize: 52, fontWeight: 700, letterSpacing: "-0.03em" }}>
          {PRECO} <span style={{ fontWeight: 500, opacity: 0.85 }}>{POR_MES}</span>
        </div>
      </div>

      {/* O leque de capas, logo abaixo do texto, saindo pelo pé do quadro. */}
      <div style={{ position: "absolute", left: "50%", top: topoLeque, width: 0, height: 0 }}>
        {capas.map((c, i) => {
          const k = i - (capas.length - 1) / 2; // -2..2
          return (
            <Capa
              key={c.capa}
              src={c.capa}
              largura={larg}
              style={{
                position: "absolute",
                left: k * 205 - larg / 2,
                top: Math.abs(k) * 45,
                rotate: `${k * 8}deg`,
                transformOrigin: "50% 100%",
                zIndex: 10 - Math.abs(k),
                boxShadow: "0 30px 60px -20px rgba(19,23,35,0.45)",
              }}
            />
          );
        })}
      </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
