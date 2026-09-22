import { Fragment } from "react";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { OrquestradorGraph } from "@/components/ui/OrquestradorGraph";
import { PartnersRow } from "@/components/ui/PartnersRow";
import { nexoPage, cta, partners } from "@/lib/content";

/**
 * Capa da /nexo com o orquestrador — o mesmo esqueleto da hero da home
 * (components/sections/Hero.tsx), de propósito e a pedido: manchete em duas
 * linhas saindo de trás da máscara, filete na rampa da marca, subtexto e CTAs
 * entrando em cascata, o grafo à direita, a faixa de parceiros presa ao pé.
 *
 * O que é da /nexo e não da home: o fundo (aurora + grão da capa anterior, que
 * dão a esta página a identidade dela) e a linha de plataforma sob os CTAs.
 *
 * Capa oficial da /nexo desde 2026-09-04 (nasceu em /preview/nexo). Os três
 * prints em perspectiva que a capa anterior carregava saíram — o Nexo Compras
 * continua tendo seu palco no fluxo (FluxoCompras), onde as telas têm o passo
 * que as explica.
 */
export function NexoCoverOrquestrador() {
  const t = nexoPage.hero;

  /* ALTURA: `100dvh - 4rem`, e aqui não é gosto — é conta. Nesta página o
     <main> tem `pt-16`: o nav fica ACIMA da capa, não por cima. Com
     `min-h-[100dvh]` a capa começava em y=64 e media a tela inteira, então
     terminava 64px abaixo da dobra — e a faixa de parcerias, que fecha a capa,
     ficava cortada pela borda da janela (medido em 1440x900: parcerias até
     y=907, dobra em 900). Tela menos nav é exatamente o que sobra. É a mesma
     altura da /academy e do /spend-lab, que têm a mesma estrutura.

     (Na home o número é o mesmo mas o motivo não: lá o <main> não tem padding
     e o nav fica POR CIMA da hero. Ver Hero.tsx.) */
  return (
    <section id="orquestrador" className="relative isolate flex min-h-[calc(100dvh-4rem)] flex-col overflow-hidden border-b border-line pb-12 pt-24">
      <div className="cover-aurora -z-10" aria-hidden="true" />
      <div className="cover-grain -z-10" aria-hidden="true" />

      <div className="flex flex-1 items-center">
        <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 items-center gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <h1 className="font-medium tracking-[-0.03em] text-fg">
              {t.headline.map((linha, i) => (
                <Fragment key={linha}>
                  <span className="block overflow-hidden pb-[0.08em]">
                    <span
                      className="hero-line block whitespace-nowrap text-[min(5.6vw,1.9rem)] leading-[1.1] sm:text-[min(5vw,2.6rem)] lg:text-[min(3.5vw,3.2rem)]"
                      style={{ animationDelay: `${60 + i * 80}ms` }}
                    >
                      {linha}
                    </span>
                  </span>
                  {/* O ESPAÇO ENTRE AS t.headline É TEXTO, e precisa existir no DOM.
                      Cada linha da manchete é um <span class="block">, e spans
                      colados no HTML viram uma palavra só no textContent: o
                      leitor de tela lia "paraCompras" e o buscador indexava
                      isso. Entre blocos, um nó de espaço não gera caixa
                      visível — o layout não muda, a frase volta a ser frase.
                      (lib/markdown-agentes.ts tem a regra irmã, para o
                      markdown servido a agentes.) */}
                  {i < t.headline.length - 1 ? " " : null}
                </Fragment>
              ))}
            </h1>

            <div
              className="hero-fade mt-8 h-px w-full max-w-[420px] bg-[linear-gradient(90deg,var(--brand-violet),var(--brand-indigo),var(--brand-periwinkle),var(--brand-blue),var(--brand-sky))]"
              style={{ animationDelay: "240ms" }}
            />

            <p className="hero-fade mt-8 max-w-[52ch] text-base leading-relaxed text-fg-muted sm:text-lg" style={{ animationDelay: "300ms" }}>
              {t.subtext}
            </p>

            <div className="hero-fade mt-10 flex flex-wrap items-center gap-3" style={{ animationDelay: "380ms" }}>
              <a
                href="#contato"
                className="group inline-flex items-center gap-2 rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-[background-color,transform] duration-200 hover:bg-accent-hover active:scale-[0.98]"
              >
                <span className="whitespace-nowrap">{cta.contact}</span>
                <ArrowRight size={17} weight="regular" className="transition-transform duration-300 group-hover:translate-x-1" />
              </a>
              <a
                href="#na-pratica"
                className="inline-flex items-center rounded-control border border-line-strong px-7 py-3.5 font-medium text-fg transition-colors duration-200 hover:border-fg active:scale-[0.98]"
              >
                <span className="whitespace-nowrap">{t.ctaSecundario}</span>
              </a>
            </div>

            <p className="hero-fade mt-6 text-sm text-fg-muted" style={{ animationDelay: "440ms" }}>
              {t.platform}
            </p>
          </div>

          {/* pr-6 em lg: os rótulos da direita ficam fora do anel e precisam
              da calha até a borda da viewport para não cortar entre 1024 e 1440. */}
          <div className="hero-fade relative lg:col-span-5 lg:pr-6" style={{ animationDelay: "180ms" }}>
            <OrquestradorGraph />
          </div>
        </div>
      </div>

      <div className="hero-fade mt-8 shrink-0" style={{ animationDelay: "460ms" }}>
        <p className="mx-auto mb-4 w-full max-w-[1400px] px-5 font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted sm:px-8">
          {partners.label}
        </p>
        <PartnersRow />
      </div>
    </section>
  );
}
