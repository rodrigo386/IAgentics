import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Fundo em vídeo do banner de boas-vindas do painel (/app). Esta composição
 * é SÓ motion abstrato — rampa da marca + blobs translúcidos. Nenhum texto,
 * nenhum logo: os dois moram em HTML por cima (app/app/page.tsx), decisão
 * do round 2 do review.
 *
 * POR QUE O LOGO SAIU DAQUI. A section real (1920×640, razão 3:1) some
 * atrás de um crop MUITO mais estreito em telas de celular — a section vira
 * quase quadrada, e `object-cover` escala o vídeo pela ALTURA pra cobrir o
 * contêiner, sobrando só uma faixa central estreita do frame (medida real
 * em browser: ~33% da largura em 375px, não os ~40-60% estimados na
 * primeira rodada). Não existe posição horizontal fixa dentro do frame que
 * sobreviva a esse crop em toda a faixa de viewports do painel - até o
 * centro exato (50%) do frame fica no limite em telas ainda mais estreitas
 * que 375px. Um elemento de vídeo não pode reagir ao viewport do
 * navegador; um elemento HTML pode. Por isso o logo + wordmark "Academy"
 * viraram overlay HTML dentro de `.banner-boasvindas` (ver
 * `app/app/page.tsx`), onde um `flex` normal os deixa 100% visíveis em
 * qualquer largura, com layout de verdade (canto direito no desktop,
 * abaixo do texto no mobile) em vez de uma aposta em coordenadas fixas
 * sobre um recorte imprevisível. O gradiente + blobs abaixo não têm esse
 * problema: são fundo ambiente, não precisam estar 100% dentro do crop
 * para cumprir o papel.
 *
 * LOOP PERFEITO, NÃO APROXIMADO. O <video loop> do painel corta do último
 * frame renderizado (299) direto para o primeiro (0), e esse corte precisa
 * ser invisível. A técnica: toda posição aqui é `sin(2π · k · frame /
 * durationInFrames + fase)`, k inteiro. O que garante a costura sem emenda
 * NÃO é "frame 300 == frame 0" isolado — é o DELTA ANGULAR CONSTANTE entre
 * frames consecutivos: Δθ = 2π·k/durationInFrames é o mesmo passo entre
 * QUALQUER par frame→frame+1, inclusive entre 299 e 0 (que, na função
 * contínua, é o "frame 300" da mesma senoide - o loop só reinicia a
 * contagem, a curva não sabe disso). Como esse passo nunca muda de
 * tamanho, não há aceleração nem salto no corte: a velocidade do
 * movimento no frame 299→0 é idêntica à de 0→1. k ser inteiro é o que
 * faz esse "frame 300" cair exatamente na mesma fase (mod 2π) do frame 0
 * - sem isso o valor bateria, mas o passo até lá teria um resto fora do
 * padrão dos demais, e o corte se veria. Frequências diferentes por
 * camada (k=1,2,3) dão movimento orgânico sem quebrar nenhuma dessas duas
 * condições.
 *
 * POR ISSO NÃO HÁ ENTRADA. Uma entrada (fade de opacidade, spring) parte de
 * um estado diferente do estado de chegada — é a definição de não-periódico
 * — e reintroduziria o corte que o loop existe para esconder. A entrada do
 * BLOCO inteiro (banner-entrada, globals.css) já é CSS no site; aqui dentro
 * tudo já nasce em regime periódico, no frame 0 tanto quanto no frame 299.
 */

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
   dois blobs pequenos e baixa opacidade. Metade direita mais rica — sem
   logo pra acomodar mais, o espaço abre pro canto (até ~92%), então os
   três blobs da direita ficam mais espalhados do que nas rodadas
   anteriores em vez de se agruparem num ponto fixo. Cinco ao todo, dentro
   da faixa pedida (3-5). Cores tiradas direto da rampa da marca. */
const BLOBS: Blob[] = [
  { top: 24, left: 12, size: 460, cor: "var(--brand-periwinkle)", opacidade: 0.14, blur: 130, ampX: 2.5, ampY: 2, k: 1, fase: 0 },
  { top: 78, left: 20, size: 520, cor: "var(--brand-violet)", opacidade: 0.12, blur: 150, ampX: 2, ampY: 2.5, k: 2, fase: Math.PI / 3 },
  { top: 30, left: 64, size: 620, cor: "var(--brand-blue)", opacidade: 0.26, blur: 150, ampX: 3, ampY: 2.5, k: 1, fase: Math.PI / 2 },
  { top: 74, left: 80, size: 520, cor: "var(--brand-indigo)", opacidade: 0.24, blur: 135, ampX: 2.5, ampY: 3, k: 3, fase: Math.PI },
  { top: 48, left: 92, size: 420, cor: "var(--brand-periwinkle)", opacidade: 0.18, blur: 120, ampX: 2, ampY: 2, k: 2, fase: (3 * Math.PI) / 4 },
];

export function BannerBoasVindas() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  /* onda(k, fase): -1..1, período = durationInFrames / k. k inteiro fecha o
     loop (ver nota de topo do arquivo). */
  const onda = (k: number, fase = 0) =>
    Math.sin((2 * Math.PI * k * frame) / durationInFrames + fase);

  // Rampa da marca correndo em paralaxe elíptico lento — um ciclo completo
  // por loop (k=1), X e Y defasados 90° para não andar em linha reta.
  const bgX = 50 + 50 * onda(1);
  const bgY = 50 + 22 * onda(1, Math.PI / 2);

  return (
    <AbsoluteFill
      style={{
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
    </AbsoluteFill>
  );
}
