import {
  AbsoluteFill,
  cancelRender,
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as carregarMono } from "@remotion/google-fonts/JetBrainsMono";
import { Logo } from "@/components/ui/Logo";

/**
 * Fundo em vídeo do banner de boas-vindas do painel (/app). Esta composição
 * produz SÓ a camada de fundo — eyebrow, título e parágrafo continuam em
 * HTML por cima (app/app/page.tsx), porque copy centralizada e a11y (texto
 * selecionável, leitor de tela, tradução futura) pedem elemento real, não
 * pixel de vídeo. O gradiente CSS que já existe em .banner-boasvindas
 * (globals.css) é o resting state/fallback: sem JS e sem vídeo o banner
 * continua íntegro, regra da casa.
 *
 * LOOP PERFEITO, NÃO APROXIMADO. O <video loop> do painel corta do último
 * frame renderizado (299) direto para o primeiro (0), e esse corte precisa
 * ser invisível. A técnica: toda posição aqui é uma função periódica —
 * seno com argumento `2π · k · frame / durationInFrames`, k inteiro. Com k
 * inteiro, sin(2π·k·300/300) = sin(2π·k) = sin(0): o estado matemático do
 * frame 300 (que nunca é renderizado, mas é para onde o loop volta) é
 * IDÊNTICO ao do frame 0. Frequências diferentes por camada (k=1,2,3) dão
 * movimento orgânico sem quebrar o fechamento.
 *
 * POR ISSO NÃO HÁ ENTRADA. Uma entrada (fade de opacidade, spring) parte de
 * um estado diferente do estado de chegada — é a definição de não-periódico
 * — e reintroduziria o corte que o loop existe para esconder. A entrada do
 * BLOCO inteiro (banner-entrada, globals.css) já é CSS no site; aqui dentro
 * tudo já nasce em regime periódico, no frame 0 tanto quanto no frame 299.
 */

const mono = carregarMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin", "latin-ext"],
});

const espera = delayRender("Carregando JetBrains Mono (banner-boasvindas)");
mono
  .waitUntilDone()
  .then(() => continueRender(espera))
  .catch((e) => cancelRender(e));

export type PropsBannerBoasVindas = {
  /** plataforma.nome ("IAgentics Academy"), passado via Root.tsx — nunca
   *  digitado aqui. O wordmark ao lado do logo é o sufixo depois do
   *  primeiro espaço ("Academy"), derivado por .split, não escrito à mão:
   *  se o nome da marca mudar, o vídeo acompanha na mesma edição. */
  nomePlataforma: string;
};

/** Um blob = um círculo grande, translúcido e desfocado, que deriva em
 *  paralaxe: posição-base (%) + amplitude (%) · onda periódica própria.
 *  `k` é o número de ciclos completos ao longo do loop de 10s — inteiro,
 *  para o loop fechar (ver nota de topo). Fases diferentes em X e Y fazem
 *  cada blob descrever uma pequena elipse em vez de andar em linha reta. */
type Blob = {
  top: number;
  left: number;
  size: number;
  cor: string;
  opacidade: number;
  blur: number;
  ampX: number;
  ampY: number;
  k: number;
  fase: number;
};

/* Metade esquerda mais calma (é onde o texto HTML do banner real vive):
   dois blobs pequenos e baixa opacidade. Metade direita, onde mora o logo,
   pode respirar mais — três blobs maiores. Cinco ao todo, dentro da faixa
   pedida (3-5). Cores tiradas direto da rampa da marca. */
const BLOBS: Blob[] = [
  { top: 24, left: 12, size: 460, cor: "var(--brand-periwinkle)", opacidade: 0.14, blur: 130, ampX: 2.5, ampY: 2, k: 1, fase: 0 },
  { top: 78, left: 20, size: 520, cor: "var(--brand-violet)", opacidade: 0.12, blur: 150, ampX: 2, ampY: 2.5, k: 2, fase: Math.PI / 3 },
  { top: 30, left: 80, size: 620, cor: "var(--brand-blue)", opacidade: 0.26, blur: 150, ampX: 3, ampY: 2.5, k: 1, fase: Math.PI / 2 },
  { top: 72, left: 90, size: 500, cor: "var(--brand-indigo)", opacidade: 0.24, blur: 130, ampX: 2.5, ampY: 3, k: 3, fase: Math.PI },
  { top: 50, left: 62, size: 380, cor: "var(--brand-periwinkle)", opacidade: 0.16, blur: 110, ampX: 2, ampY: 2, k: 2, fase: (3 * Math.PI) / 4 },
];

export function BannerBoasVindas({ nomePlataforma }: PropsBannerBoasVindas) {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  /* onda(k, fase): -1..1, período = durationInFrames / k. k inteiro fecha o
     loop (ver nota de topo do arquivo). */
  const onda = (k: number, fase = 0) =>
    Math.sin((2 * Math.PI * k * frame) / durationInFrames + fase);

  // Rampa da marca correndo em paralaxe elíptico lento — um ciclo completo
  // por loop (k=1), X e Y defasados 90° para não andar em linha reta.
  const bgX = 50 + 50 * onda(1);
  const bgY = 50 + 22 * onda(1, Math.PI / 2);

  // Flutuação quase imperceptível do bloco logo+wordmark: poucos pixels,
  // dois ciclos ao longo dos 10s.
  const floatY = height * 0.012 * onda(2, Math.PI / 5);

  const sufixo = nomePlataforma.split(" ").slice(1).join(" ");

  const logoLargura = width * 0.15;

  return (
    <AbsoluteFill
      style={{
        ["--font-jetbrains-mono" as string]: mono.fontFamily,
        overflow: "hidden",
        background:
          "linear-gradient(115deg, var(--brand-violet), var(--brand-indigo), var(--brand-periwinkle), var(--brand-blue), var(--brand-violet))",
        backgroundSize: "320% 320%",
        backgroundPosition: `${bgX}% ${bgY}%`,
      }}
    >
      {BLOBS.map((b, i) => {
        const left = b.left + b.ampX * onda(b.k, b.fase);
        const top = b.top + b.ampY * onda(b.k, b.fase + Math.PI / 2);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${left}%`,
              top: `${top}%`,
              width: b.size,
              height: b.size,
              transform: "translate(-50%, -50%)",
              borderRadius: "9999px",
              background: `radial-gradient(circle, ${b.cor}, transparent 70%)`,
              opacity: b.opacidade,
              filter: `blur(${b.blur}px)`,
            }}
          />
        );
      })}

      {/* Logo + wordmark à direita: metade esquerda do quadro fica livre
          para o texto HTML do banner real, que se sobrepõe por cima do
          vídeo na página. */}
      <div
        style={{
          position: "absolute",
          right: width * 0.08,
          top: "50%",
          transform: `translate(0, calc(-50% + ${floatY}px))`,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: height * 0.028,
        }}
      >
        <div className="text-brand-paper" style={{ width: logoLargura }}>
          <Logo />
        </div>
        <span
          className="font-mono uppercase text-brand-paper"
          style={{
            fontSize: width * 0.0095,
            letterSpacing: "0.24em",
            opacity: 0.78,
          }}
        >
          {sufixo}
        </span>
      </div>
    </AbsoluteFill>
  );
}
