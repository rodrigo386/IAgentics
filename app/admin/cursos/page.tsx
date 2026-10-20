import type { Metadata } from "next";
import Link from "next/link";
import { Cartao } from "@/components/admin/Cartao";
import { admin } from "@/lib/content-admin";
import { listarAssinaturas, type Assinatura } from "@/lib/assinatura/assinaturas";
import { ETAPAS, etapaDoCliente, prazoDeLiberacao, type Etapa } from "@/lib/assinatura/fluxo";
import { hojeSP, VALOR_ASSINATURA_CENTAVOS } from "@/lib/assinatura/regras";
import { formatarReais } from "@/lib/catalogo/preco";
import { assinaturasPorDia, funilCursos, origensCursos, resumoCursos, visitasCursosPorDia } from "@/lib/admin/cursos";
import { filtrarAssinaturas, lerFiltros, PERIODOS, type Filtros } from "@/lib/admin/filtros";
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

/** Dia AAAA-MM-DD em São Paulo de um instante (para "só do período"). */
const diaEmSP = (d: Date) => new Date(d.getTime() - 3 * 3600_000).toISOString().slice(0, 10);

type Barra = { dia: string; partes: { valor: number; classe: string }[]; dica: string };

/**
 * Gráfico de barras do painel, em CSS puro. Os números aparecem: o valor em
 * cima de cada barra quando o período tem até 31 dias (mais que isso, as
 * barras ficam finas demais para o texto), e em qualquer período ao passar o
 * mouse ou focar a barra pelo teclado. O eixo mostra datas a cada poucos dias
 * e a linha do máximo.
 */
function GraficoBarras({ barras, rotulo }: { barras: Barra[]; rotulo: string }) {
  const totalDe = (b: Barra) => b.partes.reduce((s, x) => s + x.valor, 0);
  const pico = Math.max(1, ...barras.map(totalDe));
  const mostraValores = barras.length <= 31;
  const passo = Math.max(1, Math.ceil(barras.length / 8));
  const ALTURA = 168;
  return (
    <div>
      <div className="relative h-48 border-b border-line" role="img" aria-label={rotulo}>
        <div className="absolute inset-x-0 border-t border-dashed border-line" style={{ bottom: ALTURA }} />
        <span className="absolute right-0 text-[10px] tabular-nums text-fg-muted" style={{ bottom: ALTURA + 2 }}>
          {t.graficos.maximo(numero.format(pico))}
        </span>
        <div className="absolute inset-0 flex items-end gap-[3px]">
          {barras.map((b) => {
            const total = totalDe(b);
            return (
              <div key={b.dia} tabIndex={0} className="group relative flex h-full flex-1 flex-col justify-end outline-none" aria-label={b.dica}>
                {mostraValores && total > 0 ? (
                  <span className="mb-0.5 text-center text-[10px] leading-none tabular-nums text-fg-muted">{total}</span>
                ) : null}
                <div className="flex flex-col-reverse">
                  {b.partes.map((x, i) => (
                    <div key={i} className={`w-full ${x.classe}`} style={{ height: `${(x.valor / pico) * ALTURA}px` }} />
                  ))}
                </div>
                {total === 0 ? <div className="h-[2px] w-full bg-line" /> : null}
                <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-control bg-brand-ink px-2 py-1 text-[11px] text-brand-paper group-hover:block group-focus:block">
                  {b.dica}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-1 flex gap-[3px] text-[10px] tabular-nums text-fg-muted">
        {barras.map((b, i) => (
          <span key={b.dia} className="flex-1 overflow-visible whitespace-nowrap">
            {i % passo === 0 || (i === barras.length - 1 && i % passo >= passo / 2) ? diaMes(b.dia) : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Total, média por dia e melhor dia de uma série. */
function ResumoSerie({ serie }: { serie: { dia: string; valor: number }[] }) {
  const total = serie.reduce((s, x) => s + x.valor, 0);
  const melhor = serie.reduce((m, x) => (x.valor > m.valor ? x : m), serie.at(0) ?? { dia: "", valor: 0 });
  const media = serie.length ? total / serie.length : 0;
  return (
    <dl className="mt-3 grid grid-cols-3 gap-3 border-t border-line pt-3 text-sm">
      <div>
        <dt className="text-xs text-fg-muted">{t.graficos.total}</dt>
        <dd className="tabular-nums text-fg">{numero.format(total)}</dd>
      </div>
      <div>
        <dt className="text-xs text-fg-muted">{t.graficos.media}</dt>
        <dd className="tabular-nums text-fg">{media.toFixed(1).replace(".", ",")}</dd>
      </div>
      <div>
        <dt className="text-xs text-fg-muted">{t.graficos.melhorDia}</dt>
        <dd className="tabular-nums text-fg">{melhor.valor > 0 ? `${diaMes(melhor.dia)} · ${numero.format(melhor.valor)}` : "—"}</dd>
      </div>
    </dl>
  );
}

/** Filtros por GET, sem JS: a visão filtrada fica na URL. */
function FormFiltros({ f }: { f: Filtros }) {
  const campo = "rounded-control border border-line-strong bg-bg px-3 py-1.5 text-sm text-fg";
  const rotulo = "flex flex-col gap-1 text-xs text-fg-muted";
  return (
    <section aria-label={t.filtros.titulo} className="flex flex-col gap-3 border border-line bg-surface p-4">
      <nav aria-label={t.periodo} className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">{t.periodo}</span>
        {PERIODOS.map((p) => (
          <Link
            key={p}
            href={`/admin/cursos?dias=${p}`}
            aria-current={p === f.pronto ? "page" : undefined}
            className={`rounded-control border px-3 py-1.5 text-sm ${p === f.pronto ? "border-accent bg-accent text-accent-on" : "border-line-strong text-fg"}`}
          >
            {t.dias(p)}
          </Link>
        ))}
      </nav>
      <form method="get" action="/admin/cursos" className="flex flex-wrap items-end gap-3">
        {f.pronto ? <input type="hidden" name="dias" value={f.pronto} /> : null}
        <label className={rotulo}>
          {t.filtros.de}
          <input type="date" name="de" defaultValue={f.pronto ? "" : f.de} className={campo} />
        </label>
        <label className={rotulo}>
          {t.filtros.ate}
          <input type="date" name="ate" defaultValue={f.pronto ? "" : f.ate} className={campo} />
        </label>
        <label className={`${rotulo} min-w-[220px] flex-1`}>
          {t.filtros.busca}
          <input type="search" name="q" defaultValue={f.busca} className={campo} />
        </label>
        <label className={rotulo}>
          {t.filtros.etapa}
          <select name="etapa" defaultValue={f.etapa ?? ""} className={campo}>
            <option value="">{t.filtros.todas}</option>
            {ETAPAS.map((e) => (
              <option key={e} value={e}>
                {t.fluxo.etapas[e].nome}
              </option>
            ))}
          </select>
        </label>
        <label className={rotulo}>
          {t.filtros.status}
          <select name="status" defaultValue={f.status ?? ""} className={campo}>
            <option value="">{t.filtros.todos}</option>
            {Object.entries(admin.assinaturas.status).map(([valor, nome]) => (
              <option key={valor} value={valor}>
                {nome}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm text-fg">
          <input type="checkbox" name="periodo" value="1" defaultChecked={f.soPeriodo} />
          {t.filtros.soPeriodo}
        </label>
        <button type="submit" className="rounded-control bg-accent px-4 py-1.5 text-sm font-medium text-accent-on">
          {t.filtros.aplicar}
        </button>
        <Link href="/admin/cursos" className="pb-1.5 text-sm text-fg-muted underline">
          {t.filtros.limpar}
        </Link>
      </form>
      <p className="text-xs text-fg-muted">{t.filtros.nota}</p>
    </section>
  );
}

export default async function PaginaCursos({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const hoje = hojeSP();
  const f = lerFiltros(await searchParams, hoje);
  const intervalo = { de: f.de, ate: f.ate };
  const rotuloPeriodo = t.rotuloPeriodo(f.pronto, diaMes(f.de), diaMes(f.ate));
  const agora = new Date();

  const [resumo, funil, visitas, porDia, origens, todas] = await Promise.all([
    resumoCursos(intervalo),
    funilCursos(intervalo),
    visitasCursosPorDia(intervalo),
    assinaturasPorDia(intervalo),
    origensCursos(intervalo),
    listarAssinaturas(),
  ]);

  const todasComEtapa = todas.map((a) => ({ a, etapa: etapaDoCliente(a, hoje) }));
  // Busca, etapa, status e "só do período" valem para o quadro e a tabela.
  const comEtapa = filtrarAssinaturas(todasComEtapa, f, diaEmSP);
  const porEtapa = (e: Etapa) => comEtapa.filter((x) => x.etapa === e).map((x) => x.a);
  const aLiberar = todasComEtapa.filter((x) => x.etapa === "liberar").map((x) => x.a);
  const foraDoPrazo = aLiberar.filter((a) => a.ultimoPagamentoEm && prazoDeLiberacao(a.ultimoPagamentoEm, agora).situacao === "atrasado").length;

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
      </header>

      <FormFiltros f={f} />

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
          {t.funil.titulo} · {rotuloPeriodo}
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
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">
            {t.graficos.visitas} · {rotuloPeriodo}
          </h2>
          <GraficoBarras
            rotulo={t.graficos.visitas}
            barras={visitas.map((d) => ({ dia: d.dia, partes: [{ valor: d.visitas, classe: "bg-accent/70 group-hover:bg-accent" }], dica: t.graficos.dicaVisitas(diaMes(d.dia), d.visitas) }))}
          />
          <ResumoSerie serie={visitas.map((d) => ({ dia: d.dia, valor: d.visitas }))} />
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">
            {t.graficos.assinaturas} · {rotuloPeriodo}
          </h2>
          <GraficoBarras
            rotulo={t.graficos.assinaturas}
            barras={porDia.map((d) => ({
              dia: d.dia,
              partes: [
                { valor: d.pagas, classe: "bg-accent" },
                { valor: d.iniciadas - d.pagas, classe: "bg-line-strong" },
              ],
              dica: t.graficos.dicaAssinaturas(diaMes(d.dia), d.iniciadas, d.pagas),
            }))}
          />
          <div className="flex items-center gap-3 text-xs text-fg-muted">
            <span className="flex items-center gap-1">
              <span className="inline-block size-2.5 bg-accent" /> {t.graficos.pagas}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block size-2.5 bg-line-strong" /> {t.graficos.naoPagas}
            </span>
          </div>
          <ResumoSerie serie={porDia.map((d) => ({ dia: d.dia, valor: d.iniciadas }))} />
        </div>

        <details className="lg:col-span-2">
          <summary className="cursor-pointer text-sm text-fg underline">{t.graficos.numerosPorDia}</summary>
          <div className="mt-3 max-h-96 overflow-auto">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead className="sticky top-0 bg-bg">
                <tr className="border-b border-line text-left text-fg-muted">
                  <th className="py-2 pr-4 font-normal">{t.graficos.colunaDia}</th>
                  <th className="py-2 pr-4 text-right font-normal">{t.graficos.colunaVisitas}</th>
                  <th className="py-2 pr-4 text-right font-normal">{t.graficos.colunaIniciadas}</th>
                  <th className="py-2 text-right font-normal">{t.graficos.colunaPagas}</th>
                </tr>
              </thead>
              <tbody>
                {[...visitas].reverse().map((d) => {
                  const a = porDia.find((x) => x.dia === d.dia);
                  return (
                    <tr key={d.dia} className="border-b border-line tabular-nums">
                      <td className="py-1.5 pr-4 text-fg">{dataCompleta(d.dia)}</td>
                      <td className="py-1.5 pr-4 text-right text-fg">{numero.format(d.visitas)}</td>
                      <td className="py-1.5 pr-4 text-right text-fg">{numero.format(a?.iniciadas ?? 0)}</td>
                      <td className="py-1.5 text-right text-fg">{numero.format(a?.pagas ?? 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>

        <div className="flex flex-col gap-3 lg:col-span-2">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">
            {t.graficos.origens} · {rotuloPeriodo}
          </h2>
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
          <p className="mt-1 text-sm font-medium text-fg">{t.filtros.resultado(comEtapa.length, todasComEtapa.length)}</p>
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
