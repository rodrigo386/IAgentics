import { Reveal } from "@/components/ui/Reveal";

export type ItemFaq = { pergunta: string; resposta: string };

/**
 * O bloco de perguntas frequentes, usado por /nexo, /academy e /spend-lab.
 *
 * Tudo ABERTO, sem accordion: quem extrai resposta (buscador, assistente de
 * IA) pode não renderizar conteúdo escondido atrás de clique — e esconder o
 * que o comprador quer saber nunca ajudou ninguém a decidir.
 *
 * Mesma gramática das outras seções: pergunta na margem, resposta na medida
 * ao lado, separadas por fio. Nada de caixa — as pranchas é que têm moldura
 * nestas páginas (ver nexo/Differentiators).
 *
 * O conteúdo NÃO mora aqui: cada página passa o seu, de lib/content.ts, e o
 * mesmo array alimenta o JSON-LD (faqJsonLd em lib/seo.ts). É o que impede o
 * dado estruturado de prometer uma resposta e a página mostrar outra.
 */
export function SecaoFaq({
  eyebrow,
  titulo,
  itens,
}: {
  eyebrow: string;
  titulo: string;
  itens: ReadonlyArray<ItemFaq>;
}) {
  return (
    <section className="border-t border-line py-24 sm:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{eyebrow}</p>
          <h2 className="mt-6 max-w-[18ch] text-4xl font-medium tracking-[-0.03em] text-fg sm:text-5xl lg:text-6xl">
            {titulo}
          </h2>
        </Reveal>

        <dl className="mt-16">
          {itens.map((item) => (
            <Reveal key={item.pergunta}>
              <div className="grid grid-cols-1 gap-3 border-t border-line-strong py-10 lg:grid-cols-12 lg:gap-8 lg:py-12">
                <dt className="text-xl font-medium tracking-[-0.02em] text-fg lg:col-span-5 lg:text-2xl">
                  {item.pergunta}
                </dt>
                <dd className="max-w-[52ch] text-lg leading-relaxed text-fg-muted lg:col-span-6 lg:col-start-7">
                  {item.resposta}
                </dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
