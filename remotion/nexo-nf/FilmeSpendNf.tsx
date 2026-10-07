import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { C, CenaProva, FONTE, Frase, MONO, Pilula, Rotulo, entrada, fmt, itemNaPratica, mola, prog, surge } from "../nexo-kit/kit";
import { CENAS, b } from "../nexo-kit/cues";

/**
 * Filme do módulo "Spend via NF" para a /nexo (2026-10-06): loop mudo de 22 s,
 * no bloco "Na prática" do módulo. Feito com a skill product-film
 * (github.com/Rieranthony/product-film-skill), a partir do prompt-motion.com.
 *
 * Escolhas do Rodrigo na entrevista: site, mudo em loop · as quatro cenas (a NF
 * lida, os gastos classificados, as recomendações, o número de prova) · frases
 * curtas entre as cenas · claro, com as cores do site.
 *
 * AS FRASES NÃO SÃO ESCRITAS AQUI: são os nomes dos três passos e a prova do
 * módulo em lib/content.ts — o vídeo diz exatamente o que a página diz, e muda
 * junto com ela. Os dados das cenas (fornecedores, valores, recomendações) são
 * os dos dois prints do módulo que já estão no site, traduzidos.
 *
 * Tudo é função do tempo `t` (segundos): nada de transição CSS, timer ou estado.
 * O quadro final é papel vazio, igual ao quadro 0 — o loop não tem emenda.
 */

export function FilmeSpendNf() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  return (
    <AbsoluteFill style={{ background: C.papel, fontFamily: FONTE, color: C.tinta, overflow: "hidden" }}>
      <Frase t={t} cena={CENAS.frase1} texto={passos[0].nome} destaque={2} />
      <CenaNota t={t} />
      <Frase t={t} cena={CENAS.frase2} texto={passos[1].nome} destaque={2} />
      <CenaClassifica t={t} />
      <Frase t={t} cena={CENAS.frase3} texto={passos[2].nome} destaque={1} />
      <CenaRecomenda t={t} />
      <CenaProva t={t} item={nf} />
    </AbsoluteFill>
  );
}

const nf = itemNaPratica("nf");
const passos = nf.passos;

/* ------------------------------------------------------ cena 1: a NF --- */

const NOTA = { x: 170, y: 170, w: 640, h: 740 };
const BANCO = { x: 960, y: 300, w: 790 };
const COLS = [0, 430, 560]; // fornecedor, itens, valor (medido no layout abaixo)
const LINHA_H = 92;
const linhasBanco = [
  { f: "Elif Morgenroth", i: "3", v: "US$ 74.660" },
  { f: "Sélectour Strategy Voyages", i: "1", v: "US$ 53.571" },
];
const novaLinha = { f: "Contract Packaging Inc.", i: "3", v: "US$ 62.567" };

/* Onde cada campo está NA NOTA (origem do voo) e onde pousa NO BANCO. */
const voos = [
  { texto: novaLinha.f, de: { x: NOTA.x + 44, y: NOTA.y + 222, tam: 34 }, para: { x: BANCO.x + COLS[0] + 28, y: BANCO.y + 70 + 2 * LINHA_H + 30, tam: 26 } },
  { texto: novaLinha.i, de: { x: NOTA.x + 44, y: NOTA.y + 330, tam: 34 }, para: { x: BANCO.x + COLS[1] + 28, y: BANCO.y + 70 + 2 * LINHA_H + 30, tam: 26 } },
  { texto: novaLinha.v, de: { x: NOTA.x + 44, y: NOTA.y + 612, tam: 48 }, para: { x: BANCO.x + COLS[2] + 28, y: BANCO.y + 70 + 2 * LINHA_H + 30, tam: 26 } },
];

function CenaNota({ t }: { t: number }) {
  const { de, ate } = CENAS.nota;
  if (t < de - 0.05 || t > ate + 0.25) return null;
  const varre = prog(t, b(1, 2.25), 1.1); // leitura de cima a baixo
  const linhaVarredura = NOTA.y + 80 + varre * (NOTA.h - 120);
  // Cada campo parte logo depois que a faixa de leitura passa por ele.
  const partidas = [b(1, 3), b(1, 3.6), b(1, 4.3)];
  const contador = t > b(2, 2) ? 43 : 42;

  return (
    <AbsoluteFill>
      {/* A nota fiscal */}
      <div
        style={{
          position: "absolute",
          left: NOTA.x,
          top: NOTA.y,
          width: NOTA.w,
          height: NOTA.h,
          background: C.superficie,
          border: `1px solid ${C.linha}`,
          padding: 44,
          boxSizing: "border-box",
          ...surge(t, de, ate),
        }}
      >
        <Rotulo>Nota fiscal eletrônica</Rotulo>
        <div style={{ marginTop: 8, fontSize: 24, color: C.sutil }}>NF-e nº 000.482 · Série 1</div>
        <div style={{ marginTop: 40, borderTop: `1px solid ${C.linha}`, paddingTop: 22 }}>
          <Rotulo style={{ fontSize: 18 }}>Emitente</Rotulo>
          <div style={{ marginTop: 6, fontSize: 34, fontWeight: 500, opacity: t > partidas[0] ? 0.25 : 1 }}>{novaLinha.f}</div>
        </div>
        <div style={{ marginTop: 26, borderTop: `1px solid ${C.linha}`, paddingTop: 22 }}>
          <Rotulo style={{ fontSize: 18 }}>Itens</Rotulo>
          <div style={{ marginTop: 6, fontSize: 34, fontWeight: 500, opacity: t > partidas[1] ? 0.25 : 1 }}>{novaLinha.i}</div>
          {[
            ["Caixa kraft 10003891", "US$ 41.200"],
            ["Filme stretch 500 mm", "US$ 13.880"],
            ["Palete PBR", "US$ 7.487"],
          ].map(([item, valor]) => (
            <div key={item} style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 24, color: C.apagado }}>
              <span>{item}</span>
              <span>{valor}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 30, borderTop: `1px solid ${C.linha}`, paddingTop: 22 }}>
          <Rotulo style={{ fontSize: 18 }}>Valor total</Rotulo>
          <div style={{ marginTop: 6, fontSize: 48, fontWeight: 500, opacity: t > partidas[2] ? 0.25 : 1 }}>{novaLinha.v}</div>
        </div>

        {/* A leitura: uma faixa violeta que desce pela nota. */}
        {varre > 0 && varre < 1 ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: linhaVarredura - NOTA.y - 60, height: 60, background: "linear-gradient(to bottom, rgba(118,7,232,0), rgba(118,7,232,0.10))", borderBottom: `3px solid ${C.violeta}` }} />
        ) : null}
      </div>

      {/* O banco de dados */}
      <div style={{ position: "absolute", left: BANCO.x, top: BANCO.y - 90, width: BANCO.w, ...surge(t, de + 0.15, ate) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontSize: 34, fontWeight: 500 }}>Banco de notas</div>
          <div style={{ fontSize: 26, color: C.apagado }}>
            <span style={{ color: contador === 43 ? C.violeta : C.apagado, fontWeight: 500 }}>{contador}</span> notas
          </div>
        </div>
        <div style={{ marginTop: 26, border: `1px solid ${C.linha}`, background: C.superficie }}>
          <div style={{ position: "relative", height: 70, borderBottom: `1px solid ${C.linha}` }}>
            {["Fornecedor", "Itens", "Valor"].map((h, i) => (
              <Rotulo key={h} style={{ position: "absolute", left: COLS[i] + 28, top: 24, fontSize: 18 }}>{h}</Rotulo>
            ))}
          </div>
          {[...linhasBanco, null].map((l, i) => {
            const pousou = t > partidas[2] + 0.35;
            return (
              <div key={i} style={{ position: "relative", height: LINHA_H, borderTop: i ? `1px solid ${C.linha}` : undefined, background: l === null && pousou ? "rgba(118,7,232,0.05)" : undefined }}>
                {l
                  ? [l.f, l.i, l.v].map((v, j) => (
                      <div key={j} style={{ position: "absolute", left: COLS[j] + 28, top: 30, fontSize: 26, color: j ? C.apagado : C.tinta }}>{v}</div>
                    ))
                  : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Os campos voando da nota para a linha nova (movimento mágico). */}
      {voos.map((v, i) => {
        if (t < partidas[i]) return null;
        const u = mola(t - partidas[i], 8);
        const x = v.de.x + (v.para.x - v.de.x) * u;
        const y = v.de.y + (v.para.y - v.de.y) * u;
        const tam = v.de.tam + (v.para.tam - v.de.tam) * u;
        const saida = prog(t, ate - 0.2, 0.2);
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, fontSize: tam, fontWeight: u > 0.9 ? 400 : 500, lineHeight: 1, whiteSpace: "nowrap", color: u > 0.9 && i ? C.apagado : C.tinta, opacity: 1 - saida, filter: saida ? `blur(${saida * 12}px)` : undefined }}>
            {v.texto}
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

/* ---------------------------------------------- cena 2: classificação --- */

const linhasClassif = [
  { f: "Contract Packaging Inc.", v: "US$ 62.567", cat: "Produção e embalagem", corCat: C.indigo, pais: "EUA", cad: "Recorrente" },
  { f: "Elif Morgenroth", v: "US$ 74.660", cat: "Consultoria", corCat: C.violeta, pais: "França", cad: "Pontual" },
  { f: "Sélectour Strategy Voyages", v: "US$ 53.571", cat: "Eventos e viagens", corCat: C.pervinca, pais: "França", cad: "Pontual" },
  { f: "NC State University", v: "US$ 52.378", cat: "Serviços técnicos", corCat: C.azul, pais: "EUA", cad: "Recorrente" },
];
const COLS2 = [0, 470, 720, 1150, 1330];

const categorias = [
  { nome: "Consultoria", v: 74.66, cor: C.violeta },
  { nome: "Produção e embalagem", v: 62.57, cor: C.indigo },
  { nome: "Eventos e viagens", v: 58.4, cor: C.pervinca },
  { nome: "Recrutamento", v: 46.25, cor: C.azul },
  { nome: "Serviços técnicos", v: 40.1, cor: C.ceu },
];

function CenaClassifica({ t }: { t: number }) {
  const { de, ate } = CENAS.classifica;
  if (t < de - 0.05 || t > ate + 0.25) return null;
  const virada = b(5, 1); // a tabela sai e a visão geral entra
  return (
    <AbsoluteFill>
      {/* 1ª metade: a tabela ganhando categoria, país e cadência */}
      {t < virada ? (
        <div style={{ position: "absolute", left: 170, top: 230, width: 1580, ...surge(t, de, virada - 0.25) }}>
          <div style={{ border: `1px solid ${C.linha}`, background: C.superficie }}>
            <div style={{ position: "relative", height: 74, borderBottom: `1px solid ${C.linha}` }}>
              {["Fornecedor", "Valor", "Categoria", "País", "Cadência"].map((h, i) => (
                <Rotulo key={h} style={{ position: "absolute", left: COLS2[i] + 32, top: 26, fontSize: 18 }}>{h}</Rotulo>
              ))}
            </div>
            {linhasClassif.map((l, i) => {
              const ini = b(4, 1.5) + i * 0.4;
              return (
                <div key={l.f} style={{ position: "relative", height: 116, borderTop: i ? `1px solid ${C.linha}` : undefined }}>
                  <div style={{ position: "absolute", left: COLS2[0] + 32, top: 40, fontSize: 28 }}>{l.f}</div>
                  <div style={{ position: "absolute", left: COLS2[1] + 32, top: 40, fontSize: 28, color: C.apagado }}>{l.v}</div>
                  {[
                    <Pilula key="c" cor={l.corCat}>{l.cat}</Pilula>,
                    <Pilula key="p" cor={C.sutil}>{l.pais}</Pilula>,
                    <Pilula key="d" cor={l.cad === "Recorrente" ? C.violeta : C.sutil}>{l.cad}</Pilula>,
                  ].map((pilula, j) => (
                    <div key={j} style={{ position: "absolute", left: COLS2[2 + j] + 32, top: 34, ...surge(t, ini + j * 0.12, Infinity, 14) }}>
                      {pilula}
                    </div>
                  ))}
                  {/* Célula ainda vazia: o traço de espera, no lugar exato do chip. */}
                  {[0, 1, 2].map((j) =>
                    t < ini + j * 0.12 ? (
                      <div key={`v${j}`} style={{ position: "absolute", left: COLS2[2 + j] + 32, top: 56, width: 90, height: 3, background: C.linha }} />
                    ) : null,
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* 2ª metade: a visão geral se montando */}
      {t > virada - 0.2 ? (
        <AbsoluteFill>
          <div style={{ position: "absolute", left: 170, top: 170, width: 1580, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 30 }}>
            {[
              { r: "Gasto total", v: 383167, pre: "US$ ", sub: "42 notas, sem adiantamento" },
              { r: "Notas", v: 43, pre: "", sub: "em 4 países" },
              { r: "Fornecedores", v: 11, pre: "", sub: "ativos" },
            ].map((k, i) => {
              const n = k.v * entrada(prog(t, virada + 0.1 + i * 0.12, 0.9));
              return (
                <div key={k.r} style={{ background: C.superficie, border: `1px solid ${C.linha}`, padding: "30px 36px", ...surge(t, virada - 0.15 + i * 0.12, ate) }}>
                  <Rotulo style={{ fontSize: 18 }}>{k.r}</Rotulo>
                  <div style={{ marginTop: 12, fontSize: 64, fontWeight: 500, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
                    {k.pre}
                    {fmt(n)}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 24, color: C.apagado }}>{k.sub}</div>
                </div>
              );
            })}
          </div>
          <div style={{ position: "absolute", left: 170, top: 470, width: 1580, background: C.superficie, border: `1px solid ${C.linha}`, padding: "32px 36px", boxSizing: "border-box", ...surge(t, virada + 0.05, ate) }}>
            <div style={{ fontSize: 30, fontWeight: 500 }}>Gasto por categoria</div>
            <div style={{ marginTop: 24, display: "grid", gap: 16 }}>
              {categorias.map((c, i) => {
                const u = entrada(prog(t, virada + 0.5 + i * 0.1, 0.8));
                return (
                  <div key={c.nome} style={{ display: "grid", gridTemplateColumns: "330px 1fr 150px", alignItems: "center", gap: 24 }}>
                    <div style={{ fontSize: 24, color: C.apagado, textAlign: "right" }}>{c.nome}</div>
                    <div style={{ height: 30, width: `${(c.v / 80) * 100 * u}%`, background: c.cor }} />
                    <div style={{ fontSize: 24, fontVariantNumeric: "tabular-nums" }}>US$ {(c.v * u).toFixed(1).replace(".", ",")}k</div>
                  </div>
                );
              })}
            </div>
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
}

/* --------------------------------------------- cena 3: recomendações --- */

const recomendacoes = [
  { titulo: "Contrato de fornecimento com a Contract Packaging", acao: "Volume anual com preço travado e cláusula de índice", nivel: "Alta", score: 87, valor: "US$ 62.567" },
  { titulo: "Consolidar compras de escritório", acao: "Catálogo e cartão corporativo para compras abaixo de US$ 500", nivel: "Alta", score: 82, valor: "US$ 12.941" },
  { titulo: "Formalizar a consultoria do Project Sunrise", acao: "MSA e SOW com teto de horas e entregas definidas", nivel: "Alta", score: 76, valor: "US$ 74.660" },
];

function CenaRecomenda({ t }: { t: number }) {
  const { de, ate } = CENAS.recomenda;
  if (t < de - 0.05 || t > ate + 0.25) return null;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 170, top: 170, width: 1580, display: "flex", justifyContent: "space-between", alignItems: "baseline", ...surge(t, de, ate) }}>
        <div style={{ fontSize: 40, fontWeight: 500, letterSpacing: "-0.02em" }}>Recomendações de sourcing</div>
        <Rotulo>Ordenadas por score</Rotulo>
      </div>
      <div style={{ position: "absolute", left: 170, top: 280, width: 1580, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 30 }}>
        {recomendacoes.map((r, i) => {
          const ini = de + 0.2 + i * 0.4;
          const enche = entrada(prog(t, b(7, 3) + i * 0.25, 1.1));
          return (
            <div
              key={r.titulo}
              style={{
                background: C.superficie,
                border: `1px solid ${C.linha}`,
                borderLeft: `6px solid ${C.violeta}`,
                padding: "34px 36px",
                height: 500,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                ...surge(t, ini, ate, 40),
              }}
            >
              <div>
                <Pilula cor={C.violeta} cheia style={{ fontFamily: MONO, fontSize: 18, letterSpacing: "0.14em", textTransform: "uppercase", padding: "6px 14px" }}>
                  {r.nivel}
                </Pilula>
              </div>
              <div style={{ marginTop: 24, fontSize: 34, fontWeight: 500, lineHeight: 1.15, letterSpacing: "-0.01em" }}>{r.titulo}</div>
              <div style={{ marginTop: 18, fontSize: 25, lineHeight: 1.35, color: C.apagado }}>{r.acao}</div>
              <div style={{ marginTop: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <Rotulo style={{ fontSize: 17 }}>Score de oportunidade</Rotulo>
                  <div style={{ fontSize: 28, fontWeight: 500, color: C.violeta, fontVariantNumeric: "tabular-nums" }}>{Math.round(r.score * enche)}/100</div>
                </div>
                <div style={{ marginTop: 12, height: 10, background: C.linha }}>
                  <div style={{ height: "100%", width: `${r.score * enche}%`, background: C.violeta }} />
                </div>
                <div style={{ marginTop: 22, fontSize: 26, color: C.apagado }}>
                  Gasto endereçável <span style={{ color: C.tinta, fontWeight: 500 }}>{r.valor}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 170, top: 880, ...surge(t, b(8, 3), ate, 14) }}>
        <Pilula cor={C.violeta}>e mais 3 oportunidades</Pilula>
      </div>
    </AbsoluteFill>
  );
}

