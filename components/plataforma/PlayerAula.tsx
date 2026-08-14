"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowsIn,
  ArrowsOut,
  Pause,
  Play,
  SpeakerHigh,
  SpeakerSlash,
} from "@phosphor-icons/react/dist/ssr";
import { baterProgresso, concluirAula } from "@/app/app/curso/[slug]/[aula]/actions";
import { plataforma } from "@/lib/content-plataforma";

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const VELOCIDADES = [1, 1.25, 1.5, 2, 0.75];

function formatarTempo(s: number): string {
  const total = Math.max(0, Math.floor(s));
  const m = Math.floor(total / 60);
  const seg = String(total % 60).padStart(2, "0");
  return `${m}:${seg}`;
}

/**
 * Player da aula com a IFrame API do YouTube (host youtube-nocookie), com a
 * NOSSA moldura no lugar do chrome do YouTube (escolha de 2026-08-13):
 *
 * - Antes do play o iframe nem existe: poster com a thumbnail e um botão da
 *   marca — o overlay de canal/título do YouTube não chega a aparecer.
 * - controls=0 + um overlay transparente por cima do iframe: todo clique é
 *   nosso (play/pausa), e a UI do YouTube não reage a hover. A barra de
 *   controles (progresso, tempo, velocidade, mudo, tela cheia) é nossa.
 * - Limite honesto: pausado, o YouTube ainda pinta título/logo no topo do
 *   iframe — nenhum embed remove isso; durante a reprodução fica limpo.
 *
 * O resto continua igual: `ended` conclui sozinho; a cada 15s grava segundos
 * assistidos; falha de carga vira mensagem com recarga e vídeo restrito
 * (privado/sem embed) vira aviso sem botão inútil.
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
  const moldura = useRef<HTMLDivElement | null>(null);
  const alvo = useRef<HTMLDivElement | null>(null);
  const player = useRef<any>(null);
  const timerOcultar = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [iniciado, setIniciado] = useState(false);
  const [concluida, setConcluida] = useState(jaConcluida);
  // "carga": rede/script falhou — recarregar pode resolver. "restrito": o
  // YouTube recusou o vídeo (privado, removido ou sem permissão de embed;
  // códigos 100/101/150) — recarregar não resolve, então nem oferece.
  const [falhou, setFalhou] = useState<null | "carga" | "restrito">(null);
  const [tocando, setTocando] = useState(false);
  const [tempo, setTempo] = useState(0);
  const [duracao, setDuracao] = useState(0);
  const [mudo, setMudo] = useState(false);
  const [velocidade, setVelocidade] = useState(1);
  const [telaCheia, setTelaCheia] = useState(false);
  const [controlesVisiveis, setControlesVisiveis] = useState(true);
  const [posterCaiu, setPosterCaiu] = useState(false);

  function concluir() {
    setConcluida(true);
    void concluirAula(lessonId);
  }

  function mostrarControles() {
    setControlesVisiveis(true);
    if (timerOcultar.current) clearTimeout(timerOcultar.current);
    timerOcultar.current = setTimeout(() => {
      if (player.current?.getPlayerState?.() === window.YT?.PlayerState?.PLAYING) {
        setControlesVisiveis(false);
      }
    }, 2600);
  }

  function alternarPlay() {
    const estado = player.current?.getPlayerState?.();
    if (estado === window.YT?.PlayerState?.PLAYING) player.current?.pauseVideo?.();
    else player.current?.playVideo?.();
    mostrarControles();
  }

  function alternarMudo() {
    if (player.current?.isMuted?.()) {
      player.current?.unMute?.();
      setMudo(false);
    } else {
      player.current?.mute?.();
      setMudo(true);
    }
    mostrarControles();
  }

  function proximaVelocidade() {
    const atual = VELOCIDADES.indexOf(velocidade);
    const nova = VELOCIDADES[(atual + 1) % VELOCIDADES.length];
    player.current?.setPlaybackRate?.(nova);
    setVelocidade(nova);
    mostrarControles();
  }

  function alternarTelaCheia() {
    const el = moldura.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen?.();
    else void el.requestFullscreen?.().catch(() => {});
    mostrarControles();
  }

  function aoTeclar(e: React.KeyboardEvent) {
    if (!iniciado) return;
    if (e.key === " " || e.key.toLowerCase() === "k") {
      e.preventDefault();
      alternarPlay();
    } else if (e.key === "ArrowRight") {
      player.current?.seekTo?.(Math.min((player.current?.getCurrentTime?.() ?? 0) + 5, duracao), true);
      mostrarControles();
    } else if (e.key === "ArrowLeft") {
      player.current?.seekTo?.(Math.max((player.current?.getCurrentTime?.() ?? 0) - 5, 0), true);
      mostrarControles();
    } else if (e.key.toLowerCase() === "m") {
      alternarMudo();
    } else if (e.key.toLowerCase() === "f") {
      alternarTelaCheia();
    }
  }

  useEffect(() => {
    function aoMudarTelaCheia() {
      setTelaCheia(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", aoMudarTelaCheia);
    return () => document.removeEventListener("fullscreenchange", aoMudarTelaCheia);
  }, []);

  useEffect(() => {
    if (!iniciado) return;

    let batida: ReturnType<typeof setInterval> | null = null;
    let relogio: ReturnType<typeof setInterval> | null = null;
    let ultimoGravado = -1;

    function criar() {
      player.current = new window.YT!.Player(alvo.current!, {
        host: "https://www.youtube-nocookie.com",
        videoId,
        playerVars: {
          controls: 0,
          rel: 0,
          iv_load_policy: 3,
          disablekb: 1,
          playsinline: 1,
          fs: 0,
        },
        events: {
          onReady: () => {
            setDuracao(player.current?.getDuration?.() ?? 0);
            // O clique no poster é o gesto; autoplay via playerVars não herda
            // esse gesto no iframe e o navegador bloqueia. playVideo() logo
            // após o clique ainda vale como ativação do usuário.
            player.current?.playVideo?.();
            mostrarControles();
          },
          onStateChange: (e: { data: number }) => {
            const YT = window.YT!;
            setTocando(e.data === YT.PlayerState.PLAYING);
            if (e.data === YT.PlayerState.PLAYING) mostrarControles();
            if (e.data === YT.PlayerState.PAUSED) setControlesVisiveis(true);
            if (e.data === YT.PlayerState.ENDED) {
              setControlesVisiveis(true);
              concluir();
            }
          },
          onError: (e: { data: number }) =>
            setFalhou([100, 101, 150].includes(e.data) ? "restrito" : "carga"),
        },
      });
      relogio = setInterval(() => {
        const atual = player.current?.getCurrentTime?.();
        if (typeof atual === "number") setTempo(atual);
        const total = player.current?.getDuration?.();
        if (typeof total === "number" && total > 0) setDuracao(total);
      }, 250);
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
      if (relogio) clearInterval(relogio);
      if (timerOcultar.current) clearTimeout(timerOcultar.current);
      player.current?.destroy?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, iniciado]);

  const tp = t.player;

  return (
    <div>
      <div
        ref={moldura}
        tabIndex={0}
        onKeyDown={aoTeclar}
        onPointerMove={iniciado ? mostrarControles : undefined}
        className="group relative aspect-video w-full overflow-hidden border border-line bg-brand-ink focus-visible:outline-2 focus-visible:outline-accent-text"
      >
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
        ) : !iniciado ? (
          /* Poster: o iframe do YouTube só nasce depois do clique. */
          <button
            type="button"
            onClick={() => setIniciado(true)}
            aria-label={tp.reproduzir}
            className="absolute inset-0 h-full w-full cursor-pointer"
          >
            {!posterCaiu ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
                onError={(e) => {
                  const img = e.currentTarget;
                  if (!img.src.endsWith("hqdefault.jpg")) img.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
                  else setPosterCaiu(true);
                }}
                alt=""
                className="h-full w-full object-cover opacity-80"
              />
            ) : null}
            <span className="absolute inset-0 bg-brand-ink/30" aria-hidden="true" />
            <span className="absolute left-1/2 top-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-control bg-accent text-accent-on shadow-[0_8px_30px_rgb(0_0_0/0.35)] transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none">
              <Play size={32} weight="fill" aria-hidden="true" />
            </span>
          </button>
        ) : (
          <>
            <div ref={alvo} className="h-full w-full" />
            {/* Overlay nosso por cima do iframe: captura todo clique (o
                YouTube não vê hover nem clique) e alterna play/pausa. */}
            <div
              onClick={alternarPlay}
              aria-hidden="true"
              className="absolute inset-0 cursor-pointer"
            />
            {!tocando ? (
              /* Pausado: nosso play central — afordância clara (e cobre parte
                 do chrome que o YouTube pinta no estado pausado). */
              <button
                type="button"
                onClick={alternarPlay}
                aria-label={tp.reproduzir}
                className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-control bg-accent text-accent-on shadow-[0_8px_30px_rgb(0_0_0/0.35)] transition-transform duration-200 hover:scale-105 motion-reduce:transition-none"
              >
                <Play size={26} weight="fill" aria-hidden="true" />
              </button>
            ) : null}
            <div
              className={`absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-brand-ink/90 to-transparent px-4 pb-3 pt-10 transition-opacity duration-300 motion-reduce:transition-none ${
                controlesVisiveis ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              <input
                type="range"
                min={0}
                max={Math.max(duracao, 1)}
                step={1}
                value={Math.min(tempo, duracao || tempo)}
                onChange={(e) => {
                  const s = Number(e.target.value);
                  setTempo(s);
                  player.current?.seekTo?.(s, true);
                  mostrarControles();
                }}
                aria-label={tp.progresso}
                className="progresso-aula w-full"
              />
              <div className="flex items-center gap-4 text-brand-paper">
                <button type="button" onClick={alternarPlay} aria-label={tocando ? tp.pausar : tp.reproduzir} className="grid size-9 place-items-center transition-opacity hover:opacity-80">
                  {tocando ? <Pause size={20} weight="fill" aria-hidden="true" /> : <Play size={20} weight="fill" aria-hidden="true" />}
                </button>
                <span className="font-mono text-[11px] tracking-[0.08em] tabular-nums">
                  {formatarTempo(tempo)} / {formatarTempo(duracao)}
                </span>
                <span className="flex-1" />
                <button type="button" onClick={proximaVelocidade} aria-label={tp.velocidade} className="font-mono text-[11px] tracking-[0.08em] transition-opacity hover:opacity-80">
                  {velocidade}x
                </button>
                <button type="button" onClick={alternarMudo} aria-label={mudo ? tp.comSom : tp.semSom} className="grid size-9 place-items-center transition-opacity hover:opacity-80">
                  {mudo ? <SpeakerSlash size={20} aria-hidden="true" /> : <SpeakerHigh size={20} aria-hidden="true" />}
                </button>
                <button type="button" onClick={alternarTelaCheia} aria-label={telaCheia ? tp.sairTelaCheia : tp.telaCheia} className="grid size-9 place-items-center transition-opacity hover:opacity-80">
                  {telaCheia ? <ArrowsIn size={20} aria-hidden="true" /> : <ArrowsOut size={20} aria-hidden="true" />}
                </button>
              </div>
            </div>
          </>
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
