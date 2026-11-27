"use client";

import { useState } from "react";
import { Check, Sparkle } from "@phosphor-icons/react";
import { nexoDemo as t } from "@/lib/nexo-demo/textos";
import { CODIGO_RC, CODIGO_RFQ, QTD_MAX, economiaCentavos, estimadoCentavos, faltasDaRc, itemDoCatalogo, porcento, propostas, reais, riscosDaRc, type Estado, type Requisicao } from "@/lib/nexo-demo/regras";
import { Dado, Selo, TituloTela, Vazio, botao, botaoLinha, campo, cartao, dataCurta, rotulo, type PropsTela } from "./pecas";

/**
 * Telas do lado da requisição no Nexo Demo (2026-11-27): a MIA, a abertura
 * da RC, as listas do solicitante e do comprador e as aprovações. Rótulos do
 * produto; dados fictícios de lib/nexo-demo/textos.ts.
 */

const daquiA = (dias: number) => {
  const d = new Date(Date.now() + dias * 86_400_000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function statusDaRc(e: Estado): { texto: string; tom: "azul" | "ambar" | "verde" } {
  const s = t.minhas.status;
  if (e.ocGerada) return { texto: s.aprovado, tom: "verde" };
  if (e.selecaoEnviada) return { texto: s.selecao, tom: "ambar" };
  if (e.rcAprovada) return { texto: s.cotacao, tom: "azul" };
  return e.analiseVista ? { texto: s.aguardando, tom: "ambar" } : { texto: s.analise, tom: "azul" };
}

function ResumoDaRc({ rc }: { rc: Requisicao }) {
  const item = itemDoCatalogo(rc.item)!;
  return (
    <p className="text-sm text-fg">
      {item.nome} ({rc.qtd} {item.unidade} · {reais(estimadoCentavos(rc))})
    </p>
  );
}

export function TelaMia({ e, ir, nome }: PropsTela) {
  const m = t.mia;
  const [resposta, setResposta] = useState<"grafico" | "listar" | null>(null);
  const maior = Math.max(...m.gasto.map((g) => g.centavos));
  return (
    <>
      <header className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-text text-white">
          <Sparkle size={22} weight="fill" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.01em] text-fg">{m.ola(nome)}</h1>
          <p className="text-sm text-fg-muted">{m.sub}</p>
        </div>
      </header>
      <div className={`${cartao} max-w-[70ch]`}>
        <p className="text-sm leading-relaxed text-fg">{m.fala}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => ir("abrir")} className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-accent-text hover:border-line-strong">
          {m.atalhos.abrir}
        </button>
        <button type="button" onClick={() => setResposta("grafico")} className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-accent-text hover:border-line-strong">
          {m.atalhos.grafico}
        </button>
        <button type="button" onClick={() => setResposta("listar")} className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-accent-text hover:border-line-strong">
          {m.atalhos.listar}
        </button>
      </div>
      <div aria-live="polite" className="flex flex-col gap-3">
        {resposta === "grafico" ? (
          <div className={`${cartao} max-w-[70ch]`}>
            <p className="mb-4 text-sm text-fg">{m.respostaGrafico}</p>
            <ul className="flex flex-col gap-3">
              {m.gasto.map((g) => (
                <li key={g.categoria} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 text-sm">
                  <span className="text-fg">{g.categoria}</span>
                  <span className="tabular-nums text-fg-muted">{reais(g.centavos)}</span>
                  <span className="col-span-2 h-2 rounded-full bg-bg">
                    <span className="block h-2 rounded-full bg-accent" style={{ width: `${(g.centavos / maior) * 100}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {resposta === "listar" ? (
          <div className={`${cartao} flex max-w-[70ch] flex-col items-start gap-3`}>
            {e.rc ? (
              <>
                <p className="text-sm text-fg">{m.respostaListar}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-fg">{CODIGO_RC}</span>
                  <Selo tom={statusDaRc(e).tom}>{statusDaRc(e).texto}</Selo>
                </div>
                <ResumoDaRc rc={e.rc} />
              </>
            ) : (
              <>
                <p className="text-sm text-fg">{m.respostaListarVazia}</p>
                <button type="button" onClick={() => ir("abrir")} className={botao}>
                  {t.minhas.abrir}
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>
      <div className="mt-2 flex max-w-[70ch] flex-col gap-1">
        <input disabled placeholder={m.campo} aria-label={m.campo} className={`${campo} !rounded-xl !py-3.5`} />
        <p className="text-xs text-fg-muted">{m.campoAviso}</p>
      </div>
    </>
  );
}

export function TelaAbrirRc({ e, despachar, ir }: PropsTela) {
  const r = t.rc;
  const [rc, setRc] = useState<Partial<Requisicao>>({ qtd: 1 });
  const [pelaMia, setPelaMia] = useState(false);

  if (e.rc) {
    return (
      <>
        <TituloTela titulo={r.titulo} />
        <div className={`${cartao} flex flex-col items-start gap-3`}>
          <p role="status" className="text-sm text-fg">
            {r.aberta(CODIGO_RC)}
          </p>
          <ResumoDaRc rc={e.rc} />
          <p className="text-sm text-fg-muted">{r.jaAberta}</p>
          <button type="button" onClick={() => ir("minhas")} className={botaoLinha}>
            {t.minhas.titulo}
          </button>
        </div>
      </>
    );
  }

  const item = rc.item ? itemDoCatalogo(rc.item) : undefined;
  const faltas = faltasDaRc(rc);
  const total = item && rc.qtd ? item.referenciaCentavos * rc.qtd : 0;
  const preencher = () => {
    const p = t.preenchimentoMia;
    setRc({ item: p.item, qtd: p.qtd, urgencia: p.urgencia, centro: p.centro, necessarioAte: daquiA(p.diasAteNecessario) });
    setPelaMia(true);
  };
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <TituloTela titulo={r.titulo} sub={r.sub} />
        <button type="button" onClick={preencher} className="inline-flex items-center gap-2 rounded-lg bg-accent-text px-4 py-2.5 text-sm font-medium text-white hover:opacity-90">
          <Sparkle size={16} weight="fill" aria-hidden="true" />
          {r.preencherMia}
        </button>
      </div>
      {pelaMia ? (
        <p role="status" className="rounded-lg bg-[#f4f1ff] px-4 py-3 text-sm text-fg">
          {t.mia.respostaAbrir}
        </p>
      ) : null}
      <form
        className="grid gap-5 lg:grid-cols-[1fr_300px]"
        onSubmit={(ev) => {
          ev.preventDefault();
          if (faltas.length === 0) {
            despachar({ tipo: "abrirRc", rc: rc as Requisicao });
            ir("minhas");
          }
        }}
      >
        <div className="flex flex-col gap-4">
          <fieldset className={`${cartao} flex flex-col gap-3`}>
            <legend className="sr-only">{r.passo1}</legend>
            <p className="flex items-center gap-2 text-sm font-semibold text-fg" aria-hidden="true">
              <Numero n={1} /> {r.passo1}
            </p>
            <div className="flex flex-wrap gap-2">
              {t.catalogo.map((c) => (
                <label
                  key={c.id}
                  className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm has-focus-visible:outline-2 has-focus-visible:outline-accent-text ${rc.item === c.id ? "border-accent bg-[#e8ecff] font-medium text-accent" : "border-line bg-surface text-fg hover:border-line-strong"}`}
                >
                  <input type="radio" name="item" value={c.id} checked={rc.item === c.id} onChange={() => setRc({ ...rc, item: c.id })} className="sr-only" />
                  {c.nome}
                </label>
              ))}
            </div>
            <p className="text-xs text-fg-muted">{item ? `${r.tipo}: ${item.tipo} · ${item.categoria}` : r.itemEscolha}</p>
          </fieldset>

          <div className={`${cartao} flex flex-col gap-3`}>
            <p className="flex items-center gap-2 text-sm font-semibold text-fg">
              <Numero n={2} /> {r.passo2}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_90px_90px_150px]">
              <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
                <span className={rotulo}>{r.item}</span>
                <p className={`${campo} bg-bg`}>{item?.nome ?? r.itemEscolha}</p>
              </div>
              <label className="flex flex-col gap-1">
                <span className={rotulo}>{r.qtd}</span>
                <input
                  type="number"
                  min={1}
                  max={QTD_MAX}
                  inputMode="numeric"
                  value={rc.qtd ?? ""}
                  onChange={(ev) => setRc({ ...rc, qtd: ev.target.value === "" ? undefined : Math.trunc(Number(ev.target.value)) })}
                  className={campo}
                />
              </label>
              <div className="flex flex-col gap-1">
                <span className={rotulo}>{r.unidade}</span>
                <p className={`${campo} bg-bg`}>{item?.unidade ?? "UN"}</p>
              </div>
              <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
                <span className={rotulo}>{r.valor}</span>
                <p className={`${campo} bg-bg tabular-nums`}>{reais(total)}</p>
              </div>
            </div>
            <p className="text-xs text-fg-muted">{r.valorAjuda}</p>
          </div>

          <div className={`${cartao} flex flex-col gap-4`}>
            <p className="flex items-center gap-2 text-sm font-semibold text-fg">
              <Numero n={3} /> {r.passo3}
            </p>
            <fieldset className="flex flex-col gap-2">
              <legend className={rotulo}>{r.urgencia}</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {r.urgencias.map((u) => (
                  <label
                    key={u}
                    className={`cursor-pointer rounded-lg border px-3.5 py-1.5 text-sm has-focus-visible:outline-2 has-focus-visible:outline-accent-text ${rc.urgencia === u ? "border-accent bg-[#e8ecff] font-medium text-accent" : "border-line bg-surface text-fg hover:border-line-strong"}`}
                  >
                    <input type="radio" name="urgencia" value={u} checked={rc.urgencia === u} onChange={() => setRc({ ...rc, urgencia: u })} className="sr-only" />
                    {u}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className={rotulo}>{r.necessarioAte}</span>
                <input type="date" min={daquiA(1)} value={rc.necessarioAte ?? ""} onChange={(ev) => setRc({ ...rc, necessarioAte: ev.target.value })} className={campo} />
              </label>
              <label className="flex flex-col gap-1">
                <span className={rotulo}>{r.centro}</span>
                <select value={rc.centro ?? ""} onChange={(ev) => setRc({ ...rc, centro: ev.target.value })} className={campo}>
                  <option value="" disabled>
                    {r.centroEscolha}
                  </option>
                  {r.centros.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>

        <aside className={`${cartao} flex flex-col gap-3 self-start lg:sticky lg:top-20`} aria-label={r.resumo}>
          <div className="flex items-baseline justify-between gap-3 border-b border-line pb-3">
            <h2 className="text-sm font-semibold text-fg">{r.resumo}</h2>
            <span className="text-base font-semibold tabular-nums text-accent">{reais(total)}</span>
          </div>
          <dl className="flex flex-col gap-2 text-sm">
            <LinhaResumo nome={r.tipo} valor={item?.tipo ?? r.naoEscolhido} />
            <LinhaResumo nome={r.item} valor={item ? `${rc.qtd ?? 0} ${item.unidade}` : "—"} />
            <LinhaResumo nome={r.urgencia} valor={rc.urgencia ?? "—"} />
            <LinhaResumo nome={r.necessarioAte} valor={rc.necessarioAte ? dataCurta(rc.necessarioAte) : "—"} />
            <LinhaResumo nome={r.centro} valor={rc.centro?.split(" · ")[0] ?? "—"} />
          </dl>
          {faltas.length > 0 ? (
            <div className="flex flex-col gap-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8a5200]">{r.faltaPreencher(faltas.length)}</p>
              <ul className="flex flex-col gap-0.5 text-xs text-[#a1201a]">
                {faltas.map((f) => (
                  <li key={f}>{r.faltas[f]}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={faltas.length > 0} className={`${botao} flex-1`}>
              {r.abrir}
            </button>
            <button
              type="button"
              onClick={() => {
                setRc({ qtd: 1 });
                setPelaMia(false);
              }}
              className="text-sm font-medium text-accent hover:underline"
            >
              {r.limpar}
            </button>
          </div>
        </aside>
      </form>
    </>
  );
}

const Numero = ({ n }: { n: number }) => <span className="flex size-5 items-center justify-center rounded-full bg-accent-text text-[11px] font-semibold text-white">{n}</span>;

const LinhaResumo = ({ nome, valor }: { nome: string; valor: string }) => (
  <div className="flex items-baseline justify-between gap-3">
    <dt className="text-fg-muted">{nome}</dt>
    <dd className="text-right font-medium text-fg">{valor}</dd>
  </div>
);

function Cadeia({ e }: { e: Estado }) {
  const c = t.minhas.cadeiaPassos;
  const passos = [
    { nome: c.gestor, feito: e.rcAprovada, vez: !e.rcAprovada },
    { nome: c.alcada, feito: e.ocGerada, vez: e.selecaoEnviada && !e.ocGerada },
  ];
  return (
    <ol className="flex flex-col gap-2">
      {passos.map((p) => (
        <li key={p.nome} className="flex items-center justify-between gap-3 rounded-lg border-l-2 border-accent bg-bg px-3 py-2 text-sm">
          <span className="text-fg">{p.nome}</span>
          <Selo tom={p.feito ? "verde" : p.vez ? "ambar" : "neutro"}>{p.feito ? c.aprovado : p.vez ? c.pendente : c.naFila}</Selo>
        </li>
      ))}
    </ol>
  );
}

export function TelaMinhas({ e, ir }: PropsTela) {
  const m = t.minhas;
  return (
    <>
      <TituloTela titulo={m.titulo} />
      {e.rc ? (
        <article className={`${cartao} flex flex-col gap-3`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-fg">{CODIGO_RC}</h2>
            <Selo tom={statusDaRc(e).tom}>{statusDaRc(e).texto}</Selo>
          </div>
          <p className="text-xs text-fg-muted">
            {m.abertaEm} · {t.rc.centro} {e.rc.centro.split(" · ")[0]} · {reais(estimadoCentavos(e.rc))}
          </p>
          <ResumoDaRc rc={e.rc} />
          <div className="flex flex-col gap-2">
            <h3 className={rotulo}>{m.cadeia}</h3>
            <Cadeia e={e} />
          </div>
        </article>
      ) : (
        <div className={`${cartao} flex flex-col items-center gap-3`}>
          <Vazio>{m.vazio}</Vazio>
          <button type="button" onClick={() => ir("abrir")} className={botao}>
            {m.abrir}
          </button>
        </div>
      )}
    </>
  );
}

export function TelaRequisicoes({ e, despachar }: PropsTela) {
  const q = t.requisicoes;
  const [aberta, setAberta] = useState(false);
  if (!e.rc) {
    return (
      <>
        <TituloTela titulo={q.titulo} />
        <div className={cartao}>
          <Vazio>{q.vazio}</Vazio>
        </div>
      </>
    );
  }
  const item = itemDoCatalogo(e.rc.item)!;
  const sugeridos = item.fornecedores.map((f) => t.fornecedores.find((x) => x.id === f.id)!.nome);
  return (
    <>
      <TituloTela titulo={q.titulo} />
      <article className={`${cartao} flex max-w-md flex-col gap-3`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-fg-muted">{CODIGO_RC}</span>
          <Selo tom={statusDaRc(e).tom}>{statusDaRc(e).texto}</Selo>
        </div>
        <h2 className="text-sm font-semibold text-fg">{item.nome}</h2>
        <p className="flex flex-wrap items-center gap-2 text-sm text-fg">
          <span className="text-fg-muted">
            {t.rc.qtd} {e.rc.qtd}
          </span>
          <span className="font-semibold tabular-nums">{reais(estimadoCentavos(e.rc))}</span>
          <Selo tom="azul">{e.rc.urgencia}</Selo>
        </p>
        <p className="text-xs text-fg-muted">
          {e.rc.centro} · {dataCurta(e.rc.necessarioAte)}
        </p>
        <button
          type="button"
          aria-expanded={aberta}
          onClick={() => {
            setAberta(!aberta);
            despachar({ tipo: "verAnalise" });
          }}
          className={`${botao} self-end`}
        >
          {aberta ? q.fechar : q.verAnalise}
        </button>
      </article>

      {aberta ? (
        <section className={`${cartao} nexo-demo-chega flex flex-col gap-5`} aria-label={q.relatorio}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">{q.relatorio}</p>
              <h2 className="text-lg font-semibold text-fg">{CODIGO_RC}</h2>
              <p className="text-xs text-fg-muted">{q.classificacao}</p>
            </div>
            <Selo tom="verde">{q.valida}</Selo>
          </div>
          <dl className="grid gap-4 border-y border-line py-4 sm:grid-cols-2">
            <Dado nome={q.categoria} valor={item.categoria} />
            <Dado nome={q.urgenciaAvaliada} valor={<Selo tom="azul">{e.rc.urgencia}</Selo>} />
          </dl>
          <Bloco titulo={q.sugeridos} itens={sugeridos} />
          <Bloco titulo={q.riscos} itens={riscosDaRc(e.rc, new Date())} alerta />
          <Bloco titulo={q.pendencias} itens={[...q.pendenciasItens]} />
          <div className="flex flex-col gap-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">{q.resumo}</h3>
            <p className="text-sm leading-relaxed text-fg">{q.resumoTexto(item.nome, e.rc.qtd, item.unidade, sugeridos.length)}</p>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">{q.cadeia}</h3>
            <Cadeia e={e} />
          </div>
        </section>
      ) : null}
    </>
  );
}

function Bloco({ titulo, itens, alerta = false }: { titulo: string; itens: string[]; alerta?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">{titulo}</h3>
      <ul className={`flex list-disc flex-col gap-1 pl-5 text-sm ${alerta ? "text-[#a1201a]" : "text-fg"}`}>
        {itens.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}

export function TelaAprovacoes({ e, despachar, ir }: PropsTela) {
  const a = t.aprovacoes;
  const [aviso, setAviso] = useState(false);
  const vencedor = propostas(e).find((p) => p.fornecedor === e.vencedor);
  const selecaoPendente = e.selecaoEnviada && !e.ocGerada && vencedor;
  const rcPendente = e.rc && !e.rcAprovada;
  const economia = economiaCentavos(e);
  return (
    <>
      <TituloTela titulo={a.titulo} sub={a.sub} />
      <section className={`${cartao} flex flex-col gap-3`}>
        <div>
          <h2 className="text-sm font-semibold text-fg">{a.selecoes}</h2>
          <p className="text-xs text-fg-muted">{a.selecoesSub}</p>
        </div>
        {selecaoPendente && e.rc ? (
          <div className="flex flex-col gap-3 rounded-lg border border-line p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-fg">{CODIGO_RFQ}</span>
              <Selo tom="ambar">{t.minhas.cadeiaPassos.pendente}</Selo>
            </div>
            <ResumoDaRc rc={e.rc} />
            <dl className="grid gap-3 sm:grid-cols-3">
              <Dado nome={a.vencedor} valor={vencedor.nome} />
              <Dado nome={t.cotacoes.totalGeral} valor={<span className="tabular-nums">{reais(vencedor.totalCentavos)}</span>} />
              <Dado
                nome={economia >= 0 ? a.economia : t.cotacoes.acima}
                valor={
                  <span className="tabular-nums">
                    {reais(Math.abs(economia))} ({porcento(Math.abs(economia) / estimadoCentavos(e.rc))})
                  </span>
                }
              />
            </dl>
            <button type="button" onClick={() => despachar({ tipo: "aprovarSelecao" })} className={`${botao} self-start !bg-[#0f8a4b] hover:!bg-[#0b6b3a]`}>
              <Check size={16} weight="bold" aria-hidden="true" />
              {a.aprovarSelecao}
            </button>
          </div>
        ) : (
          <Vazio>{a.selecoesVazio}</Vazio>
        )}
      </section>

      <section className={`${cartao} flex flex-col gap-3`}>
        <h2 className="text-sm font-semibold text-fg">{a.rcs}</h2>
        {rcPendente && e.rc ? (
          <div className="flex flex-col gap-3 rounded-lg border border-line p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-fg">{CODIGO_RC}</span>
              <Selo tom="ambar">{t.minhas.cadeiaPassos.pendente}</Selo>
              <Selo tom="azul">{e.rc.urgencia}</Selo>
            </div>
            <ResumoDaRc rc={e.rc} />
            <p className="text-xs text-fg-muted">
              {e.rc.centro} · {t.rc.necessarioAte} {dataCurta(e.rc.necessarioAte)}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  despachar({ tipo: "aprovarRc" });
                  setAviso(false);
                }}
                className={`${botao} !bg-[#0f8a4b] hover:!bg-[#0b6b3a]`}
              >
                <Check size={16} weight="bold" aria-hidden="true" />
                {a.aprovar}
              </button>
              <button type="button" onClick={() => setAviso(true)} className={botaoLinha}>
                {a.reprovar}
              </button>
            </div>
            {aviso ? (
              <p role="status" className="text-xs text-fg-muted">
                {a.reprovarAviso}
              </p>
            ) : null}
          </div>
        ) : (
          <>
            <Vazio>{a.rcsVazio}</Vazio>
            {e.rcAprovada && !e.convitesEnviados ? (
              <div role="status" className="flex flex-wrap items-center gap-3 text-sm text-fg">
                <span>{a.rcAprovada}</span>
                <button type="button" onClick={() => ir("cotacoes")} className={botaoLinha}>
                  {t.app.menu[2].itens[1].rotulo}
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>
    </>
  );
}
