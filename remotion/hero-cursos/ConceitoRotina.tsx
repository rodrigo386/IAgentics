import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { cursos } from "@/lib/content";
import { aparece, COR, curso, ent, FONTE, H, Marcas, MONO, mix, Preco, useT, W } from "./base";

/**
 * Conceito 3, "Cabe no seu dia": três horas do dia, três aparelhos, três
 * cursos tocando (referência: os comerciais de iPhone). Cada momento entra pela
 * direita com uma leve virada, assenta, e sai pela esquerda; a hora em violeta
 * no alto, o lugar em letra grande embaixo. No fim os três aparelhos se
 * alinham pequenos e o fecho é o ritmo e o preço. Aparelhos desenhados em
 * vetor; as telas mostram as capas e fotos reais.
 */
const f = cursos.filmesHero.rotina;

/** Foto de tela larga quando o curso tem professor fotografado. */
const FOTO_LARGA: Record<string, { src: string; enquadre: string }> = {
  "Marketing com IA": { src: "/academy/marketing-com-ia-capa.jpg", enquadre: "50% 22%" },
};

function Tela({ nome, larga, progresso }: { nome: string; larga: boolean; progresso: number }) {
  const c = curso(nome);
  const foto = FOTO_LARGA[c.nome];
  return (
    <div style={{ position: "absolute", inset: 0, background: COR.tinta, overflow: "hidden" }}>
      {larga && !foto ? (
        <>
          {/* Tela larga sem foto: a capa no centro sobre ela mesma desfocada, como pôster de player. */}
          <Img src={staticFile(c.capa.slice(1))} style={{ position: "absolute", inset: -40, width: "calc(100% + 80px)", height: "calc(100% + 80px)", objectFit: "cover", filter: "blur(30px) brightness(0.6)" }} />
          <Img src={staticFile(c.capa.slice(1))} style={{ position: "absolute", top: "8%", height: "84%", left: "50%", translate: "-50% 0", borderRadius: 14 }} />
        </>
      ) : (
        <Img src={staticFile((foto?.src ?? c.capa).slice(1))} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: foto?.enquadre ?? "50% 30%" }} />
      )}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "30%", background: "linear-gradient(to top, rgba(19,23,35,0.7), transparent)" }} />
      <div style={{ position: "absolute", left: "6%", right: "6%", bottom: "6%", height: 7, borderRadius: 7, background: "rgba(248,248,248,0.3)" }}>
        <div style={{ width: `${progresso * 100}%`, height: "100%", borderRadius: 7, background: COR.violeta }} />
      </div>
    </div>
  );
}

/** Os três aparelhos, em vetor: só moldura, sem marca. */
function Aparelho({ tipo, children, style }: { tipo: string; children: ReactNode; style?: CSSProperties }) {
  if (tipo === "celular") {
    return (
      <div style={{ width: 400, height: 820, borderRadius: 70, background: COR.tinta, padding: 16, boxShadow: "0 50px 100px -40px rgba(19,23,35,0.5)", ...style }}>
        <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 56, overflow: "hidden" }}>
          {children}
          <div style={{ position: "absolute", top: 18, left: "50%", translate: "-50% 0", width: 120, height: 34, borderRadius: 20, background: COR.tinta }} />
        </div>
      </div>
    );
  }
  if (tipo === "notebook") {
    return (
      <div style={{ display: "grid", justifyItems: "center", ...style }}>
        <div style={{ width: 880, height: 560, borderRadius: "28px 28px 8px 8px", background: COR.tinta, padding: 18, boxShadow: "0 50px 100px -40px rgba(19,23,35,0.5)" }}>
          <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 10, overflow: "hidden" }}>{children}</div>
        </div>
        <div style={{ width: 1000, height: 26, borderRadius: "0 0 26px 26px", background: "linear-gradient(#d9dbe2, #b9bcc6)" }} />
      </div>
    );
  }
  return (
    <div style={{ width: 860, height: 620, borderRadius: 44, background: COR.tinta, padding: 22, boxShadow: "0 50px 100px -40px rgba(19,23,35,0.5)", ...style }}>
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 24, overflow: "hidden" }}>{children}</div>
    </div>
  );
}

/** Largura e altura de cada aparelho desenhado (o notebook inclui a base). */
const TAMANHO: Record<string, [number, number]> = { celular: [400, 820], notebook: [1000, 586], tablet: [860, 620] };

const DUR_MOMENTO = 4.6;
const INI = 0.3;

/** O fecho: os três aparelhos pequenos, lado a lado, o ritmo e o preço.
 *  Peça com hora de início porque o conceito 4 (ConceitoMisto) também fecha
 *  assim. */
export function FechoAparelhos({ t, ini, sai }: { t: number; ini: number; sai: number }) {
  if (t < ini - 0.1) return null;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - sai }}>
      {/* `scale` não muda a caixa no layout: cada aparelho mora numa caixa
          do tamanho já reduzido, e escala a partir do canto. */}
      <div style={{ position: "absolute", top: 150, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 44 }}>
        {f.momentos.map((m, i) => {
          const u = ent(t, ini + i * 0.15, 0.8);
          const [larg, alt] = TAMANHO[m.aparelho];
          const e = 0.34;
          return (
            <div key={m.hora} style={{ position: "relative", width: larg * e, height: alt * e, opacity: u, translate: `0 ${(1 - u) * 60}px` }}>
              <div style={{ position: "absolute", left: 0, top: 0, scale: `${e}`, transformOrigin: "0 0" }}>
                <Aparelho tipo={m.aparelho}>
                  <Tela nome={m.curso} larga={m.aparelho !== "celular"} progresso={0.85} />
                </Aparelho>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 560, left: 0, right: 0, display: "grid", gap: 70, justifyItems: "center" }}>
        <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: "-0.045em", ...aparece(t, ini + 0.6) }}>{f.fecho}</div>
        <Preco t={t} ini={ini + 1.2} tamanho={150} />
      </div>
      {/* As três marcas no rodapé, como na abertura da hero (pedido do Rodrigo,
          2026-10-14: logos no lugar do texto "Pecege · parceiro da USP/Esalq").
          Mesmos arquivos e proporções da hero; ver o comentário em Estante.tsx. */}
      <Marcas style={{ position: "absolute", bottom: 64, left: 0, right: 0, ...aparece(t, ini + 1.8) }} />
    </div>
  );
}

export function ConceitoRotina() {
  const t = useT();
  const final = 14.2;
  const sai = ent(t, 17.2, 0.7);

  return (
    <AbsoluteFill style={{ background: COR.papel, fontFamily: FONTE, color: COR.tinta, overflow: "hidden" }}>
      {f.momentos.map((m, i) => {
        const ini = INI + i * DUR_MOMENTO;
        const fim = ini + DUR_MOMENTO;
        if (t < ini - 0.1 || t > fim + 0.2) return null;
        const entra = ent(t, ini, 0.9);
        const vai = ent(t, fim - 0.6, 0.7);
        const x = mix(W * 0.9, 0, entra) - vai * W * 0.9;
        return (
          <div key={m.hora} style={{ position: "absolute", inset: 0 }}>
            <div style={{ position: "absolute", top: 90, left: 0, right: 0, textAlign: "center", fontFamily: MONO, fontWeight: 500, fontSize: 64, letterSpacing: "0.04em", color: COR.violeta, ...aparece(t, ini + 0.2, fim - 0.1) }}>
              {m.hora}
            </div>
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 220,
                height: 860,
                display: "grid",
                placeItems: "center",
                translate: `${x}px 0`,
                rotate: `${(1 - entra) * 6 - vai * 6}deg`,
                opacity: Math.min(1, entra * 1.5) * (1 - vai),
              }}
            >
              <Aparelho tipo={m.aparelho}>
                <Tela nome={m.curso} larga={m.aparelho !== "celular"} progresso={ent(t, ini + 0.6, DUR_MOMENTO - 1.2) * 0.85} />
              </Aparelho>
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 120, textAlign: "center", fontSize: 112, fontWeight: 700, letterSpacing: "-0.045em", ...aparece(t, ini + 0.6, fim - 0.1) }}>
              {m.onde}
            </div>
          </div>
        );
      })}

      <FechoAparelhos t={t} ini={final} sai={sai} />
    </AbsoluteFill>
  );
}
