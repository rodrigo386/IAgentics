import { Composition } from "remotion";
import { site } from "@/lib/content";
import { AberturaMarca, type PropsAbertura } from "./AberturaMarca";
import { BannerBoasVindas } from "./BannerBoasVindas";
import { FilmeSpendNf } from "./nexo-nf/FilmeSpendNf";
import { FilmeLogistico } from "./nexo-logistico/FilmeLogistico";
import { FilmeVarejo } from "./nexo-varejo/FilmeVarejo";
import { FilmeOrcamento } from "./nexo-orcamento/FilmeOrcamento";
import { DURACAO as DURACAO_NF } from "./nexo-kit/cues";
import "./style.css";

/**
 * Catálogo de composições. Tudo que aparece na barra lateral do estúdio nasce aqui.
 *
 * A tagline e o domínio vêm de lib/content.ts, o mesmo arquivo que alimenta o site.
 * Isso é de propósito: a trava de copy da casa diz que toda string visível mora lá,
 * e um vídeo com a tagline digitada à mão sairia do ar junto com a primeira revisão
 * de texto sem ninguém perceber.
 *
 * As duas composições são o MESMO componente em dois formatos. O componente lê
 * width/height por useVideoConfig e se reorganiza, então não existe uma versão
 * "vertical" para manter em paralelo.
 */
export function RemotionRoot() {
  return (
    <>
      <Composition
        id="abertura-marca"
        component={AberturaMarca}
        durationInFrames={120}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={
          { tagline: site.tagline, dominio: site.domain } satisfies PropsAbertura
        }
      />

      <Composition
        id="abertura-marca-vertical"
        component={AberturaMarca}
        durationInFrames={120}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={
          { tagline: site.tagline, dominio: site.domain } satisfies PropsAbertura
        }
      />

      {/* Fundo em vídeo do banner de boas-vindas do painel (/app). 10s a
          30fps, loop perfeito (ver nota em BannerBoasVindas.tsx) - o
          <video loop> na página nunca mostra um corte. Só motion abstrato
          (rampa da marca + blobs), sem props: logo e wordmark "Academy"
          são overlay HTML em app/app/page.tsx, não pixel de vídeo - um
          vídeo não consegue reagir ao crop de object-cover em cada
          viewport, um elemento HTML consegue (ver nota de topo em
          BannerBoasVindas.tsx). */}
      <Composition
        id="banner-boasvindas"
        component={BannerBoasVindas}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={640}
      />

      {/* Filme do módulo Spend via NF da /nexo (2026-10-06): loop mudo de 22 s
          a 60 fps, feito com a skill product-film. Ver remotion/nexo-nf/. */}
      <Composition
        id="nexo-spend-nf"
        component={FilmeSpendNf}
        durationInFrames={Math.round(DURACAO_NF * 60)}
        fps={60}
        width={1920}
        height={1080}
      />

      {/* Os irmãos do Spend via NF (2026-10-07): mesmo ritmo e mesmo kit
          (remotion/nexo-kit). */}
      <Composition id="nexo-logistico" component={FilmeLogistico} durationInFrames={Math.round(DURACAO_NF * 60)} fps={60} width={1920} height={1080} />
      <Composition id="nexo-varejo" component={FilmeVarejo} durationInFrames={Math.round(DURACAO_NF * 60)} fps={60} width={1920} height={1080} />
      <Composition id="nexo-orcamento" component={FilmeOrcamento} durationInFrames={Math.round(DURACAO_NF * 60)} fps={60} width={1920} height={1080} />
    </>
  );
}
