"use client";

import { useEffect, useRef } from "react";

/**
 * A video that starts itself when it comes into view, and only then.
 *
 * Four rules are baked in, each for a concrete reason:
 *
 * 1. MUTED, ALWAYS. Every browser blocks autoplay with sound. This is not a preference
 *    we could override - an unmuted autoplay simply never starts. `controls` stays on
 *    so a viewer who wants the audio can unmute.
 *
 * 2. ONLY WHILE VISIBLE. An IntersectionObserver starts it on entry and pauses it on
 *    exit. Without that, a 29s clip loops forever behind three screens of scroll,
 *    burning battery on a phone for something nobody is looking at.
 *
 * 3. NOTHING UNDER prefers-reduced-motion. Auto-playing video is motion, and the whole
 *    site treats that setting as binding. There the element is left as an ordinary
 *    player - poster, controls, press play if you want it.
 *
 * 4. A MANUAL PAUSE WINS. If the viewer pauses, scrolling away and back does not
 *    restart it. Programmatic pauses are marked before they happen so the pause
 *    handler can tell its own work apart from the viewer's.
 *
 * The `autoPlay` attribute is deliberately NOT rendered. With it, the server-rendered
 * markup would start playing before any of the above could apply; instead playback is
 * asked for in the effect, which means no-JS gets a normal, working player.
 */
export function AutoplayVideo({
  src,
  poster,
  label,
  className = "",
  hideControls = false,
  preload = "metadata",
}: {
  src: string;
  poster?: string;
  label: string;
  className?: string;
  /** Para vídeo puramente decorativo, como o fundo da faixa de clientes do
   *  Academy: sem controles e fora da árvore de acessibilidade. Quem decide isso
   *  é quem chama - um vídeo que o visitante deveria poder pausar NUNCA usa. */
  hideControls?: boolean;
  /**
   * OBRIGATORIAMENTE "none" quando o vídeo pode estar em `display:none` em alguma
   * largura de tela. Medido no /academy: a placa dos formatos é `hidden lg:block`,
   * e ainda assim o celular baixava os 2,59 MB inteiros do arquivo - o elemento
   * não tem caixa, o IntersectionObserver nunca dispara, o vídeo nunca toca, e o
   * download acontece do mesmo jeito. O arquivo tem faststart (moov antes do
   * mdat), então nem era questão de procurar o índice: o navegador simplesmente
   * puxa adiante. Com "none" nada é buscado até o play(), e é o `poster` que
   * sustenta o quadro até lá.
   */
  preload?: "none" | "metadata" | "auto";
}) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let pausedByUs = false;
    let pausedByViewer = false;

    const onPause = () => {
      // Our own pause sets the flag first, so anything else is the viewer.
      if (!pausedByUs) pausedByViewer = true;
      pausedByUs = false;
    };
    video.addEventListener("pause", onPause);

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (pausedByViewer) return;
          // Rejects when the browser still refuses; nothing to recover, the
          // controls are right there.
          void video.play().catch(() => {});
        } else if (!video.paused) {
          pausedByUs = true;
          video.pause();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(video);

    return () => {
      io.disconnect();
      video.removeEventListener("pause", onPause);
    };
  }, []);

  return (
    <video
      ref={ref}
      className={className}
      src={src}
      poster={poster}
      controls={!hideControls}
      muted
      loop
      playsInline
      preload={preload}
      aria-hidden={hideControls || undefined}
    >
      {label}
    </video>
  );
}
