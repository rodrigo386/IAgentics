import { Reveal } from "@/components/ui/Reveal";
import { PausaAnimacao } from "@/components/ui/PausaAnimacao";
import { nexoPage } from "@/lib/content";

/**
 * "Uma tela, a compra inteira" (2026-10-07, pedido do Rodrigo): o padrão
 * "morphing UI states" do prompt-motion.com. A MESMA tela passa de requisição
 * para cotação e depois para aprovação, sem trocar de imagem — os itens ficam,
 * as colunas de preço entram, a tabela recolhe e o resumo da aprovação abre.
 *
 * CSS puro (classes .tv-* em globals.css), laço de 12 s, quatro segundos por
 * estado. Sem animação (reduced motion, ou CSS ainda não carregado), tudo fica
 * visível ao mesmo tempo: os preços, o resumo e o rótulo da cotação — a tela
 * parada mostra a compra inteira, não um estado pela metade.
 *
 * A tela é decorativa para leitor de tela (aria-hidden); quem não a vê recebe
 * o `resumo`, que conta os três estados em texto.
 */
const t = nexoPage.telaViva;

export function NexoTelaViva() {
  return (
    <section aria-labelledby="tela-viva" className="border-t border-line py-24 sm:py-32">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-y-10 px-5 sm:px-8 lg:grid-cols-12 lg:items-center lg:gap-x-12">
        <Reveal className="lg:col-span-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-text">{t.eyebrow}</p>
          <h2 id="tela-viva" className="mt-4 max-w-[16ch] text-4xl font-medium tracking-[-0.03em] text-fg sm:text-5xl">
            {t.titulo}
          </h2>
          <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-fg-muted">{t.lead}</p>
          {/* Os três estados, em texto e na ordem — também a legenda do laço. */}
          <ol className="mt-8 flex flex-wrap gap-2">
            {t.estados.map((e, i) => (
              <li key={e} className="tv-legenda rounded-control border border-line-strong px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-fg" style={{ "--i": i } as React.CSSProperties}>
                {String(i + 1).padStart(2, "0")} {e}
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal className="lg:col-span-8">
          <p className="sr-only">{t.resumo}</p>
          <PausaAnimacao textos={{ pausar: t.pausar, continuar: t.continuar }}>
            <div aria-hidden="true" className="tv-tela overflow-hidden border border-line bg-surface">
              {/* Barra da janela: o número da RC fica; o estado troca. */}
              <div className="flex items-center justify-between gap-4 border-b border-line py-4 pl-5 pr-16 sm:pl-6">
                <span className="font-mono text-xs tracking-[0.08em] text-fg-muted">{t.rc}</span>
                <span className="relative grid">
                  {t.estados.map((e, i) => (
                    <span
                      key={e}
                      className="tv-estado col-start-1 row-start-1 rounded-control bg-accent px-3 py-1 text-center text-xs font-medium text-accent-on"
                      style={{ "--i": i } as React.CSSProperties}
                    >
                      {e}
                    </span>
                  ))}
                </span>
              </div>

              {/* Os três degraus: cada um enche na sua vez e fica cheio. */}
              <div className="grid grid-cols-3 gap-1 px-5 pt-4 sm:px-6">
                {t.estados.map((e, i) => (
                  <span key={e} className="h-1 overflow-hidden bg-line">
                    <span className={`tv-degrau-${i} block h-full origin-left bg-accent`} />
                  </span>
                ))}
              </div>

              {/* A tabela: itens sempre; preços entram na cotação; a tabela
                  inteira recolhe na aprovação (grid 1fr → 0fr). */}
              <div className="tv-tabela grid">
                <div className="min-h-0 overflow-hidden">
                  <div className="px-5 pb-2 pt-5 sm:px-6">
                    <div className="grid grid-cols-[minmax(0,1.6fr)_0.6fr_repeat(3,minmax(0,1fr))] gap-x-2 border-b border-line pb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-fg-muted sm:text-[11px]">
                      <span>{t.colunas.item}</span>
                      <span className="text-right">{t.colunas.qtd}</span>
                      {t.colunas.fornecedores.map((f, j) => (
                        <span key={f} className="tv-preco truncate text-right" style={{ "--j": j } as React.CSSProperties}>
                          {f}
                        </span>
                      ))}
                    </div>
                    {t.itens.map((item) => (
                      <div key={item.nome} className="grid grid-cols-[minmax(0,1.6fr)_0.6fr_repeat(3,minmax(0,1fr))] items-center gap-x-2 border-b border-line py-3 text-xs text-fg sm:text-sm">
                        <span className="truncate">{item.nome}</span>
                        <span className="tnum text-right text-fg-muted">{item.qtd}</span>
                        {item.precos.map((p, j) => (
                          <span
                            key={j}
                            className={`tv-preco tnum px-1 py-0.5 text-right ${j === item.melhor ? "tv-melhor" : "text-fg-muted"}`}
                            style={{ "--j": j } as React.CSSProperties}
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    ))}
                    {/* Rodapé que muda: aprovadora indicada (RC) → propostas (cotação). */}
                    <div className="relative mt-3 grid text-xs text-fg-muted sm:text-sm">
                      <span className="tv-nota-rc col-start-1 row-start-1">{t.aprovadoraRc}</span>
                      <span className="tv-nota-cot col-start-1 row-start-1">{t.rotuloCotacao}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* O resumo da aprovação: abre quando a tabela recolhe. */}
              <div className="tv-resumo grid">
                <div className="min-h-0 overflow-hidden">
                  <div className="px-5 pb-6 pt-5 sm:px-6">
                    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-muted">{t.aprovacao.rotulo}</p>
                    <p className="tnum mt-2 text-3xl font-medium tracking-[-0.02em] text-fg sm:text-4xl">{t.aprovacao.total}</p>
                    <p className="mt-2 text-sm text-fg-muted">{t.aprovacao.divisao}</p>
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                      <span className="text-sm text-fg">{t.aprovacao.aprovador}</span>
                      <span className="tv-botao rounded-control bg-accent px-5 py-2 text-sm font-medium text-accent-on">{t.aprovacao.botao}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </PausaAnimacao>
        </Reveal>
      </div>
    </section>
  );
}
