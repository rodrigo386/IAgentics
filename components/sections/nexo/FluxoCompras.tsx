"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { nexo } from "@/lib/content";

/**
 * O fluxo de compras de ponta a ponta (deck IAgentics_DeskManager_Promo,
 * slide 3), no lugar do antigo índice de agentes ("Entrega embarcada").
 * Escolha de layout do Rodrigo em 2026-08-14: Esteira (scrollytelling).
 *
 * Em lg+: os passos correm à esquerda e um palco fica preso (sticky) à
 * direita trocando o print com crossfade conforme o passo cruza a faixa
 * central da viewport (IntersectionObserver — mesmo mecanismo dos Reveal).
 * O passo ativo acende; os demais esmaecem. O movimento é a sequência do
 * processo, não decoração.
 *
 * No celular não existe palco: cada passo carrega o próprio print, porque
 * sticky + crossfade em tela pequena esconderia o conteúdo que o passo
 * está descrevendo.
 */
type Passo = (typeof nexo.fluxo.passos)[number];

function Prancha({ passo }: { passo: Passo }) {
  return (
    <div className="flex aspect-video items-center justify-center overflow-hidden border border-line bg-brand-paper">
      <Image src={passo.src} alt={passo.nome} width={passo.w} height={passo.h} className="max-h-full w-full object-contain" />
    </div>
  );
}

export function NexoFluxoCompras() {
  const [ativo, setAtivo] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) {
            setAtivo(Number((e.target as HTMLElement).dataset.indice));
          }
        }
      },
      // Faixa estreita no meio da tela: o passo que a cruza é o ativo.
      { rootMargin: "-45% 0px -45% 0px" },
    );
    for (const el of refs.current) if (el) io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="border-t border-line py-24 sm:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        {/* Cabeçalho DENTRO da coluna esquerda: o palco sobe e alinha com o
            título — sem vazio no topo direito nem respiro antes do passo 01. */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Reveal>
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
              <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-fg-muted">{nexo.fluxo.lead}</p>
            </Reveal>

            <ol className="mt-12 flex flex-col gap-14 lg:mt-16 lg:gap-28 lg:pb-[20vh]">
            {nexo.fluxo.passos.map((p, i) => (
              <li
                key={p.n}
                data-indice={i}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                className="border-t border-line-strong pt-6"
              >
                <span className="font-mono text-[11px] tracking-[0.16em] text-accent-text">{p.n}</span>
                <h3
                  className={`mt-2 text-2xl font-medium tracking-[-0.02em] transition-colors duration-300 motion-reduce:transition-none sm:text-3xl ${
                    ativo === i ? "text-fg" : "text-fg lg:text-fg-subtle"
                  }`}
                >
                  {p.nome}
                </h3>
                <p
                  className={`mt-3 max-w-[42ch] leading-relaxed transition-colors duration-300 motion-reduce:transition-none ${
                    ativo === i ? "text-fg-muted" : "text-fg-muted lg:text-fg-subtle"
                  }`}
                >
                  {p.texto}
                </p>
                <div className="mt-5 lg:hidden">
                  <Prancha passo={p} />
                </div>
              </li>
            ))}
            </ol>
          </div>

          <div className="hidden lg:col-span-7 lg:block">
            <div className="sticky top-24">
              <div className="relative aspect-video overflow-hidden border border-line bg-brand-paper">
                {nexo.fluxo.passos.map((p, i) => (
                  <div
                    key={p.n}
                    aria-hidden={ativo !== i}
                    className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 motion-reduce:transition-none ${
                      ativo === i ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <Image src={p.src} alt="" width={p.w} height={p.h} className="max-h-full w-full object-contain" />
                  </div>
                ))}
              </div>
              <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">
                {nexo.fluxo.passos[ativo].n} · {nexo.fluxo.passos[ativo].nome}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
