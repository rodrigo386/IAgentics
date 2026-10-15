import { AbsoluteFill, useVideoConfig } from "remotion";
import { Logo } from "@/components/ui/Logo";
import { cursos } from "@/lib/content";
import { aparece, Capa, COR, ent, FONTE, mix, PUBLICADOS, TODOS, useT } from "../hero-cursos/base";
import { FechoSocial } from "./comum";

/**
 * Vídeo de lançamento 3, "O que tem dentro" (2026-10-14, para Instagram e
 * LinkedIn, pensado para quem compra para o time): as contagens, uma trilha
 * por compasso com três capas dela, e o fecho (5 s, para o endereço ser lido). 22 s, em 9:16 e 4:5.
 *
 * As contagens saem da vitrine (lib/content.ts): curso novo lá muda o número
 * aqui no próximo render. Uma trilha a cada 2 s (um compasso a 120 BPM),
 * a partir de 3 s; fecho em 17 s. Mudou um tempo, mude a trilha junto
 * (scripts/trilha-lancamento.py).
 */
export const DURACAO_DENTRO = 22;
const f = cursos.filmesSocial;
const LINHAS = cursos.vitrine.linhas;
const INI_TRILHAS = 3;
const POR_TRILHA = 2;

function Numero({ t, ini, numero, texto }: { t: number; ini: number; numero: number; texto: string }) {
  return (
    <div style={{ fontSize: 116, fontWeight: 700, letterSpacing: "-0.05em", lineHeight: 1, ...aparece(t, ini, INI_TRILHAS - 0.05, 0.35) }}>
      <span style={{ color: COR.violeta }}>{numero}</span> {texto}
    </div>
  );
}

function Trilha({ t, i }: { t: number; i: number }) {
  const { width: W, height: H } = useVideoConfig();
  const ini = INI_TRILHAS + i * POR_TRILHA;
  if (t < ini - 0.1 || t > ini + POR_TRILHA + 0.1) return null;
  const linha = LINHAS[i];
  const larg = Math.min(300, (W - 2 * 60 - 2 * 28) / 3);
  const altCapa = (larg * 466) / 306;
  const sai = ent(t, ini + POR_TRILHA - 0.45, 0.45);
  const desliza = (atraso: number) => mix(W, 0, ent(t, ini + atraso, 0.55)) - sai * W;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: H * 0.17, textAlign: "center", padding: "0 70px", translate: `${desliza(0)}px 0` }}>
        <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: "-0.045em", lineHeight: 1.02, textWrap: "balance" }}>{linha.titulo}</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: H * 0.58 - altCapa / 2, display: "flex", justifyContent: "center", gap: 28 }}>
        {linha.cursos.slice(0, 3).map((c, j) => (
          <Capa key={c.capa} src={c.capa} largura={larg} style={{ translate: `${desliza(0.08 + j * 0.07)}px 0`, flex: "none" }} />
        ))}
      </div>
    </AbsoluteFill>
  );
}

export function Dentro() {
  const t = useT();
  return (
    <AbsoluteFill style={{ background: COR.papel, fontFamily: FONTE, color: COR.tinta, overflow: "hidden" }}>
      <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 40, textAlign: "center" }}>
        {/* A marca abre o vídeo (pedido do Rodrigo). */}
        <div style={{ marginBottom: 30, ...aparece(t, 0.02, INI_TRILHAS - 0.05, 0.35) }}>
          <Logo className="w-[440px]" />
        </div>
        <Numero t={t} ini={0.1} numero={LINHAS.length} texto={f.dentro.trilhas} />
        <Numero t={t} ini={1.0} numero={PUBLICADOS.length} texto={f.dentro.noAr} />
        <Numero t={t} ini={2.0} numero={TODOS.length - PUBLICADOS.length} texto={f.dentro.chegando} />
      </AbsoluteFill>
      {LINHAS.map((_, i) => (
        <Trilha key={i} t={t} i={i} />
      ))}
      <FechoSocial t={t} ini={INI_TRILHAS + LINHAS.length * POR_TRILHA} frase={f.dentro.fecho} />
    </AbsoluteFill>
  );
}
