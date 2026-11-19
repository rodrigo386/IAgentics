import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { PacoteReforma } from "@/components/sections/reforma/PacoteReforma";
import { consultaNcm as t } from "@/lib/content";
import { buscar, consultar, formatarNcm, VERSAO_TABELA, type Tratamento } from "@/lib/consulta-ncm";
import { REDUCOES, ROTA_REFORMA } from "@/lib/reforma";
import { faqJsonLd, ogDaPagina } from "@/lib/seo";

/**
 * Consulta de NCM na Reforma Tributária (2026-11-19). Renderizada no servidor
 * a cada busca (GET com `q` ou `ncm`): funciona sem JavaScript, o buscador lê o
 * resultado como HTML, e a tabela (1,2 MB) não vai para o navegador.
 *
 * Só a página sem parâmetro é indexada: cada busca aponta o canonical para ela
 * e leva noindex, para o Google não guardar milhares de variações finas da
 * mesma página. (Páginas próprias por NCM ficaram para depois do alerta de
 * mudanças na tabela: página parada com dado fiscal velho atrapalha.)
 */
type Params = Promise<{ q?: string; ncm?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: Params }): Promise<Metadata> {
  const { q, ncm } = await searchParams;
  return {
    title: { absolute: t.meta.titulo },
    description: t.meta.descricao,
    alternates: { canonical: t.rota },
    openGraph: ogDaPagina(t.rota, t.meta.titulo, t.meta.descricao),
    ...(q || ncm ? { robots: { index: false, follow: true } } : {}),
  };
}

const campo = "w-full min-w-0 rounded-control border border-line bg-bg px-4 py-3.5 text-fg outline-none focus-visible:border-fg";
const botao =
  "group inline-flex shrink-0 items-center justify-center gap-2 rounded-control bg-accent px-6 py-3.5 font-medium text-accent-on transition-[background-color,transform] duration-200 hover:bg-accent-hover active:scale-[0.98]";
const dataBr = (iso: string) => iso.split("-").reverse().join("/");

export default async function Page({ searchParams }: { searchParams: Params }) {
  const { q: qBruto, ncm } = await searchParams;
  const q = (qBruto ?? "").slice(0, 80);
  const consulta = ncm ? consultar(ncm) : null;
  const busca = !ncm && q ? buscar(q) : null;

  return (
    <>
      <JsonLd dados={faqJsonLd(t.faq)} />
      <Nav />
      <main id="conteudo" className="pt-16">
        <PacoteReforma atual="consulta" />
        <section className="border-b border-line py-16 sm:py-20">
          <div className="mx-auto max-w-[1100px] px-5 sm:px-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.capa.kicker}</p>
            <h1 className="mt-5 max-w-[20ch] text-[min(9vw,2.75rem)] font-medium leading-[1.08] tracking-[-0.04em] text-fg sm:text-[3.5rem]">
              {t.capa.titulo}
            </h1>
            <p className="mt-6 max-w-[65ch] text-lg leading-relaxed text-fg-muted">{t.capa.lead}</p>
            <form action={t.rota} method="get" role="search" className="mt-10 flex flex-col gap-2">
              <label htmlFor="q" className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">
                {t.capa.rotulo}
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input id="q" name="q" type="search" defaultValue={q} placeholder={t.capa.placeholder} maxLength={80} autoComplete="off" className={campo} />
                <button type="submit" className={botao}>
                  <MagnifyingGlass size={18} />
                  <span>{t.capa.buscar}</span>
                </button>
              </div>
            </form>
            <Link href={ROTA_REFORMA} className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-accent-text hover:underline">
              {t.atalho} <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {busca ? (
          <section className="border-b border-line py-12 sm:py-16" aria-labelledby="resultados">
            <div className="mx-auto max-w-[1100px] px-5 sm:px-8">
              {q.replace(/[^\p{L}\p{N}]/gu, "").length < 2 ? (
                <p className="text-fg-muted">{t.resultados.curta}</p>
              ) : busca.total === 0 ? (
                <p id="resultados" className="text-fg-muted">
                  {t.resultados.nenhum}
                </p>
              ) : (
                <>
                  <h2 id="resultados" className="text-2xl font-medium tracking-[-0.02em] text-fg">
                    {t.resultados.titulo(q, busca.total)}
                  </h2>
                  {busca.total > busca.achados.length ? <p className="mt-2 text-sm text-fg-muted">{t.resultados.mostrando(busca.achados.length)}</p> : null}
                  <ul className="mt-6 flex flex-col border-t border-line">
                    {busca.achados.map((a) => (
                      <li key={a.codigo} className="border-b border-line">
                        <Link
                          href={`${t.rota}?ncm=${a.codigo}`}
                          className="grid grid-cols-1 gap-1 py-4 transition-colors hover:bg-surface sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4 sm:px-2"
                          prefetch={false}
                        >
                          <span className="font-mono font-medium tabular-nums text-fg">{formatarNcm(a.codigo)}</span>
                          <span className="flex flex-col">
                            <span className="text-fg">{a.descricao}</span>
                            {a.contexto ? <span className="line-clamp-1 text-sm text-fg-muted">{a.contexto}</span> : null}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </section>
        ) : null}

        {ncm ? (
          <section className="border-b border-line py-12 sm:py-16" aria-labelledby="ncm-titulo">
            <div className="mx-auto flex max-w-[1100px] flex-col gap-10 px-5 sm:px-8">
              <Link href={t.rota} className="inline-flex items-center gap-2 text-sm text-fg-muted hover:text-fg" prefetch={false}>
                <ArrowLeft size={14} /> {t.ncm.voltar}
              </Link>
              {!consulta ? (
                <p className="text-fg-muted">{t.ncm.naoEncontrado}</p>
              ) : (
                <>
                  <div className="flex flex-col gap-3">
                    <p className="font-mono text-3xl font-medium tabular-nums text-fg sm:text-4xl">{formatarNcm(consulta.codigo)}</p>
                    <h2 id="ncm-titulo" className="max-w-[60ch] text-xl font-medium text-fg">
                      {consulta.descricao}
                    </h2>
                    <details className="max-w-[80ch] text-sm text-fg-muted">
                      <summary className="cursor-pointer">{t.ncm.caminho}</summary>
                      <ol className="mt-3 flex flex-col gap-1.5 border-l-2 border-line pl-4">
                        {consulta.caminho.map((n) => (
                          <li key={n.codigo}>
                            <span className="font-mono text-fg">{formatarNcm(n.codigo)}</span> {n.descricao}
                          </li>
                        ))}
                      </ol>
                    </details>
                  </div>

                  <div className="flex flex-col gap-4">
                    <h3 className="text-2xl font-medium tracking-[-0.02em] text-fg">{t.ncm.tratamentosTitulo}</h3>
                    {consulta.tratamentos.length ? (
                      <>
                        <p className="max-w-[70ch] text-sm text-fg-muted">{t.ncm.tratamentosNota}</p>
                        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                          {consulta.tratamentos.map((tr) => (
                            <CartaoTratamento key={tr.cClassTrib} tr={tr} />
                          ))}
                        </ul>
                      </>
                    ) : (
                      <p className="max-w-[70ch] text-fg">
                        {t.ncm.semTratamento} <b className="font-mono font-medium">cClassTrib {consulta.integral.cClassTrib}</b> (CST {consulta.integral.cst},{" "}
                        {consulta.integral.situacao.toLowerCase()}).
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 border-t border-line pt-6">
                    <h3 className="text-lg font-medium text-fg">{t.ncm.seletivoTitulo}</h3>
                    <p className="max-w-[70ch] text-fg-muted">{consulta.seletivo.length ? t.ncm.seletivoSim : t.ncm.seletivoNao}</p>
                  </div>
                </>
              )}
            </div>
          </section>
        ) : null}

        <section className="border-b border-line py-16 sm:py-20">
          <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-12 px-5 sm:px-8 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
              <h2 className="text-2xl font-medium tracking-[-0.03em] text-fg sm:text-3xl">{t.comoLer.titulo}</h2>
              <ul className="flex flex-col gap-3">
                {t.comoLer.itens.map((i) => (
                  <li key={i} className="border-l-2 border-accent pl-4 leading-relaxed text-fg-muted">
                    {i}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-4 self-start border border-line bg-surface p-6 sm:p-8">
              <h2 className="text-2xl font-medium tracking-[-0.03em] text-fg">{t.calculadora.titulo}</h2>
              <p className="leading-relaxed text-fg-muted">{t.calculadora.texto}</p>
              <div>
                <Link href={ROTA_REFORMA} className={botao}>
                  <span className="whitespace-nowrap">{t.calculadora.cta}</span>
                  <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-line py-16 sm:py-20">
          <div className="mx-auto max-w-[860px] px-5 sm:px-8">
            <h2 className="text-3xl font-medium tracking-[-0.03em] text-fg sm:text-4xl">{t.faqTitulo}</h2>
            <div className="mt-8 flex flex-col">
              {t.faq.map((f) => (
                <details key={f.pergunta} className="border-b border-line py-5">
                  <summary className="cursor-pointer list-none text-lg font-medium text-fg">{f.pergunta}</summary>
                  <p className="mt-3 leading-relaxed text-fg-muted">{f.resposta}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="mx-auto max-w-[1100px] px-5 sm:px-8">
            <h2 className="text-lg font-medium text-fg">{t.fonte.titulo}</h2>
            <p className="mt-2 max-w-[80ch] text-sm leading-relaxed text-fg-muted">
              {t.fonte.texto(VERSAO_TABELA.versaoBase ?? "", dataBr(VERSAO_TABELA.geradoEm))}{" "}
              <a href={t.fonte.url} className="text-fg underline underline-offset-4" target="_blank" rel="noopener noreferrer">
                {t.fonte.link}
              </a>
              .
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function CartaoTratamento({ tr }: { tr: Tratamento }) {
  const r = tr.reducao.cbs ?? 0;
  const calculavel = (REDUCOES as readonly number[]).includes(r) && r > 0;
  return (
    <li className="flex flex-col gap-4 border border-line bg-surface p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <span className="font-mono text-xl font-medium tabular-nums text-fg">cClassTrib {tr.cClassTrib}</span>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-muted">
          CST {tr.cst} · {tr.situacao}
        </span>
      </div>
      <p className="text-fg">{tr.descricao}</p>
      <dl className="flex flex-col gap-3 text-sm">
        <div>
          <dt className="text-fg-muted">{t.ncm.reducao}</dt>
          <dd className="font-mono text-2xl font-medium tabular-nums text-accent-text">{r}%</dd>
        </div>
        {tr.condicao ? (
          <div>
            <dt className="text-fg-muted">
              {t.ncm.condicao}
              {tr.anexo ? ` · ${t.ncm.anexo} ${tr.anexo}` : ""}
            </dt>
            <dd className="leading-relaxed text-fg">{tr.condicao}</dd>
          </div>
        ) : null}
        {tr.fundamento.length ? (
          <div>
            <dt className="text-fg-muted">{t.ncm.fundamento}</dt>
            <dd className="leading-relaxed text-fg">
              {tr.fundamento.map((f) => (
                <span key={f.referencia} className="block">
                  <b className="font-medium">{f.referencia}, LC 214/2025.</b> {f.texto.replace(/^Art\. [^.]+\.\s*/, "")}
                </span>
              ))}
            </dd>
          </div>
        ) : null}
      </dl>
      {calculavel ? (
        <Link href={`${ROTA_REFORMA}?reducao=${r}#calculadora`} className="inline-flex items-center gap-2 self-start text-sm font-medium text-accent-text hover:underline">
          {t.ncm.calcular(r)} <ArrowRight size={14} />
        </Link>
      ) : null}
    </li>
  );
}
