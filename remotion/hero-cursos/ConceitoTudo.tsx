import { AbsoluteFill } from "remotion";
import { cursos } from "@/lib/content";
import { aparece, Capa, COR, ent, FONTE, H, mix, Preco, PUBLICADOS, TODOS, useT, W } from "./base";

/**
 * Conceito 1, "Tudo numa assinatura": tipografia em cascata, como um keynote.
 * Três cursos com nome grande, um por vez; depois os nomes de todos os cursos
 * aceleram até virar borrão e o borrão assenta em "+70 cursos"; as capas caem
 * e formam uma grade; a grade se recolhe no preço. Termina no papel vazio,
 * que é como começa: o laço não tem emenda.
 */
const f = cursos.filmesHero.tudo;

/* A cascata: cada nome fica um pouco menos que o anterior. */
const INI_CASCATA = 4.0;
const FIM_CASCATA = 8.0;
const CASCATA = (() => {
  const nomes = TODOS.map((c) => c.nome);
  const marcas: { nome: string; de: number; ate: number }[] = [];
  let t = INI_CASCATA;
  let d = 0.32;
  let i = 0;
  while (t < FIM_CASCATA) {
    marcas.push({ nome: nomes[i % nomes.length], de: t, ate: t + d });
    t += d;
    d = Math.max(0.05, d * 0.86);
    i++;
  }
  return marcas;
})();

const GRADE = PUBLICADOS.slice(0, 16);
const COLS = 4;
const LARG = 214;
const GAP = 22;

export function ConceitoTudo() {
  const t = useT();
  const sai = ent(t, 17.2, 0.7);

  /* 1. Três destaques, ~1,1 s cada. */
  const destaques = f.destaques.map((texto, i) => {
    const ini = 0.5 + i * 1.15;
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
          scale: `${mix(1.06, 1, ent(t, ini, 1.1))}`,
          ...aparece(t, ini, ini + 1.15, 0.35),
        }}
      >
        {texto}
      </div>
    );
  });

  /* 2. A cascata e o número. */
  const atual = CASCATA.find((m) => t >= m.de && t < m.ate);
  const borrao = ent(t, 6.6, 1.4);
  const contagem = aparece(t, 7.9, 9.9, 0.5);

  /* 3. A grade de capas: caem, param, se recolhem no centro. */
  const recolhe = ent(t, 12.0, 0.9);
  const largGrade = COLS * LARG + (COLS - 1) * GAP;
  const altCapa = (LARG * 466) / 306;
  const linhas = Math.ceil(GRADE.length / COLS);
  const altGrade = linhas * altCapa + (linhas - 1) * GAP;

  /* 4. O cartão do preço nasce de onde a grade se recolheu. */
  const cartao = ent(t, 12.6, 0.8);

  return (
    <AbsoluteFill style={{ background: COR.papel, fontFamily: FONTE, color: COR.tinta, overflow: "hidden" }}>
      {destaques}

      {atual ? (
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
            color: mix(0, 1, borrao) > 0.5 ? COR.apagado : COR.tinta,
            filter: `blur(${borrao * 14}px)`,
            opacity: 1 - ent(t, 7.6, 0.4),
          }}
        >
          {atual.nome}
        </div>
      ) : null}

      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", ...contagem }}>
        <div style={{ fontSize: 220, fontWeight: 700, letterSpacing: "-0.055em", lineHeight: 1 }}>
          <span style={{ color: COR.violeta }}>{f.contagem.split(" ")[0]}</span> {f.contagem.split(" ").slice(1).join(" ")}
        </div>
      </div>

      {t >= 9.6 && t < 13.4
        ? GRADE.map((c, i) => {
            const col = i % COLS;
            const lin = Math.floor(i / COLS);
            const x = (W - largGrade) / 2 + col * (LARG + GAP);
            const y = (H - altGrade) / 2 + lin * (altCapa + GAP);
            const cai = ent(t, 9.7 + (lin * 0.12 + col * 0.07), 0.9);
            const dx = mix(x, W / 2 - LARG / 2, recolhe);
            const dy = mix(y - (1 - cai) * 1100, H / 2 - altCapa / 2, recolhe);
            return (
              <Capa
                key={c.capa}
                src={c.capa}
                largura={LARG}
                style={{
                  position: "absolute",
                  left: dx,
                  top: dy,
                  rotate: `${(1 - cai) * (col % 2 ? 8 : -8) + recolhe * (i % 2 ? 4 : -4)}deg`,
                  scale: `${mix(1, 0.7, recolhe)}`,
                  opacity: 1 - ent(t, 12.6, 0.5),
                }}
              />
            );
          })
        : null}

      {t >= 12.6 ? (
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
                <Preco t={t} ini={13.2} tamanho={170} />
                <div style={{ fontSize: 46, fontWeight: 500, letterSpacing: "-0.02em", ...aparece(t, 14.2) }}>{f.fecho}</div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
