import { PausaAnimacao } from "@/components/ui/PausaAnimacao";
import { explicadores } from "@/lib/content";

/**
 * "Mapa de cotação em 30 segundos" (2026-10-07, pedido do Rodrigo, estilo
 * "explainer" do prompt-motion.com): cinco passos de 6 s em laço, em CSS puro
 * (classes .exp-* em globals.css). O mesmo mapa vai ganhando camadas — as
 * propostas, o destaque do melhor preço, os totais, o prazo — e nada sai do
 * lugar: cada célula existe desde o início e só acende na sua vez, então a
 * tabela não pula.
 *
 * O TEXTO É DE VERDADE: os cinco passos estão numa lista na página. Com
 * animação, a lista vira apoio de leitor de tela e a legenda visível troca
 * passo a passo; sem animação (reduced motion), a lista aparece inteira e o
 * mapa fica completo. O buscador lê o mesmo texto nos dois casos.
 */
const t = explicadores.mapaDeCotacao;
const COLUNAS = "grid-cols-[minmax(0,1.4fr)_0.5fr_repeat(3,minmax(0,1fr))]";

export function ExplicadorMapaCotacao() {
  return (
    <figure className="explicador">
      <PausaAnimacao textos={{ pausar: explicadores.pausar, continuar: explicadores.continuar }} className="border border-line bg-surface p-5 sm:p-7">
        <figcaption className="pr-12 font-mono text-[11px] uppercase tracking-[0.16em] text-accent-text">{t.titulo}</figcaption>

        {/* Progresso: um degrau por passo, cada um enche na sua vez. */}
        <div className="exp-progresso mt-4 grid grid-cols-5 gap-1" aria-hidden="true">
          {t.passos.map((_, i) => (
            <span key={i} className="h-1 overflow-hidden bg-line">
              <span className={`exp-degrau-${i} block h-full origin-left bg-accent`} />
            </span>
          ))}
        </div>

        {/* A legenda que troca (só com animação) — decorativa: o texto real é a lista abaixo. */}
        <div className="exp-legenda mt-5 min-h-[3.5em] text-lg leading-snug text-fg" aria-hidden="true">
          {t.passos.map((p, i) => (
            <p key={i} className="exp-janela col-start-1 row-start-1" style={{ "--i": i } as React.CSSProperties}>
              <span className="mr-2 font-mono text-[11px] tracking-[0.14em] text-fg-muted">{t.rotuloPasso(i + 1, t.passos.length)}</span>
              {p}
            </p>
          ))}
        </div>
        <ol className="exp-lista mt-5 list-decimal space-y-2 pl-5 text-base leading-snug text-fg">
          {t.passos.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ol>

        {/* O mapa */}
        <div className="mt-6 overflow-x-auto" aria-hidden="true">
          <div className="min-w-[30rem] text-sm">
            <div className={`grid ${COLUNAS} gap-x-2 border-b border-line pb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-fg-muted`}>
              <span>{t.colunas.item}</span>
              <span className="text-right">{t.colunas.qtd}</span>
              {t.colunas.fornecedores.map((f, j) => (
                <span key={f} className="exp-a2 text-right" style={{ "--j": j } as React.CSSProperties}>
                  {f}
                </span>
              ))}
            </div>
            {t.itens.map((item) => (
              <div key={item.nome} className={`grid ${COLUNAS} items-center gap-x-2 border-b border-line py-2.5 text-fg`}>
                <span className="truncate">{item.nome}</span>
                <span className="tnum text-right text-fg-muted">{item.qtd}</span>
                {item.precos.map((p, j) => (
                  <span key={j} className={`exp-a2 tnum px-1 py-0.5 text-right ${j === item.melhor ? "exp-melhor" : "text-fg-muted"}`} style={{ "--j": j } as React.CSSProperties}>
                    {p}
                  </span>
                ))}
              </div>
            ))}
            {/* Totais: só o fornecedor completo é comparável sozinho. */}
            <div className={`exp-a4 grid ${COLUNAS} items-center gap-x-2 border-b border-line-strong py-2.5`}>
              <span className="col-span-2 font-medium text-fg">{t.totais.rotulo}</span>
              {t.totais.valores.map((v, j) => (
                <span key={j} className={`tnum text-right ${j === t.totais.completo ? "font-medium text-fg" : "text-fg-subtle"}`}>
                  {v}
                </span>
              ))}
            </div>
            <div className="exp-a4 mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border border-accent px-3 py-2">
              <span className="font-medium text-fg">
                {t.combinacao.rotulo}: <span className="tnum text-accent-text">{t.combinacao.valor}</span>
              </span>
              <span className="text-fg-muted">{t.combinacao.economia}</span>
            </div>
            {/* Prazo e motivo: o último passo. */}
            <div className={`exp-a5 mt-3 grid ${COLUNAS} items-center gap-x-2 border-b border-line py-2.5`}>
              <span className="col-span-2 text-fg">{t.prazo.rotulo}</span>
              {t.prazo.valores.map((v, j) => (
                <span key={j} className="tnum text-right text-fg-muted">
                  {v}
                </span>
              ))}
            </div>
            <p className="exp-a5 mt-3 text-fg-muted">{t.motivo}</p>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-fg-subtle">{t.notaUnidade}</p>
          </div>
        </div>
      </PausaAnimacao>
    </figure>
  );
}
