import { Reveal } from "@/components/ui/Reveal";
import { problema } from "@/lib/content";

/**
 * "O problema" (pitch Hacktown, slides 3 e 4): dois painéis, um por slide.
 *
 * O número é o protagonista, como no deck — mas em vez do laranja sobre foto
 * escura do slide, ele entra na tipografia de display da página, no acento
 * da marca via `text-accent-text` (nunca o violeta cru como texto: DESIGN.md
 * §1). A fonte fica logo abaixo do número, visível, em mono — número sem
 * fonte na tela é copy que a regra da casa proíbe.
 *
 * Mesma família de layout das seções novas da /nexo: colunas assimétricas
 * (5/7), hairlines, sem cartão.
 */
export function Problema() {
  /* RESPIRO DE CIMA MENOR QUE O DE BAIXO, e esta é a única seção do site
     assim. Ela vem logo depois de uma hero de tela cheia, que já termina com
     a própria sobra: com `pt-32` os dois respiros somavam ~276px e o vão lia
     como buraco. Cortado, a manchete desta seção espia acima da dobra numa
     janela de 900px, que é o que convida a rolar. */
  return (
    <section id="problema" className="border-t border-line pb-24 pt-12 sm:pb-32 sm:pt-16">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent-text">{problema.eyebrow}</p>
        </Reveal>

        <div className="mt-10 divide-y divide-line border-y border-line">
          {problema.paineis.map((painel) => (
            <Reveal key={painel.numero}>
              <div className="grid grid-cols-1 gap-10 py-14 lg:grid-cols-12 lg:gap-10 lg:py-20">
                <div className="lg:col-span-5">
                  <p className="tnum text-7xl font-medium leading-none tracking-[-0.04em] text-accent-text sm:text-8xl lg:text-9xl">
                    {painel.numero}
                  </p>
                  <p className="mt-5 max-w-[34ch] text-lg leading-snug text-fg">{painel.legenda}</p>
                  <p className="mt-4 max-w-[46ch] font-mono text-[11px] leading-relaxed tracking-[0.04em] text-fg-muted">
                    {painel.fonte}
                  </p>
                </div>

                <div className="lg:col-span-7">
                  <h2 className="max-w-[20ch] text-3xl font-medium leading-[1.1] tracking-[-0.03em] text-fg sm:text-4xl lg:text-5xl">
                    {painel.titulo[0]} <span className="text-fg-muted">{painel.titulo[1]}</span>
                  </h2>
                  <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-fg-muted">{painel.lead}</p>
                  <ul className="mt-8 divide-y divide-line border-t border-line-strong">
                    {painel.itens.map((item) => (
                      <li key={item.nome} className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-12 sm:gap-6">
                        <p className="font-medium text-fg sm:col-span-4">{item.nome}</p>
                        <p className="text-fg-muted sm:col-span-8">{item.texto}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
