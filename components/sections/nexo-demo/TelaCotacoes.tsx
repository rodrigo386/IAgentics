"use client";

import { useMemo, useState } from "react";
import { SEMENTES } from "@/lib/nexo-demo/dados";
import { nexoDemo as t } from "@/lib/nexo-demo/textos";
import { NUMERO, codigoRfq, cotacoes, estadoDaSemente, estimadoCentavos, itemDoCatalogo, reais, semAcento, statusDaRfq, type Estado, type StatusRfq } from "@/lib/nexo-demo/regras";
import { DetalheRfq, TOM_RFQ, type Rfq } from "./DetalheRfq";
import { Indicador, Selo, TOM_URGENCIA, TituloTela, Vazio, botao, botaoLinha, campo, cartao, type PropsTela } from "./pecas";

/**
 * Central de Compras do Nexo Demo (2026-11-27): a lista de cotações de uma
 * operação que já existe (as de `SEMENTES`, mais a da pessoa), com
 * indicadores, busca, filtros e as visões Lista e Kanban do produto. O
 * detalhe abre em janela (DetalheRfq).
 */
const c = t.cotacoes;

/** Todas as cotações na tela: a da pessoa (quando a RC já foi aprovada) na frente das da operação. */
export function todasAsRfqs(e: Estado, nome: string, hoje: Date): Rfq[] {
  const outras: Rfq[] = SEMENTES.map((s) => ({ numero: s.numero, e: estadoDaSemente(s, hoje), solicitante: s.solicitante, comprador: s.comprador, diasAberto: s.diasAberto, sua: false }));
  return e.rc && e.rcAprovada ? [{ numero: NUMERO, e, solicitante: nome, comprador: c.voce, diasAberto: 0, sua: true }, ...outras] : outras;
}

const COLUNAS: StatusRfq[][] = [["setup"], ["convites", "aguardando"], ["propostas"], ["aprovacao"], ["concluida"]];

export function TelaCotacoes({ e, despachar, ir, nome, hoje, aberta, abrir }: PropsTela & { aberta: string | null; abrir: (numero: string | null) => void }) {
  const [visao, setVisao] = useState<keyof typeof c.visoes>("lista");
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("");
  const [comprador, setComprador] = useState("");
  const [categoria, setCategoria] = useState("");
  const sementes = useMemo(() => todasAsRfqs({ rc: null } as Estado, nome, hoje), [nome, hoje]);
  const rfqs: Rfq[] = e.rc && e.rcAprovada ? [{ numero: NUMERO, e, solicitante: nome, comprador: c.voce, diasAberto: 0, sua: true }, ...sementes] : sementes;
  const categoriasDe = (r: Rfq) => r.e.rc!.itens.map((l) => itemDoCatalogo(l.item)!.categoria);
  const n = semAcento(busca);
  const visiveis = rfqs.filter(
    (r) =>
      (!status || statusDaRfq(r.e) === status) &&
      (!comprador || r.comprador === comprador) &&
      (!categoria || categoriasDe(r).includes(categoria)) &&
      (n === "" || semAcento([codigoRfq(r.numero), r.solicitante, ...r.e.rc!.itens.map((l) => itemDoCatalogo(l.item)!.nome)].join(" ")).includes(n)),
  );
  const abertas = rfqs.filter((r) => !r.e.ocGerada);
  const selecionada = rfqs.find((r) => r.numero === aberta);

  const cartaoRfq = (r: Rfq, compacto = false) => {
    const rc = r.e.rc!;
    const st = statusDaRfq(r.e);
    return (
      <li key={r.numero} className={`${cartao} flex flex-col gap-2 ${compacto ? "!p-3" : ""} ${r.sua ? "!border-accent" : ""}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-fg-muted">{codigoRfq(r.numero)}</span>
          {compacto ? null : <Selo tom={TOM_RFQ[st]}>{c.status[st]}</Selo>}
          {r.sua ? <Selo tom="violeta">{c.sua}</Selo> : null}
        </div>
        <h3 className="text-sm font-semibold text-fg">{itemDoCatalogo(rc.itens[0].item)!.nome}</h3>
        {rc.itens.length > 1 ? <p className="text-xs text-fg-muted">{c.maisItens(rc.itens.length - 1)}</p> : null}
        <p className="flex flex-wrap items-center gap-1.5">
          <Selo tom={r.diasAberto > 10 ? "vermelho" : "neutro"}>{c.diasAberto(r.diasAberto)}</Selo>
          <Selo tom={TOM_URGENCIA[rc.urgencia]}>{rc.urgencia}</Selo>
        </p>
        <p className="flex flex-wrap items-center gap-1.5 text-sm">
          <span className="font-semibold tabular-nums text-fg">{reais(estimadoCentavos(rc))}</span>
          {compacto ? null : (
            <>
              <Selo>{c.fornecedores(cotacoes(r.e).length, r.e.convitesEnviados ? r.e.convidados.length : 0)}</Selo>
              <Selo>{c.propostas(cotacoes(r.e).length)}</Selo>
            </>
          )}
        </p>
        <button type="button" onClick={() => abrir(r.numero)} className={`${r.sua ? botao : botaoLinha} mt-auto self-start !py-1.5 !text-xs`}>
          {c.abrir(codigoRfq(r.numero))}
        </button>
      </li>
    );
  };

  return (
    <>
      <TituloTela titulo={c.titulo} sub={c.fonte} />
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Indicador nome={c.indicadores.abertas} valor={abertas.length} />
        <Indicador nome={c.indicadores.criticos} valor={abertas.filter((r) => r.e.rc!.urgencia === "Crítica").length} alerta />
        <Indicador nome={c.indicadores.prazo} valor={Math.round(abertas.reduce((s, r) => s + r.diasAberto, 0) / Math.max(1, abertas.length))} />
        <Indicador nome={c.indicadores.total} valor={rfqs.length} />
      </dl>

      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label={c.lista} className="flex gap-1 rounded-lg border border-line bg-surface p-1">
          {(Object.keys(c.visoes) as (keyof typeof c.visoes)[]).map((v) => (
            <button key={v} type="button" aria-pressed={visao === v} onClick={() => setVisao(v)} className={`rounded-md px-3 py-1.5 text-sm ${visao === v ? "bg-accent font-medium text-white" : "text-fg hover:bg-bg"}`}>
              {c.visoes[v]}
            </button>
          ))}
        </div>
        <input value={busca} onChange={(ev) => setBusca(ev.target.value)} placeholder={c.buscar} aria-label={c.buscar} className={`${campo} min-w-[200px] flex-1`} />
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <select value={status} onChange={(ev) => setStatus(ev.target.value)} aria-label={c.todosStatus} className={campo}>
          <option value="">{c.todosStatus}</option>
          {Object.entries(c.status).map(([id, rot]) => (
            <option key={id} value={id}>
              {rot}
            </option>
          ))}
        </select>
        <select value={comprador} onChange={(ev) => setComprador(ev.target.value)} aria-label={c.todosCompradores} className={campo}>
          <option value="">{c.todosCompradores}</option>
          {[...new Set(rfqs.map((r) => r.comprador))].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select value={categoria} onChange={(ev) => setCategoria(ev.target.value)} aria-label={c.todasCategorias} className={campo}>
          <option value="">{c.todasCategorias}</option>
          {[...new Set(rfqs.flatMap(categoriasDe))].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            setBusca("");
            setStatus("");
            setComprador("");
            setCategoria("");
          }}
          className={botaoLinha}
        >
          {c.limpar}
        </button>
      </div>

      {visiveis.length === 0 ? (
        <div className={cartao}>
          <Vazio>{c.vazio}</Vazio>
        </div>
      ) : visao === "lista" ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label={c.lista}>
          {visiveis.map((r) => cartaoRfq(r))}
        </ul>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
          <div className="grid min-w-[1000px] grid-cols-5 gap-3">
            {COLUNAS.map((col) => {
              const daColuna = visiveis.filter((r) => col.includes(statusDaRfq(r.e)));
              return (
                <section key={col[0]} className="flex flex-col gap-2 rounded-xl bg-[#e3e6f6] p-2" aria-label={c.status[col[0]]}>
                  <h2 className="flex items-center justify-between px-1 pt-1 text-xs font-semibold text-fg">
                    {c.status[col[0]]} <span className="tabular-nums text-fg-muted">{daColuna.length}</span>
                  </h2>
                  <ul className="flex flex-col gap-2">{daColuna.map((r) => cartaoRfq(r, true))}</ul>
                </section>
              );
            })}
          </div>
        </div>
      )}

      {selecionada ? <DetalheRfq key={selecionada.numero} rfq={selecionada} despachar={selecionada.sua ? despachar : () => {}} leitura={!selecionada.sua} hoje={hoje} fechar={() => abrir(null)} sair={ir} /> : null}
    </>
  );
}
