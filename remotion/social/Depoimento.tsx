import { AbsoluteFill, Audio, OffthreadVideo, staticFile, useVideoConfig } from "remotion";
import { cursos } from "@/lib/content";
import { aparece, COR, ent, FONTE, LogoAcademy, mix, useT } from "../hero-cursos/base";
import { FechoSocial } from "./comum";
import p154225 from "./depoimentos/15.42.25.json";
import p155025 from "./depoimentos/15.50.25.json";
import p160047 from "./depoimentos/16.00.47.json";
import p161129 from "./depoimentos/16.11.29.json";

/**
 * Os depoimentos do Vinícius sobre o lançamento (gravados por celular em
 * 2026-10-15, Dia dos Professores), no conceito B "moldura da marca"
 * escolhido pelo Rodrigo: o papel dos vídeos de lançamento, o logo da
 * Academy, o tema em cima, o vídeo numa janela, a legenda palavra a palavra
 * embaixo (o feed começa mudo), destaques da marca quando ele diz a frase
 * que os ancora, e o fecho de sempre (preço, marcas, endereço).
 *
 * A janela é menor que a tela de propósito: o original tem 478×850, e em
 * tela cheia ficaria borrado. No 9:16 a legenda termina acima dos ~300 px do
 * pé que o Instagram cobre com a legenda do post e os botões.
 *
 * As palavras e seus tempos vêm do Whisper (modelo small, palavra a palavra),
 * revisadas só no que era erro de transcrição: o nome da marca, "executável",
 * "lá dentro" e "Dia dos Professores". O resto é o que ele disse.
 *
 * Os vídeos e a música NÃO estão em public/ (iriam para o site): ficam em
 * out/publico-depoimentos/, e o bundle destas composições é feito com
 * --public-dir apontando para lá (scripts/depoimentos-social.sh).
 */
type Palavra = { w: string; s: number; e: number };
type Frase = { palavras: Palavra[]; s: number; e: number };

const PALAVRAS: Record<string, Palavra[]> = {
  "15.42.25": p154225,
  "15.50.25": p155025,
  "16.00.47": p160047,
  "16.11.29": p161129,
};

/** Depois da última palavra: respiro, e o fecho com o preço e o endereço. */
const RESPIRO = 0.8;
const FECHO = 4.5;

export function duracaoDepoimento(id: string) {
  return PALAVRAS[id].at(-1)!.e + RESPIRO + FECHO;
}

/** A fala em frases curtas de legenda: quebra na pontuação, numa pausa
 *  longa ou quando a linha passa de ~26 caracteres. */
function frases(palavras: Palavra[]): Frase[] {
  const out: Frase[] = [];
  let atual: Palavra[] = [];
  const fecha = () => {
    if (atual.length) out.push({ palavras: atual, s: atual[0].s, e: atual.at(-1)!.e });
    atual = [];
  };
  palavras.forEach((p, i) => {
    const anterior = atual.at(-1);
    if (anterior && p.s - anterior.e > 0.6) fecha();
    atual.push(p);
    const texto = atual.map((x) => x.w).join(" ");
    const proxima = palavras.at(i + 1);
    if (/[.?!]$/.test(p.w) || (/,$/.test(p.w) && atual.length >= 3) || texto.length > 26 || !proxima) fecha();
  });
  return out;
}

const semPontuacao = (w: string) => w.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();

/** Quando ele diz a âncora (primeira ocorrência), em segundos. */
function quando(palavras: Palavra[], ancora: string) {
  const alvo = ancora.split(" ").map(semPontuacao);
  const i = palavras.findIndex((_, k) => alvo.every((a, j) => semPontuacao(palavras.at(k + j)?.w ?? "") === a));
  return i >= 0 ? palavras.at(i)!.s : null;
}

export type PropsDepoimento = { id: string };

export function Depoimento({ id }: PropsDepoimento) {
  const t = useT();
  const { height: H } = useVideoConfig();
  const v = cursos.depoimentos.videos.find((x) => x.id === id)!;
  const palavras = PALAVRAS[id];
  const lista = frases(palavras);
  const fimFala = palavras.at(-1)!.e;
  const iniFecho = fimFala + RESPIRO;
  const sai = ent(t, iniFecho - 0.4, 0.5);

  const vert = H > 1500;
  const L = vert ? 600 : 470;
  const A = (L * 850) / 478;
  const topoLogo = vert ? 110 : 44;
  const topoTema = vert ? 236 : 140;
  const topoJanela = vert ? 400 : 290;
  const topoLegenda = topoJanela + A + (vert ? 36 : 28);
  const tamLegenda = vert ? 56 : 44;

  const frase = lista.find((f) => t >= f.s - 0.05 && t < Math.max(f.e + 0.25, f.s + 0.6));
  const destaques = v.destaques.flatMap((d) => {
    const s = quando(palavras, d.ancora);
    return s === null ? [] : [{ ...d, s }];
  });

  // Música baixa sob a voz, sobe no fecho, sai nos últimos 0,8 s.
  const fim = duracaoDepoimento(id);
  const volume = (f: number) => {
    const s = f / 30;
    const base = mix(0.09, 0.8, ent(s, iniFecho - 0.3, 0.8));
    return base * Math.min(1, s / 0.6) * Math.min(1, (fim - s) / 0.8);
  };

  return (
    <AbsoluteFill style={{ background: COR.papel, fontFamily: FONTE, color: COR.tinta, overflow: "hidden" }}>
      <Audio src={staticFile("musica/bright-strategy.mp3")} volume={volume} />

      <AbsoluteFill style={{ opacity: 1 - sai }}>
        <div style={{ position: "absolute", top: topoLogo, left: 0, right: 0, display: "flex", justifyContent: "center", ...aparece(t, 0) }}>
          <LogoAcademy largura={vert ? 340 : 260} />
        </div>
        <div
          style={{
            position: "absolute",
            top: topoTema,
            left: 70,
            right: 70,
            textAlign: "center",
            fontSize: vert ? 64 : 50,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            textWrap: "balance",
            ...aparece(t, 0.05),
          }}
        >
          {v.tema}
        </div>

        {/* A janela com o vídeo. */}
        {t < iniFecho + 0.2 ? (
          <div
            style={{
              position: "absolute",
              top: topoJanela,
              left: "50%",
              width: L,
              height: A,
              translate: "-50% 0",
              borderRadius: 36,
              overflow: "hidden",
              background: COR.tinta,
              boxShadow: "0 40px 80px -30px rgba(19,23,35,0.45)",
              scale: `${mix(0.94, 1, ent(t, 0.1, 0.6))}`,
              opacity: ent(t, 0.1, 0.4),
            }}
          >
            <OffthreadVideo src={staticFile(`depoimentos/${id}.mp4`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            {/* Quem fala, nos primeiros segundos. */}
            <div
              style={{
                position: "absolute",
                left: 24,
                bottom: 24,
                padding: vert ? "14px 22px" : "10px 16px",
                borderRadius: 18,
                background: "rgba(248,248,248,0.94)",
                ...aparece(t, 1.0, 6.5, 0.4),
              }}
            >
              <div style={{ fontSize: vert ? 32 : 24, fontWeight: 700, letterSpacing: "-0.02em" }}>{cursos.depoimentos.nome}</div>
              <div style={{ fontSize: vert ? 24 : 18, fontWeight: 500, color: COR.violeta }}>{cursos.depoimentos.cargo}</div>
            </div>
          </div>
        ) : null}

        {/* Destaques da marca, sobre o alto da janela, quando ele diz a âncora. */}
        {destaques.map((d) => (
          <div
            key={d.texto}
            style={{
              position: "absolute",
              top: topoJanela + (vert ? 36 : 24),
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              pointerEvents: "none",
              ...aparece(t, d.s, d.s + 3.4, 0.3),
            }}
          >
            <div
              style={{
                padding: vert ? "16px 30px" : "12px 22px",
                borderRadius: 999,
                background: COR.violeta,
                color: COR.papel,
                fontSize: vert ? 40 : 30,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                boxShadow: "0 20px 40px -18px rgba(118,7,232,0.6)",
                scale: `${mix(0.85, 1, ent(t, d.s, 0.35))}`,
              }}
            >
              {d.texto}
            </div>
          </div>
        ))}

        {/* Legenda: a frase da vez, a palavra falada em violeta. */}
        {frase ? (
          <div
            key={frase.s}
            style={{
              position: "absolute",
              top: topoLegenda,
              left: 60,
              right: 60,
              textAlign: "center",
              fontSize: tamLegenda,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.12,
              textWrap: "balance",
              opacity: ent(t, frase.s - 0.05, 0.12),
            }}
          >
            {frase.palavras.map((p, i) => {
              const falando = t >= p.s && t < p.e + 0.08;
              const dita = t >= p.s;
              return (
                <span key={i} style={{ color: falando ? COR.violeta : COR.tinta, opacity: dita ? 1 : 0.35 }}>
                  {p.w}
                  {i < frase.palavras.length - 1 ? " " : ""}
                </span>
              );
            })}
          </div>
        ) : null}
      </AbsoluteFill>

      <FechoSocial t={t} ini={iniFecho} />
    </AbsoluteFill>
  );
}
