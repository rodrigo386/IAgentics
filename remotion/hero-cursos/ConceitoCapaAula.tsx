import { AbsoluteFill, Img, staticFile } from "remotion";
import { cursos } from "@/lib/content";
import { aparece, Capa, COR, curso, ent, FONTE, H, mix, Preco, PUBLICADOS, TRILHAS, useT, W } from "./base";

/**
 * Conceito 2, "Da capa à aula": plano contínuo, sem corte (referência: o
 * showreel do @heyiamnick no skillry). A capa do Fundamentos abre e vira a
 * aula; a barra de progresso enche, achata o player numa linha, e a linha se
 * dobra na moldura da capa seguinte (Marketing com IA), que abre de novo. A
 * câmera recua para as trilhas correndo, tudo se recolhe num ponto violeta, e
 * o ponto se abre na frase e no preço. Termina no papel vazio.
 */
const f = cursos.filmesHero.capaAula;

const CAPA_L = 470;
const CAPA_A = (CAPA_L * 466) / 306;
const PLAYER_L = 960;
const PLAYER_A = (PLAYER_L * 9) / 16;
const PLAYER_Y = 300;

export type Aula = { capa: string; foto: string; enquadre: string; nome: string; professor: string; ini: number };
const fund = curso("Fundamentos de IA");
const mkt = curso("Marketing com IA");
export const AULAS: Aula[] = [
  { capa: fund.capa, foto: "/academy/academy-convite-poster.jpg", enquadre: "50% 20%", nome: fund.nome, professor: "professor" in fund ? fund.professor : "", ini: 0.3 },
  { capa: mkt.capa, foto: "/academy/marketing-com-ia-capa.jpg", enquadre: "50% 22%", nome: mkt.nome, professor: "professor" in mkt ? mkt.professor : "", ini: 4.4 },
];

/** Uma aula: capa → player → barra enche → achata em linha. Depois de `ini`. */
/** `primeira`: nasce do papel; senão, nasce da linha da aula anterior.
 *  `ultima`: a linha final some, porque não há aula seguinte para virar. */
export function AulaEmCena({ t, a, primeira, ultima }: { t: number; a: Aula; primeira: boolean; ultima: boolean }) {
  const r = t - a.ini;
  if (r < 0 || r > 4.6) return null;
  const nasce = primeira ? ent(t, a.ini, 0.7) : 1;
  const moldura = primeira ? 1 : ent(t, a.ini, 0.6); // linha → moldura da capa
  const abre = ent(t, a.ini + 1.0, 0.9); // capa → player
  const enche = ent(t, a.ini + 1.9, 1.5);
  const achata = ent(t, a.ini + 3.5, 0.6); // player → linha
  const someLinha = ultima ? ent(t, a.ini + 4.1, 0.5) : 0;

  const capaX = (W - CAPA_L) / 2;
  const capaY = (H - CAPA_A) / 2 - 40;
  const playerX = (W - PLAYER_L) / 2;
  // Retângulo atual: da linha (só na segunda), da capa, do player, de novo a linha.
  const linhaL = PLAYER_L;
  const linhaY = PLAYER_Y + PLAYER_A + 40;
  let x = mix(playerX, capaX, moldura);
  let y = mix(linhaY, capaY, moldura);
  let w = mix(linhaL, CAPA_L, moldura);
  let h = mix(8, CAPA_A, moldura);
  x = mix(x, playerX, abre);
  y = mix(y, PLAYER_Y, abre);
  w = mix(w, PLAYER_L, abre);
  h = mix(h, PLAYER_A, abre);
  // Ao achatar, o player desce até a barra e vira ela.
  y = mix(y, linhaY, achata);
  h = mix(h, 8, achata);

  const raio = mix(CAPA_L * 0.055, 28, abre) * (1 - achata) + 4 * achata;
  const conteudo = moldura * (1 - achata);

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w,
          height: h,
          borderRadius: raio,
          overflow: "hidden",
          background: achata > 0.6 || moldura < 0.6 ? COR.violeta : COR.tinta,
          scale: `${mix(0.86, 1, nasce)}`,
          opacity: nasce * (1 - someLinha),
          boxShadow: conteudo > 0.5 ? "0 40px 80px -30px rgba(19,23,35,0.4)" : undefined,
        }}
      >
        <div style={{ position: "absolute", inset: 0, opacity: conteudo * (1 - abre) }}>
          <Img src={staticFile(a.capa.slice(1))} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{ position: "absolute", inset: 0, opacity: conteudo * abre }}>
          <Img src={staticFile(a.foto.slice(1))} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: a.enquadre }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(19,23,35,0.65), transparent 40%)" }} />
          {/* A barra de progresso do player. */}
          <div style={{ position: "absolute", left: 36, right: 36, bottom: 30, height: 8, borderRadius: 8, background: "rgba(248,248,248,0.3)" }}>
            <div style={{ width: `${enche * 100}%`, height: "100%", borderRadius: 8, background: COR.violeta }} />
          </div>
        </div>
      </div>
      {/* O nome da aula, embaixo do player. */}
      <div
        style={{
          position: "absolute",
          left: playerX,
          right: playerX,
          top: PLAYER_Y + PLAYER_A + 80,
          textAlign: "center",
          ...aparece(t, a.ini + 1.6, a.ini + 3.6),
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1 }}>{a.nome}</div>
        <div style={{ fontSize: 34, fontWeight: 500, color: COR.apagado, marginTop: 18 }}>{a.professor}</div>
      </div>
    </>
  );
}

/** As trilhas correndo, a câmera recuando, os nomes passando. */
function Trilhas({ t }: { t: number }) {
  const ini = 8.6;
  if (t < ini || t > 14.6) return null;
  const recua = ent(t, ini, 2.2);
  const recolhe = ent(t, 13.4, 0.8);
  const linhas = 6;
  const larg = 150;
  const alt = (larg * 466) / 306;
  const gap = 16;
  const altLinha = alt + gap;
  const total = linhas * altLinha;
  const veu = ent(t, 9.4, 0.6) * (1 - recolhe);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: W / 2,
          top: H / 2,
          width: 0,
          height: 0,
          scale: `${mix(2.4, 1, recua) * mix(1, 0.02, recolhe)}`,
          opacity: ent(t, ini, 0.4) * (1 - ent(t, 13.9, 0.3)),
        }}
      >
        {Array.from({ length: linhas }).map((_, l) => {
          const sentido = l % 2 ? 1 : -1;
          const desloca = ((t - ini) * 70 * sentido) % ((larg + gap) * PUBLICADOS.length);
          return (
            <div key={l} style={{ position: "absolute", top: -total / 2 + l * altLinha, left: -1500 + desloca, display: "flex", gap }}>
              {Array.from({ length: 22 }).map((__, i) => {
                const c = PUBLICADOS[(i * 3 + l * 5) % PUBLICADOS.length];
                return <Capa key={i} src={c.capa} largura={larg} style={{ boxShadow: "none", flex: "none" }} />;
              })}
            </div>
          );
        })}
      </div>
      {/* Véu de papel e o nome da trilha da vez, em letra grande. */}
      <div style={{ position: "absolute", inset: 0, background: COR.papel, opacity: veu * 0.82 }} />
      {TRILHAS.slice(0, 4).map((nome, i) => (
        <div
          key={nome}
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            padding: "0 90px",
            textAlign: "center",
            fontSize: 104,
            fontWeight: 700,
            letterSpacing: "-0.045em",
            lineHeight: 1,
            textWrap: "balance",
            ...aparece(t, 9.6 + i * 0.95, i === 3 ? 13.3 : 9.6 + (i + 1) * 0.95, 0.35),
          }}
        >
          {nome}
        </div>
      ))}
    </>
  );
}

export function ConceitoCapaAula() {
  const t = useT();
  const ponto = ent(t, 13.8, 0.5);
  const abrePonto = ent(t, 14.3, 0.6);
  const sai = ent(t, 17.2, 0.7);
  return (
    <AbsoluteFill style={{ background: COR.papel, fontFamily: FONTE, color: COR.tinta, overflow: "hidden" }}>
      {AULAS.map((a, i) => (
        <AulaEmCena key={a.capa} t={t} a={a} primeira={i === 0} ultima={i === AULAS.length - 1} />
      ))}
      <Trilhas t={t} />

      {/* O ponto violeta: onde tudo se recolhe, e de onde a frase sai. */}
      {t >= 13.8 && t < 15.2 ? (
        <div
          style={{
            position: "absolute",
            left: W / 2,
            top: H / 2,
            width: 44,
            height: 44,
            translate: "-50% -50%",
            borderRadius: 999,
            background: COR.violeta,
            scale: `${ponto * mix(1, 40, abrePonto)}`,
            opacity: 1 - ent(t, 14.6, 0.5),
          }}
        />
      ) : null}

      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", opacity: 1 - sai }}>
        <div style={{ display: "grid", gap: 90, justifyItems: "center" }}>
          <div style={{ fontSize: 92, fontWeight: 700, letterSpacing: "-0.045em", ...aparece(t, 14.6) }}>{f.ritmo}</div>
          {t >= 15.3 ? <Preco t={t} ini={15.4} tamanho={170} /> : <div style={{ height: 260 }} />}
        </div>
      </div>

    </AbsoluteFill>
  );
}
