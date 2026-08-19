import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { contact, privacidade as t } from "@/lib/content";
import { ogDaPagina } from "@/lib/seo";

export const metadata: Metadata = {
  title: t.meta.titulo,
  description: t.meta.descricao,
  alternates: { canonical: "/privacidade" },
  openGraph: ogDaPagina("/privacidade", `${t.meta.titulo} · IAgentics`, t.meta.descricao),
};

/**
 * A política de privacidade, em documento corrido.
 *
 * Existe por duas razões somadas: o site coleta dados de verdade (formulário
 * de contato, contas de aluno, CPF na cobrança) e /privacidade era a segunda
 * página mais exibida do domínio no Google — respondendo 404, herança do site
 * antigo. Quem clicava batia numa parede.
 *
 * Layout de leitura, não de venda: coluna única, medida curta, hierarquia por
 * fio. Sem Reveal aqui de propósito — texto legal não deve depender de
 * animação de entrada para ser lido, nem esperar scroll para aparecer.
 */
export default function Page() {
  return (
    <>
      <Nav />
      <main id="conteudo" className="pt-16">
        <article className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 sm:py-32">
          <header className="max-w-[46ch]">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.hero.eyebrow}</p>
            <h1 className="mt-6 text-4xl font-medium tracking-[-0.03em] text-fg sm:text-5xl lg:text-6xl">
              {t.hero.titulo}
            </h1>
            <p className="mt-6 font-mono text-sm text-fg-subtle">{t.hero.atualizado}</p>
            <p className="mt-8 text-lg leading-relaxed text-fg-muted">{t.hero.lead}</p>
          </header>

          <div className="mt-20 flex flex-col">
            {t.secoes.map((secao) => (
              <section key={secao.titulo} className="border-t border-line-strong py-10 lg:py-12">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
                  <h2 className="text-2xl font-medium tracking-[-0.02em] text-fg lg:col-span-4">{secao.titulo}</h2>

                  <div className="flex flex-col gap-6 lg:col-span-7 lg:col-start-6">
                    {secao.paragrafos.map((paragrafo) => (
                      <p key={paragrafo} className="max-w-[62ch] text-lg leading-relaxed text-fg-muted">
                        {paragrafo}
                      </p>
                    ))}

                    {secao.itens.length > 0 ? (
                      <dl className="flex flex-col divide-y divide-line border-t border-line">
                        {secao.itens.map((item) => (
                          <div key={item.termo} className="py-5">
                            <dt className="text-base font-medium text-fg">{item.termo}</dt>
                            <dd className="mt-2 max-w-[62ch] leading-relaxed text-fg-muted">{item.texto}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : null}
                  </div>
                </div>
              </section>
            ))}

            <section className="border-t border-line-strong py-10 lg:py-12">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
                <h2 className="text-2xl font-medium tracking-[-0.02em] text-fg lg:col-span-4">{t.contato.titulo}</h2>
                <div className="lg:col-span-7 lg:col-start-6">
                  <p className="max-w-[62ch] text-lg leading-relaxed text-fg-muted">{t.contato.texto}</p>
                  <ul className="mt-8 flex flex-wrap gap-4">
                    {contact.social.map((canal) => (
                      <li key={canal.label}>
                        <a
                          href={canal.href}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-block rounded-control border border-line-strong px-5 py-2.5 text-sm text-fg transition-colors duration-200 hover:border-fg"
                        >
                          {canal.label}
                        </a>
                      </li>
                    ))}
                    <li>
                      <a
                        href="/#contato"
                        className="inline-block rounded-control border border-line-strong px-5 py-2.5 text-sm text-fg transition-colors duration-200 hover:border-fg"
                      >
                        {contact.headline}
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
