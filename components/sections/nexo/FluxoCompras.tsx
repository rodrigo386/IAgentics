"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { Play } from "@phosphor-icons/react";
import { Reveal } from "@/components/ui/Reveal";
import { VideoVitrine } from "@/components/ui/VideoVitrine";
import { nexo } from "@/lib/content";
import posterPassoAPasso from "@/public/nexo/nexo-passo-a-passo-poster.jpg";

/**
 * O fluxo de compras de ponta a ponta (deck IAgentics_DeskManager_Promo,
 * slide 3). Os passos correm à esquerda e um palco fica preso (sticky) à
 * direita — o esqueleto da Esteira escolhida pelo Rodrigo em 2026-08-14.
 *
 * O PALCO É O VÍDEO DO PASSO A PASSO desde 2026-10-07 (pedido do Rodrigo:
 * "deve substituir os prints"). Antes eram sete prints trocando em crossfade
 * conforme o scroll; agora quem manda é o TEMPO DO VÍDEO, não o scroll:
 *   - o passo cujo capítulo está passando acende (`inicio` em content.ts,
 *     medido quadro a quadro no arquivo);
 *   - clicar num passo leva o vídeo até o capítulo dele.
 * O scroll deixou de dirigir o palco de propósito: se dirigisse, o vídeo
 * pularia de capítulo sozinho enquanto a pessoa lê.
 *
 * No celular o vídeo vem entre o título e os passos (ordem do grid), e é o
 * MESMO elemento — dois <video> com um escondido baixariam o arquivo duas
 * vezes (ver a nota de `preload` no AutoplayVideo).
 */
const passos = nexo.fluxo.passos;

function capituloEm(segundos: number) {
  let atual = -1;
  passos.forEach((p, i) => {
    if (segundos >= p.inicio) atual = i;
  });
  return atual;
}

const mmss = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function NexoFluxoCompras() {
  const [ativo, setAtivo] = useState(-1);
  const video = useRef<HTMLVideoElement | null>(null);
  const palco = useRef<HTMLDivElement | null>(null);

  function irPara(i: number) {
    const v = video.current;
    if (!v) return;
    v.currentTime = passos[i].inicio;
    setAtivo(i);
    void v.play().catch(() => {});
    // No celular o vídeo está acima da lista: traz para a tela quem pediu.
    const caixa = palco.current?.getBoundingClientRect();
    if (caixa && (caixa.bottom < 0 || caixa.top > window.innerHeight)) {
      palco.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }

  return (
    <section className="border-t border-line py-24 sm:py-32">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 px-5 sm:px-8 lg:grid-cols-12 lg:gap-x-10 lg:gap-y-0">
        <Reveal className="lg:col-span-5 lg:row-start-1">
          {/* Lockup com o ícone do app, como no hero — o título carrega a marca. */}
          <h2 className="flex max-w-[22ch] items-center gap-4 text-4xl font-medium tracking-[-0.03em] text-fg sm:gap-5 sm:text-5xl lg:text-6xl">
            <Image
              src="/nexo-app-icon.svg"
              alt=""
              width={512}
              height={512}
              className="size-10 shrink-0 sm:size-12 lg:size-14"
            />
            {nexo.fluxo.titulo}
          </h2>
          <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-fg-muted">
            {nexo.fluxo.lead}
          </p>
        </Reveal>

        <div
          ref={palco}
          className="lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1"
        >
          <div className="lg:sticky lg:top-24">
            <VideoVitrine
              className="aspect-video w-full"
              src={nexo.fluxo.video.src}
              poster={posterPassoAPasso}
              label={nexo.fluxo.video.label}
              textos={nexo.controlesVideo}
              controle={video}
              aoTempo={(s) => setAtivo(capituloEm(s))}
            />
            <p
              className="mt-4 min-h-[1lh] font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted"
              aria-live="off"
            >
              {ativo >= 0
                ? `${passos[ativo].n} · ${passos[ativo].nome}`
                : nexo.fluxo.video.legenda}
            </p>
          </div>
        </div>

        <ol className="flex flex-col gap-10 lg:col-span-5 lg:row-start-2 lg:mt-16 lg:gap-14">
          {passos.map((p, i) => {
            const aceso = ativo === i;
            const apagado = ativo >= 0 && !aceso;
            return (
              <li
                key={p.n}
                className={`border-t pt-6 transition-colors duration-300 motion-reduce:transition-none ${aceso ? "border-accent" : "border-line-strong"}`}
              >
                {/* h3 por fora, botão por dentro: o passo continua sendo título para
                    leitor de tela e buscador, e o botão só leva texto de frase. */}
                <h3>
                  <button
                    type="button"
                    onClick={() => irPara(i)}
                    aria-label={`${nexo.fluxo.video.irPara} ${p.nome} (${mmss(p.inicio)})`}
                    className="group block w-full text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                  >
                    <span className="flex items-center gap-3 font-mono text-[11px] tracking-[0.16em] text-accent-text">
                      {p.n}
                      <span className="inline-flex items-center gap-1.5 text-fg-muted transition-colors group-hover:text-accent-text">
                        <Play size={10} weight="fill" aria-hidden="true" />
                        {mmss(p.inicio)}
                      </span>
                    </span>
                    <span
                      className={`mt-2 block text-2xl font-medium tracking-[-0.02em] transition-colors duration-300 group-hover:text-fg motion-reduce:transition-none sm:text-3xl ${
                        apagado ? "text-fg-subtle" : "text-fg"
                      }`}
                    >
                      {p.nome}
                    </span>
                  </button>
                </h3>
                <p
                  className={`mt-3 max-w-[42ch] leading-relaxed transition-colors duration-300 motion-reduce:transition-none ${apagado ? "text-fg-subtle" : "text-fg-muted"}`}
                >
                  {p.texto}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
