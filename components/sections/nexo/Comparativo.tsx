import { Reveal } from "@/components/ui/Reveal";
import { nexoPage } from "@/lib/content";

/**
 * Comparativo contra "SaaS de Compras" (pitch Hacktown, slide 12).
 *
 * Tabela de verdade (<table>), não grid de divs: é dado tabular, e leitor de
 * tela navega por célula. As colunas são 3/4/5 de doze: o critério à esquerda
 * em texto forte, a coluna do SaaS apagada, a do Nexo em peso normal — a
 * hierarquia diz qual coluna é a nossa sem precisar de cor de destaque.
 *
 * Abaixo de md a tabela rola na horizontal dentro do próprio contêiner: em
 * cinco linhas por três colunas, empilhar viraria uma lista de quinze itens em
 * que a comparação lado a lado — o ponto da seção — se perde.
 */
export function NexoComparativo() {
  const t = nexoPage.comparativo;
  return (
    <section id="comparativo" className="border-t border-line py-24 sm:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-text">{t.eyebrow}</p>
          <h2 className="mt-4 max-w-[22ch] text-3xl font-medium leading-[1.1] tracking-[-0.03em] text-fg sm:text-4xl lg:text-5xl">
            {t.titulo[0]} <span className="text-fg-muted">{t.titulo[1]}</span>
          </h2>
        </Reveal>

        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line-strong">
                <th scope="col" className="w-3/12 py-4 pr-6 font-normal text-fg-muted" />
                <th scope="col" className="w-4/12 py-4 pr-6 font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">
                  {t.colunas[0]}
                </th>
                <th scope="col" className="w-5/12 py-4 font-mono text-[11px] uppercase tracking-[0.16em] text-accent-text">
                  {t.colunas[1]}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {t.linhas.map((l) => (
                <tr key={l.criterio}>
                  <th scope="row" className="py-5 pr-6 align-top text-base font-medium text-fg">
                    {l.criterio}
                  </th>
                  <td className="py-5 pr-6 align-top text-fg-muted">{l.saas}</td>
                  <td className="py-5 align-top text-fg">{l.nexo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
