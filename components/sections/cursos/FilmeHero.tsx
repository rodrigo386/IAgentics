"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "@phosphor-icons/react/dist/ssr";

/**
 * O filme de propaganda da hero da /cursos (2026-10-14): loop mudo de 18 s,
 * 4:5, renderizado no Remotion (remotion/hero-cursos/). Decorativo: o título,
 * o preço e o botão estão escritos ao lado, então o vídeo fica fora da árvore
 * de acessibilidade, e o rótulo do botão de pausa é que diz o que ele é.
 *
 * As regras do AutoplayVideo, sem os controles nativos (num comercial eles
 * seriam ruído): toca só com metade dele na tela; sob reduced motion não
 * toca e fica o pôster, que é o quadro do preço; pausa do visitante vence a
 * rolagem. O botão de pausa existe por causa da WCAG 2.2.2 (movimento com
 * mais de 5 s precisa de como parar).
 */
export function FilmeHero({
  src,
  poster,
  rotulos,
}: {
  src: string;
  poster: string;
  rotulos: { pausar: string; continuar: string };
}) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const pausadoPeloVisitante = useRef(false);
  const [tocando, setTocando] = useState(false);
  const [semMovimento, setSemMovimento] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setSemMovimento(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (!pausadoPeloVisitante.current) void video.play().catch(() => {});
        } else video.pause();
      },
      { threshold: 0.5 },
    );
    io.observe(video);
    const tocou = () => setTocando(true);
    const parou = () => setTocando(false);
    video.addEventListener("play", tocou);
    video.addEventListener("pause", parou);
    return () => {
      io.disconnect();
      video.removeEventListener("play", tocou);
      video.removeEventListener("pause", parou);
    };
  }, [src]);

  const alternar = () => {
    const video = ref.current;
    if (!video) return;
    if (video.paused) {
      pausadoPeloVisitante.current = false;
      void video.play().catch(() => {});
    } else {
      pausadoPeloVisitante.current = true;
      video.pause();
    }
  };

  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-[520px] overflow-hidden bg-brand-paper">
      <video
        ref={ref}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        className="size-full object-cover"
      />
      {semMovimento ? null : (
        <button
          type="button"
          onClick={alternar}
          aria-label={tocando ? rotulos.pausar : rotulos.continuar}
          className="absolute right-3 bottom-3 grid size-9 place-items-center rounded-control border border-line-strong bg-bg/80 text-fg backdrop-blur transition-colors hover:border-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text"
        >
          {tocando ? <Pause size={14} weight="fill" aria-hidden="true" /> : <Play size={14} weight="fill" aria-hidden="true" />}
        </button>
      )}
    </div>
  );
}
