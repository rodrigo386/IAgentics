"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Check, DownloadSimple, Sparkle } from "@phosphor-icons/react";
import { FORNECEDORES } from "@/lib/nexo-demo/dados";
import { nexoDemo as t } from "@/lib/nexo-demo/textos";
import {
  AJUSTE_MAX,
  alcadaDe,
  centavosDe,
  codigoRc,
  codigoRfq,
  cotacoes,
  disponiveis,
  economiaCentavos,
  estimadoCentavos,
  fornecedorDe,
  insights,
  itemDoCatalogo,
  melhores,
  ordensDeCompra,
  porcento,
  quemNaoResponde,
  reais,
  rodadaDe,
  selecaoCompleta,
  semAcento,
  semProposta,
  statusDaRfq,
  sugestaoPortal,
  totalSelecionado,
  type Acao,
  type Cotacao,
  type Estado,
} from "@/lib/nexo-demo/regras";
import { OrdemCompra } from "./OrdemCompra";
import { GuiaJanela } from "./Guia";
import { Dado, Janela, Selo, Vazio, botao, botaoLinha, botaoMia, botaoVerde, campo, dataCurta, destaque, linque, rotulo, type Tom } from "./pecas";

/**
 * O detalhe da cotação no Nexo Demo (2026-11-27): a janela que abre sobre a
 * Central de Compras, com a régua de etapas e as abas do produto. Serve à
 * cotação da pessoa e às da operação de exemplo (`leitura`: só olhar).
 * Propostas, insights e ordens de compra saem de lib/nexo-demo/regras.ts.
 */
const c = t.cotacoes;
export type Aba = keyof typeof c.abas;
export type Rfq = { numero: string; e: Estado; solicitante: string; comprador: string; diasAberto: number; sua: boolean };
type Props = { rfq: Rfq; despachar: (a: Acao) => void; leitura: boolean; hoje: Date };

export const TOM_RFQ: Record<string, Tom> = { setup: "ambar", convites: "azul", aguardando: "ambar", propostas: "azul", aprovacao: "ambar", concluida: "verde" };

const etapaDe = (e: Estado) => (e.ocGerada ? 5 : e.selecaoEnviada ? 2 : e.convitesEnviados ? 1 : 0);
export const abaDaVez = (e: Estado): Aba => (e.ocGerada ? "oc" : e.selecaoEnviada ? "selecao" : e.mapaGerado ? "mapa" : e.convitesEnviados ? "propostas" : "fornecedores");

export function DetalheRfq({ rfq, despachar, leitura, hoje, fechar, sair }: Props & { fechar: () => void; sair: (para: "aprovacoes" | "fecho") => void }) {
  const { e } = rfq;
  const [aba, setAba] = useState<Aba>(abaDaVez(e));
  /** O fornecedor cujo portal está aberto (a pessoa responde no lugar dele). */
  const [portal, setPortal] = useState<string | null>(null);
  const rc = e.rc!;
  const status = statusDaRfq(e);
  const etapa = etapaDe(e);
  const props = { rfq, despachar, leitura, hoje, irPara: setAba, abrirPortal: setPortal };
  return (
    <Janela
      titulo={codigoRfq(rfq.numero)}
      sobre={`${codigoRc(rfq.numero)} · ${c.cabecalho.requisitante}: ${rfq.solicitante} · ${c.cabecalho.comprador}: ${rfq.comprador}`}
      selos={
        <>
          <Selo tom="azul">{c.rodada(rodadaDe(e))}</Selo>
          <Selo tom={TOM_RFQ[status]}>{c.status[status]}</Selo>
        </>
      }
      fechar={fechar}
    >
      {leitura ? (
        <p className="rounded-lg bg-[#fdf0d5] px-4 py-2.5 text-sm text-[#8a5200]">{t.app.somenteLeitura}</p>
      ) : portal ? null : (
        <GuiaJanela e={e} aba={aba} irAba={setAba} sair={sair} nomeAba={(a) => c.abas[a as Aba]} />
      )}
      <dl className="grid grid-cols-2 gap-4 rounded-lg bg-bg p-4 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-4">
          <dt className={rotulo}>{c.cabecalho.itens}</dt>
          <dd>
            <ul className="mt-1 flex flex-col gap-0.5 text-sm font-medium text-fg">
              {rc.itens.map((l) => (
                <li key={l.item}>
                  {l.qtd} {itemDoCatalogo(l.item)!.unidade} · {itemDoCatalogo(l.item)!.nome} <span className="font-normal text-fg-muted">· {itemDoCatalogo(l.item)!.categoria}</span>
                </li>
              ))}
            </ul>
          </dd>
        </div>
        <Dado nome={c.cabecalho.estimado} valor={<span className="tabular-nums">{reais(estimadoCentavos(rc))}</span>} />
        <Dado nome={c.cabecalho.centro} valor={rc.centro.split(" · ")[0]} />
        <Dado nome={c.cabecalho.necessario} valor={dataCurta(rc.necessarioAte)} />
        <Dado nome={c.cabecalho.propostas} valor={`${cotacoes(e).length} / ${e.convitesEnviados ? e.convidados.length : 0}`} />
      </dl>

      <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs" aria-label={c.status[status]}>
        {c.etapas.map((nome, i) => (
          <li key={nome} className="flex items-center gap-2" aria-current={i === etapa ? "step" : undefined}>
            <span className={`flex size-5 items-center justify-center rounded-full text-[11px] font-semibold ${i < etapa ? "bg-[#0f8a4b] text-white" : i === etapa ? "bg-accent text-white" : "bg-[#e3e6f2] text-fg-muted"}`}>
              {i < etapa ? <Check size={12} weight="bold" aria-hidden="true" /> : i + 1}
            </span>
            <span className={i === etapa ? "font-semibold text-fg" : "text-fg-muted"}>{nome}</span>
            {i < c.etapas.length - 1 ? <span className={`h-px w-5 ${i < etapa ? "bg-[#0f8a4b]" : "bg-line"}`} aria-hidden="true" /> : null}
          </li>
        ))}
      </ol>

      {portal ? (
        <Portal rfq={rfq} fornecedor={portal} despachar={despachar} fechar={() => setPortal(null)} />
      ) : (
        <>
          <div role="tablist" aria-label={codigoRfq(rfq.numero)} className="-mx-5 flex gap-1 overflow-x-auto border-b border-line px-5">
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
            {aba === "fornecedores" ? <AbaFornecedores {...props} /> : null}
            {aba === "propostas" ? <AbaPropostas {...props} /> : null}
            {aba === "mapa" ? <AbaMapa {...props} /> : null}
            {aba === "selecao" ? <AbaSelecao {...props} /> : null}
            {aba === "rodada" ? <AbaRodada {...props} /> : null}
            {aba === "oc" ? <AbaOc {...props} /> : null}
          </div>
        </>
      )}
    </Janela>
  );
}

type PropsAba = Props & { irPara: (a: Aba) => void; abrirPortal: (id: string) => void };

/* ---------- Fornecedores ---------- */

function AbaFornecedores({ rfq, despachar, leitura, irPara, abrirPortal }: PropsAba) {
  const { e } = rfq;
  const [modo, setModo] = useState<keyof typeof c.modos>("cadastro");
  const [filtro, setFiltro] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [erroNovo, setErroNovo] = useState(false);
  const rc = e.rc!;
  const nomeDe = (id: string) => fornecedorDe(e, id)?.nome ?? id;

  if (e.convitesEnviados) {
    const com = cotacoes(e).map((x) => x.fornecedor);
    const calado = quemNaoResponde(e);
    return (
      <>
        <h3 className="text-sm font-semibold text-fg">
          {c.jaConvidados} <span className="font-normal text-fg-muted">({e.convidados.length})</span>
        </h3>
        <ul className="flex flex-col gap-2">
          {disponiveis(e)
            .filter((f) => e.convidados.includes(f.id))
            .map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line px-4 py-3">
                <div>
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-fg">
                    {f.nome} <Selo tom={f.homologado ? "neutro" : "ambar"}>{f.homologado ? c.homologado : c.naoHomologado}</Selo>
                  </p>
                  <p className="text-xs text-fg-muted">{f.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Selo tom={com.includes(f.id) ? "verde" : "neutro"}>{com.includes(f.id) ? c.respondido : e.propostasChegaram && f.id === calado ? c.semResposta : c.aguardando}</Selo>
                  {!leitura && !e.selecaoEnviada ? (
                    <button type="button" onClick={() => abrirPortal(f.id)} className={`${botaoLinha} !py-1.5`} aria-label={`${c.portalVer}: ${f.nome}`}>
                      {c.portalVer}
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
        </ul>
        <button type="button" onClick={() => irPara("propostas")} className={`${botao} self-end`}>
          {c.abas.propostas}
          <ArrowRight size={14} weight="bold" aria-hidden="true" />
        </button>
      </>
    );
  }

  const itemFornecedor = (id: string) => {
    const f = fornecedorDe(e, id)!;
    const dentro = e.convidados.includes(id);
    return (
      <li key={id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line px-4 py-3">
        <div>
          <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-fg">
            {f.nome} <Selo tom={f.homologado ? "neutro" : "ambar"}>{f.homologado ? c.homologado : c.naoHomologado}</Selo>
          </p>
          <p className="text-xs text-fg-muted">{f.email}</p>
        </div>
        <button type="button" disabled={leitura} aria-pressed={dentro} onClick={() => despachar({ tipo: "alternarConvite", fornecedor: id })} className={`${dentro ? botaoLinha : botao} !py-1.5`} aria-label={`${dentro ? c.remover : c.adicionar} ${f.nome}`}>
          {dentro ? c.remover : c.adicionar}
        </button>
      </li>
    );
  };
  const daBase = FORNECEDORES.filter((f) => semAcento(f.nome).includes(semAcento(filtro)));
  const novo = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const d = new FormData(ev.currentTarget);
    const nome = String(d.get("nome") ?? "").trim();
    const email = String(d.get("email") ?? "").trim();
    const ok = nome.length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    setErroNovo(!ok);
    if (!ok) return;
    despachar({ tipo: "novoFornecedor", nome, email });
    ev.currentTarget.reset();
  };
  return (
    <>
      <div className="rounded-lg border border-[#b9c6ff] p-4">
        <h3 className="text-sm font-semibold text-fg">
          {c.caixa} <span className="font-normal text-fg-muted">({e.convidados.length})</span>
        </h3>
        {e.convidados.length === 0 ? (
          <p className="mt-1 text-sm text-fg-muted">{c.caixaVazia}</p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2" aria-label={c.caixa}>
            {e.convidados.map((id) => (
              <li key={id}>
                <Selo tom="azul">{nomeDe(id)}</Selo>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-line p-4">
        <h3 className="text-sm font-semibold text-fg">{c.encontrar}</h3>
        <div role="group" aria-label={c.encontrar} className="flex flex-wrap gap-1 self-start rounded-lg border border-line p-1">
          {(Object.keys(c.modos) as (keyof typeof c.modos)[]).map((m) => (
            <button key={m} type="button" aria-pressed={modo === m} onClick={() => setModo(m)} className={`rounded-md px-3 py-1.5 text-sm ${modo === m ? "bg-accent font-medium text-white" : "text-fg hover:bg-bg"}`}>
              {c.modos[m]}
            </button>
          ))}
        </div>

        {modo === "cadastro" ? (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <input value={filtro} onChange={(ev) => setFiltro(ev.target.value)} placeholder={c.filtroNome} aria-label={c.filtroNome} className={`${campo} max-w-sm`} />
              <button type="button" disabled={leitura} onClick={() => despachar({ tipo: "convidarTodos" })} className={`${linque} rounded px-1 ${destaque(!leitura && !e.convitesEnviados && e.convidados.length < 2)}`}>
                {c.adicionarTodos}
              </button>
            </div>
            {daBase.length === 0 ? <Vazio>{c.filtroVazio}</Vazio> : <ul className="flex flex-col gap-2">{daBase.map((f) => itemFornecedor(f.id))}</ul>}
          </>
        ) : null}

        {modo === "ia" ? (
          <>
            <p className="text-sm text-fg-muted">{c.iaTexto}</p>
            {e.iaBuscada ? (
              <>
                <p role="status" className="rounded-lg bg-[#f4f1ff] px-4 py-2.5 text-sm text-fg">
                  {c.iaAchou(disponiveis(e).filter((f) => !f.homologado && !f.id.startsWith("novo")).length)}
                </p>
                <ul className="flex flex-col gap-2">
                  {disponiveis(e)
                    .filter((f) => !f.homologado && !f.id.startsWith("novo"))
                    .map((f) => itemFornecedor(f.id))}
                </ul>
              </>
            ) : buscando ? (
              <p role="status" className="rounded-lg bg-bg px-4 py-4 text-center text-sm text-fg-muted">
                {c.iaBuscando}
              </p>
            ) : (
              <button
                type="button"
                disabled={leitura}
                onClick={() => {
                  setBuscando(true);
                  window.setTimeout(() => despachar({ tipo: "buscarIa" }), window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1100);
                }}
                className={`${botaoMia} self-start`}
              >
                <Sparkle size={16} weight="fill" aria-hidden="true" />
                {c.iaBuscar}
              </button>
            )}
          </>
        ) : null}

        {modo === "novo" ? (
          <>
            <p className="text-sm text-fg-muted">{c.novoTexto}</p>
            {e.extras.length > 0 ? <ul className="flex flex-col gap-2">{e.extras.map((x) => itemFornecedor(x.id))}</ul> : null}
            {e.extras.length >= 2 ? (
              <p className="text-xs text-fg-muted">{c.novoLimite}</p>
            ) : (
              <form onSubmit={novo} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <label className="flex flex-col gap-1">
                  <span className={rotulo}>{c.novoNome}</span>
                  <input name="nome" maxLength={80} autoComplete="off" className={campo} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className={rotulo}>{c.novoEmail}</span>
                  <input name="email" type="email" maxLength={120} autoComplete="off" className={campo} />
                </label>
                <button type="submit" disabled={leitura} className={botao}>
                  {c.novoCadastrar}
                </button>
                {erroNovo ? (
                  <p role="alert" className="text-xs text-[#a1201a] sm:col-span-3">
                    {c.novoErro}
                  </p>
                ) : null}
              </form>
            )}
          </>
        ) : null}
      </div>

      <details className="rounded-lg border border-line p-4">
        <summary className="cursor-pointer text-sm font-semibold text-fg">{c.previa}</summary>
        <div className="mt-3 flex flex-col gap-2 rounded-lg bg-bg p-4 text-sm text-fg">
          <p className="text-xs text-fg-muted">
            {c.emailPara}: {e.convidados.length > 0 ? e.convidados.map((id) => fornecedorDe(e, id)!.email).join(", ") : "—"}
          </p>
          <p className="font-semibold">{c.emailAssunto(codigoRfq(rfq.numero))}</p>
          {c.emailCorpo(rc.itens.map((l) => `${l.qtd} ${itemDoCatalogo(l.item)!.unidade} de ${itemDoCatalogo(l.item)!.nome}`).join("; "), dataCurta(rc.necessarioAte)).map((p) => (
            <p key={p}>{p}</p>
          ))}
          <p className="self-start rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white">{c.emailLink}</p>
        </div>
      </details>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {e.convidados.length < 2 ? <p className="text-xs text-fg-muted">{c.minimo}</p> : null}
        <button
          type="button"
          disabled={leitura || e.convidados.length < 2}
          onClick={() => {
            despachar({ tipo: "enviarConvites" });
            irPara("propostas");
          }}
          className={`${botao} ${destaque(!leitura && !e.convitesEnviados && e.convidados.length >= 2)}`}
        >
          {c.enviarConvites(e.convidados.length)}
        </button>
      </div>
    </>
  );
}

/* ---------- Portal do Fornecedor ---------- */

function Portal({ rfq, fornecedor, despachar, fechar }: { rfq: Rfq; fornecedor: string; despachar: (a: Acao) => void; fechar: () => void }) {
  const p = c.portal;
  const { e } = rfq;
  const f = fornecedorDe(e, fornecedor)!;
  const [sugestao] = useState(() => sugestaoPortal(e, fornecedor));
  const [erro, setErro] = useState(false);
  const rc = e.rc!;
  const enviar = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const d = new FormData(ev.currentTarget);
    const precos: Record<string, number> = {};
    for (const l of rc.itens) precos[l.item] = centavosDe(String(d.get(`preco-${l.item}`) ?? ""));
    const prazoDias = Number(d.get("prazo"));
    const ok = Object.values(precos).every((v) => Number.isInteger(v) && v > 0) && Number.isInteger(prazoDias) && prazoDias > 0 && prazoDias <= 365;
    setErro(!ok);
    if (!ok) return;
    despachar({ tipo: "responderPortal", fornecedor, resposta: { precos, prazoDias } });
    fechar();
  };
  return (
    <section aria-label={p.titulo} className="flex flex-col gap-4 rounded-xl border-2 border-dashed border-[#b9c6ff] bg-[#fbfbff] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-fg">{p.titulo}</h3>
          <p className="text-sm text-fg-muted">{p.sub(f.nome)}</p>
        </div>
        <button type="button" onClick={fechar} className={`${botaoLinha} !py-1.5`}>
          {t.app.janela.fechar}
        </button>
      </div>
      <p className="truncate rounded-lg bg-bg px-3 py-2 font-mono text-xs text-fg-muted">{p.link(f.id)}</p>
      <form onSubmit={enviar} className="flex flex-col gap-4">
        <div>
          <p className={rotulo}>{p.pedido}</p>
          <p className="text-sm font-medium text-fg">
            {codigoRfq(rfq.numero)} · {c.cabecalho.necessario.toLowerCase()} {dataCurta(rc.necessarioAte)}
          </p>
        </div>
        {rc.itens.map((l) => {
          const item = itemDoCatalogo(l.item)!;
          return (
            <label key={l.item} className="flex flex-col gap-1">
              <span className="text-sm text-fg">
                {l.qtd} {item.unidade} · {item.nome}
              </span>
              <span className="sr-only">{p.preco(item.nome)}</span>
              <input name={`preco-${l.item}`} inputMode="decimal" defaultValue={(sugestao.precos[l.item] / 100).toFixed(2).replace(".", ",")} aria-label={p.preco(item.nome)} className={`${campo} max-w-[200px] tabular-nums`} />
            </label>
          );
        })}
        <label className="flex flex-col gap-1">
          <span className={rotulo}>{p.prazo}</span>
          <input name="prazo" type="number" min={1} max={365} defaultValue={sugestao.prazoDias} className={`${campo} max-w-[120px]`} />
        </label>
        <div className="flex flex-col gap-1">
          <button type="button" disabled className={`${botaoLinha} self-start`}>
            {p.anexo}
          </button>
          <p className="text-xs text-fg-muted">{p.anexoDemo}</p>
        </div>
        {erro ? (
          <p role="alert" className="text-sm text-[#a1201a]">
            {p.erro}
          </p>
        ) : null}
        <button type="submit" className={`${botao} self-start`}>
          {p.enviar}
        </button>
      </form>
    </section>
  );
}

/* ---------- Propostas ---------- */

type Painel = "proposta" | "historico" | "negociar" | "insights";

function AbaPropostas({ rfq, despachar, leitura, irPara, abrirPortal }: PropsAba) {
  const { e } = rfq;
  const [aberto, setAberto] = useState<{ id: string; painel: Painel } | null>(null);
  const [recado, setRecado] = useState<string | null>(null);
  if (!e.convitesEnviados) return <Vazio>{c.propostasVazio}</Vazio>;
  const cs = cotacoes(e);
  const rc = e.rc!;
  const sem = semProposta(e);
  const menor = cs.reduce((m, x) => (x.cotadas === rc.itens.length && x.totalCentavos < m ? x.totalCentavos : m), Number.POSITIVE_INFINITY);
  const m = melhores(cs, rc);
  const podeNegociar = cs.filter((x) => !e.negociados.includes(x.fornecedor));
  const alternar = (id: string, painel: Painel) => setAberto(aberto?.id === id && aberto.painel === painel ? null : { id, painel });
  const negociar = (ids: string[]) => {
    const antes = cs.filter((x) => ids.includes(x.fornecedor));
    despachar({ tipo: "negociar", fornecedores: ids });
    setRecado(antes.map((x) => c.negociacaoFeita(x.nome, porcento(fornecedorDe(e, x.fornecedor)!.descontoRodada))).join(" "));
    setAberto(null);
  };
  return (
    <>
      {!e.propostasChegaram && cs.length === 0 ? (
        <p role="status" className="rounded-lg bg-bg px-4 py-6 text-center text-sm text-fg-muted">
          {leitura ? c.status.convites : c.chegando}
        </p>
      ) : cs.length === 0 ? (
        <Vazio>{c.semPropostas}</Vazio>
      ) : (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            [c.resumoPropostas.convidados, String(e.convidados.length)],
            [c.resumoPropostas.responderam, String(cs.length)],
            [c.resumoPropostas.melhor, Number.isFinite(menor) ? reais(menor) : "—"],
          ].map(([nome, valor], i) => (
            <div key={nome} className={`rounded-lg border border-line p-3 ${i === 2 ? "max-sm:col-span-2" : ""}`}>
              <dd className="text-lg font-semibold tabular-nums text-fg">{valor}</dd>
              <dt className={rotulo}>{nome}</dt>
            </div>
          ))}
        </dl>
      )}
      {recado ? (
        <p role="status" className="rounded-lg bg-[#e9f8ef] px-4 py-2.5 text-sm text-[#0b6b3a]">
          {recado}
        </p>
      ) : null}

      <ul className="flex flex-col gap-3">
        {cs.map((x, i) => {
          const f = fornecedorDe(e, x.fornecedor)!;
          const painel = aberto?.id === x.fornecedor ? aberto.painel : null;
          const completa = x.cotadas === rc.itens.length;
          const notas = [
            completa && x.totalCentavos === menor ? c.insightProposta.melhor : completa && Number.isFinite(menor) ? c.insightProposta.acima(porcento(x.totalCentavos / menor - 1)) : c.insightProposta.parcial,
            ...(m.prazo === x.fornecedor ? [c.insightProposta.prazo] : []),
            ...(x.homologado ? [] : [c.insightProposta.naoHomologado]),
            ...(e.negociados.includes(x.fornecedor) ? [] : [c.insightProposta.espaco(porcento(f.descontoRodada))]),
          ];
          return (
            <li key={x.fornecedor} className="nexo-demo-chega flex flex-col gap-3 rounded-lg border border-line p-4" style={{ animationDelay: `${i * 110}ms` }} data-proposta={x.fornecedor}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-fg">
                  {x.nome}
                  <Selo tom={x.homologado ? "neutro" : "ambar"}>{x.homologado ? c.homologado : c.naoHomologado}</Selo>
                  {completa ? null : <Selo tom="ambar">{c.seloParcial(x.cotadas, rc.itens.length)}</Selo>}
                  {e.negociados.includes(x.fornecedor) ? <Selo tom="verde">{c.seloNegociado}</Selo> : null}
                  {x.peloPortal ? <Selo tom="violeta">{c.seloPortal}</Selo> : null}
                </p>
                <p className="text-base font-semibold tabular-nums text-fg">{reais(x.totalCentavos)}</p>
              </div>
              <p className="text-xs text-fg-muted">
                {c.colunas.prazo}: {c.dias(x.prazoDias)} · {c.colunas.pagamento}: {x.pagamento}
              </p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["proposta", c.verProposta],
                    ["historico", c.historico],
                    ["negociar", c.negociar],
                    ["insights", c.insightsBotao],
                  ] as [Painel, string][]
                ).map(([id, rot]) => (
                  <button
                    key={id}
                    type="button"
                    aria-expanded={painel === id}
                    disabled={id === "negociar" && (leitura || e.selecaoEnviada || e.negociados.includes(x.fornecedor))}
                    onClick={() => alternar(x.fornecedor, id)}
                    className={`${painel === id ? botao : botaoLinha} !px-3 !py-1.5 !text-xs`}
                    aria-label={`${rot}: ${x.nome}`}
                  >
                    {id === "insights" ? <Sparkle size={12} weight="fill" aria-hidden="true" /> : null}
                    {rot}
                  </button>
                ))}
              </div>
              {painel === "proposta" ? <LinhasDaProposta x={x} e={e} /> : null}
              {painel === "historico" ? (
                <ol className="flex flex-col gap-1.5 border-l-2 border-line pl-4 text-sm text-fg">
                  {[c.historicoItens.convite, c.historicoItens.abriu, x.peloPortal ? c.historicoItens.portal : c.historicoItens.respondeu, ...(e.negociados.includes(x.fornecedor) ? [c.historicoItens.negociacao, c.historicoItens.revisou] : [])].map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ol>
              ) : null}
              {painel === "negociar" ? (
                <div className="flex flex-col gap-2 rounded-lg bg-bg p-4 text-sm text-fg">
                  <p className="text-xs text-fg-muted">
                    {c.emailPara}: {f.email}
                  </p>
                  <p className="font-semibold">{c.negociacaoAssunto(codigoRfq(rfq.numero))}</p>
                  {c.negociacaoCorpo(x.nome, reais(Math.round(x.totalCentavos * 0.95))).map((par) => (
                    <p key={par}>{par}</p>
                  ))}
                  <button type="button" onClick={() => negociar([x.fornecedor])} className={`${botao} self-start`}>
                    {c.enviarEmail}
                  </button>
                </div>
              ) : null}
              {painel === "insights" ? (
                <ul className="flex list-disc flex-col gap-1 rounded-lg bg-[#f4f1ff] py-3 pl-8 pr-4 text-sm text-fg">
                  {notas.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>

      {sem.length > 0 && !leitura && !e.selecaoEnviada ? (
        <ul className="flex flex-col gap-2">
          {sem.map((id) => (
            <li key={id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-line px-4 py-3">
              <p className="flex flex-wrap items-center gap-2 text-sm text-fg">
                {fornecedorDe(e, id)!.nome} <Selo>{e.propostasChegaram ? c.semResposta : c.aguardando}</Selo>
              </p>
              <button type="button" onClick={() => abrirPortal(id)} className={`${botaoLinha} !py-1.5`} aria-label={`${c.portalResponder}: ${fornecedorDe(e, id)!.nome}`}>
                {c.portalResponder}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {cs.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={leitura}
            onClick={() => {
              despachar({ tipo: "gerarMapa" });
              irPara("mapa");
            }}
            className={e.mapaGerado ? botaoLinha : `${botaoMia} ${destaque(!leitura)}`}
          >
            <Sparkle size={16} weight="fill" aria-hidden="true" />
            {e.mapaGerado ? c.abas.mapa : c.gerarMapa}
          </button>
          <button type="button" disabled={leitura || e.selecaoEnviada || podeNegociar.length === 0} onClick={() => negociar(podeNegociar.map((x) => x.fornecedor))} className={botaoLinha}>
            {c.negociarTodos(podeNegociar.length)}
          </button>
        </div>
      ) : null}
    </>
  );
}

function LinhasDaProposta({ x, e }: { x: Cotacao; e: Estado }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="bg-bg">
            <tr>
              {[c.colunas.item, c.colunas.qtd, c.colunas.unitario, c.colunas.total].map((n) => (
                <th key={n} scope="col" className={`${rotulo} px-3 py-2`}>
                  {n}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {e.rc!.itens.map((l) => {
              const p = x.linhas[l.item];
              return (
                <tr key={l.item} className="border-t border-line">
                  <th scope="row" className="px-3 py-2.5 font-medium text-fg">
                    {itemDoCatalogo(l.item)!.nome}
                  </th>
                  <td className="px-3 py-2.5 tabular-nums text-fg">{l.qtd}</td>
                  <td className="px-3 py-2.5 tabular-nums text-fg">{p ? reais(p.unitarioCentavos) : c.naoCotou}</td>
                  <td className="px-3 py-2.5 tabular-nums text-fg">{p ? reais(p.totalCentavos) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-muted">
        {c.condicoes.map((k) => (
          <li key={k}>{k}</li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Mapa ---------- */

function baixarCsv(rfq: Rfq) {
  const k = c.csv;
  const sep = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const linhas = [[k.item, k.qtd, k.fornecedor, k.unitario, k.total, k.prazo, k.pagamento].join(";")];
  for (const l of rfq.e.rc!.itens)
    for (const x of cotacoes(rfq.e)) {
      const p = x.linhas[l.item];
      if (p) linhas.push([itemDoCatalogo(l.item)!.nome, l.qtd, x.nome, (p.unitarioCentavos / 100).toFixed(2).replace(".", ","), (p.totalCentavos / 100).toFixed(2).replace(".", ","), x.prazoDias, x.pagamento].map(sep).join(";"));
    }
  const url = URL.createObjectURL(new Blob(["﻿" + linhas.join("\r\n")], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `mapa-${codigoRfq(rfq.numero)}.csv` });
  a.click();
  URL.revokeObjectURL(url);
}

function AbaMapa({ rfq, despachar, leitura, irPara }: PropsAba) {
  const { e } = rfq;
  if (!e.mapaGerado) return <Vazio>{c.mapaVazio}</Vazio>;
  const rc = e.rc!;
  const cs = cotacoes(e);
  const m = melhores(cs, rc);
  const i = insights(e);
  const podeNegociar = cs.filter((x) => !e.negociados.includes(x.fornecedor)).map((x) => x.fornecedor);
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-fg">{c.mapaTitulo}</h3>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => baixarCsv(rfq)} className={`${botaoLinha} !py-2`}>
            <DownloadSimple size={14} aria-hidden="true" />
            {c.exportar}
          </button>
          <button type="button" disabled={leitura || e.selecaoEnviada || podeNegociar.length === 0} onClick={() => despachar({ tipo: "negociar", fornecedores: podeNegociar })} className={`${botaoLinha} !py-2`}>
            {c.negociarTodos(podeNegociar.length)}
          </button>
          <button type="button" onClick={() => irPara("selecao")} className={`${botao} !py-2`}>
            {c.irSelecao}
            <ArrowRight size={14} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full text-left text-sm" style={{ minWidth: `${220 + cs.length * 170}px` }}>
          <thead className="bg-bg">
            <tr>
              <th scope="col" className={`${rotulo} px-3 py-2.5`}>
                {c.colunas.item}
              </th>
              {cs.map((x) => (
                <th key={x.fornecedor} scope="col" className={`${rotulo} px-3 py-2.5`}>
                  {x.nome}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rc.itens.map((l) => (
              <tr key={l.item} className="border-t border-line align-top">
                <th scope="row" className="px-3 py-3 font-medium text-fg">
                  {itemDoCatalogo(l.item)!.nome}
                  <span className="block text-xs font-normal text-fg-muted">
                    {c.colunas.qtd} {l.qtd}
                  </span>
                </th>
                {cs.map((x) => {
                  const p = x.linhas[l.item];
                  const melhor = m.porLinha[l.item] === x.fornecedor;
                  return (
                    <td key={x.fornecedor} className={`px-3 py-3 ${melhor ? "bg-[#f3fbf6]" : ""}`} data-celula={`${l.item}:${x.fornecedor}`}>
                      {p ? (
                        <>
                          <span className="font-medium tabular-nums text-fg">{reais(p.unitarioCentavos)}</span> {melhor ? <Selo tom="verde">{c.melhorPreco}</Selo> : null}
                          <span className="block text-xs tabular-nums text-fg-muted">
                            {c.colunas.total}: {reais(p.totalCentavos)}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-fg-muted">{c.naoCotou}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="border-t border-line bg-bg">
              <th scope="row" className="px-3 py-3 text-xs font-semibold text-fg">
                {c.totalFornecedor}
              </th>
              {cs.map((x) => (
                <td key={x.fornecedor} className="px-3 py-3 font-semibold tabular-nums text-fg">
                  {reais(x.totalCentavos)}
                </td>
              ))}
            </tr>
            <tr className="border-t border-line">
              <th scope="row" className="px-3 py-3 text-xs font-semibold text-fg">
                {c.prazoLinha}
              </th>
              {cs.map((x) => (
                <td key={x.fornecedor} className="px-3 py-3 text-fg">
                  {c.dias(x.prazoDias)} {m.prazo === x.fornecedor ? <Selo tom="azul">{c.melhorPrazo}</Selo> : null}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-4 rounded-lg border-l-2 border-accent-text bg-[#f4f1ff] p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-fg">
          <Sparkle size={16} weight="fill" className="text-accent-text" aria-hidden="true" />
          {c.insights}
        </h3>
        {(
          [
            [c.insightMelhor, i.melhor],
            [c.insightOutliers, i.outliers],
            [c.insightRiscos, i.riscos],
          ] as [string, string[]][]
        ).map(([titulo, itens]) => (
          <div key={titulo} className="flex flex-col gap-1">
            <h4 className="text-sm font-semibold text-fg">{titulo}</h4>
            <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-fg">
              {itens.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------- Seleção ---------- */

function AbaSelecao({ rfq, despachar, leitura, irPara }: PropsAba) {
  const { e } = rfq;
  /** O desconto que a pessoa pediu em cada linha (para dizer se o fornecedor aceitou tudo ou só parte). */
  const [pedidos, setPedidos] = useState<Record<string, number>>({});
  const [invalido, setInvalido] = useState<string | null>(null);
  if (!e.mapaGerado) return <Vazio>{c.selecaoVazia}</Vazio>;
  const rc = e.rc!;
  const cs = cotacoes(e);
  const total = totalSelecionado(e);
  const economia = economiaCentavos(e);
  const completa = selecaoCompleta(e);
  const ocs = ordensDeCompra(e, rfq.numero);
  const travada = leitura || e.selecaoEnviada;
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-fg">{c.selecaoTitulo}</h3>
        <button type="button" disabled={travada} onClick={() => despachar({ tipo: "sugerirSelecao" })} className={`${botaoMia} !py-2 ${destaque(!travada && !completa)}`}>
          <Sparkle size={14} weight="fill" aria-hidden="true" />
          {c.sugerir}
        </button>
      </div>
      {e.selecaoEnviada ? (
        <p role="status" className="rounded-lg border-l-2 border-accent bg-bg px-4 py-2.5 text-sm text-fg">
          {e.ocGerada ? c.aprovada(ocs.map((o) => o.codigo).join(" e ")) : c.emAprovacao(reais(total), alcadaDe(total).aprovador)}
        </p>
      ) : null}
      {rc.itens.map((l) => {
        const item = itemDoCatalogo(l.item)!;
        const escolhido = cs.find((x) => x.fornecedor === e.selecao[l.item] && x.linhas[l.item]);
        const aceito = e.ajustes[l.item];
        const pedido = pedidos[l.item];
        return (
          <fieldset key={l.item} className="flex flex-col gap-3 rounded-lg border border-line p-4" data-linha={l.item}>
            <legend className="sr-only">{item.nome}</legend>
            <div className="flex flex-wrap items-center justify-between gap-2" aria-hidden="true">
              <p className="text-sm font-semibold text-fg">
                {item.nome} <span className="font-normal text-fg-muted">· {c.linha(l.qtd, item.unidade)}</span>
              </p>
              <Selo tom={escolhido ? "verde" : "neutro"}>{c.alocado(Boolean(escolhido))}</Selo>
            </div>
            <ul className="flex flex-col gap-1.5">
              {cs
                .filter((x) => x.linhas[l.item])
                .map((x) => (
                  <li key={x.fornecedor}>
                    <label className={`flex cursor-pointer flex-wrap items-center gap-3 rounded-lg border px-3 py-2 text-sm ${escolhido?.fornecedor === x.fornecedor ? "border-[#0f8a4b] bg-[#e9f8ef]" : "border-line"}`}>
                      <input type="radio" name={`vencedor-${rfq.numero}-${l.item}`} checked={escolhido?.fornecedor === x.fornecedor} disabled={travada} onChange={() => despachar({ tipo: "selecionar", item: l.item, fornecedor: x.fornecedor })} className="size-4 accent-[var(--accent)]" />
                      <span className="font-medium text-fg">{x.nome}</span>
                      <span className="tabular-nums text-fg-muted">
                        {reais(x.linhas[l.item]!.unitarioCentavos)}/{item.unidade.toLowerCase()} · {c.dias(x.prazoDias)} · {x.pagamento}
                      </span>
                      <span className="ml-auto font-semibold tabular-nums text-fg">{reais(x.linhas[l.item]!.totalCentavos)}</span>
                    </label>
                  </li>
                ))}
            </ul>
            {escolhido ? (
              <form
                className="flex flex-wrap items-end gap-3"
                onSubmit={(ev) => {
                  ev.preventDefault();
                  const pct = Number(String(new FormData(ev.currentTarget).get("pct")).replace(",", "."));
                  const ok = pct > 0 && pct <= AJUSTE_MAX;
                  setInvalido(ok ? null : l.item);
                  if (!ok) return;
                  setPedidos({ ...pedidos, [l.item]: pct });
                  despachar({ tipo: "ajustar", item: l.item, pct });
                }}
              >
                <div className="flex flex-col gap-1">
                  <span className={rotulo}>{c.qtd}</span>
                  <p className={`${campo} w-20 bg-bg tabular-nums`}>{l.qtd}</p>
                </div>
                <label className="flex flex-col gap-1">
                  <span className={rotulo}>{c.desc}</span>
                  <input name="pct" inputMode="decimal" defaultValue={aceito ?? ""} disabled={travada} aria-label={`${c.desc} ${item.nome}`} className={`${campo} w-24 tabular-nums`} />
                </label>
                <div className="flex flex-col gap-1">
                  <span className={rotulo}>{c.precoNeg}</span>
                  <p className={`${campo} w-36 bg-bg tabular-nums`}>{reais(escolhido.linhas[l.item]!.unitarioCentavos)}</p>
                </div>
                <button type="submit" disabled={travada} className={botaoLinha}>
                  {c.solicitar}
                </button>
                {invalido === l.item ? (
                  <p role="alert" className="basis-full text-xs text-[#a1201a]">
                    {c.ajusteInvalido}
                  </p>
                ) : aceito ? (
                  <p role="status" className="basis-full text-xs text-[#0b6b3a]">
                    {pedido && pedido > aceito ? c.ajusteParcial(escolhido.nome, porcento(aceito / 100)) : c.ajusteAceito(escolhido.nome, porcento(aceito / 100))}
                  </p>
                ) : null}
              </form>
            ) : null}
          </fieldset>
        );
      })}
      {ocs.length > 1 ? <p className="rounded-lg bg-[#f4f1ff] px-4 py-2.5 text-sm text-fg">{c.dividido(ocs.length)}</p> : null}
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-lg bg-bg p-4">
        <dl className="flex flex-wrap gap-x-8 gap-y-3">
          <Dado nome={c.totalGeral} valor={<span className="text-lg tabular-nums">{completa ? reais(total) : "—"}</span>} />
          {completa ? (
            <Dado
              nome={economia >= 0 ? c.economia : c.acima}
              valor={
                <span className={`text-lg tabular-nums ${economia >= 0 ? "text-[#0b6b3a]" : "text-[#a1201a]"}`}>
                  {reais(Math.abs(economia))} ({porcento(Math.abs(economia) / estimadoCentavos(rc))})
                </span>
              }
            />
          ) : null}
        </dl>
        {e.selecaoEnviada ? (
          e.ocGerada ? (
            <button type="button" onClick={() => irPara("oc")} className={botao}>
              {c.abas.oc}
              <ArrowRight size={14} weight="bold" aria-hidden="true" />
            </button>
          ) : null
        ) : (
          <div className="flex flex-col items-end gap-1">
            <button type="button" disabled={leitura || !completa} onClick={() => despachar({ tipo: "concluirSelecao" })} className={`${botaoVerde} ${destaque(!leitura && completa)}`}>
              {c.concluir}
            </button>
            {!completa ? <p className="text-xs text-fg-muted">{c.escolha}</p> : null}
          </div>
        )}
      </div>
    </>
  );
}

/* ---------- Rodada e OC ---------- */

function AbaRodada({ rfq }: PropsAba) {
  const { e } = rfq;
  const cs = cotacoes(e);
  if (cs.length === 0) return <Vazio>{c.propostasVazio}</Vazio>;
  const antes = cotacoes({ ...e, negociados: [], ajustes: {} });
  const menor = (xs: Cotacao[]) => xs.filter((x) => x.cotadas === e.rc!.itens.length).reduce((m, x) => Math.min(m, x.totalCentavos), Number.POSITIVE_INFINITY);
  const rodadas = [{ n: 1, quantos: antes.length, menor: menor(antes) }, ...(e.negociados.length > 0 ? [{ n: 2, quantos: e.negociados.length, menor: menor(cotacoes({ ...e, ajustes: {} })) }] : [])];
  return (
    <>
      <div>
        <h3 className="text-sm font-semibold text-fg">{c.rodadaTitulo}</h3>
        <p className="text-xs text-fg-muted">{c.rodadaSub}</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {rodadas.map((r) => {
          const vigente = r.n === rodadaDe(e);
          return (
            <li key={r.n} className={`flex flex-col gap-2 rounded-lg border p-4 ${vigente ? "border-accent" : "border-line"}`}>
              <div className="flex gap-2">
                <Selo tom="azul">{c.rodada(r.n)}</Selo>
                <Selo tom={vigente ? "verde" : "neutro"}>{vigente ? c.vigente : c.encerrada}</Selo>
              </div>
              <p className="text-sm font-semibold text-fg">{codigoRfq(rfq.numero)}</p>
              <p className="text-xs text-fg-muted">{c.naRodada(r.quantos)}</p>
              <p className="text-sm text-fg">
                {c.melhorDaRodada} <span className="font-semibold tabular-nums">{Number.isFinite(r.menor) ? reais(r.menor) : "—"}</span>
              </p>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function AbaOc({ rfq, hoje }: PropsAba) {
  const { e } = rfq;
  if (!e.ocGerada) return <Vazio>{c.oc.vazia}</Vazio>;
  return (
    <>
      {ordensDeCompra(e, rfq.numero).map((oc) => (
        <OrdemCompra key={oc.codigo} oc={oc} e={e} numero={rfq.numero} hoje={hoje} comprador={rfq.comprador} solicitante={rfq.solicitante} />
      ))}
    </>
  );
}
