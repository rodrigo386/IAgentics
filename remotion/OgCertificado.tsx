import {
  AbsoluteFill,
  cancelRender,
  continueRender,
  delayRender,
} from "remotion";
import { loadFont as carregarGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as carregarMono } from "@remotion/google-fonts/JetBrainsMono";
import { Logo } from "@/components/ui/Logo";
import { plataforma } from "@/lib/content-plataforma";

/**
 * Still 1200×630 para OG da página de certificado. Estático de propósito
 * (durationInFrames: 1) — é imagem, não vídeo. Rampa + véu iguais ao banner
 * de boas-vindas do painel para a identidade fechar.
 *
 * LOGO E FONTE NÃO VÊM DE BannerBoasVindas.tsx. Aquela composição é só
 * motion abstrato (gradiente + blobs) — não importa `Logo`, não carrega
 * fonte nenhuma; o logo de lá virou overlay HTML em app/app/page.tsx
 * justamente porque um <video> não reage ao crop de object-cover (ver nota
 * de topo de BannerBoasVindas.tsx). Quem de fato prova o mecanismo dentro
 * do Remotion é AberturaMarca.tsx: fontes do site entram via
 * @remotion/google-fonts (next/font não existe fora do Next) seguradas por
 * delayRender/continueRender até carregarem, e o logo é o mesmo PNG-mask
 * (`.brand-lockup`, url("/iagentics-lockup.png")) que o componente `Logo`
 * usa no site — o roots do webpack em remotion.config.ts (PONTE 3) resolve
 * essa URL absoluta contra public/, então o componente `Logo` funciona aqui
 * sem reescrita. Este arquivo copia esse mecanismo comprovado.
 */

const grotesk = carregarGrotesk("normal", {
  weights: ["400", "500"],
  subsets: ["latin", "latin-ext"],
});
const mono = carregarMono("normal", {
  weights: ["400"],
  subsets: ["latin", "latin-ext"],
});

/* Segura o único frame do still até as duas famílias estarem prontas — sem
   isto a imagem sai na fonte de sistema em vez de Space Grotesk/JetBrains
   Mono. */
const espera = delayRender(
  "Carregando Space Grotesk e JetBrains Mono (OG certificado)",
);
Promise.all([grotesk.waitUntilDone(), mono.waitUntilDone()])
  .then(() => continueRender(espera))
  .catch((e) => cancelRender(e));

export function OgCertificado() {
  return (
    <AbsoluteFill
      className="font-sans"
      style={{
        /* Mesma ponte de AberturaMarca.tsx: o @theme do site resolve
           --font-sans/--font-mono a partir destas duas variáveis, que no
           site vêm do next/font e aqui vêm do Google Fonts carregado acima. */
        ["--font-space-grotesk" as string]: grotesk.fontFamily,
        ["--font-jetbrains-mono" as string]: mono.fontFamily,
        background:
          "linear-gradient(115deg, var(--brand-violet), var(--brand-indigo), var(--brand-periwinkle), var(--brand-blue))",
        justifyContent: "center",
        padding: 96,
      }}
    >
      <AbsoluteFill style={{ background: "rgb(19 23 35 / 0.4)" }} />
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: 32,
          color: "var(--brand-paper)",
        }}
      >
        <div className="text-brand-paper" style={{ width: 320 }}>
          <Logo />
        </div>
        <div
          className="font-mono"
          style={{
            textTransform: "uppercase",
            letterSpacing: "0.24em",
            fontSize: 22,
            opacity: 0.9,
          }}
        >
          {plataforma.nome}
        </div>
        <div
          style={{
            fontSize: 76,
            fontWeight: 500,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
          }}
        >
          {plataforma.certificado.titulo}
        </div>
      </div>
    </AbsoluteFill>
  );
}
