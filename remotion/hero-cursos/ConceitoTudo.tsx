import { AbsoluteFill } from "remotion";
import { cursos } from "@/lib/content";
import { aparece, Capa, COR, ent, FONTE, H, mix, Preco, PUBLICADOS, TODOS, useT, W } from "./base";

/**
 * Conceito 1, "Tudo numa assinatura": tipografia em cascata, como um keynote.
 * Três cursos com nome grande, um por vez; depois os nomes de todos os cursos
 * aceleram até virar borrão e o borrão assenta em "+70 cursos"; as capas caem
 * e formam uma grade; a grade se recolhe no preço. Termina no papel vazio,
 * que é como começa: o laço não tem emenda.
 *
 * As cenas são peças com hora de início, porque o conceito 4 (o misto de 1 e
 * 2, ConceitoMisto) reusa as mesmas com outro relógio.
 */
const f = cursos.filmesHero.tudo;

/** Nomes grandes, um por vez, `passo` segundos cada. */
export function Destaques({ t, ini, textos, passo = 1.15 }: { t: number; ini: number; textos: readonly string[]; passo?: number }) {
  return (
    <>
      {textos.map((texto, i) => {
        const de = ini + i * passo;
        return (
          <div
            key={texto}
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              padding: "0 80px",
              textAlign: "center",
              fontSize: 132,
              fontWeight: 700,
              letterSpacing: "-0.045em",
              lineHeight: 0.98,
              textWrap: "balance",
              scale: `${mix(1.06, 1, ent(t, de, 1.1))}`,
              ...aparece(t, de, de + passo, 0.35),
            }}
          >
            {texto}
          </div>
        );
      })}
    </>
  );
}

/** Os nomes de todos os cursos, cada um um pouco mais rápido, até o borrão. */
function agenda(ini: number, fim: number) {
  const nomes = TODOS.map((c) => c.nome);
  const marcas: { nome: string; de: number; ate: number }[] = [];
  let t = ini;
  let d = 0.32;
  let i = 0;
  while (t < fim) {
    marcas.push({ nome: nomes[i % nomes.length], de: t, ate: t + d });
    t += d;
    d = Math.max(0.05, d * 0.86);
    i++;
  }
  return marcas;
}

export function Cascata({ t, ini, fim }: { t: number; ini: number; fim: number }) {
  const atual = agenda(ini, fim).find((m) => t >= m.de && t < m.ate);
  if (!atual) return null;
  const borrao = ent(t, fim - 1.4, 1.4);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        padding: "0 90px",
        textAlign: "center",
        fontSize: 84,
        fontWeight: 600,
        letterSpacing: "-0.035em",
        lineHeight: 1.02,
        textWrap: "balance",
        color: borrao > 0.5 ? COR.apagado : COR.tinta,
        filter: `blur(${borrao * 14}px)`,
        opacity: 1 - ent(t, fim - 0.4, 0.4),
      }}
    >
      {atual.nome}
    </div>
  );
}

/** O número grande; a primeira palavra vai no violeta. `texto` troca o
 *  "+70 cursos" (o conceito 4 usa "+300 horas de aula"). */
export function Contagem({ t, ini, fim, texto = f.contagem }: { t: number; ini: number; fim: number; texto?: string }) {
  const [numero, ...resto] = texto.split(" ");
  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: "0 70px", ...aparece(t, ini, fim, 0.5) }}>
      <div style={{ fontSize: 188, fontWeight: 700, letterSpacing: "-0.055em", lineHeight: 0.98, textAlign: "center", textWrap: "balance" }}>
        <span style={{ color: COR.violeta }}>{numero}</span> {resto.join(" ")}
      </div>
    </div>
  );
}

const GRADE = PUBLICADOS.slice(0, 16);
const COLS = 4;
const LARG = 214;
const GAP = 22;

/** As capas caem em grade (`ini`), param, e se recolhem no centro (`recolhe`). */
export function GradeCapas({ t, ini, recolheEm }: { t: number; ini: number; recolheEm: number }) {
  if (t < ini || t >= recolheEm + 1.4) return null;
  const recolhe = ent(t, recolheEm, 0.9);
  const largGrade = COLS * LARG + (COLS - 1) * GAP;
  const altCapa = (LARG * 466) / 306;
  const linhas = Math.ceil(GRADE.length / COLS);
  const altGrade = linhas * altCapa + (linhas - 1) * GAP;
  return (
    <>
      {GRADE.map((c, i) => {
        const col = i % COLS;
        const lin = Math.floor(i / COLS);
        const x = (W - largGrade) / 2 + col * (LARG + GAP);
        const y = (H - altGrade) / 2 + lin * (altCapa + GAP);
        const cai = ent(t, ini + 0.1 + (lin * 0.12 + col * 0.07), 0.9);
        return (
          <Capa
            key={c.capa}
            src={c.capa}
            largura={LARG}
            style={{
              position: "absolute",
              left: mix(x, W / 2 - LARG / 2, recolhe),
              top: mix(y - (1 - cai) * 1100, H / 2 - altCapa / 2, recolhe),
              rotate: `${(1 - cai) * (col % 2 ? 8 : -8) + recolhe * (i % 2 ? 4 : -4)}deg`,
              scale: `${mix(1, 0.7, recolhe)}`,
              opacity: 1 - ent(t, recolheEm + 0.6, 0.5),
            }}
          />
        );
      })}
    </>
  );
}

/** O cartão branco que nasce de onde a grade se recolheu, com o preço. */
export function CartaoPreco({ t, ini, sai }: { t: number; ini: number; sai: number }) {
  if (t < ini) return null;
  const cartao = ent(t, ini, 0.8);
  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
      <div
        style={{
          width: mix(160, 900, cartao),
          height: mix(240, 780, cartao),
          borderRadius: 48,
          background: "#ffffff",
          boxShadow: "0 40px 90px -30px rgba(19,23,35,0.28)",
          border: `1px solid ${COR.linha}`,
          display: "grid",
          placeItems: "center",
          opacity: (1 - sai) * Math.min(1, cartao * 2),
        }}
      >
        {cartao > 0.6 ? (
          <div style={{ display: "grid", gap: 64, justifyItems: "center" }}>
            <Preco t={t} ini={ini + 0.6} tamanho={170} />
            <div style={{ fontSize: 46, fontWeight: 500, letterSpacing: "-0.02em", ...aparece(t, ini + 1.6) }}>{f.fecho}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ConceitoTudo() {
  const t = useT();
  return (
    <AbsoluteFill style={{ background: COR.papel, fontFamily: FONTE, color: COR.tinta, overflow: "hidden" }}>
      <Destaques t={t} ini={0.5} textos={f.destaques} />
      <Cascata t={t} ini={4.0} fim={8.0} />
      <Contagem t={t} ini={7.9} fim={9.9} />
      <GradeCapas t={t} ini={9.6} recolheEm={12.0} />
      <CartaoPreco t={t} ini={12.6} sai={ent(t, 17.2, 0.7)} />
    </AbsoluteFill>
  );
}
