import { AbsoluteFill } from "remotion";
import { Logo } from "@/components/ui/Logo";
import { cursos } from "@/lib/content";
import { aparece, COR, FONTE, useT } from "../hero-cursos/base";
import { Trilhas } from "../hero-cursos/ConceitoCapaAula";
import { Cascata, Contagem } from "../hero-cursos/ConceitoTudo";
import { FechoSocial } from "./comum";

/**
 * Vídeo de lançamento 1, "O lançamento" (2026-10-14, para Instagram e
 * LinkedIn): o filme da hero encurtado, com gancho no primeiro segundo e
 * fecho de anúncio. 17 s, em 9:16 e 4:5 (a mesma composição; as cenas leem o
 * tamanho do quadro).
 *
 * Os cortes caem no grid da trilha (120 BPM, 0,5 s por tempo): impacto em 0
 * ("Chegou."), bateria em 2,5 (cascata), impacto em 6 ("+300 horas de aula"),
 * groove cheio nas trilhas e impacto em 12,5 (preço). Mudou um tempo aqui,
 * mude a trilha junto (scripts/trilha-lancamento.py, DESTAQUES).
 */
export const DURACAO_LANCAMENTO = 17;
const f = cursos.filmesSocial;

export function Lancamento() {
  const t = useT();
  return (
    <AbsoluteFill style={{ background: COR.papel, fontFamily: FONTE, color: COR.tinta, overflow: "hidden" }}>
      <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 36, padding: "0 80px", textAlign: "center" }}>
        {/* A marca abre o vídeo (pedido do Rodrigo): no feed, quem fala é
            reconhecido antes do que é dito. */}
        <div style={{ marginBottom: 40, ...aparece(t, 0.02, 2.45, 0.35) }}>
          <Logo className="w-[440px]" />
        </div>
        <div style={{ fontSize: 210, fontWeight: 700, letterSpacing: "-0.055em", lineHeight: 0.95, ...aparece(t, 0.15, 2.45, 0.35) }}>{f.lancamento.chegou}</div>
        <div style={{ fontSize: 66, fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1.08, textWrap: "balance", color: COR.apagado, ...aparece(t, 0.6, 2.45, 0.4) }}>
          {f.lancamento.linha}
        </div>
      </AbsoluteFill>
      <Cascata t={t} ini={2.5} fim={6.0} />
      <Contagem t={t} ini={5.95} fim={7.9} texto={cursos.filmesHero.misto.contagem} />
      <Trilhas t={t} ini={7.6} />
      <FechoSocial t={t} ini={12.5} />
    </AbsoluteFill>
  );
}
