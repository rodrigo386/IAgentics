import type { Metadata } from "next";
import Link from "next/link";
import { Cartao } from "@/components/admin/Cartao";
import { admin } from "@/lib/content-admin";
import { listarAssinaturas, type Assinatura } from "@/lib/assinatura/assinaturas";
import { ETAPAS, etapaDoCliente, prazoDeLiberacao, type Etapa } from "@/lib/assinatura/fluxo";
import { hojeSP, VALOR_ASSINATURA_CENTAVOS } from "@/lib/assinatura/regras";
import { formatarReais } from "@/lib/catalogo/preco";
import { assinaturasPorDia, funilCursos, origensCursos, resumoCursos, visitasCursosPorDia } from "@/lib/admin/cursos";
import { cancelarAssinaturaAdmin, liberarAcessoAssinatura, revogarAcessoAssinatura } from "../acoes";

/**
 * /admin/cursos (2026-10-16, pedido do Rodrigo: "controle mais completo da
 * plataforma cursos, uma página separada com dashboard, gráficos, fluxo do
 * cliente"). Atrás do mesmo Basic Auth do /admin (o middleware cobre o
 * prefixo inteiro).
 *
 * De cima para baixo: indicadores, funil do período, três gráficos (visitas
 * por dia, assinaturas por dia, origem das chegadas), o quadro do fluxo do
 * cliente com os botões de ação e a tabela completa. Gráficos em CSS puro,
 * como os do /admin: sem biblioteca e sem JS.
 */
const t = admin.cursos;
export const metadata: Metadata = { title: t.meta.titulo, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const numero = new Intl.NumberFormat("pt-BR");
const dataHora = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
const diaMes = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const dataCompleta = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
const pct = (parte: number, todo: number) => (todo > 0 ? ((parte / todo) * 100).toFixed(1).replace(".", ",") : "0");
const whatsapp = (telefone: string) => `https://wa.me/55${telefone.replace(/\D/g, "")}`;

/** Cartões por coluna sem ação; as de liberar e revogar mostram todos. */
const LIMITE_COLUNA = 12;

const COR_PRAZO: Record<string, string> = {
  "no-prazo": "border-line-strong text-fg-muted",
  "vence-logo": "border-accent text-accent-text",
  atrasado: "border-accent bg-accent text-accent-on",
};

/** Botões de cada cartão do quadro: os mesmos do /admin. */
function Acoes({ a, etapa }: { a: Assinatura; etapa: Etapa }) {
  const s = admin.assinaturas;
  return (
    <div className="mt-3 flex flex-col gap-2">
      {etapa === "liberar" ? (
        <form action={liberarAcessoAssinatura}>
          <input type="hidden" name="id" value={a.id} />
          <button type="submit" className="w-full rounded-control bg-accent px-3 py-1.5 text-xs font-medium text-accent-on">
            {s.botaoLiberar}
          </button>
        </form>
      ) : null}
      {etapa === "revogar" ? (
        <form action={revogarAcessoAssinatura}>
          <input type="hidden" name="id" value={a.id} />
          <button type="submit" className="w-full rounded-control border border-line-strong px-3 py-1.5 text-xs font-medium text-fg">
            {s.botaoRevogar}
          </button>
        </form>
      ) : null}
      {["pendente", "ativa", "atrasada", "falhou"].includes(a.status) ? (
        /* Dois cliques de propósito: cancelar para a cobrança no Asaas. */
        <details>
          <summary className="cursor-pointer text-xs text-fg-muted underline">{s.cancelar}</summary>
          <form action={cancelarAssinaturaAdmin} className="mt-2">
            <input type="hidden" name="id" value={a.id} />
            <button type="submit" className="rounded-control border border-line-strong px-3 py-1.5 text-xs text-fg">
              {s.confirmarCancelar}
            </button>
          </form>
        </details>
      ) : null}
    </div>
  );
}

export default async function PaginaCursos({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  const pedido = Number((await searchParams).dias);
  const dias = (t.periodos as readonly number[]).includes(pedido) ? pedido : 30;
  const hoje = hojeSP();
  const agora = new Date();

  const [resumo, funil, visitas, porDia, origens, todas] = await Promise.all([
    resumoCursos(dias),
    funilCursos(dias),
    visitasCursosPorDia(dias),
    assinaturasPorDia(dias),
    origensCursos(dias),
    listarAssinaturas(),
  ]);

  const comEtapa = todas.map((a) => ({ a, etapa: etapaDoCliente(a, hoje) }));
  const porEtapa = (e: Etapa) => comEtapa.filter((x) => x.etapa === e).map((x) => x.a);
  const aLiberar = porEtapa("liberar");
  const foraDoPrazo = aLiberar.filter((a) => a.ultimoPagamentoEm && prazoDeLiberacao(a.ultimoPagamentoEm, agora).situacao === "atrasado").length;

  const picoVisitas = Math.max(1, ...visitas.map((d) => d.visitas));
  const picoAssinaturas = Math.max(1, ...porDia.map((d) => d.iniciadas));
  const totalOrigens = origens.reduce((s, o) => s + o.visitas, 0);
  const etapasFunil = [funil.visitas, funil.iniciadas, funil.pagaram, funil.liberadas];

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-12 px-5 py-12 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Link href="/admin" className="text-sm text-fg-muted underline">
            {t.voltar}
          </Link>
          <h1 className="mt-3 text-3xl font-medium tracking-[-0.03em] text-fg">{t.titulo}</h1>
          <p className="mt-2 text-fg-muted">{t.lead}</p>
        </div>
        <nav aria-label={t.periodo} className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">{t.periodo}</span>
          {t.periodos.map((p) => (
            <Link
              key={p}
              href={`/admin/cursos?dias=${p}`}
              aria-current={p === dias ? "page" : undefined}
              className={`rounded-control border px-3 py-1.5 text-sm ${p === dias ? "border-accent bg-accent text-accent-on" : "border-line-strong text-fg"}`}
            >
              {t.dias(p)}
            </Link>
          ))}
        </nav>
      </header>

      {/* Indicadores */}
      <section aria-label={t.titulo} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Cartao rotulo={t.indicadores.ativas} valor={numero.format(resumo.ativas)} />
        <Cartao
          rotulo={t.indicadores.receita}
          valor={formatarReais(resumo.ativas * VALOR_ASSINATURA_CENTAVOS)}
          nota={t.indicadores.receitaNota}
        />
        <Cartao
          rotulo={t.indicadores.conversao}
          valor={`${pct(resumo.pagaramNoPeriodo, funil.visitas)}%`}
          nota={t.indicadores.conversaoNota(resumo.pagaramNoPeriodo, funil.visitas)}
        />
        <Cartao
          rotulo={t.indicadores.liberar}
          valor={numero.format(aLiberar.length)}
          nota={aLiberar.length ? t.indicadores.liberarNota(foraDoPrazo) : undefined}
          alerta={aLiberar.length > 0}
        />
        <Cartao rotulo={t.indicadores.atrasadas} valor={numero.format(resumo.atrasadas)} alerta={resumo.atrasadas > 0} />
        <Cartao
          rotulo={t.indicadores.canceladas}
          valor={numero.format(resumo.canceladasNoPeriodo)}
          nota={t.indicadores.canceladasNota(resumo.pagaramDesdeSempre)}
        />
      </section>

      {/* Funil */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">
          {t.funil.titulo} · {t.dias(dias)}
        </h2>
        <ol className="flex flex-col gap-3">
          {t.funil.etapas.map((nome, i) => {
            const valor = etapasFunil.at(i) ?? 0;
            const anterior = i > 0 ? (etapasFunil.at(i - 1) ?? 0) : null;
            return (
              <li key={nome} className="grid grid-cols-[180px_1fr] items-center gap-4 sm:grid-cols-[220px_1fr]">
                <span className="text-sm text-fg">{nome}</span>
                <div className="flex items-center gap-3">
                  <div
                    className="h-7 bg-accent/80"
                    style={{ width: `${Math.max(1.5, (valor / Math.max(1, funil.visitas)) * 100)}%` }}
                  />
                  <span className="shrink-0 text-sm tabular-nums text-fg">
                    <strong className="font-medium">{numero.format(valor)}</strong>
                    {anterior !== null ? <span className="ml-2 text-fg-muted">{t.funil.taxa(pct(valor, anterior))}</span> : null}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
        <p className="max-w-[80ch] text-xs text-fg-muted">{t.funil.nota}</p>
      </section>

      {/* Gráficos */}
      <section className="grid gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.graficos.visitas}</h2>
          <div className="flex h-44 items-end gap-[3px] border-b border-line" role="img" aria-label={t.graficos.visitas}>
            {visitas.map((d) => (
              <div key={d.dia} className="group flex-1" title={`${diaMes(d.dia)}: ${d.visitas}`}>
                <div className="w-full bg-accent/70 group-hover:bg-accent" style={{ height: `${Math.max(2, (d.visitas / picoVisitas) * 168)}px` }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs tabular-nums text-fg-muted">
            <span>{diaMes(visitas.at(0)?.dia ?? hoje)}</span>
            <span>máx. {numero.format(picoVisitas)}</span>
            <span>{diaMes(visitas.at(-1)?.dia ?? hoje)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.graficos.assinaturas}</h2>
          <div className="flex h-44 items-end gap-[3px] border-b border-line" role="img" aria-label={t.graficos.assinaturas}>
            {porDia.map((d) => (
              <div
                key={d.dia}
                className="flex flex-1 flex-col-reverse"
                title={`${diaMes(d.dia)}: ${d.iniciadas} iniciadas, ${d.pagas} ${t.graficos.pagas}`}
              >
                <div className="w-full bg-accent" style={{ height: `${(d.pagas / picoAssinaturas) * 168}px` }} />
                <div className="w-full bg-line-strong" style={{ height: `${((d.iniciadas - d.pagas) / picoAssinaturas) * 168}px` }} />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-between gap-2 text-xs tabular-nums text-fg-muted">
            <span>{diaMes(porDia.at(0)?.dia ?? hoje)}</span>
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="inline-block size-2.5 bg-accent" /> {t.graficos.pagas}
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block size-2.5 bg-line-strong" /> {t.graficos.naoPagas}
              </span>
            </span>
            <span>{diaMes(porDia.at(-1)?.dia ?? hoje)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:col-span-2">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.graficos.origens}</h2>
          {totalOrigens === 0 ? (
            <p className="text-sm text-fg-muted">{t.graficos.semDados}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {origens.map((o) => (
                <li key={o.origem} className="grid grid-cols-[minmax(0,320px)_1fr_auto] items-center gap-4 text-sm">
                  <span className="truncate text-fg">{t.graficos.origem[o.origem] ?? o.origem}</span>
                  <div className="h-3 bg-accent/70" style={{ width: `${(o.visitas / totalOrigens) * 100}%` }} />
                  <span className="tabular-nums text-fg-muted">
                    {numero.format(o.visitas)} · {pct(o.visitas, totalOrigens)}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Fluxo do cliente */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.fluxo.titulo}</h2>
          <p className="mt-2 text-sm text-fg-muted">{t.fluxo.lead}</p>
        </div>
        <div className="-mx-5 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8">
          <div className="grid min-w-[1300px] grid-cols-6 gap-3">
            {ETAPAS.map((etapa) => {
              const lista = porEtapa(etapa);
              const pedeAcao = (etapa === "liberar" || etapa === "revogar") && lista.length > 0;
              const info = t.fluxo.etapas[etapa];
              return (
                <section
                  key={etapa}
                  aria-label={info.nome}
                  className={`flex flex-col gap-3 border p-3 ${pedeAcao ? "border-accent bg-accent/5" : "border-line bg-surface"}`}
                >
                  <header>
                    <p className="flex items-center justify-between text-sm font-medium text-fg">
                      {info.nome}
                      <span className="tabular-nums text-fg-muted">{lista.length}</span>
                    </p>
                    <p className="mt-1 text-xs text-fg-muted">{info.ajuda}</p>
                  </header>
                  {lista.length === 0 ? (
                    <p className="text-xs text-fg-subtle">{t.fluxo.vazio}</p>
                  ) : (
                    /* Colunas que pedem ação mostram todos; as outras, as mais
                       recentes, para checkout abandonado não soterrar a página. */
                    (pedeAcao ? lista : lista.slice(0, LIMITE_COLUNA)).map((a) => {
                      const prazo = etapa === "liberar" && a.ultimoPagamentoEm ? prazoDeLiberacao(a.ultimoPagamentoEm, agora) : null;
                      return (
                        <article key={a.id} className="border border-line bg-bg p-3 text-xs">
                          <p className="text-sm font-medium text-fg">{a.nome}</p>
                          <a href={`mailto:${a.email}`} className="mt-1 block break-all text-fg-muted underline">
                            {a.email}
                          </a>
                          <a href={whatsapp(a.telefone)} target="_blank" rel="noreferrer noopener" className="mt-1 block text-fg-muted underline">
                            {t.fluxo.whatsapp} · {a.telefone}
                          </a>
                          <p className="mt-2 text-fg-muted">{t.fluxo.assinouEm(dataHora.format(a.criadaEm))}</p>
                          {a.pagoAte ? <p className="text-fg-muted">{t.fluxo.pagoAte(dataCompleta(a.pagoAte))}</p> : null}
                          {a.boasVindasEm ? <p className="text-fg-muted">✓ {t.fluxo.boasVindas}</p> : null}
                          {prazo ? (
                            <p className={`mt-2 inline-block rounded-control border px-2 py-0.5 font-medium ${COR_PRAZO[prazo.situacao]}`}>
                              {t.fluxo.prazo[prazo.situacao](prazo.horas.toFixed(1).replace(".", ","))}
                            </p>
                          ) : null}
                          <Acoes a={a} etapa={etapa} />
                        </article>
                      );
                    })
                  )}
                  {!pedeAcao && lista.length > LIMITE_COLUNA ? (
                    <p className="text-xs text-fg-muted">{t.fluxo.maisAntigas(lista.length - LIMITE_COLUNA)}</p>
                  ) : null}
                </section>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tabela completa */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.tabela.titulo}</h2>
          <a href="/admin/assinaturas.csv" className="rounded-control border border-line-strong px-3 py-1.5 text-sm text-fg">
            {t.tabela.exportar}
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-fg-muted">
                <th className="py-2 pr-4 font-normal">{admin.assinaturas.colunaData}</th>
                <th className="py-2 pr-4 font-normal">{admin.assinaturas.colunaAssinante}</th>
                <th className="py-2 pr-4 font-normal">{admin.assinaturas.colunaStatus}</th>
                <th className="py-2 pr-4 font-normal">{t.fluxo.titulo}</th>
                <th className="py-2 pr-4 font-normal">{admin.assinaturas.colunaPagoAte}</th>
              </tr>
            </thead>
            <tbody>
              {comEtapa.map(({ a, etapa }) => (
                <tr key={a.id} className="border-b border-line align-top">
                  <td className="py-2 pr-4 tabular-nums text-fg-muted">{dataHora.format(a.criadaEm)}</td>
                  <td className="py-2 pr-4">
                    <span className="block text-fg">{a.nome}</span>
                    <span className="block text-fg-muted">{a.email}</span>
                  </td>
                  <td className="py-2 pr-4 text-fg">{admin.assinaturas.status[a.status] ?? a.status}</td>
                  <td className="py-2 pr-4 text-fg">{t.fluxo.etapas[etapa].nome}</td>
                  <td className="py-2 pr-4 tabular-nums text-fg-muted">{a.pagoAte ? dataCompleta(a.pagoAte) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="max-w-[80ch] text-xs text-fg-muted">{admin.assinaturas.lgpd}</p>
      </section>
    </div>
  );
}
