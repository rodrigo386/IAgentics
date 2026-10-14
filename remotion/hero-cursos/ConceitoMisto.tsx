import { AbsoluteFill } from "remotion";
import { cursos } from "@/lib/content";
import { COR, ent, FONTE, useT } from "./base";
import { Trilhas } from "./ConceitoCapaAula";
import { FechoAparelhos } from "./ConceitoRotina";
import { Cascata, Contagem, Destaques } from "./ConceitoTudo";

/**
 * Conceito 4, misto (2026-10-14, pedido do Rodrigo depois de ver os três),
 * em três atos com as MESMAS cenas dos outros filmes em outro relógio:
 *  - o início do 1: nomes grandes, cascata, e "+300 horas de aula" no lugar
 *    de "+70 cursos";
 *  - os cursos do 2: as trilhas correndo com todas as capas, a câmera
 *    recuando e os nomes das trilhas passando. Uma versão anterior usou as
 *    aulas do 2 (capa que vira aula); o Rodrigo corrigiu: "quero a parte com
 *    todos os cursos passando";
 *  - o fecho do 3: os três aparelhos, o ritmo e o preço.
 */
export const DURACAO_MISTO = 21;
const f = cursos.filmesHero;
const ATO_2 = 9.9;
const ATO_3 = ATO_2 + 5.4;

export function ConceitoMisto() {
  const t = useT();
  return (
    <AbsoluteFill style={{ background: COR.papel, fontFamily: FONTE, color: COR.tinta, overflow: "hidden" }}>
      <Destaques t={t} ini={0.5} textos={f.tudo.destaques} />
      <Cascata t={t} ini={4.0} fim={8.0} />
      <Contagem t={t} ini={7.9} fim={ATO_2 + 0.2} texto={f.misto.contagem} />
      <Trilhas t={t} ini={ATO_2} />
      <FechoAparelhos t={t} ini={ATO_3} sai={ent(t, DURACAO_MISTO - 0.8, 0.7)} />
    </AbsoluteFill>
  );
}
