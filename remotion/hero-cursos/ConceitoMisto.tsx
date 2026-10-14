import { AbsoluteFill } from "remotion";
import { cursos } from "@/lib/content";
import { COR, ent, FONTE, useT } from "./base";
import { AULAS, AulaEmCena } from "./ConceitoCapaAula";
import { CartaoPreco, Cascata, Contagem, Destaques, GradeCapas } from "./ConceitoTudo";

/**
 * Conceito 4, misto de 1 e 2 (2026-10-14, pedido do Rodrigo depois de ver os
 * três): a abertura do "Da capa à aula" e o fecho do "Tudo numa assinatura".
 * A capa do Fundamentos abre e vira a aula; a barra enche, achata em linha e
 * some; dali entram os nomes grandes, a cascata, "+70 cursos", a grade de
 * capas e o cartão do preço. Mesmas peças dos dois filmes, outro relógio.
 */
export function ConceitoMisto() {
  const t = useT();
  return (
    <AbsoluteFill style={{ background: COR.papel, fontFamily: FONTE, color: COR.tinta, overflow: "hidden" }}>
      <AulaEmCena t={t} a={AULAS[0]} ultima />
      <Destaques t={t} ini={4.8} textos={cursos.filmesHero.misto.destaques} />
      <Cascata t={t} ini={7.1} fim={9.9} />
      <Contagem t={t} ini={9.8} fim={11.5} />
      <GradeCapas t={t} ini={11.2} recolheEm={13.0} />
      <CartaoPreco t={t} ini={13.6} sai={ent(t, 17.2, 0.7)} />
    </AbsoluteFill>
  );
}
