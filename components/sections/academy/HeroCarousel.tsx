"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { academy } from "@/lib/content";

/**
 * O carrossel de três títulos do hero, como no site atual.
 *
 * TODOS OS SLIDES FICAM NO DOM, empilhados na mesma célula de grid em vez de
 * posicionados em absoluto. Assim o contêiner nasce com a altura do slide mais
 * alto e a página não pula ao trocar - "Escola de experiências com IA" ocupa
 * duas linhas onde "Desenhe junto conosco a solução" ocupa uma.
 *
 * Só o slide ativo é lido: os outros levam `inert`, que tira do foco de teclado
 * E da árvore de acessibilidade de uma vez. Sem isso, dar Tab dentro do hero
 * levaria a botões invisíveis.
 *
 * A troca automática é de 7s e PARA quando o cursor entra, quando algo ali
 * recebe foco, ou quando a preferência do sistema é menos movimento. Nesse
 * último caso as setas continuam funcionando - a pessoa escolhe quando trocar,
 * que é diferente de não poder ver os outros slides.
 */
const TROCA_MS = 7000;

/** h1 quando é o slide da vez, parágrafo quando não é. Mesma aparência nos dois. */
function Titulo({
  ativo,
  className,
  children,
}: {
  ativo: boolean;
  className: string;
  children: React.ReactNode;
}) {
  const Tag = ativo ? "h1" : "p";
  return <Tag className={className}>{children}</Tag>;
}

export function AcademyHeroCarousel() {
  const slides = academy.hero.slides;
  const inicial = Math.max(
    0,
    slides.findIndex((s) => s.primary),
  );
  const [ativo, setAtivo] = useState(inicial);
  const [parado, setParado] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (parado) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(
      () => setAtivo((i) => (i + 1) % slides.length),
      TROCA_MS,
    );
    return () => window.clearInterval(t);
  }, [parado, slides.length]);

  const ir = (delta: number) =>
    setAtivo((i) => (i + delta + slides.length) % slides.length);

  return (
    <div
      ref={raiz}
      onPointerEnter={() => setParado(true)}
      onPointerLeave={() => setParado(false)}
      onFocusCapture={() => setParado(true)}
      onBlurCapture={() => setParado(false)}
    >
      <div className="grid">
        {slides.map((slide, i) => (
          <div
            key={slide.headline}
            // Tira do foco de teclado E da árvore de acessibilidade de uma vez.
            // Passar a string vazia não funciona: no React 19 `inert` é booleano.
            inert={i !== ativo}
            className={`col-start-1 row-start-1 transition-opacity duration-500 motion-reduce:transition-none ${
              i === ativo ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            {/* UM h1 por página. Só o slide ativo é h1; os outros dois existem no
                DOM para dar altura ao contêiner e são parágrafos com a mesma
                aparência. Três h1 é o que a primeira versão fazia, e nem `inert`
                conserta isso para um buscador. */}
            <Titulo
              ativo={i === ativo}
              className="max-w-[16ch] text-[min(11vw,3.5rem)] font-medium leading-[1.06] tracking-[-0.04em] text-fg sm:text-[min(9vw,5.5rem)] lg:text-[min(6.5vw,6.5rem)]"
            >
              <span className="block overflow-hidden pb-[0.14em]">
                <span className="hero-line block" style={{ animationDelay: "140ms" }}>
                  {slide.headline}
                </span>
              </span>
            </Titulo>

            <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">
              <p className="text-xl leading-snug text-fg sm:text-2xl lg:col-span-6">
                {slide.subtext}
              </p>
              <div className="flex flex-wrap items-start gap-3 lg:col-span-5 lg:col-start-8">
                <a
                  href="#cursos"
                  className="group inline-flex items-center gap-2 rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-[background-color,transform] duration-200 hover:bg-accent-hover active:scale-[0.98]"
                >
                  <span className="whitespace-nowrap">Explorar trilhas</span>
                  <ArrowRight
                    size={17}
                    weight="regular"
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </a>
                <a
                  href="#formatos"
                  className="inline-flex items-center rounded-control border border-line-strong px-7 py-3.5 font-medium text-fg transition-colors duration-200 hover:border-fg active:scale-[0.98]"
                >
                  <span className="whitespace-nowrap">Ver formatos</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Controles. Os pontos são botões de verdade, não enfeite. */}
      <div className="mt-10 flex items-center gap-4">
        <button
          type="button"
          onClick={() => ir(-1)}
          aria-label="Título anterior"
          className="grid size-10 place-items-center rounded-control border border-line-strong text-fg transition-colors duration-200 hover:border-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text"
        >
          <CaretLeft size={16} weight="bold" aria-hidden="true" />
        </button>

        <ul className="flex items-center gap-2">
          {slides.map((slide, i) => (
            <li key={slide.headline}>
              <button
                type="button"
                onClick={() => setAtivo(i)}
                aria-label={slide.headline}
                aria-current={i === ativo}
                className={`block h-1.5 rounded-control transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-text motion-reduce:transition-none ${
                  i === ativo ? "w-8 bg-accent" : "w-1.5 bg-line-strong"
                }`}
              />
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => ir(1)}
          aria-label="Próximo título"
          className="grid size-10 place-items-center rounded-control border border-line-strong text-fg transition-colors duration-200 hover:border-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text"
        >
          <CaretRight size={16} weight="bold" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
