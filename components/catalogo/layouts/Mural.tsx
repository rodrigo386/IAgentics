"use client";
import { useState } from "react";
import { Check, Plus } from "@phosphor-icons/react";
import { catalogo as t, type Tema } from "@/lib/content";
import { formatarReais } from "@/lib/catalogo/preco";
import { Marquee } from "@/components/ui/Marquee";
import { Capa } from "../Capa";
import { CascaLayout } from "../CascaLayout";

/**
 * Opção de layout "Mural" (2026-09-26): o catálogo como parede de pôsteres.
 *
 * Os temas correm numa faixa em letra grande; o filtro por tema troca a parede
 * inteira; e a grade mistura pôsteres grandes e pequenos — a cada sete, um
 * ocupa o espaço de quatro, para a parede não virar tabela. `grid-flow-dense`
 * fecha os buracos que os grandes deixam.
 */
type Props = { precoBaseCentavos: number; urlCheckout: string };
const TEMAS = Object.keys(t.temas) as Tema[];

export function Mural({ precoBaseCentavos, urlCheckout }: Props) {
  const [tema, setTema] = useState<Tema | null>(null);
  const cursos = t.cursos.filter((c) => tema === null || c.temas.includes(tema));

  return (
    <CascaLayout precoBaseCentavos={precoBaseCentavos} urlCheckout={urlCheckout}>
      {({ estado, abrirTrilha }) => (
        <>
          <section className="mx-auto grid max-w-[1400px] gap-8 px-5 pt-14 sm:px-8 lg:grid-cols-12 lg:items-end lg:pt-20">
            <div className="lg:col-span-8">
              <p className="hero-fade font-mono text-[11px] uppercase tracking-[0.24em] text-fg-muted">{t.mural.eyebrow}</p>
              <h1 className="hero-fade mt-4 text-4xl font-medium leading-[1.02] tracking-[-0.03em] text-fg sm:text-6xl [text-wrap:balance]" style={{ animationDelay: "80ms" }}>
                {t.mural.titulo}
              </h1>
            </div>
            <div className="lg:col-span-4 lg:justify-self-end">
              <button
                type="button"
                onClick={abrirTrilha}
                className="hero-fade rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-colors hover:bg-accent-hover active:translate-y-px"
                style={{ animationDelay: "200ms" }}
              >
                {t.vitrine.montar}
              </button>
            </div>
          </section>

          {/* A faixa de temas: decoração com conteúdo — os seis temas do catálogo. */}
          <div className="mt-10 border-y border-line py-5" aria-hidden="true">
            <Marquee duration="45s" gap="gap-12">
              {TEMAS.map((tm) => (
                <span key={tm} className="shrink-0 text-3xl font-medium tracking-[-0.03em] text-fg sm:text-5xl">
                  {t.temas[tm]}
                  <span className="ml-12 text-accent-text">/</span>
                </span>
              ))}
            </Marquee>
          </div>

          <div className="mx-auto max-w-[1400px] px-5 pb-16 pt-8 sm:px-8">
            <div role="group" aria-label={t.mural.filtro} className="flex flex-wrap gap-2">
              {[null, ...TEMAS].map((tm) => (
                <button
                  key={String(tm)}
                  type="button"
                  aria-pressed={tema === tm}
                  onClick={() => setTema(tm)}
                  className={`rounded-control border px-4 py-2 text-sm transition-colors ${
                    tema === tm ? "border-accent bg-accent text-accent-on" : "border-line-strong text-fg hover:border-fg"
                  }`}
                >
                  {tm === null ? t.mural.todos : t.temas[tm]}
                </button>
              ))}
            </div>

            {/* key={tema}: trocar o filtro remonta a grade e a cascata de entrada roda de novo. */}
            <ul key={String(tema)} className="mt-8 grid grid-flow-dense grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {cursos.map((c, i) => {
                const dentro = estado.noCarrinho.has(c.slug);
                const grande = i % 7 === 0;
                return (
                  <li
                    key={c.slug}
                    className={`mural-card cascata group relative ${grande ? "col-span-2 row-span-2" : ""} ${dentro ? "outline outline-2 outline-offset-2 outline-accent" : ""}`}
                    style={{ "--i": Math.min(i, 14) } as React.CSSProperties}
                  >
                    <div className="overflow-hidden">
                      <Capa curso={c} className={grande ? "[&_p]:text-[clamp(1.4rem,8cqw,2.6rem)]" : ""} />
                    </div>
                    <div className="absolute right-3 top-3">
                      <button
                        type="button"
                        /* O nome acessível contém o texto visível (preço ou "No carrinho"), como pede o WCAG 2.5.3. */
                        aria-label={`${dentro ? t.card.remover : t.card.adicionar} ${c.nome} · ${dentro ? t.vitrine.noCarrinho : formatarReais(estado.carrinho.proximo?.precoCentavos ?? 0)}`}
                        aria-pressed={dentro}
                        onClick={() => (dentro ? estado.remover(c.slug) : estado.adicionar(c.slug))}
                        className={`inline-flex items-center gap-1.5 rounded-control px-3 py-1.5 text-xs font-medium shadow-lg transition-colors active:translate-y-px ${
                          dentro ? "bg-brand-paper text-brand-ink" : "bg-accent text-accent-on hover:bg-accent-hover"
                        }`}
                      >
                        {dentro ? <Check size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />}
                        <span className="tnum">{dentro ? t.vitrine.noCarrinho : formatarReais(estado.carrinho.proximo?.precoCentavos ?? 0)}</span>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </CascaLayout>
  );
}
