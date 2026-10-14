import { AbsoluteFill } from "remotion";
import { cursos } from "@/lib/content";
import { COR, ent, FONTE, useT } from "./base";
import { AULAS, AulaEmCena } from "./ConceitoCapaAula";
import { FechoAparelhos } from "./ConceitoRotina";
import { Cascata, Contagem, Destaques } from "./ConceitoTudo";

/**
 * Conceito 4, misto (2026-10-14, pedido do Rodrigo depois de ver os três; a
 * 1ª versão era a abertura do 2 com o fecho do 1). Agora em três atos, com
 * as MESMAS cenas dos outros filmes em outro relógio:
 *  - o início do 1: nomes grandes, cascata, e "+300 horas de aula" no lugar
 *    de "+70 cursos";
 *  - os cursos do 2: a capa do Fundamentos vira aula, a barra se dobra na
 *    capa do Marketing com IA, que vira aula;
 *  - o fecho do 3: os três aparelhos, o ritmo e o preço.
 * São 24 s, não 18: os três atos não cabem no tempo dos outros sem correr.
 */
export const DURACAO_MISTO = 24;
const f = cursos.filmesHero;
const ATO_2 = 9.9;

export function ConceitoMisto() {
  const t = useT();
  const aulas = [
    { ...AULAS[0], ini: ATO_2 },
    { ...AULAS[1], ini: ATO_2 + 4.1 },
  ];
  return (
    <AbsoluteFill style={{ background: COR.papel, fontFamily: FONTE, color: COR.tinta, overflow: "hidden" }}>
      <Destaques t={t} ini={0.5} textos={f.tudo.destaques} />
      <Cascata t={t} ini={4.0} fim={8.0} />
      <Contagem t={t} ini={7.9} fim={ATO_2} texto={f.misto.contagem} />
      {aulas.map((a, i) => (
        <AulaEmCena key={a.capa} t={t} a={a} primeira={i === 0} ultima={i === aulas.length - 1} />
      ))}
      <FechoAparelhos t={t} ini={aulas[1].ini + 4.5} sai={ent(t, DURACAO_MISTO - 0.8, 0.7)} />
    </AbsoluteFill>
  );
}
