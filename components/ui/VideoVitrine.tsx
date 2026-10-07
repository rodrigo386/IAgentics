"use client";

import { useEffect, useRef, useState } from "react";
import Image, { type StaticImageData } from "next/image";
import { Pause, Play, SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";

/**
 * Vídeo de produto que toca mudo, em loop, quando entra na tela (2026-10-06,
 * pedido do Rodrigo para os vídeos do Nexo, com o prompt-motion.com como base
 * do movimento).
 *
 * O que veio de lá, em camadas:
 *   1. a capa nasce desfocada (placeholder do next/image) e assenta nítida;
 *   2. o vídeo fica transparente por cima dela e só aparece, num fade de
 *      300ms, quando o PRIMEIRO QUADRO está pintado (evento `playing`) — nunca
 *      um retângulo preto entre a capa e o vídeo;
 *   3. sem controles nativos: dois botões discretos, com o ícone trocando em
 *      crossfade de 150ms.
 *
 * As regras do AutoplayVideo continuam valendo, pelos mesmos motivos: mudo
 * sempre (autoplay com som o navegador recusa), só enquanto visível, nada sob
 * prefers-reduced-motion (fica a capa e o botão de play), e pausa manual
 * vence o scroll.
 *
 * Os vídeos do Nexo são NARRADOS. Mudo em loop foi escolha do Rodrigo; o botão
 * de som existe para quem quer a narração, e ele volta o vídeo ao começo —
 * ligar o som no segundo 40 é ouvir uma frase pela metade.
 */
export function VideoVitrine({
  src,
  poster,
  label,
  textos,
  className = "",
}: {
  src: string;
  poster: StaticImageData;
  /** Descrição do vídeo para leitor de tela. */
  label: string;
  textos: { pausar: string; continuar: string; ligarSom: string; desligarSom: string };
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const pausaDoVisitante = useRef(false);
  const pausaNossa = useRef(false);
  const [visivel, setVisivel] = useState(false);
  const [tocando, setTocando] = useState(false);
  const [mudo, setMudo] = useState(true);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const io = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          if (pausaDoVisitante.current) return;
          void video.play().catch(() => {});
        } else if (!video.paused) {
          pausaNossa.current = true;
          video.pause();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(video);
    return () => io.disconnect();
  }, []);

  function alternarPausa() {
    const video = ref.current;
    if (!video) return;
    if (video.paused) {
      pausaDoVisitante.current = false;
      void video.play().catch(() => {});
    } else {
      pausaDoVisitante.current = true;
      video.pause();
    }
  }

  function alternarSom() {
    const video = ref.current;
    if (!video) return;
    if (video.muted) {
      video.currentTime = 0;
      video.muted = false;
      pausaDoVisitante.current = false;
      void video.play().catch(() => {});
    } else {
      video.muted = true;
    }
  }

  const botao =
    "relative inline-flex size-10 items-center justify-center rounded-full bg-brand-ink/70 text-brand-paper ring-1 ring-brand-paper/15 backdrop-blur-sm transition-colors duration-150 hover:bg-brand-ink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
  const icone = "absolute transition-opacity duration-150 motion-reduce:transition-none";

  return (
    <div className={`group relative overflow-hidden bg-brand-ink ring-1 ring-line transition-[box-shadow] duration-200 hover:ring-line-strong ${className}`}>
      <Image src={poster} alt="" fill placeholder="blur" sizes="(min-width: 1024px) 1100px, 100vw" className="object-cover" />

      <video
        ref={ref}
        className={`absolute inset-0 size-full object-cover transition-opacity duration-300 ease-out motion-reduce:transition-none ${visivel ? "opacity-100" : "opacity-0"}`}
        src={src}
        muted
        loop
        playsInline
        preload="metadata"
        disablePictureInPicture
        aria-label={label}
        onPlaying={() => {
          setVisivel(true);
          setTocando(true);
        }}
        onPause={() => {
          // Pausa que não marcamos antes é do visitante (botão ou sistema).
          if (!pausaNossa.current) pausaDoVisitante.current = true;
          pausaNossa.current = false;
          setTocando(false);
        }}
        onVolumeChange={(e) => setMudo(e.currentTarget.muted)}
      />

      <div className="absolute right-3 top-3 flex gap-2 sm:right-4 sm:top-4">
        <button type="button" onClick={alternarSom} aria-pressed={!mudo} aria-label={mudo ? textos.ligarSom : textos.desligarSom} className={botao}>
          <SpeakerSlash size={18} weight="fill" aria-hidden="true" className={`${icone} ${mudo ? "opacity-100" : "opacity-0"}`} />
          <SpeakerHigh size={18} weight="fill" aria-hidden="true" className={`${icone} ${mudo ? "opacity-0" : "opacity-100"}`} />
        </button>
        <button type="button" onClick={alternarPausa} aria-label={tocando ? textos.pausar : textos.continuar} className={botao}>
          <Pause size={18} weight="fill" aria-hidden="true" className={`${icone} ${tocando ? "opacity-100" : "opacity-0"}`} />
          <Play size={18} weight="fill" aria-hidden="true" className={`${icone} ${tocando ? "opacity-0" : "opacity-100"}`} />
        </button>
      </div>
    </div>
  );
}
