"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react";
import { Reveal } from "@/components/ui/Reveal";
import { solutions } from "@/lib/content";

/**
 * As 3 soluções em "palco fixo" (2026-10-07, pedido do Rodrigo, pensando em
 * motion). Os nomes correm à esquerda; à direita um palco preso na tela troca
 * o filme de cada solução (remotion/home-solucoes, loops mudos de 8 s) quando
 * a rolagem passa por ela — ou quando o mouse ou o foco do teclado chegam no
 * nome. Substituiu o "índice editorial" de linhas com foto no hover, que no
 * celular não tinha movimento nenhum.
 *
 * Decisões:
 *  - Só o filme ativo toca, e só com o palco na tela: os outros ficam pausados
 *    no quadro em que pararam, sem gastar bateria.
 *  - No celular o palco vem ANTES da lista e fica preso no alto (sticky), e
 *    os nomes passam por baixo dele. É o mesmo elemento nos dois tamanhos —
 *    nada de um palco escondido baixando vídeo à toa.
 *  - Reduced motion: nada toca sozinho; o palco mostra a capa de cada solução,
 *    trocando sem transição.
 *  - O palco é decorativo (aria-hidden): tudo o que ele mostra está escrito na
 *    lista, que continua sendo de links.
 */
export function Solutions() {
  const [ativo, setAtivo] = useState(0);
  const itens = useRef<(HTMLLIElement | null)[]>([]);
  const filmes = useRef<(HTMLVideoElement | null)[]>([]);
  const palco = useRef<HTMLDivElement | null>(null);
  const [palcoVisivel, setPalcoVisivel] = useState(false);
  const [semMovimento, setSemMovimento] = useState(false);

  useEffect(() => {
    setSemMovimento(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    // O item que cruza a faixa de leitura é o ativo. No desktop, o meio da
    // tela; no celular, mais abaixo: o palco preso ocupa o alto, e no meio o
    // título da solução ativa ficava escondido atrás dele.
    const desktop = window.matchMedia("(min-width: 1024px)").matches;
    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas)
          if (e.isIntersecting)
            setAtivo(Number((e.target as HTMLElement).dataset.indice));
      },
      { rootMargin: desktop ? "-45% 0px -45% 0px" : "-68% 0px -22% 0px" },
    );
    for (const el of itens.current) if (el) io.observe(el);
    const vis = new IntersectionObserver(
      ([e]) => setPalcoVisivel(e.isIntersecting),
      { threshold: 0.2 },
    );
    if (palco.current) vis.observe(palco.current);
    return () => {
      io.disconnect();
      vis.disconnect();
    };
  }, []);

  useEffect(() => {
    filmes.current.forEach((v, i) => {
      if (!v) return;
      if (i === ativo && palcoVisivel && !semMovimento)
        void v.play().catch(() => {});
      else v.pause();
    });
  }, [ativo, palcoVisivel, semMovimento]);

  return (
    /* Sem padding no topo: o respiro entre o último fio do Problema e o eyebrow
       daqui é o fundo do Problema (64px, o ritmo fio → 64 → eyebrow da casa).
       Somar os dois abria um vão vazio (print do Rodrigo, 2026-10-07). */
    <section id="solucoes" className="pb-24 sm:pb-32">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-x-12 px-5 sm:px-8 lg:grid-cols-12">
        {/* O título mora na coluna da esquerda, em cima dos nomes, e o palco
            começa na mesma altura: título numa faixa só deixava a metade da
            direita vazia. No celular a ordem é título → palco → lista. */}
        <Reveal className="order-1 lg:col-span-5 lg:row-start-1">
          {/* The page's only eyebrow. */}
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent-text">
            {solutions.eyebrow}
          </p>
          <h2 className="mt-5 max-w-[18ch] text-3xl font-medium tracking-[-0.02em] text-fg sm:text-4xl lg:text-5xl">
            {solutions.headline}
          </h2>
        </Reveal>

        {/* O palco. No celular: depois do título e preso no alto; no desktop: à direita, preso, ao lado do título e da lista. */}
        <div
          ref={palco}
          className="sticky top-16 z-10 order-2 -mx-5 mt-10 bg-bg px-5 pb-4 pt-2 sm:-mx-8 sm:px-8 lg:order-none lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1 lg:mx-0 lg:mt-0 lg:self-start lg:px-0 lg:pb-0 lg:pt-0 lg:top-28"
        >
          <div
            aria-hidden="true"
            className="relative aspect-[4/3] overflow-hidden border border-line bg-brand-paper"
          >
            {solutions.items.map((item, i) => (
              <video
                key={item.id}
                ref={(el) => {
                  filmes.current[i] = el;
                }}
                src={item.filme}
                poster={item.capa}
                muted
                loop
                playsInline
                preload={i === 0 ? "metadata" : "none"}
                tabIndex={-1}
                className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
                  i === ativo ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
          </div>
          {/* Os três degraus do palco: qual solução está em cena. */}
          <div aria-hidden="true" className="mt-3 grid grid-cols-3 gap-1">
            {solutions.items.map((item, i) => (
              <span
                key={item.id}
                className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-fg-muted"
              >
                <span
                  className={`h-0.5 flex-1 transition-colors duration-300 ${i === ativo ? "bg-accent" : "bg-line"}`}
                />
                <span className={i === ativo ? "text-accent-text" : ""}>
                  {String(i + 1).padStart(2, "0")}
                </span>
              </span>
            ))}
          </div>
        </div>

        <ol className="order-3 lg:order-none lg:col-span-5 lg:row-start-2 lg:mt-12">
          {solutions.items.map((item, i) => {
            const aceso = i === ativo;
            return (
              <li
                key={item.id}
                data-indice={i}
                ref={(el) => {
                  itens.current[i] = el;
                }}
                className="border-t border-line-strong last:border-b lg:flex lg:min-h-[48vh] lg:items-center"
              >
                <Link
                  href={item.href}
                  onMouseEnter={() => setAtivo(i)}
                  onFocus={() => setAtivo(i)}
                  className="group block w-full py-10 lg:py-14"
                >
                  <span className="flex items-start justify-between gap-6">
                    <span
                      className={`text-4xl font-medium tracking-[-0.03em] transition-colors duration-300 sm:text-5xl lg:text-6xl ${aceso ? "text-fg" : "text-fg-subtle"}`}
                    >
                      {item.name}
                    </span>
                    <ArrowUpRight
                      size={28}
                      aria-hidden="true"
                      className={`mt-2 shrink-0 transition-[transform,color] duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 ${aceso ? "text-accent-text" : "text-fg-subtle"}`}
                    />
                  </span>
                  <span
                    className={`mt-4 block text-lg transition-colors duration-300 sm:text-xl ${aceso ? "text-fg" : "text-fg-muted"}`}
                  >
                    {item.promise}
                  </span>
                  <span className="mt-1 block text-sm text-fg-muted">
                    {item.platform}
                  </span>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {item.scope.map((s) => (
                      <li
                        key={s}
                        className={`border px-2.5 py-1 font-mono text-[11px] transition-colors duration-300 ${aceso ? "border-line-strong text-fg-muted" : "border-line text-fg-subtle"}`}
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
