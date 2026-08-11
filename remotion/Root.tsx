import { Composition } from "remotion";
import { site } from "@/lib/content";
import { AberturaMarca, type PropsAbertura } from "./AberturaMarca";
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
    </>
  );
}
