"use client";

import { useState } from "react";
import { Check, Sparkle, X } from "@phosphor-icons/react";
import { CATALOGO, CENTROS, FORNECEDORES, RCS_NA_FILA, URGENCIAS } from "@/lib/nexo-demo/dados";
import { nexoDemo as t } from "@/lib/nexo-demo/textos";
import {
  LINHAS_MAX,
  QTD_MAX,
  TIPOS,
  alcadaDe,
  buscarCatalogo,
  classificar,
  codigoRc,
  codigoRfq,
  cotacoes,
  economiaCentavos,
  estimadoCentavos,
  estimadoDoForm,
  faltasDoForm,
  isoEm,
  itemDoCatalogo,
  ordensDeCompra,
  porcento,
  reais,
  riscosDaRc,
  semAcento,
  totalSelecionado,
  type Estado,
  type Formulario,
  type LinhaForm,
  type Requisicao,
} from "@/lib/nexo-demo/regras";
import { Dado, Janela, Lista, Selo, TOM_URGENCIA, TituloTela, Vazio, botao, botaoLinha, botaoMia, botaoVerde, campo, cartao, dataCurta, linque, rotulo, secao, type PropsTela, type Tom } from "./pecas";

/**
 * Telas do lado da requisição no Nexo Demo (2026-11-27): a abertura da RC
 * (texto livre, vários itens, rascunho e a devolução pela MIA), as listas do
 * solicitante e do comprador e as aprovações. Rótulos do produto; dados
 * fictícios de lib/nexo-demo/dados.ts.
 */

const VAZIO: Formulario = { linhas: [{ texto: "", qtd: 1 }], urgencia: "", necessarioAte: "", centro: "", justificativa: "" };

function statusDaRc(e: Estado): { texto: string; tom: Tom } {
  const s = t.minhas.status;
  if (e.ocGerada) return { texto: s.aprovado, tom: "verde" };
  if (e.selecaoEnviada) return { texto: s.selecao, tom: "ambar" };
  if (e.rcAprovada) return { texto: s.cotacao, tom: "azul" };
  return e.analiseVista ? { texto: s.aguardando, tom: "ambar" } : { texto: s.analise, tom: "azul" };
}

const descreve = (rc: Pick<Requisicao, "itens">) => rc.itens.map((l) => `${l.qtd} ${itemDoCatalogo(l.item)!.unidade} · ${itemDoCatalogo(l.item)!.nome}`);

function ItensDaRc({ rc }: { rc: Pick<Requisicao, "itens"> }) {
  return (
    <ul className="flex flex-col gap-0.5 text-sm text-fg">
      {descreve(rc).map((d) => (
        <li key={d}>{d}</li>
      ))}
    </ul>
  );
}

/* ---------- Abrir RC ---------- */

export type Prefill = LinhaForm[] | "padrao" | null;

function formDoPrefill(prefill: Prefill, hoje: Date): Formulario {
  if (prefill === "padrao") {
    const p = t.preenchimentoMia;
    return { linhas: p.linhas.map((l) => ({ ...l })), urgencia: p.urgencia, centro: p.centro, necessarioAte: isoEm(hoje, p.diasAteNecessario), justificativa: p.justificativa };
  }
  return prefill ? { ...VAZIO, linhas: prefill } : VAZIO;
}

export function TelaAbrirRc({ e, despachar, ir, hoje, prefill }: PropsTela & { prefill: Prefill }) {
  const r = t.rc;
  const [form, setForm] = useState<Formulario>(() => formDoPrefill(prefill, hoje));
  const [pelaMia, setPelaMia] = useState(prefill === "padrao");
  const [tipo, setTipo] = useState<string | null>(null);
  const [ativa, setAtiva] = useState<number | null>(null);
  const [corrigindo, setCorrigindo] = useState(false);

  if (e.rc) {
    return (
      <>
        <TituloTela titulo={r.titulo} />
        <div className={`${cartao} flex flex-col items-start gap-3`}>
          <p role="status" className="text-sm text-fg">
            {r.aberta(codigoRc())}
          </p>
          <ItensDaRc rc={e.rc} />
          <p className="text-sm text-fg-muted">{r.jaAberta}</p>
          <button type="button" onClick={() => ir("minhas")} className={botaoLinha}>
            {t.minhas.titulo}
          </button>
        </div>
      </>
    );
  }

  if (e.devolvida && !corrigindo) {
    const d = r.devolvida;
    return (
      <>
        <TituloTela titulo={r.titulo} />
        <section className={`${cartao} flex flex-col gap-5`} aria-label={d.titulo}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className={secao}>{t.requisicoes.relatorio}</p>
              <h2 className="text-lg font-semibold text-fg">{d.titulo}</h2>
              <p className="text-xs text-fg-muted">{t.requisicoes.classificacao}</p>
            </div>
            <Selo tom="vermelho">{d.selo}</Selo>
          </div>
          <div className="rounded-lg border-l-2 border-[#d92d20] bg-[#fde4e1] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#a1201a]">{d.motivoRotulo}</p>
            <p className="mt-1 text-sm leading-relaxed text-fg">{e.devolvida.motivo === "vaga" ? d.vaga(e.devolvida.descricao) : d.fora(e.devolvida.descricao)}</p>
          </div>
          <Lista titulo={d.pendenciasRotulo} itens={d.pendencias} />
          <Lista titulo={d.sugestao} itens={CATALOGO.map((i) => i.nome)} />
          <button
            type="button"
            onClick={() => {
              if (e.rascunho) setForm(e.rascunho);
              setCorrigindo(true);
            }}
            className={`${botao} self-start`}
          >
            {d.corrigir}
          </button>
        </section>
      </>
    );
  }

  const faltas = faltasDoForm(form);
  const total = estimadoDoForm(form.linhas);
  const linha = (i: number, parte: Partial<LinhaForm>) => setForm({ ...form, linhas: form.linhas.map((l, j) => (j === i ? { ...l, ...parte } : l)) });
  const enviar = () => {
    if (faltas.length > 0) return;
    const valida = form.linhas.every((l) => "item" in classificar(l.texto));
    despachar({ tipo: "abrirRc", form });
    if (valida) ir("minhas");
    else {
      setCorrigindo(false);
      window.scrollTo(0, 0);
    }
  };
  return (
    <>
      <TituloTela
        titulo={r.titulo}
        sub={r.sub}
        lado={
          <button
            type="button"
            onClick={() => {
              setForm(formDoPrefill("padrao", hoje));
              setPelaMia(true);
            }}
            className={botaoMia}
          >
            <Sparkle size={16} weight="fill" aria-hidden="true" />
            {r.preencherMia}
          </button>
        }
      />
      {pelaMia ? (
        <p role="status" className="rounded-lg bg-[#f4f1ff] px-4 py-3 text-sm text-fg">
          {t.mia.r.abrirPadrao}
        </p>
      ) : null}
      {e.rascunho && !corrigindo ? (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-line bg-surface px-4 py-3 text-sm text-fg">
          <strong className="font-semibold">{r.rascunhos}</strong>
          <span className="text-fg-muted">{e.rascunho.linhas.map((l) => l.texto || r.semDescricao).join(" · ")}</span>
          <button type="button" onClick={() => setForm(e.rascunho!)} className={linque}>
            {r.retomar}
          </button>
          <span aria-hidden="true">·</span>
          <button type="button" onClick={() => despachar({ tipo: "descartarRascunho" })} className="text-sm font-medium text-[#a1201a] hover:underline">
            {r.descartar}
          </button>
        </p>
      ) : null}
      <form
        className="grid gap-5 lg:grid-cols-[1fr_300px]"
        onSubmit={(ev) => {
          ev.preventDefault();
          enviar();
        }}
      >
        <div className="flex flex-col gap-4">
          <fieldset className={`${cartao} flex flex-col gap-3`}>
            <legend className="sr-only">{r.passo1}</legend>
            <p className="flex items-center gap-2 text-sm font-semibold text-fg" aria-hidden="true">
              <Numero n={1} /> {r.passo1}
            </p>
            <div className="flex flex-wrap gap-2">
              {[null, ...TIPOS].map((tp) => (
                <label
                  key={tp ?? "todos"}
                  className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm has-focus-visible:outline-2 has-focus-visible:outline-accent-text ${tipo === tp ? "border-accent bg-[#e8ecff] font-medium text-accent" : "border-line bg-surface text-fg hover:border-line-strong"}`}
                >
                  <input type="radio" name="tipo" checked={tipo === tp} onChange={() => setTipo(tp)} className="sr-only" />
                  {tp ?? r.tipoTodos}
                </label>
              ))}
            </div>
            <p className="text-xs text-fg-muted">{r.tipoAjuda}</p>
          </fieldset>

          <div className={`${cartao} flex flex-col gap-4`}>
            <p className="flex items-center gap-2 text-sm font-semibold text-fg">
              <Numero n={2} /> {r.passo2}
            </p>
            {form.linhas.map((l, i) => {
              const c = classificar(l.texto);
              const item = "item" in c ? itemDoCatalogo(c.item)! : null;
              const exato = item && semAcento(item.nome) === semAcento(l.texto);
              const sugestoes = ativa === i && !exato ? buscarCatalogo(l.texto, tipo).slice(0, 5) : [];
              return (
                <div key={i} className="flex flex-col gap-2 rounded-lg bg-bg p-3">
                  <div className="grid grid-cols-[1fr_auto] gap-3 sm:grid-cols-[1fr_84px_70px_130px_auto]">
                    <label className="col-span-2 flex flex-col gap-1 sm:col-span-1">
                      <span className={rotulo}>
                        {r.item} <span className="sr-only">{i + 1}</span>
                      </span>
                      <input value={l.texto} onChange={(ev) => linha(i, { texto: ev.target.value })} onFocus={() => setAtiva(i)} placeholder={r.itemPlaceholder} maxLength={120} autoComplete="off" className={campo} />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className={rotulo}>
                        {r.qtd} <span className="sr-only">{i + 1}</span>
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={QTD_MAX}
                        inputMode="numeric"
                        value={Number.isNaN(l.qtd) ? "" : l.qtd}
                        onChange={(ev) => linha(i, { qtd: ev.target.value === "" ? Number.NaN : Math.trunc(Number(ev.target.value)) })}
                        className={campo}
                      />
                    </label>
                    <div className="flex flex-col gap-1 max-sm:hidden">
                      <span className={rotulo}>{r.unidade}</span>
                      <p className={`${campo} bg-transparent`}>{item?.unidade ?? "UN"}</p>
                    </div>
                    <div className="flex flex-col gap-1 max-sm:hidden">
                      <span className={rotulo}>{r.valor}</span>
                      <p className={`${campo} bg-transparent tabular-nums`}>{reais(item && l.qtd > 0 ? item.referenciaCentavos * l.qtd : 0)}</p>
                    </div>
                    <button
                      type="button"
                      disabled={form.linhas.length === 1}
                      onClick={() => setForm({ ...form, linhas: form.linhas.filter((_, j) => j !== i) })}
                      className="mt-5 self-start rounded-lg p-2.5 text-fg-muted hover:bg-surface disabled:opacity-30"
                      aria-label={r.remover(i + 1)}
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </div>
                  {sugestoes.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                      <p className={rotulo}>{r.sugestoes}</p>
                      <ul className="flex flex-wrap gap-1.5">
                        {sugestoes.map((s) => (
                          <li key={s.id}>
                            <button type="button" onClick={() => linha(i, { texto: s.nome })} className="rounded-full border border-line bg-surface px-3 py-1 text-xs text-fg hover:border-accent">
                              {s.nome}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {item ? (
                    <p className="flex items-center gap-1.5 text-xs text-[#0b6b3a]">
                      <Sparkle size={12} weight="fill" aria-hidden="true" />
                      {r.reconhecido(item.categoria, item.tipo)}
                    </p>
                  ) : l.texto.trim().length >= 2 ? (
                    <p className="text-xs text-[#8a5200]">{r.naoReconhecido}</p>
                  ) : null}
                </div>
              );
            })}
            <button type="button" disabled={form.linhas.length >= LINHAS_MAX} onClick={() => setForm({ ...form, linhas: [...form.linhas, { texto: "", qtd: 1 }] })} className={`${linque} self-start disabled:opacity-40`}>
              {r.adicionar}
            </button>
          </div>

          <div className={`${cartao} flex flex-col gap-4`}>
            <p className="flex items-center gap-2 text-sm font-semibold text-fg">
              <Numero n={3} /> {r.passo3}
            </p>
            <fieldset className="flex flex-col gap-2">
              <legend className={rotulo}>{r.urgencia}</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {URGENCIAS.map((u) => (
                  <label
                    key={u}
                    className={`cursor-pointer rounded-lg border px-3.5 py-1.5 text-sm has-focus-visible:outline-2 has-focus-visible:outline-accent-text ${form.urgencia === u ? "border-accent bg-[#e8ecff] font-medium text-accent" : "border-line bg-surface text-fg hover:border-line-strong"}`}
                  >
                    <input type="radio" name="urgencia" value={u} checked={form.urgencia === u} onChange={() => setForm({ ...form, urgencia: u })} className="sr-only" />
                    {u}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className={rotulo}>{r.necessarioAte}</span>
                <input type="date" min={isoEm(hoje, 1)} value={form.necessarioAte} onChange={(ev) => setForm({ ...form, necessarioAte: ev.target.value })} className={campo} />
              </label>
              <label className="flex flex-col gap-1">
                <span className={rotulo}>{r.centro}</span>
                <select value={form.centro} onChange={(ev) => setForm({ ...form, centro: ev.target.value })} className={campo}>
                  <option value="" disabled>
                    {r.centroEscolha}
                  </option>
                  {CENTROS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <details className={cartao} open={form.justificativa !== "" ? true : undefined}>
            <summary className="cursor-pointer text-sm font-semibold text-fg">
              {r.mais} <span className="font-normal text-fg-muted">{r.opcional}</span>
            </summary>
            <label className="mt-4 flex flex-col gap-1">
              <span className={rotulo}>{r.justificativa}</span>
              <textarea value={form.justificativa} onChange={(ev) => setForm({ ...form, justificativa: ev.target.value })} placeholder={r.justificativaPlaceholder} rows={3} maxLength={400} className={campo} />
            </label>
          </details>
        </div>

        <aside className={`${cartao} flex flex-col gap-3 self-start lg:sticky lg:top-20`} aria-label={r.resumo}>
          <div className="flex items-baseline justify-between gap-3 border-b border-line pb-3">
            <h2 className="text-sm font-semibold text-fg">{r.resumo}</h2>
            <span className="text-base font-semibold tabular-nums text-accent">{reais(total)}</span>
          </div>
          <dl className="flex flex-col gap-2 text-sm">
            {form.linhas.map((l, i) => (
              <LinhaResumo key={i} nome={r.itemN(i + 1)} valor={l.texto.trim() ? `${Number.isNaN(l.qtd) ? 0 : l.qtd} × ${l.texto.trim()}` : r.semDescricao} />
            ))}
            <LinhaResumo nome={r.urgencia} valor={form.urgencia || "—"} />
            <LinhaResumo nome={r.necessarioAte} valor={form.necessarioAte ? dataCurta(form.necessarioAte) : "—"} />
            <LinhaResumo nome={r.centro} valor={form.centro.split(" · ")[0] || "—"} />
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
                setForm(VAZIO);
                setPelaMia(false);
              }}
              className={linque}
            >
              {r.limpar}
            </button>
          </div>
          <button type="button" onClick={() => despachar({ tipo: "salvarRascunho", form })} className={`${botaoLinha} !py-2`}>
            {r.salvarRascunho}
          </button>
        </aside>
      </form>
    </>
  );
}

const Numero = ({ n }: { n: number }) => <span className="flex size-5 items-center justify-center rounded-full bg-accent-text text-[11px] font-semibold text-white">{n}</span>;

const LinhaResumo = ({ nome, valor }: { nome: string; valor: string }) => (
  <div className="flex items-baseline justify-between gap-3">
    <dt className="shrink-0 text-fg-muted">{nome}</dt>
    <dd className="text-right font-medium text-fg">{valor}</dd>
  </div>
);

/* ---------- Minhas requisições ---------- */

function Cadeia({ e }: { e: Estado }) {
  const c = t.minhas.cadeiaPassos;
  const total = e.selecaoEnviada ? totalSelecionado(e) : e.rc ? estimadoCentavos(e.rc) : 0;
  const passos = [
    { nome: c.gestor, feito: e.rcAprovada, vez: !e.rcAprovada },
    { nome: c.alcada(alcadaDe(total).aprovador), feito: e.ocGerada, vez: e.selecaoEnviada && !e.ocGerada },
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
            <h2 className="text-sm font-semibold text-fg">{codigoRc()}</h2>
            <Selo tom={statusDaRc(e).tom}>{statusDaRc(e).texto}</Selo>
          </div>
          <p className="text-xs text-fg-muted">
            {m.abertaEm} · {t.rc.centro} {e.rc.centro.split(" · ")[0]} · {reais(estimadoCentavos(e.rc))}
          </p>
          <ItensDaRc rc={e.rc} />
          {e.rc.justificativa ? <p className="text-sm text-fg-muted">{e.rc.justificativa}</p> : null}
          <div className="flex flex-col gap-2">
            <h3 className={rotulo}>{m.cadeia}</h3>
            <Cadeia e={e} />
          </div>
        </article>
      ) : (
        <div className={`${cartao} flex flex-col items-center gap-3`}>
          {e.devolvida ? (
            <p className="flex flex-wrap items-center justify-center gap-2 text-sm text-fg">
              <Selo tom="vermelho">{m.status.devolvida}</Selo>
              {e.devolvida.descricao}
            </p>
          ) : (
            <Vazio>{m.vazio}</Vazio>
          )}
          <button type="button" onClick={() => ir("abrir")} className={botao}>
            {m.abrir}
          </button>
        </div>
      )}
    </>
  );
}

/* ---------- Requisições (fila do comprador) ---------- */

type NaFila = { numero: string; itens: readonly { item: string; qtd: number }[] | null; descricao?: string; urgencia: string; centro: string; solicitante: string; status: keyof typeof t.requisicoes.status; sua: boolean };

function fila(e: Estado, nome: string): NaFila[] {
  const q = t.requisicoes;
  const outras: NaFila[] = RCS_NA_FILA.map((r) => ({
    numero: r.numero,
    itens: "itens" in r ? r.itens : null,
    descricao: "descricao" in r ? r.descricao : undefined,
    urgencia: r.urgencia,
    centro: r.centro,
    solicitante: r.solicitante,
    status: r.situacao,
    sua: false,
  }));
  if (!e.rc) return outras;
  const status: keyof typeof q.status = e.rcAprovada ? "cotacao" : e.analiseVista ? "aguardando" : "analise";
  return [{ numero: "", itens: e.rc.itens, urgencia: e.rc.urgencia, centro: e.rc.centro, solicitante: nome, status, sua: true }, ...outras];
}

const TOM_STATUS: Record<string, Tom> = { analise: "azul", aguardando: "ambar", cotacao: "verde", devolvida: "vermelho" };

export function TelaRequisicoes({ e, despachar, nome, hoje }: PropsTela) {
  const q = t.requisicoes;
  const [busca, setBusca] = useState("");
  const [urgencia, setUrgencia] = useState("");
  const [status, setStatus] = useState("");
  const [aberta, setAberta] = useState<NaFila | null>(null);
  const todas = fila(e, nome);
  const n = semAcento(busca);
  const texto = (r: NaFila) => semAcento([r.descricao ?? r.itens!.map((l) => itemDoCatalogo(l.item)!.nome).join(" "), r.solicitante, r.centro, codigoRc(r.numero || undefined)].join(" "));
  const visiveis = todas.filter((r) => (!urgencia || r.urgencia === urgencia) && (!status || r.status === status) && (n === "" || texto(r).includes(n)));
  return (
    <>
      <TituloTela titulo={q.titulo} sub={q.contagem(visiveis.length)} />
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
        <input value={busca} onChange={(ev) => setBusca(ev.target.value)} placeholder={q.buscar} aria-label={q.buscar} className={campo} />
        <select value={urgencia} onChange={(ev) => setUrgencia(ev.target.value)} aria-label={q.todasUrgencias} className={campo}>
          <option value="">{q.todasUrgencias}</option>
          {URGENCIAS.map((u) => (
            <option key={u}>{u}</option>
          ))}
        </select>
        <select value={status} onChange={(ev) => setStatus(ev.target.value)} aria-label={q.todosStatus} className={campo}>
          <option value="">{q.todosStatus}</option>
          {Object.entries(q.status).map(([id, rot]) => (
            <option key={id} value={id}>
              {rot}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            setBusca("");
            setUrgencia("");
            setStatus("");
          }}
          className={botaoLinha}
        >
          {q.limpar}
        </button>
      </div>
      {visiveis.length === 0 ? (
        <div className={cartao}>
          <Vazio>{q.vazio}</Vazio>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visiveis.map((r) => {
            const codigo = codigoRc(r.numero || undefined);
            return (
              <li key={codigo} className={`${cartao} flex flex-col gap-2.5 ${r.sua ? "!border-accent" : ""}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-fg-muted">{codigo}</span>
                  <Selo tom={TOM_STATUS[r.status]}>{q.status[r.status]}</Selo>
                  {r.sua ? <Selo tom="violeta">{q.sua}</Selo> : null}
                </div>
                <h2 className="text-sm font-semibold text-fg">{r.descricao ?? itemDoCatalogo(r.itens![0].item)!.nome}</h2>
                {r.itens && r.itens.length > 1 ? <p className="text-xs text-fg-muted">{t.cotacoes.maisItens(r.itens.length - 1)}</p> : null}
                <p className="flex flex-wrap items-center gap-2 text-sm text-fg">
                  {r.itens ? <span className="font-semibold tabular-nums">{reais(estimadoCentavos({ itens: [...r.itens] } as Requisicao))}</span> : null}
                  <Selo tom={TOM_URGENCIA[r.urgencia]}>{r.urgencia}</Selo>
                </p>
                <p className="text-xs text-fg-muted">
                  {r.solicitante} · {r.centro.split(" · ")[0]}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setAberta(r);
                    if (r.sua) despachar({ tipo: "verAnalise" });
                  }}
                  className={`${botao} mt-auto self-end`}
                  aria-label={`${q.verAnalise}: ${codigo}`}
                >
                  {q.verAnalise}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {aberta ? <Relatorio r={aberta} e={e} hoje={hoje} fechar={() => setAberta(null)} /> : null}
    </>
  );
}

/** O relatório de classificação da MIA, na janela que abre sobre a fila. */
function Relatorio({ r, e, hoje, fechar }: { r: NaFila; e: Estado; hoje: Date; fechar: () => void }) {
  const q = t.requisicoes;
  const codigo = codigoRc(r.numero || undefined);
  if (!r.itens) {
    return (
      <Janela titulo={codigo} sobre={q.relatorio} selos={<Selo tom="vermelho">{t.rc.devolvida.selo}</Selo>} fechar={fechar} larga={false}>
        <p className="text-xs text-fg-muted">{q.classificacao}</p>
        <div className="rounded-lg border-l-2 border-[#d92d20] bg-[#fde4e1] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#a1201a]">{t.rc.devolvida.motivoRotulo}</p>
          <p className="mt-1 text-sm leading-relaxed text-fg">{t.rc.devolvida.vaga(r.descricao ?? "")}</p>
        </div>
        <Lista titulo={q.sugeridos} itens={[q.semSugeridos]} />
        <Lista titulo={q.riscos} itens={q.riscosDevolvida} alerta />
        <Lista titulo={t.rc.devolvida.pendenciasRotulo} itens={t.rc.devolvida.pendencias} />
        <div className="flex flex-col gap-2">
          <h3 className={secao}>{q.resumo}</h3>
          <p className="text-sm leading-relaxed text-fg">{q.resumoDevolvida}</p>
        </div>
      </Janela>
    );
  }
  const rc: Requisicao = r.sua && e.rc ? e.rc : { itens: [...r.itens], urgencia: r.urgencia, centro: r.centro, necessarioAte: isoEm(hoje, 14), justificativa: "" };
  const sugeridos = FORNECEDORES.filter((f) => rc.itens.some((l) => itemDoCatalogo(l.item)!.fornecedores[f.id])).map((f) => f.nome);
  const categorias = [...new Set(rc.itens.map((l) => itemDoCatalogo(l.item)!.categoria))];
  const aprovada = r.sua ? e.rcAprovada : false;
  return (
    <Janela titulo={codigo} sobre={q.relatorio} selos={<Selo tom="verde">{q.valida}</Selo>} fechar={fechar} larga={false}>
      <p className="text-xs text-fg-muted">{q.classificacao}</p>
      <ItensDaRc rc={rc} />
      <dl className="grid gap-4 border-y border-line py-4 sm:grid-cols-2">
        <Dado nome={q.categoria} valor={categorias.join(" · ")} />
        <Dado nome={q.urgenciaAvaliada} valor={<Selo tom={TOM_URGENCIA[rc.urgencia]}>{rc.urgencia}</Selo>} />
      </dl>
      <Lista titulo={q.sugeridos} itens={sugeridos} />
      <Lista titulo={q.riscos} itens={riscosDaRc(rc, hoje)} alerta />
      <Lista titulo={q.pendencias} itens={q.pendenciasItens} />
      <div className="flex flex-col gap-2">
        <h3 className={secao}>{q.resumo}</h3>
        <p className="text-sm leading-relaxed text-fg">{q.resumoTexto(rc.itens.length, reais(estimadoCentavos(rc)), sugeridos.length)}</p>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className={secao}>{q.cadeia}</h3>
        <ol className="flex flex-col gap-2">
          <li className="flex items-center justify-between gap-3 rounded-lg border-l-2 border-accent bg-bg px-3 py-2 text-sm">
            <span className="text-fg">{t.minhas.cadeiaPassos.gestor}</span>
            <Selo tom={aprovada ? "verde" : "ambar"}>{aprovada ? t.minhas.cadeiaPassos.aprovado : t.minhas.cadeiaPassos.pendente}</Selo>
          </li>
          <li className="flex items-center justify-between gap-3 rounded-lg border-l-2 border-accent bg-bg px-3 py-2 text-sm">
            <span className="text-fg">{t.minhas.cadeiaPassos.alcada(alcadaDe(estimadoCentavos(rc)).aprovador)}</span>
            <Selo>{t.minhas.cadeiaPassos.naFila}</Selo>
          </li>
        </ol>
      </div>
    </Janela>
  );
}

/* ---------- Minhas aprovações ---------- */

export function TelaAprovacoes({ e, despachar, ir, abrirRfq }: PropsTela & { abrirRfq: () => void }) {
  const a = t.aprovacoes;
  const [aviso, setAviso] = useState(false);
  const selecaoPendente = e.selecaoEnviada && !e.ocGerada;
  const rcPendente = e.rc && !e.rcAprovada;
  const economia = economiaCentavos(e);
  const total = totalSelecionado(e);
  const alcada = alcadaDe(total);
  const vencedores = selecaoPendente ? [...new Set(ordensDeCompra(e).map((o) => o.fornecedor.nome))] : [];
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
              <span className="text-sm font-semibold text-fg">{codigoRfq()}</span>
              <Selo tom="ambar">{t.minhas.cadeiaPassos.pendente}</Selo>
              <Selo tom="azul">{t.cotacoes.propostas(cotacoes(e).length)}</Selo>
            </div>
            <ItensDaRc rc={e.rc} />
            <dl className="grid gap-3 sm:grid-cols-3">
              <Dado nome={vencedores.length > 1 ? a.vencedores : a.vencedor} valor={vencedores.join(" · ")} />
              <Dado nome={t.cotacoes.totalGeral} valor={<span className="tabular-nums">{reais(total)}</span>} />
              <Dado
                nome={economia >= 0 ? a.economia : t.cotacoes.acima}
                valor={
                  <span className="tabular-nums">
                    {reais(Math.abs(economia))} ({porcento(Math.abs(economia) / estimadoCentavos(e.rc))})
                  </span>
                }
              />
            </dl>
            <p className="rounded-lg bg-[#f4f1ff] px-3 py-2 text-sm text-fg">
              {a.porQue(reais(total), alcada.faixa, alcada.aprovador)}{" "}
              <button type="button" onClick={() => ir("alcada")} className={linque}>
                {a.verAlcada}
              </button>
            </p>
            <button type="button" onClick={() => despachar({ tipo: "aprovarSelecao" })} className={`${botaoVerde} self-start`}>
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
              <span className="text-sm font-semibold text-fg">{codigoRc()}</span>
              <Selo tom="ambar">{t.minhas.cadeiaPassos.pendente}</Selo>
              <Selo tom={TOM_URGENCIA[e.rc.urgencia]}>{e.rc.urgencia}</Selo>
            </div>
            <ItensDaRc rc={e.rc} />
            <p className="text-xs text-fg-muted">
              {e.rc.centro} · {t.rc.necessarioAte} {dataCurta(e.rc.necessarioAte)} · {reais(estimadoCentavos(e.rc))}
            </p>
            {e.rc.justificativa ? <p className="text-sm text-fg-muted">{e.rc.justificativa}</p> : null}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  despachar({ tipo: "aprovarRc" });
                  setAviso(false);
                }}
                className={botaoVerde}
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
                <button type="button" onClick={abrirRfq} className={botaoLinha}>
                  {t.cotacoes.abrir(codigoRfq())}
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>
    </>
  );
}
