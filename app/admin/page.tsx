import type { Metadata } from "next";
import { admin as t } from "@/lib/content-admin";
import { MarcadorInterno } from "@/components/admin/MarcadorInterno";
import { liberarAcesso } from "./acoes";
import { formatarReais } from "@/lib/catalogo/preco";
import {
  conversaoCursos,
  inscritos,
  listarVendas,
  origensDasEntradas,
  paginasDeEntrada,
  resumoEntradas,
  resumoListaEspera,
  resumoVendas,
  resumoVisitas,
  rotasMaisVistas,
  visitasPorDia,
} from "@/lib/admin/dados";

export const metadata: Metadata = { title: t.meta.titulo, robots: { index: false, follow: false } };

/* Sempre fresco: painel que mostra dado velho leva a decisão errada, e o custo
   de recalcular seis consultas para um único operador é irrelevante. */
export const dynamic = "force-dynamic";

const numero = new Intl.NumberFormat("pt-BR");
const dataHora = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
const dataCurta = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });

function Cartao({ rotulo, valor, nota }: { rotulo: string; valor: string; nota?: string }) {
  return (
    <div className="border border-line bg-surface p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">{rotulo}</p>
      <p className="mt-2 text-3xl font-medium tabular-nums tracking-[-0.02em] text-fg">{valor}</p>
      {nota ? <p className="mt-1 text-xs text-fg-muted">{nota}</p> : null}
    </div>
  );
}

/** Variação entre as duas janelas de 7 dias, em texto — sem base, diz que não
 *  tem base em vez de inventar 100%. */
function variacao(atual: number, anterior: number): string {
  if (anterior === 0) return t.variacao.semBase;
  const p = ((atual - anterior) / anterior) * 100;
  if (Math.abs(p) < 0.5) return t.variacao.igual;
  const texto = Math.abs(p).toFixed(0);
  return p > 0 ? t.variacao.subiu(texto) : t.variacao.caiu(texto);
}

export default async function PaginaAdmin({ searchParams }: { searchParams: Promise<{ vendas?: string }> }) {
  const modo = (await searchParams).vendas === "teste" ? "teste" : "real";

  const [visitas, porDia, porRota, lista, pessoas, conv, entradas, porOrigem, porEntrada, listaVendas, somaVendas] =
    await Promise.all([
      resumoVisitas(),
      visitasPorDia(30),
      rotasMaisVistas(30),
      resumoListaEspera(),
      inscritos(),
      conversaoCursos(30),
      resumoEntradas(30),
      origensDasEntradas(30),
      paginasDeEntrada(30),
      listarVendas(modo),
      resumoVendas(modo),
    ]);

  const pico = Math.max(1, ...porDia.map((d) => d.visitas));
  const maiorRota = Math.max(1, ...porRota.map((r) => r.visitas));
  const maiorOrigem = Math.max(1, ...porOrigem.map((o) => o.visitas));
  const maiorEntrada = Math.max(1, ...porEntrada.map((r) => r.visitas));

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-12 px-5 py-12 sm:px-8">
      <header>
        <h1 className="text-3xl font-medium tracking-[-0.03em] text-fg">{t.titulo}</h1>
        <p className="mt-2 text-fg-muted">{t.lead}</p>
      </header>

      {/* Antes dos números, não depois: quem abre o painel é da casa, e cada
          visita dele some ou entra na conta que ele está prestes a ler. */}
      <MarcadorInterno />

      <section className="flex flex-col gap-5">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.visitas.titulo}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Cartao
            rotulo={t.visitas.ultimos7}
            valor={numero.format(visitas.ultimos7)}
            nota={variacao(visitas.ultimos7, visitas.anteriores7)}
          />
          <Cartao rotulo={t.visitas.ultimos30} valor={numero.format(visitas.ultimos30)} />
          <Cartao
            rotulo={t.visitas.total}
            valor={numero.format(visitas.totalGeral)}
            nota={visitas.desde ? t.visitas.desde(dataCurta.format(new Date(`${visitas.desde}T12:00:00Z`))) : undefined}
          />
          <Cartao
            rotulo={t.conversao.taxa}
            valor={`${conv.taxa.toFixed(1)}%`}
            nota={`${numero.format(conv.inscricoes)} / ${numero.format(conv.visitas)} ${t.conversao.visitas.toLowerCase()}`}
          />
        </div>
        <p className="max-w-[70ch] text-xs text-fg-muted">{t.visitas.nota}</p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.visitas.porDia}</h2>
        {visitas.totalGeral === 0 ? (
          <p className="text-fg-muted">{t.visitas.semDados}</p>
        ) : (
          /* Barras em CSS puro: 30 divs com altura proporcional. Não vale uma
             biblioteca de gráfico para isso, e assim funciona sem JS. */
          <div className="flex h-40 items-end gap-1 border-b border-line" role="img" aria-label={t.visitas.porDia}>
            {porDia.map((d) => (
              <div key={d.dia} className="group relative flex-1" title={`${d.dia}: ${d.visitas}`}>
                <div
                  className="w-full bg-accent/70 transition-colors group-hover:bg-accent"
                  style={{ height: `${Math.max(2, (d.visitas / pico) * 156)}px` }}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.visitas.porPagina}</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-fg-muted">
                <th className="py-2 font-normal">{t.visitas.coluna}</th>
                <th className="w-24 py-2 text-right font-normal">{t.visitas.colunaVisitas}</th>
              </tr>
            </thead>
            <tbody>
              {porRota.map((r) => (
                <tr key={r.rota} className="border-b border-line/60">
                  <td className="py-2 pr-4 text-fg">
                    <span className="inline-flex w-full items-center gap-3">
                      <span className="shrink-0">{r.rota}</span>
                      <span
                        aria-hidden="true"
                        className="h-1.5 bg-accent/40"
                        style={{ width: `${(r.visitas / maiorRota) * 100}%` }}
                      />
                    </span>
                  </td>
                  <td className="py-2 text-right tabular-nums text-fg">{numero.format(r.visitas)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-5 border-t border-line pt-10">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.origem.titulo}</h2>

        {entradas.desde === null ? (
          <p className="max-w-[70ch] text-fg-muted">{t.origem.semDados}</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Cartao
                rotulo={t.origem.entradas}
                valor={numero.format(entradas.entradas)}
                nota={t.origem.desde(dataCurta.format(new Date(`${entradas.desde}T12:00:00Z`)))}
              />
              <Cartao
                rotulo={t.origem.paginasPorEntrada}
                valor={entradas.paginasPorEntrada === null ? "—" : entradas.paginasPorEntrada.toFixed(1)}
                nota={`${numero.format(entradas.visualizacoes)} ${t.visitas.colunaVisitas.toLowerCase()}`}
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-fg-muted">
                    <th className="py-2 font-normal">{t.origem.colunaOrigem}</th>
                    <th className="w-24 py-2 text-right font-normal">{t.origem.colunaEntradas}</th>
                  </tr>
                </thead>
                <tbody>
                  {porOrigem.map((o) => (
                    <tr key={o.origem} className="border-b border-line/60">
                      <td className="py-2 pr-4 text-fg">
                        <span className="inline-flex w-full items-center gap-3">
                          <span className="shrink-0">{t.origem.rotulos[o.origem] ?? o.origem}</span>
                          <span
                            aria-hidden="true"
                            className="h-1.5 bg-accent/40"
                            style={{ width: `${(o.visitas / maiorOrigem) * 100}%` }}
                          />
                        </span>
                      </td>
                      <td className="py-2 text-right tabular-nums text-fg">{numero.format(o.visitas)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {porEntrada.length > 0 ? (
              <div className="flex flex-col gap-3 pt-4">
                <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">
                  {t.origem.porPagina}
                </h3>
                <p className="max-w-[70ch] text-xs text-fg-muted">{t.origem.porPaginaNota}</p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-line text-left text-fg-muted">
                        <th className="py-2 font-normal">{t.visitas.coluna}</th>
                        <th className="w-24 py-2 text-right font-normal">{t.origem.colunaEntradas}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {porEntrada.map((r) => (
                        <tr key={r.rota} className="border-b border-line/60">
                          <td className="py-2 pr-4 text-fg">
                            <span className="inline-flex w-full items-center gap-3">
                              <span className="shrink-0">{r.rota}</span>
                              <span
                                aria-hidden="true"
                                className="h-1.5 bg-accent/40"
                                style={{ width: `${(r.visitas / maiorEntrada) * 100}%` }}
                              />
                            </span>
                          </td>
                          <td className="py-2 text-right tabular-nums text-fg">{numero.format(r.visitas)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </>
        )}

        <p className="max-w-[70ch] text-xs text-fg-muted">{t.origem.nota}</p>
      </section>

      <section className="flex flex-col gap-5 border-t border-line pt-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.vendas.titulo}</h2>
          <div className="flex flex-wrap items-center gap-4">
            <a href={modo === "teste" ? "?vendas=real" : "?vendas=teste"} className="text-sm text-fg-muted underline">
              {modo === "teste" ? t.vendas.verReal : t.vendas.verTeste}
            </a>
            {listaVendas.length > 0 ? (
              <a
                href={`/admin/vendas.csv?modo=${modo}`}
                className="rounded-control bg-accent px-5 py-2.5 text-sm font-medium text-accent-on transition-colors hover:bg-accent-hover"
              >
                {t.vendas.exportar}
              </a>
            ) : null}
          </div>
        </div>

        {modo === "teste" ? <p className="text-sm text-fg-muted">{t.vendas.modoTeste}</p> : null}

        <div className="grid gap-4 sm:grid-cols-3">
          <Cartao rotulo={t.vendas.aguardando} valor={numero.format(somaVendas.aguardandoLiberacao)} />
          <Cartao rotulo={t.vendas.pagas} valor={numero.format(somaVendas.pagas)} />
          <Cartao rotulo={t.vendas.recebido} valor={formatarReais(somaVendas.recebidoCentavos)} />
        </div>

        {listaVendas.length === 0 ? (
          <p className="text-fg-muted">{t.vendas.nenhuma}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-fg-muted">
                  <th className="py-2 font-normal">{t.vendas.colunaData}</th>
                  <th className="py-2 font-normal">{t.vendas.colunaComprador}</th>
                  <th className="py-2 font-normal">{t.vendas.colunaCursos}</th>
                  <th className="py-2 text-right font-normal">{t.vendas.colunaTotal}</th>
                  <th className="py-2 font-normal">{t.vendas.colunaStatus}</th>
                  <th className="py-2 font-normal">{t.vendas.colunaAcesso}</th>
                </tr>
              </thead>
              <tbody>
                {listaVendas.map((v) => (
                  <tr key={v.id} className="border-b border-line/60">
                    <td className="py-2 pr-4 text-fg-muted">{dataHora.format(v.criadaEm)}</td>
                    <td className="py-2 pr-4 text-fg">
                      {v.nome}
                      <br />
                      <span className="text-fg-muted">
                        {v.email} · {v.telefone}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-fg">{v.itens.map((i) => i.nome).join(", ")}</td>
                    <td className="py-2 text-right tabular-nums text-fg">{formatarReais(v.totalCentavos)}</td>
                    <td className="py-2 pr-4 text-fg">{t.vendas.status[v.status]}</td>
                    <td className="py-2 pr-4 text-fg">
                      {v.acessoLiberadoEm ? (
                        t.vendas.liberadoEm(dataHora.format(v.acessoLiberadoEm))
                      ) : v.status === "pago" ? (
                        <form action={liberarAcesso}>
                          <input type="hidden" name="id" value={v.id} />
                          <button
                            type="submit"
                            className="rounded-control border border-line px-3 py-1.5 text-xs font-medium text-fg transition-colors hover:bg-surface"
                          >
                            {t.vendas.liberar}
                          </button>
                        </form>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="max-w-[70ch] text-xs text-fg-muted">{t.vendas.lgpd}</p>
      </section>

      <section className="flex flex-col gap-5 border-t border-line pt-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.lista.titulo}</h2>
          {pessoas.length > 0 ? (
            <a
              href="/admin/lista-espera.csv"
              className="rounded-control bg-accent px-5 py-2.5 text-sm font-medium text-accent-on transition-colors hover:bg-accent-hover"
            >
              {t.lista.exportar}
            </a>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Cartao rotulo={t.lista.total} valor={numero.format(lista.total)} />
          <Cartao rotulo={t.lista.ultimos7} valor={numero.format(lista.ultimos7)} />
          <Cartao
            rotulo={t.lista.ultimoEm}
            valor={lista.ultimoEm ? dataHora.format(new Date(lista.ultimoEm)) : "—"}
          />
        </div>

        {pessoas.length === 0 ? (
          <p className="text-fg-muted">{t.lista.nenhum}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-fg-muted">
                  <th className="py-2 font-normal">{t.lista.colunaNome}</th>
                  <th className="py-2 font-normal">{t.lista.colunaEmail}</th>
                  <th className="w-40 py-2 text-right font-normal">{t.lista.colunaData}</th>
                </tr>
              </thead>
              <tbody>
                {pessoas.map((p) => (
                  <tr key={p.email} className="border-b border-line/60">
                    <td className="py-2 pr-4 text-fg">{p.nome}</td>
                    <td className="py-2 pr-4 text-fg-muted">{p.email}</td>
                    <td className="py-2 text-right tabular-nums text-fg-muted">{dataHora.format(p.criadoEm)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="max-w-[70ch] text-xs text-fg-muted">{t.lista.lgpd}</p>
      </section>
    </div>
  );
}
