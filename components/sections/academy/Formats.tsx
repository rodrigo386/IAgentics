"use client";

import { useState } from "react";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { AutoplayVideo } from "@/components/ui/AutoplayVideo";
import { academy } from "@/lib/content";

/**
 * Os quatro formatos como tipografia cinética.
 *
 * A versão anterior era uma lista com régua: 1171px de rolagem para 121 palavras,
 * com os quatro parágrafos cinzas competindo ao mesmo tempo. Ninguém lia os quatro
 * e o bloco não convidava a ler nenhum.
 *
 * Aqui o nome é o visual. Os quatro ficam contornados em repouso e o da vez se
 * preenche, com o parágrafo entrando ao lado. Só um por vez, o que resolve a
 * competição: a seção passa a ser algo que se olha antes de se ler.
 *
 * CONTRASTE DO CONTORNO. Texto vazado é o risco desta ideia. O traço usa --fg
 * cheio (16,8:1 no claro), não uma versão apagada, e a 100px de corpo um traço de
 * 1,5px é sólido. O nome ativo preenche em --accent-text (6,73:1 claro, 6,09:1
 * escuro). Os quatro nomes são texto de verdade no DOM: um leitor de tela recebe
 * todos, contornados ou não.
 *
 * O botão é sobreposição esticada, não invólucro: <button> só aceita conteúdo de
 * frase, e embrulhar o <h4> nele seria HTML inválido. Mesma solução do índice de
 * agentes do /nexo.
 */
export function AcademyFormats() {
  const [ativo, setAtivo] = useState(0);
  const item = academy.formats.items[ativo];

  return (
    <section
      id="formatos"
      className="scroll-mt-24 border-t border-line py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">
          {academy.formats.kicker}
        </p>
        <h3 className="mt-6 max-w-[22ch] text-3xl font-medium tracking-[-0.03em] text-fg sm:text-4xl">
          {academy.formats.title}
        </h3>

        <div className="mt-16 grid grid-cols-1 gap-x-12 lg:grid-cols-12">
          <ul className="lg:col-span-7">
            {academy.formats.items.map((formato, i) => {
              const isAtivo = i === ativo;
              return (
                <li key={formato.name} className="relative">
                  <button
                    type="button"
                    aria-pressed={isAtivo}
                    aria-label={`Ver o formato ${formato.name}`}
                    onClick={() => setAtivo(i)}
                    onPointerEnter={() => setAtivo(i)}
                    onFocus={() => setAtivo(i)}
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent-text"
                  />
                  <h4
                    className={`format-name pointer-events-none block py-1 text-[min(13vw,4.5rem)] font-medium leading-[1.05] tracking-[-0.045em] transition-colors duration-300 motion-reduce:transition-none sm:text-[min(11vw,6rem)] lg:text-[min(7vw,7rem)] ${
                      isAtivo ? "is-active text-accent-text" : "text-transparent"
                    }`}
                  >
                    {formato.name}
                  </h4>

                  {/* No celular o parágrafo do ativo entra logo abaixo do nome:
                      sem coluna ao lado, a única leitura possível é essa. */}
                  {isAtivo ? (
                    <p className="max-w-[52ch] pb-8 pt-2 leading-relaxed text-fg-muted lg:hidden">
                      {formato.body}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>

          {/* A placa de vídeo. Altura h-full, não proporção fixa: com aspect-[4/5]
              ela mediria 660px contra os 455px da coluna de nomes e abriria 200px
              de vão morto ao lado da lista - medido em 1280, 1440 e 1920, onde a
              grade dá 408, 455 e 502px. Deixando o vídeo seguir a altura da coluna,
              a seção não cresce por causa da decoração.

              O `sticky top-32` que existia aqui saiu junto: com 455px de grade não
              havia percurso para grudar, ele só ocupava linha. */}
          <div className="hidden lg:col-span-5 lg:block">
            <div className="relative isolate h-full overflow-hidden">
              <div aria-hidden="true" className="absolute inset-0 -z-10">
                {/* Não é o empresas-bg.mp4. Ele já está na faixa "Para Empresas",
                    que é a seção IMEDIATAMENTE acima desta - a mesma filmagem duas
                    vezes seguidas se denuncia. Este é o header do Spend Lab, também
                    de vocês: sala de formação com laptops, que é o que estes quatro
                    formatos são. */}
                <AutoplayVideo
                  src="/spend-lab/ai-spend-lab-header-video.mp4"
                  poster="/spend-lab/ai-spend-lab-header-poster.jpg"
                  label=""
                  hideControls
                  /* Esta coluna é `hidden lg:block`. Sem preload="none" o celular
                     baixava 2,59 MB de um vídeo que ele nunca mostra - medido. O
                     poster de 46 KB segura o quadro no desktop até o play. */
                  preload="none"
                  className="h-full w-full object-cover"
                />
                {/* Mesmo véu da faixa "Para Empresas". No pior quadro possível, um
                    branco puro, o fundo composto fica em #3D414B e o texto papel
                    ainda dá 9,4:1 - ou seja, a legibilidade não depende de qual
                    cena estiver passando. */}
                <div className="absolute inset-0 bg-brand-ink/[0.82]" />
              </div>

              <div className="flex h-full flex-col justify-end p-8 text-brand-paper lg:p-10">
                {/* Papel a 70%, não o azul de destaque: sobre este véu o
                    --accent-text dá 3,45:1 e reprova em 11px. O papel rebaixado dá
                    5,6:1. Mesma escolha da faixa "Para Empresas". */}
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] opacity-70">
                  {item.name}
                </p>
                {/* key força o remonte a cada troca, então a entrada roda de novo. */}
                <p
                  key={item.name}
                  className="format-body mt-4 text-lg leading-relaxed"
                >
                  {item.body}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-line-strong pt-12">
          <a
            href="#contato"
            className="group inline-flex items-center gap-2 text-lg font-medium text-fg transition-colors duration-200 hover:text-accent-text"
          >
            {academy.formats.cta}
            <ArrowRight
              size={18}
              weight="regular"
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </a>
        </div>
      </div>
    </section>
  );
}
