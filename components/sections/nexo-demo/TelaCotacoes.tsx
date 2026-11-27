"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Sparkle } from "@phosphor-icons/react";
import { nexoDemo as t } from "@/lib/nexo-demo/textos";
import { CODIGO_OC, CODIGO_RC, CODIGO_RFQ, economiaCentavos, estimadoCentavos, insights, itemDoCatalogo, melhores, porcento, propostas, reais, semResposta, type Estado } from "@/lib/nexo-demo/regras";
import { Dado, Selo, TituloTela, Vazio, botao, botaoLinha, cartao, dataCurta, rotulo, type PropsTela } from "./pecas";

/**
 * Central de Compras do Nexo Demo (2026-11-27): a cotação da RC, com as
 * cinco abas do produto (Fornecedores, Propostas, Mapa, Seleção, Rodada de
 * Negociação) e a régua de etapas até "Enviada ao ERP". As propostas e os
 * insights são calculados em lib/nexo-demo/regras.ts.
 */
const c = t.cotacoes;
type Aba = keyof typeof c.abas;

function statusDaRfq(e: Estado): { texto: string; tom: "azul" | "ambar" | "verde" } {
  if (e.ocGerada) return { texto: c.status.concluida, tom: "verde" };
  if (e.selecaoEnviada) return { texto: c.status.aprovacao, tom: "ambar" };
  if (e.mapaGerado) return { texto: c.status.propostas, tom: "azul" };
  return e.convitesEnviados ? { texto: c.status.convites, tom: "azul" } : { texto: c.status.setup, tom: "ambar" };
}

/** Em qual etapa da régua a cotação está (0 a 5; 5 = tudo feito). */
const etapaDe = (e: Estado) => (e.ocGerada ? 5 : e.selecaoEnviada ? 2 : e.convitesEnviados ? 1 : 0);

const abaDaVez = (e: Estado): Aba => (e.selecaoEnviada ? "selecao" : e.mapaGerado ? "mapa" : e.convitesEnviados ? "propostas" : "fornecedores");

export function TelaCotacoes(props: PropsTela) {
  const { e } = props;
  const [aba, setAba] = useState<Aba>(abaDaVez(e));
  /* As propostas "chegam" um instante depois do envio dos convites; quem volta à tela já as encontra. */
  const [chegaram, setChegaram] = useState(e.convitesEnviados);
  useEffect(() => {
    if (!e.convitesEnviados || chegaram) return;
    const espera = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1400;
    const id = window.setTimeout(() => setChegaram(true), espera);
    return () => window.clearTimeout(id);
  }, [e.convitesEnviados, chegaram]);

  if (!e.rc || !e.rcAprovada) {
    return (
      <>
        <TituloTela titulo={c.titulo} />
        <div className={cartao}>
          <Vazio>{c.vazio}</Vazio>
        </div>
      </>
    );
  }
  const item = itemDoCatalogo(e.rc.item)!;
  const ps = propostas(e);
  const status = statusDaRfq(e);
  const etapa = etapaDe(e);
  return (
    <>
      <TituloTela titulo={c.titulo} />
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [c.indicadores.abertas, e.ocGerada ? 0 : 1],
          [c.indicadores.criticos, e.rc.urgencia === "Crítica" && !e.ocGerada ? 1 : 0],
          [c.indicadores.prazo, Math.round(item.fornecedores.reduce((s, f) => s + f.prazoDias, 0) / item.fornecedores.length)],
          [c.indicadores.total, 1],
        ].map(([nome, valor]) => (
          <div key={nome} className={`${cartao} !p-4`}>
            <dd className="text-2xl font-semibold tabular-nums text-fg">{valor}</dd>
            <dt className={rotulo}>{nome}</dt>
          </div>
        ))}
      </dl>

      <section className={`${cartao} flex flex-col gap-5`} aria-label={CODIGO_RFQ}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-fg">{CODIGO_RFQ}</h2>
            <p className="text-xs text-fg-muted">{CODIGO_RC}</p>
          </div>
          <div className="flex gap-2">
            <Selo tom="azul">{c.rodada(e.rodada)}</Selo>
            <Selo tom={status.tom}>{status.texto}</Selo>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-4 rounded-lg bg-bg p-4 sm:grid-cols-4">
          <div className="col-span-2">
            <Dado nome={c.cabecalho.item} valor={item.nome} />
          </div>
          <Dado nome={c.cabecalho.quantidade} valor={`${e.rc.qtd} ${item.unidade}`} />
          <Dado nome={c.cabecalho.estimado} valor={<span className="tabular-nums">{reais(estimadoCentavos(e.rc))}</span>} />
          <div className="col-span-2">
            <Dado nome={c.cabecalho.categoria} valor={item.categoria} />
          </div>
          <Dado nome={c.cabecalho.necessario} valor={dataCurta(e.rc.necessarioAte)} />
          <Dado nome={c.cabecalho.propostas} valor={`${chegaram ? ps.length : 0} / ${e.convitesEnviados ? e.convidados.length : 0}`} />
        </dl>

        <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs" aria-label={status.texto}>
          {c.etapas.map((nome, i) => (
            <li key={nome} className="flex items-center gap-2" aria-current={i === etapa ? "step" : undefined}>
              <span
                className={`flex size-5 items-center justify-center rounded-full text-[11px] font-semibold ${i < etapa ? "bg-[#0f8a4b] text-white" : i === etapa ? "bg-accent text-white" : "bg-[#e3e6f2] text-fg-muted"}`}
              >
                {i < etapa ? <Check size={12} weight="bold" aria-hidden="true" /> : i + 1}
              </span>
              <span className={i === etapa ? "font-semibold text-fg" : "text-fg-muted"}>{nome}</span>
              {i < c.etapas.length - 1 ? <span className={`h-px w-5 ${i < etapa ? "bg-[#0f8a4b]" : "bg-line"}`} aria-hidden="true" /> : null}
            </li>
          ))}
        </ol>

        <div role="tablist" aria-label={CODIGO_RFQ} className="-mx-5 flex gap-1 overflow-x-auto border-b border-line px-5">
          {(Object.keys(c.abas) as Aba[]).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`aba-${id}`}
              aria-selected={aba === id}
              aria-controls="painel-rfq"
              onClick={() => setAba(id)}
              className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm ${aba === id ? "border-accent font-semibold text-accent" : "border-transparent text-fg-muted hover:text-fg"}`}
            >
              {c.abas[id]}
            </button>
          ))}
        </div>

        <div role="tabpanel" id="painel-rfq" aria-labelledby={`aba-${aba}`} className="flex flex-col gap-4">
          {aba === "fornecedores" ? <AbaFornecedores {...props} irPara={setAba} /> : null}
          {aba === "propostas" ? <AbaPropostas {...props} chegaram={chegaram} irPara={setAba} /> : null}
          {aba === "mapa" ? <AbaMapa {...props} irPara={setAba} /> : null}
          {aba === "selecao" ? <AbaSelecao {...props} /> : null}
          {aba === "rodada" ? <AbaRodada {...props} /> : null}
        </div>
      </section>
    </>
  );
}

type PropsAba = PropsTela & { irPara: (a: Aba) => void };

function AbaFornecedores({ e, despachar, irPara }: PropsAba) {
  const item = itemDoCatalogo(e.rc!.item)!;
  const fora = semResposta(e);
  if (e.convitesEnviados) {
    return (
      <>
        <h3 className="text-sm font-semibold text-fg">
          {c.jaConvidados} <span className="font-normal text-fg-muted">({e.convidados.length})</span>
        </h3>
        <ul className="flex flex-col gap-2">
          {item.fornecedores
            .filter((f) => e.convidados.includes(f.id))
            .map((f) => {
              const d = t.fornecedores.find((x) => x.id === f.id)!;
              const respondeu = propostas(e).some((p) => p.fornecedor === f.id);
              return (
                <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-fg">{d.nome}</p>
                    <p className="text-xs text-fg-muted">{d.email}</p>
                  </div>
                  <Selo tom={respondeu ? "verde" : "neutro"}>{respondeu ? c.respondido : fora.includes(f.id) ? c.semResposta : c.aguardando}</Selo>
                </li>
              );
            })}
        </ul>
        <button type="button" onClick={() => irPara("propostas")} className={`${botao} self-end`}>
          {c.abas.propostas}
          <ArrowRight size={14} weight="bold" aria-hidden="true" />
        </button>
      </>
    );
  }
  return (
    <>
      <div className="rounded-lg border border-[#b9c6ff] p-4">
        <h3 className="text-sm font-semibold text-fg">
          {c.caixa} <span className="font-normal text-fg-muted">({e.convidados.length})</span>
        </h3>
        {e.convidados.length === 0 ? (
          <p className="mt-1 text-sm text-fg-muted">{c.caixaVazia}</p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {e.convidados.map((id) => (
              <li key={id}>
                <Selo tom="azul">{t.fornecedores.find((x) => x.id === id)!.nome}</Selo>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-fg">{c.sugeridos}</h3>
        <button type="button" onClick={() => despachar({ tipo: "convidarTodos" })} className="text-sm font-medium text-accent hover:underline">
          {c.adicionarTodos}
        </button>
      </div>
      <ul className="flex flex-col gap-2">
        {item.fornecedores.map((f) => {
          const d = t.fornecedores.find((x) => x.id === f.id)!;
          const dentro = e.convidados.includes(f.id);
          return (
            <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line px-4 py-3">
              <div>
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-fg">
                  {d.nome} <Selo>{c.homologado}</Selo>
                </p>
                <p className="text-xs text-fg-muted">
                  {d.email} · {item.categoria}
                </p>
              </div>
              <button type="button" aria-pressed={dentro} onClick={() => despachar({ tipo: "alternarConvite", fornecedor: f.id })} className={`${dentro ? botaoLinha : botao} !py-1.5`} aria-label={`${dentro ? c.remover : c.adicionar} ${d.nome}`}>
                {dentro ? c.remover : c.adicionar}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap items-center justify-end gap-3">
        {e.convidados.length < 2 ? <p className="text-xs text-fg-muted">{c.minimo}</p> : null}
        <button
          type="button"
          disabled={e.convidados.length < 2}
          onClick={() => {
            despachar({ tipo: "enviarConvites" });
            irPara("propostas");
          }}
          className={botao}
        >
          {c.enviarConvites(e.convidados.length)}
        </button>
      </div>
    </>
  );
}

function TabelaPropostas({ e, escolher }: { e: Estado; escolher?: (id: string) => void }) {
  const ps = propostas(e);
  const m = melhores(ps);
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full min-w-[620px] text-left text-sm">
        <thead className="bg-bg">
          <tr>
            {escolher ? <th className="w-10 px-3 py-2.5" /> : null}
            {Object.values(c.colunas)
              .filter((nome) => nome !== c.colunas.status)
              .map((nome) => (
                <th key={nome} scope="col" className={`${rotulo} px-3 py-2.5`}>
                  {nome}
                </th>
              ))}
          </tr>
        </thead>
        <tbody>
          {ps.map((p, i) => {
            const escolhido = e.vencedor === p.fornecedor;
            return (
              <tr key={p.fornecedor} className={`nexo-demo-chega border-t border-line ${escolhido ? "bg-[#e9f8ef]" : m?.preco.fornecedor === p.fornecedor ? "bg-[#f3fbf6]" : ""}`} style={{ animationDelay: `${i * 120}ms` }}>
                {escolher ? (
                  <td className="px-3 py-3">
                    <input
                      type="radio"
                      name="vencedor"
                      checked={escolhido}
                      disabled={e.selecaoEnviada}
                      onChange={() => escolher(p.fornecedor)}
                      aria-label={p.nome}
                      className="size-4 accent-[var(--accent)]"
                    />
                  </td>
                ) : null}
                <th scope="row" className="px-3 py-3 font-medium text-fg">
                  {p.nome}
                </th>
                <td className="px-3 py-3 tabular-nums text-fg">
                  {reais(p.unitarioCentavos)} {m?.preco.fornecedor === p.fornecedor ? <Selo tom="verde">{c.melhorPreco}</Selo> : null}
                </td>
                <td className="px-3 py-3 font-medium tabular-nums text-fg">{reais(p.totalCentavos)}</td>
                <td className="px-3 py-3 text-fg">
                  {c.dias(p.prazoDias)} {m?.prazo.fornecedor === p.fornecedor ? <Selo tom="azul">{c.melhorPrazo}</Selo> : null}
                </td>
                <td className="px-3 py-3 text-fg-muted">{p.pagamento}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AbaPropostas({ e, despachar, chegaram, irPara }: PropsAba & { chegaram: boolean }) {
  if (!e.convitesEnviados) return <Vazio>{c.propostasVazio}</Vazio>;
  if (!chegaram) {
    return (
      <p role="status" className="rounded-lg bg-bg px-4 py-6 text-center text-sm text-fg-muted">
        {c.chegando}
      </p>
    );
  }
  const ps = propostas(e);
  const m = melhores(ps)!;
  return (
    <>
      <dl className="grid grid-cols-3 gap-3">
        {[
          [c.resumoPropostas.convidados, String(e.convidados.length)],
          [c.resumoPropostas.responderam, String(ps.length)],
          [c.resumoPropostas.melhor, reais(m.preco.unitarioCentavos)],
        ].map(([nome, valor]) => (
          <div key={nome} className="rounded-lg border border-line p-3">
            <dd className="text-lg font-semibold tabular-nums text-fg">{valor}</dd>
            <dt className={rotulo}>{nome}</dt>
          </div>
        ))}
      </dl>
      <TabelaPropostas e={e} />
      <button
        type="button"
        onClick={() => {
          despachar({ tipo: "gerarMapa" });
          irPara("mapa");
        }}
        className={`${e.mapaGerado ? botaoLinha : botao} self-start`}
      >
        <Sparkle size={16} weight="fill" aria-hidden="true" />
        {e.mapaGerado ? c.abas.mapa : c.gerarMapa}
      </button>
    </>
  );
}

function AbaMapa({ e, despachar, irPara }: PropsAba) {
  if (!e.mapaGerado) return <Vazio>{c.mapaVazio}</Vazio>;
  const i = insights(e);
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-fg">{c.mapaTitulo}</h3>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={e.rodada === 2 || e.selecaoEnviada} onClick={() => despachar({ tipo: "novaRodada" })} className={`${botaoLinha} !py-2`}>
            {c.novaRodada}
          </button>
          <button type="button" onClick={() => irPara("selecao")} className={`${botao} !py-2`}>
            {c.irSelecao}
            <ArrowRight size={14} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </div>
      {e.rodada === 2 ? (
        <p role="status" className="rounded-lg bg-[#e9f8ef] px-4 py-2.5 text-sm text-[#0b6b3a]">
          {c.novaRodadaFeita}
        </p>
      ) : null}
      <TabelaPropostas key={e.rodada} e={e} />
      <div className="flex flex-col gap-4 rounded-lg border-l-2 border-accent-text bg-[#f4f1ff] p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-fg">
          <Sparkle size={16} weight="fill" className="text-accent-text" aria-hidden="true" />
          {c.insights}
        </h3>
        {[
          [c.insightMelhor, i.melhor],
          [c.insightOutliers, i.outliers],
          [c.insightRiscos, i.riscos],
        ].map(([titulo, itens]) => (
          <div key={titulo as string} className="flex flex-col gap-1">
            <h4 className="text-sm font-semibold text-fg">{titulo}</h4>
            <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-fg">
              {(itens as string[]).map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}

function AbaSelecao({ e, despachar, ir }: PropsTela) {
  if (!e.mapaGerado) return <Vazio>{c.selecaoVazia}</Vazio>;
  const vencedor = propostas(e).find((p) => p.fornecedor === e.vencedor);
  const economia = economiaCentavos(e);
  return (
    <>
      <h3 className="text-sm font-semibold text-fg">{c.selecaoTitulo}</h3>
      {e.selecaoEnviada && vencedor ? (
        <p role="status" className="rounded-lg border-l-2 border-accent bg-bg px-4 py-2.5 text-sm text-fg">
          {e.ocGerada ? c.aprovada(CODIGO_OC) : c.emAprovacao(reais(vencedor.totalCentavos))}
        </p>
      ) : null}
      <TabelaPropostas e={e} escolher={(id) => despachar({ tipo: "escolherVencedor", fornecedor: id })} />
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-lg bg-bg p-4">
        <dl className="flex flex-wrap gap-x-8 gap-y-3">
          <Dado nome={c.totalGeral} valor={<span className="text-lg tabular-nums">{vencedor ? reais(vencedor.totalCentavos) : "—"}</span>} />
          {vencedor ? (
            <Dado
              nome={economia >= 0 ? c.economia : c.acima}
              valor={
                <span className={`text-lg tabular-nums ${economia >= 0 ? "text-[#0b6b3a]" : "text-[#a1201a]"}`}>
                  {reais(Math.abs(economia))} ({porcento(Math.abs(economia) / estimadoCentavos(e.rc!))})
                </span>
              }
            />
          ) : null}
        </dl>
        {e.selecaoEnviada ? (
          e.ocGerada ? null : (
            <button type="button" onClick={() => ir("aprovacoes")} className={botao}>
              {t.aprovacoes.titulo}
              <ArrowRight size={14} weight="bold" aria-hidden="true" />
            </button>
          )
        ) : (
          <div className="flex flex-col items-end gap-1">
            <button type="button" disabled={!vencedor} onClick={() => despachar({ tipo: "concluirSelecao" })} className={`${botao} !bg-[#0f8a4b] hover:!bg-[#0b6b3a]`}>
              {c.concluir}
            </button>
            {!vencedor ? <p className="text-xs text-fg-muted">{c.escolha}</p> : null}
          </div>
        )}
      </div>
    </>
  );
}

function AbaRodada({ e }: PropsTela) {
  const rodadas = e.convitesEnviados ? (e.rodada === 2 ? [1, 2] : [1]) : [];
  return (
    <>
      <div>
        <h3 className="text-sm font-semibold text-fg">{c.rodadaTitulo}</h3>
        <p className="text-xs text-fg-muted">{c.rodadaSub}</p>
      </div>
      {rodadas.length === 0 ? <Vazio>{c.propostasVazio}</Vazio> : null}
      <ul className="grid gap-3 sm:grid-cols-2">
        {rodadas.map((n) => {
          const ps = propostas({ ...e, rodada: n as 1 | 2 });
          const vigente = n === e.rodada;
          return (
            <li key={n} className={`flex flex-col gap-2 rounded-lg border p-4 ${vigente ? "border-accent" : "border-line"}`}>
              <div className="flex gap-2">
                <Selo tom="azul">{c.rodada(n)}</Selo>
                <Selo tom={vigente ? "verde" : "neutro"}>{vigente ? c.vigente : c.encerrada}</Selo>
              </div>
              <p className="text-sm font-semibold text-fg">{CODIGO_RFQ}</p>
              <p className="text-xs text-fg-muted">
                {c.cabecalho.convidados} {e.convidados.length} · {c.cabecalho.propostas} {ps.length}
              </p>
              <p className="text-sm text-fg">
                {c.melhorDaRodada} <span className="font-semibold tabular-nums">{reais(melhores(ps)!.preco.unitarioCentavos)}</span>
              </p>
            </li>
          );
        })}
      </ul>
    </>
  );
}
