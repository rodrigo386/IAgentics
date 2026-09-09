"use client";

import { useEffect, useRef } from "react";

/**
 * Um <video> comum que nasce numa velocidade escolhida.
 *
 * EXISTE SÓ POR CAUSA DO `playbackRate`, que não tem atributo em HTML: é
 * propriedade do elemento, então precisa de uma linha de JavaScript. Este
 * componente é o menor recorte possível para essa linha — recebe strings e um
 * número, e por isso o `lib/content.ts` inteiro continua do lado do servidor.
 * Marcar a seção toda como client arrastaria o arquivo de conteúdo junto para o
 * bundle.
 *
 * NÃO É AutoplayVideo, e a diferença importa: aquele existe para vídeo mudo de
 * fundo, que começa sozinho. Este tem alguém falando, então começa parado, com
 * controles.
 *
 * A velocidade é aplicada na montagem e a cada `loadedmetadata` — que, com
 * `preload="none"`, só acontece quando alguém aperta play. Depois disso ninguém
 * mexe mais: se o visitante trocar a velocidade no menu do player, a escolha
 * dele fica. Sem JavaScript o vídeo toca a 1×, que é um degradar honesto.
 */
export function VideoComVelocidade({
  src,
  poster,
  label,
  legendas,
  velocidade = 1,
  className = "",
}: {
  src: string;
  poster: string;
  label: string;
  legendas?: string;
  velocidade?: number;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || velocidade === 1) return;

    const aplicar = () => {
      video.playbackRate = velocidade;
    };
    aplicar();
    video.addEventListener("loadedmetadata", aplicar);
    return () => video.removeEventListener("loadedmetadata", aplicar);
  }, [velocidade]);

  return (
    <video ref={ref} className={className} src={src} poster={poster} controls preload="none" playsInline>
      {legendas ? (
        <track kind="captions" src={legendas} srcLang="pt-BR" label="Português" default />
      ) : null}
      {label}
    </video>
  );
}
