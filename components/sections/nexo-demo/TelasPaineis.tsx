"use client";

import { ALCADAS, CATALOGO, FORNECEDORES, SALA, SEMENTES, SPEND } from "@/lib/nexo-demo/dados";
import { nexoDemo as t } from "@/lib/nexo-demo/textos";
import { alcadaDe, codigoRfq, economiaCentavos, estimadoCentavos, faseDe, milhoes, porcento, reais, totalSelecionado } from "@/lib/nexo-demo/regras";
import { Barra, Indicador, Lista, Selo, TituloTela, cartao, rotulo, type PropsTela } from "./pecas";

/**
 * Spend, Sala de comando, Base de fornecedores e Alçada de compra do Nexo
 * Demo (2026-11-27). Números fictícios de lib/nexo-demo/dados.ts; a cotação
 * da pessoa entra onde faz sentido (economia, fila, faixa de alçada).
 * Gráficos em CSS puro, com o valor sempre escrito.
 */
const p = t.paineis;
const numero = new Intl.NumberFormat("pt-BR");

export function TelaSpend() {
  const s = p.spend;
  const total = SPEND.categorias.reduce((x, c) => x + c.centavos, 0);
  const maiorCat = Math.max(...SPEND.categorias.map((c) => c.centavos));
  const maiorMes = Math.max(...SPEND.meses.map(([, v]) => v));
  const maiorForn = Math.max(...SPEND.fornecedores.map((f) => f.centavos));
  return (
    <>
      <TituloTela titulo={s.titulo} sub={s.sub} />
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador nome={s.indicadores.total} valor={milhoes(total)} />
        <Indicador nome={s.indicadores.fornecedores} valor={numero.format(SPEND.fornecedoresAtivos)} />
        <Indicador nome={s.indicadores.tail} valor={porcento(SPEND.tailSpend)} />
        <Indicador nome={s.indicadores.maverick} valor={porcento(SPEND.maverick)} alerta />
      </dl>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className={`${cartao} flex flex-col gap-4`}>
          <h2 className="text-sm font-semibold text-fg">{s.porCategoria}</h2>
          <ul className="flex flex-col gap-3">
            {SPEND.categorias.map((c) => (
              <Barra key={c.nome} nome={c.nome} valor={`${reais(c.centavos)} · ${porcento(c.centavos / total)}`} fracao={c.centavos / maiorCat} />
            ))}
          </ul>
        </section>
        <section className={`${cartao} flex flex-col gap-4`}>
          <h2 className="text-sm font-semibold text-fg">{s.top}</h2>
          <ul className="flex flex-col gap-3">
            {SPEND.fornecedores.map((f) => (
              <Barra key={f.nome} nome={f.nome} valor={`${milhoes(f.centavos)} · ${s.pedidos(f.pedidos)}`} fracao={f.centavos / maiorForn} />
            ))}
          </ul>
        </section>
      </div>
      <section className={`${cartao} flex flex-col gap-4`}>
        <h2 className="text-sm font-semibold text-fg">{s.mensal}</h2>
        <ol className="grid h-44 grid-cols-12 items-end gap-1.5 sm:gap-3">
          {SPEND.meses.map(([mes, v]) => (
            <li key={mes} className="flex h-full flex-col items-center justify-end gap-1">
              <span className="text-[10px] tabular-nums text-fg-muted max-sm:hidden">{milhoes(v).replace("R$", "").trim()}</span>
              <span className="w-full rounded-t bg-accent" style={{ height: `${(v / maiorMes) * 78}%` }} aria-hidden="true" />
              <span className="text-[11px] text-fg-muted">
                {mes}
                <span className="sr-only">: {reais(v)}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
      <section className={`${cartao} border-l-2 !border-l-accent-text`}>
        <Lista titulo={s.oportunidades} itens={s.oportunidadesItens} />
      </section>
    </>
  );
}

export function TelaSala({ e }: PropsTela) {
  const s = p.sala;
  const abertas = SEMENTES.filter((x) => x.ate !== "oc");
  const atrasadas = abertas.filter((x) => x.diasAberto > 10);
  const criticas = abertas.filter((x) => x.urgencia === "Crítica");
  const sua = e.rc && e.rcAprovada && !e.ocGerada ? 1 : 0;
  const seuSaving = e.ocGerada ? Math.max(0, economiaCentavos(e)) : 0;
  const maiorFunil = SALA.funil[0][1];
  const g = t.guia.fases[faseDe(e)];
  return (
    <>
      <TituloTela titulo={s.titulo} sub={s.sub} />
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador nome={s.indicadores.abertas} valor={abertas.length + sua} />
        <Indicador nome={s.indicadores.sla} valor={s.slaDias(SALA.slaDias.toLocaleString("pt-BR"))} />
        <Indicador nome={s.indicadores.saving} valor={milhoes(SALA.savingAnoCentavos + seuSaving)} />
        <Indicador nome={s.indicadores.atraso} valor={atrasadas.length} alerta />
      </dl>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className={`${cartao} flex flex-col gap-4`}>
          <h2 className="text-sm font-semibold text-fg">{s.funil}</h2>
          <ul className="flex flex-col gap-3">
            {SALA.funil.map(([nome, n]) => (
              <Barra key={nome} nome={nome} valor={`${n} · ${porcento(n / maiorFunil)}`} fracao={n / maiorFunil} />
            ))}
          </ul>
        </section>
        <section className={`${cartao} flex flex-col gap-3`}>
          <h2 className="text-sm font-semibold text-fg">{s.alertas}</h2>
          <ul className="flex flex-col gap-2 text-sm text-fg">
            {criticas.map((x) => (
              <li key={x.numero} className="flex gap-2">
                <Selo tom="vermelho">{x.urgencia}</Selo> {s.alertaCritico(codigoRfq(x.numero), x.diasAberto)}
              </li>
            ))}
            <li className="flex gap-2">
              <Selo tom="ambar">{atrasadas.length}</Selo> {s.alertaAtraso(atrasadas.length)}
            </li>
            {e.rc ? (
              <li className="flex gap-2">
                <Selo tom="violeta">{t.cotacoes.voce}</Selo> {s.alertaSua(codigoRfq(), g.texto)}
              </li>
            ) : null}
          </ul>
        </section>
      </div>
      <section className={`${cartao} flex flex-col gap-3`}>
        <h2 className="text-sm font-semibold text-fg">{s.compradores}</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr>
                {Object.values(s.colunas).map((c) => (
                  <th key={c} scope="col" className={`${rotulo} px-2 py-2`}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SALA.compradores.map((c) => (
                <tr key={c.nome} className="border-t border-line">
                  <th scope="row" className="px-2 py-2.5 font-medium text-fg">
                    {c.nome}
                  </th>
                  <td className="px-2 py-2.5 text-fg-muted">{c.carteira}</td>
                  <td className="px-2 py-2.5 tabular-nums text-fg">{abertas.filter((x) => x.comprador === c.nome).length}</td>
                  <td className="px-2 py-2.5 tabular-nums text-fg">{porcento(c.saving)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

export function TelaFornecedores() {
  const b = p.base;
  return (
    <>
      <TituloTela titulo={b.titulo} sub={b.sub} />
      <ul className="grid gap-4 sm:grid-cols-2">
        {FORNECEDORES.map((f) => (
          <li key={f.id} className={`${cartao} flex flex-col gap-2`}>
            <h2 className="flex flex-wrap items-center gap-2 text-sm font-semibold text-fg">
              {f.nome} <Selo tom="verde">{t.cotacoes.homologado}</Selo>
            </h2>
            <p className="text-xs text-fg-muted">
              {f.email} · {b.colunas.pagamento}: {f.pagamento}
            </p>
            <p className={rotulo}>{b.colunas.categorias}</p>
            <ul className="flex flex-wrap gap-1.5">
              {[...new Set(CATALOGO.filter((i) => i.fornecedores[f.id]).map((i) => i.categoria))].map((c) => (
                <li key={c}>
                  <Selo>{c}</Selo>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </>
  );
}

export function TelaAlcada({ e }: PropsTela) {
  const a = p.alcada;
  const total = e.rc ? (e.selecaoEnviada ? totalSelecionado(e) : estimadoCentavos(e.rc)) : null;
  const atual = total === null ? null : alcadaDe(total);
  return (
    <>
      <TituloTela titulo={a.titulo} sub={a.sub} />
      <section className={`${cartao} flex flex-col gap-4`}>
        <p className="text-sm text-fg">{a.gestor}</p>
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead className="bg-bg">
              <tr>
                <th scope="col" className={`${rotulo} px-3 py-2.5`}>
                  {a.colunas.faixa}
                </th>
                <th scope="col" className={`${rotulo} px-3 py-2.5`}>
                  {a.colunas.aprovador}
                </th>
              </tr>
            </thead>
            <tbody>
              {ALCADAS.map((x) => (
                <tr key={x.aprovador} className={`border-t border-line ${atual === x ? "bg-[#f4f1ff]" : ""}`}>
                  <th scope="row" className="px-3 py-3 font-medium text-fg">
                    {x.faixa}
                  </th>
                  <td className="px-3 py-3 text-fg">
                    {x.aprovador} {atual === x ? <Selo tom="violeta">{`${a.atual}: ${reais(total!)}`}</Selo> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-fg-muted">{a.nota}</p>
      </section>
    </>
  );
}
