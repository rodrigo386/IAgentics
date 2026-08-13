"use client";
import { useEffect, useRef, useState } from "react";
import { baterProgresso, concluirAula } from "@/app/app/curso/[slug]/[aula]/actions";
import { plataforma } from "@/lib/content-plataforma";

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

/**
 * Player da aula com a IFrame API do YouTube (host youtube-nocookie).
 * - `ended` marca a aula concluída sozinho; o botão existe porque nem todo
 *   mundo assiste o último segundo.
 * - A cada 15s de reprodução grava segundos assistidos (só se o segundo mudou).
 * - Falha de carga vira mensagem com recarga, nunca retângulo preto mudo.
 * - Grava progresso via as server actions do módulo (auth() dentro delas —
 *   este componente nunca manda userId, só lessonId/segundos).
 */
export function PlayerAula({
  videoId,
  lessonId,
  jaConcluida,
  hrefProxima,
}: {
  videoId: string;
  lessonId: string;
  jaConcluida: boolean;
  hrefProxima: string | null;
}) {
  const t = plataforma.aula;
  const alvo = useRef<HTMLDivElement | null>(null);
  const player = useRef<any>(null);
  const [concluida, setConcluida] = useState(jaConcluida);
  // "carga": rede/script falhou — recarregar pode resolver. "restrito": o
  // YouTube recusou o vídeo (privado, removido ou sem permissão de embed;
  // códigos 100/101/150) — recarregar não resolve, então nem oferece.
  const [falhou, setFalhou] = useState<null | "carga" | "restrito">(null);

  function concluir() {
    setConcluida(true);
    void concluirAula(lessonId);
  }

  useEffect(() => {
    let batida: ReturnType<typeof setInterval> | null = null;
    let ultimoGravado = -1;

    function criar() {
      player.current = new window.YT!.Player(alvo.current!, {
        host: "https://www.youtube-nocookie.com",
        videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (e: { data: number }) => {
            if (e.data === window.YT!.PlayerState.ENDED) concluir();
          },
          onError: (e: { data: number }) =>
            setFalhou([100, 101, 150].includes(e.data) ? "restrito" : "carga"),
        },
      });
      batida = setInterval(() => {
        const s = Math.floor(player.current?.getCurrentTime?.() ?? 0);
        if (s > 0 && s !== ultimoGravado) {
          ultimoGravado = s;
          void baterProgresso(lessonId, s);
        }
      }, 15_000);
    }

    if (window.YT?.Player) criar();
    else {
      window.onYouTubeIframeAPIReady = criar;
      if (!document.querySelector('script[src*="iframe_api"]')) {
        const s = document.createElement("script");
        s.src = "https://www.youtube.com/iframe_api";
        s.onerror = () => setFalhou("carga");
        document.head.appendChild(s);
      }
    }
    return () => {
      if (batida) clearInterval(batida);
      player.current?.destroy?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  return (
    <div>
      <div className="aspect-video w-full border border-line bg-brand-ink">
        {falhou ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-brand-paper">
            <p>{falhou === "restrito" ? t.videoIndisponivel : t.videoFalhou}</p>
            {falhou === "carga" ? (
              <button
                onClick={() => location.reload()}
                className="rounded-control border border-current px-5 py-2 text-sm"
              >
                {t.recarregar}
              </button>
            ) : null}
          </div>
        ) : (
          <div ref={alvo} className="h-full w-full" />
        )}
      </div>
      <div className="mt-4 flex items-center gap-3">
        {concluida && hrefProxima ? (
          <a
            href={hrefProxima}
            className="rounded-control bg-accent px-6 py-3 font-medium text-accent-on transition-colors hover:bg-accent-hover"
          >
            {t.proximaAula}
          </a>
        ) : concluida ? (
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-text">{t.concluida}</p>
        ) : (
          <button
            onClick={concluir}
            className="rounded-control border border-line-strong px-6 py-3 font-medium transition-colors hover:border-fg"
          >
            {t.marcarConcluida}
          </button>
        )}
      </div>
    </div>
  );
}
