import {
  AbsoluteFill,
  Easing,
  cancelRender,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as carregarGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as carregarMono } from "@remotion/google-fonts/JetBrainsMono";

/**
 * Abertura de marca IAgentics. Serve de cabeça para qualquer peça em vídeo.
 *
 * MOTION AQUI É O AVESSO DA REGRA DO SITE. No site, toda animação de entrada é CSS
 * com fill backwards, justamente para o estado de repouso existir sem JavaScript. No
 * Remotion isso seria um defeito: o renderizador não roda o vídeo, ele SALTA de
 * quadro em quadro e fotografa cada um. Uma animação de CSS não sabe em que quadro
 * está, então sairia congelada no primeiro estado em todos os 120 frames. Aqui toda
 * posição é função de useCurrentFrame().
 *
 * COMPOSIÇÃO. Bloco alinhado à esquerda, não centralizado: a varredura corre da
 * esquerda para a direita e revela o lockup por onde passa, então o texto ancorado
 * na mesma margem faz a leitura acompanhar o movimento. Um bloco centralizado
 * brigaria com a direção da varredura.
 *
 * CORES: O QUADRO É MODO ESCURO. O fundo é tinta, então a raiz leva a classe `dark`
 * e todo o sistema de tokens do site resolve sozinho - bg, fg, fg-muted e accent-text
 * caem nos valores já medidos para fundo escuro. Não há uma paleta paralela de vídeo.
 *
 * A régua saiu do violeta. Violeta é PREENCHIMENTO na trava da casa e dá 2,54:1 sobre
 * tinta; numa barra de 3px isso apareceu embaçado no still 110. Ela agora usa
 * --accent-text, que no escuro é o azul da marca a 6,09:1. O violeta continua no
 * lugar certo: a faixa que varre o quadro, onde ele é área, não linha.
 */

/* As fontes do site vêm do next/font, que só existe dentro do Next. No Remotion elas
   entram pelo @remotion/google-fonts - mesmas duas famílias, mesma tipografia. */
const grotesk = carregarGrotesk("normal", {
  weights: ["400", "500"],
  subsets: ["latin", "latin-ext"],
});
const mono = carregarMono("normal", {
  weights: ["400"],
  subsets: ["latin", "latin-ext"],
});

/* Segura o primeiro quadro até as duas famílias estarem prontas. Sem isto o frame 0
   sai na fonte de sistema e o vídeo abre com um salto de tipografia. */
const espera = delayRender("Carregando Space Grotesk e JetBrains Mono");
Promise.all([grotesk.waitUntilDone(), mono.waitUntilDone()])
  .then(() => continueRender(espera))
  .catch((e) => cancelRender(e));

/**
 * DUAS CURVAS, E A DIFERENÇA IMPORTA.
 *
 * CURVA_ENTRADA é a mesma bezier(0.16, 1, 0.3, 1) das entradas do site: freia forte,
 * ótima para um elemento que chega e para.
 *
 * A varredura NÃO usa curva nenhuma, e isso é decisão, não esquecimento. Duas coisas
 * medidas levaram até aqui:
 *
 * 1. Com a curva do site, a faixa atravessava os 1920px e a marca aparecia inteira
 *    antes do frame 10 - os stills 14 e 24 saíram byte a byte idênticos, o quadro já
 *    estava parado.
 * 2. Com uma bezier in-out, as duas bordas andam a velocidades diferentes no meio do
 *    percurso e a faixa incha: no frame 16 ela cobria a tela toda e virava um flash
 *    violeta, não uma faixa.
 *
 * Em velocidade constante as duas bordas mantêm a distância que têm, então a faixa
 * conserva 40% da largura do quadro do começo ao fim. Borda dura em velocidade
 * constante também é o que combina com um sistema de raio 0.
 */
const CURVA_ENTRADA = Easing.bezier(0.16, 1, 0.3, 1);

/** Proporção nativa do arquivo iagentics-lockup.png, 1135x267. Não redesenhar. */
const PROPORCAO_LOCKUP = 267 / 1135;

export type PropsAbertura = {
  tagline: string;
  dominio: string;
};

export function AberturaMarca({ tagline, dominio }: PropsAbertura) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const vertical = height > width;
  const margem = width * 0.1;
  const larguraMarca = width * (vertical ? 0.68 : 0.4);
  const alturaMarca = larguraMarca * PROPORCAO_LOCKUP;

  /* A faixa violeta é uma banda entre duas bordas que atravessam o quadro. A borda
     de frente sai na frente e a de trás persegue, então a banda tem espessura no
     meio do percurso e some ao sair pela direita. 1.35 e não 1: a banda precisa
     terminar de sair, não apenas encostar na borda. */
  const frente = interpolate(frame, [0, 40], [0, 1.45], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tras = interpolate(frame, [11, 51], [0, 1.45], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  /* O lockup aparece por onde a borda de trás já passou. A conta é feita nas
     coordenadas da própria marca, não do quadro: a marca começa em `margem`, então
     a fração revelada é o quanto da borda já ultrapassou esse ponto. */
  const revelado = interpolate(
    tras * width,
    [margem, margem + larguraMarca],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const regua = interpolate(frame, [44, 66], [0, 1], {
    easing: CURVA_ENTRADA,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const entrada = (inicio: number) => ({
    opacity: interpolate(frame, [inicio, inicio + 14], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    translateY: interpolate(frame, [inicio, inicio + 18], [width * 0.012, 0], {
      easing: CURVA_ENTRADA,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  });

  const legenda = entrada(52);
  const rodape = entrada(74);

  return (
    <AbsoluteFill
      className="dark bg-bg font-sans"
      style={{
        /* O @theme do site resolve --font-sans a partir desta variável, que no site
           é preenchida pelo next/font. Aqui ela recebe a família do Google Fonts, e
           então font-sans e font-mono funcionam iguais aos do site. */
        ["--font-space-grotesk" as string]: grotesk.fontFamily,
        ["--font-jetbrains-mono" as string]: mono.fontFamily,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: margem,
          top: "50%",
          transform: "translateY(-50%)",
          width: width - margem * 2,
        }}
      >
        {/* O lockup é máscara, não <img>: assim ele assume a cor do texto, como no
            site. currentColor vem de text-brand-paper no elemento. */}
        <div
          className="text-fg"
          style={{
            width: larguraMarca,
            height: alturaMarca,
            backgroundColor: "currentColor",
            WebkitMaskImage: `url(${staticFile("iagentics-lockup.png")})`,
            maskImage: `url(${staticFile("iagentics-lockup.png")})`,
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "left center",
            maskPosition: "left center",
            clipPath: `inset(0 ${(1 - revelado) * 100}% 0 0)`,
          }}
        />

        <div
          className="bg-accent-text"
          style={{
            marginTop: height * 0.035,
            width: larguraMarca,
            height: Math.max(2, Math.round(width * 0.0016)),
            transform: `scaleX(${regua})`,
            transformOrigin: "left center",
          }}
        />

        <p
          className="font-mono uppercase text-fg-muted"
          style={{
            marginTop: height * 0.032,
            maxWidth: larguraMarca * 1.12,
            fontSize: width * (vertical ? 0.026 : 0.0135),
            lineHeight: 1.6,
            letterSpacing: "0.16em",
            /* A opacidade aqui é só a entrada. O nível de leitura vem de
               --fg-muted, medido em 5,87:1 sobre tinta - rebaixar o papel na mão
               produziria um contraste que ninguém conferiu. */
            opacity: legenda.opacity,
            transform: `translateY(${legenda.translateY}px)`,
          }}
        >
          {tagline}
        </p>
      </div>

      <p
        className="font-mono text-accent-text"
        style={{
          position: "absolute",
          left: margem,
          bottom: height * 0.09,
          fontSize: width * (vertical ? 0.02 : 0.0105),
          letterSpacing: "0.14em",
          opacity: rodape.opacity,
          transform: `translateY(${rodape.translateY}px)`,
        }}
      >
        {dominio}
      </p>

      {/* A faixa fica por último no DOM, então passa POR CIMA do lockup - é ela que
          faz a revelação parecer um corte, e não um fade. */}
      <div
        className="bg-accent"
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: tras * width,
          width: Math.max(0, (frente - tras) * width),
        }}
      />
    </AbsoluteFill>
  );
}
