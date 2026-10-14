import { AbsoluteFill, Img, staticFile } from "remotion";
import { C, FONTE, MONO } from "../nexo-kit/kit";

/**
 * Capa 600×900 do "Fundamentos de IA para Negócios" (2026-10-14), no formato
 * das capas dos cursos da Solution (professor em destaque, título grande, nome
 * do professor no pé) para ficar ao lado delas na /cursos — pedido do Rodrigo:
 * "mantenha o curso da IAgentics de Fundamentos junto com as imagens do
 * Pecege". A foto é o quadro do vídeo-convite; a vinheta apaga o mural ao fundo.
 * Gerada com `npx remotion still capa-fundamentos public/solution/fundamentos-ia-para-negocios.jpg`.
 */
export function CapaFundamentos() {
  return (
    <AbsoluteFill style={{ background: C.tinta, fontFamily: FONTE, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 60, height: 520 }}>
        <Img
          src={staticFile("academy/academy-convite-poster.jpg")}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "52% 10%" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 46% 60% at 52% 36%, transparent 18%, rgb(19 23 35 / 0.7) 58%, rgb(19 23 35) 92%), linear-gradient(to bottom, rgb(19 23 35) 0%, transparent 16%, transparent 58%, rgb(19 23 35) 96%)",
          }}
        />
      </div>
      <div style={{ position: "absolute", top: 34, left: 0, right: 0, textAlign: "center", fontFamily: MONO, fontSize: 18, letterSpacing: "0.3em", color: "rgba(248,248,248,0.75)" }}>
        IAGENTICS
      </div>
      <div style={{ position: "absolute", left: 30, right: 30, top: 548, textAlign: "center" }}>
        <div style={{ fontSize: 74, fontWeight: 500, lineHeight: 0.98, letterSpacing: "-0.03em", color: C.papel }}>Fundamentos de IA</div>
        <div
          style={{
            display: "inline-block",
            marginTop: 18,
            padding: "8px 22px",
            background: C.violeta,
            color: C.papel,
            fontSize: 36,
            fontWeight: 500,
            letterSpacing: "-0.01em",
          }}
        >
          para Negócios
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 30, left: 0, right: 0, textAlign: "center", fontSize: 24, color: "rgba(248,248,248,0.9)" }}>
        Prof. Vinícius
      </div>
    </AbsoluteFill>
  );
}
