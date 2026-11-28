"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, CircleNotch, Plus, X } from "@phosphor-icons/react";
import { consultaNcm, reforma } from "@/lib/content";
import { registrarEvento } from "@/lib/eventos-cliente";
import type { MOTIVOS_REFORMA } from "@/lib/eventos";
import {
  ANOS,
  CBS_REFERENCIA,
  IBS_REFERENCIA,
  MAX_COTACOES,
  REDUCOES,
  REGIMES,
  calcular,
  pct,
  reais,
  type Ano,
  type Cenario,
  type Reducao,
  type Regime,
} from "@/lib/reforma";

/**
 * A calculadora da Reforma Tributária (2026-11-18). A conta roda aqui, na hora,
 * sem enviar nada; o servidor só recebe o cenário quando a pessoa pede o
 * comparativo por e-mail (e refaz a conta com o mesmo lib/reforma.ts).
 *
 * Os campos guardam o TEXTO digitado e a conta lê o número dele: "1.300,50"
 * é o jeito brasileiro de escrever, e um <input type="number"> recusaria.
 */
const t = reforma.calculadora;
const l = reforma.lead;

const rotulo = "font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted";
const campo = "w-full rounded-control border border-line bg-bg px-4 py-3 text-fg outline-none focus-visible:border-fg";
const botao =
  "group inline-flex items-center gap-2 rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-[background-color,transform] duration-200 hover:bg-accent-hover active:scale-[0.98] disabled:opacity-60";

/** "1.300,50", "1300.5" ou "1300" viram número; vazio ou lixo, null. */
export function lerNumero(s: string): number | null {
  const limpo = s.replace(/[R$\s%]/g, "");
  if (!limpo) return null;
  const normal = limpo.includes(",") ? limpo.replace(/\./g, "").replace(",", ".") : limpo;
  const n = Number(normal);
  return Number.isFinite(n) ? n : null;
}

type Linha = { nome: string; regime: Regime; valor: string; percentual: string };
const novaLinha = (i: number, regime: Regime): Linha => ({ nome: `Fornecedor ${String.fromCharCode(65 + i)}`, regime, valor: "", percentual: "" });

export function Calculadora() {
  const [ano, setAno] = useState<Ano>(2027);
  const [reducao, setReducao] = useState<Reducao>(0);
  const [credita, setCredita] = useState(true);
  const [cbsRef, setCbsRef] = useState(String(CBS_REFERENCIA).replace(".", ","));
  const [ibsRef, setIbsRef] = useState(String(IBS_REFERENCIA).replace(".", ","));
  const [vezes, setVezes] = useState("");
  const [linhas, setLinhas] = useState<Linha[]>([novaLinha(0, "regular"), novaLinha(1, "simples_das")]);

  const cenario = useMemo<Cenario | null>(() => {
    const cotacoes = linhas
      .map((q) => ({ nome: q.nome.trim() || "Fornecedor", regime: q.regime, valor: lerNumero(q.valor) ?? 0, percentualSimples: q.regime === "simples_das" ? lerNumero(q.percentual) : null }))
      .filter((q) => q.valor > 0);
    if (!cotacoes.length) return null;
    const v = lerNumero(vezes);
    return {
      ano,
      reducao,
      compradorCredita: credita,
      cbsRef: lerNumero(cbsRef) ?? CBS_REFERENCIA,
      ibsRef: lerNumero(ibsRef) ?? IBS_REFERENCIA,
      vezesPorAno: v && v > 0 ? Math.round(v) : null,
      cotacoes: cotacoes.map((q) => ({ ...q, percentualSimples: q.percentualSimples === null ? null : Math.min(100, Math.max(0, q.percentualSimples)) })),
    };
  }, [ano, reducao, credita, cbsRef, ibsRef, vezes, linhas]);

  /* A consulta de NCM manda a redução do item pelo endereço (?reducao=60).
     Lida só depois de montar, para o HTML do servidor não divergir. */
  useEffect(() => {
    const r = Number(new URLSearchParams(window.location.search).get("reducao"));
    if ((REDUCOES as readonly number[]).includes(r)) setReducao(r as Reducao);
  }, []);

  const conta = cenario ? calcular(cenario) : null;

  /* Primeira comparação com resultado nesta visita (evento sem nenhum valor digitado). */
  const calculou = useRef(false);
  useEffect(() => {
    if (cenario && !calculou.current) {
      calculou.current = true;
      registrarEvento("reforma_calculo");
    }
  }, [cenario]);
  const muda = (i: number, k: keyof Linha, v: string) => setLinhas((ls) => ls.map((q, j) => (j === i ? { ...q, [k]: v } : q)));

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
      <form className="flex flex-col gap-8 lg:col-span-7" onSubmit={(e) => e.preventDefault()} aria-labelledby="calc-titulo">
        <div className="flex flex-col gap-3">
          <h2 id="calc-titulo" className="text-3xl font-medium tracking-[-0.03em] text-fg sm:text-4xl">
            {t.titulo}
          </h2>
          <p className="max-w-[62ch] leading-relaxed text-fg-muted">{t.instrucao}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={rotulo}>{t.ano}</span>
            <select value={ano} onChange={(e) => setAno(Number(e.target.value) as Ano)} className={campo}>
              {ANOS.map((a) => (
                <option key={a} value={a}>
                  {a === 2033 ? "2033 em diante" : a}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={rotulo}>{t.reducao}</span>
            <select value={reducao} onChange={(e) => setReducao(Number(e.target.value) as Reducao)} className={campo}>
              {REDUCOES.map((r) => (
                <option key={r} value={r}>
                  {t.reducoes[r]}
                </option>
              ))}
            </select>
          </label>
          <p className="text-sm text-fg-muted sm:col-span-2">
            {t.reducaoNota}{" "}
            <Link href={consultaNcm.rota} className="text-fg underline underline-offset-4">
              {t.reducaoConsulta}
            </Link>
          </p>
        </div>

        <label className="flex items-start gap-3 border border-line p-4 text-fg">
          <input type="checkbox" checked={credita} onChange={(e) => setCredita(e.target.checked)} className="mt-1 size-4 shrink-0 accent-[var(--accent)]" />
          <span className="flex flex-col gap-1">
            <span className="font-medium">{t.comprador}</span>
            <span className="text-sm text-fg-muted">{t.compradorNota}</span>
          </span>
        </label>

        <ol className="flex flex-col gap-4">
          {linhas.map((q, i) => (
            <li key={i} className="flex flex-col gap-4 border border-line bg-surface p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <span className={rotulo}>
                  {t.cotacao} {i + 1}
                </span>
                {linhas.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setLinhas((ls) => ls.filter((_, j) => j !== i))}
                    className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg"
                    aria-label={`${t.remover} ${t.cotacao.toLowerCase()} ${i + 1}`}
                  >
                    <X size={14} /> {t.remover}
                  </button>
                ) : null}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className={rotulo}>{t.nome}</span>
                  <input value={q.nome} onChange={(e) => muda(i, "nome", e.target.value)} className={campo} maxLength={60} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={rotulo}>{t.valor}</span>
                  <input
                    inputMode="decimal"
                    placeholder="0,00"
                    value={q.valor}
                    onChange={(e) => muda(i, "valor", e.target.value)}
                    className={`${campo} font-mono tabular-nums`}
                  />
                </label>
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className={rotulo}>{t.regime}</span>
                  <select value={q.regime} onChange={(e) => muda(i, "regime", e.target.value)} className={campo}>
                    {REGIMES.map((r) => (
                      <option key={r} value={r}>
                        {t.regimes[r]}
                      </option>
                    ))}
                  </select>
                </label>
                {q.regime === "simples_das" ? (
                  <label className="flex flex-col gap-1.5 sm:col-span-2">
                    <span className={rotulo}>{t.percentual}</span>
                    <input
                      inputMode="decimal"
                      placeholder="ex.: 4,5"
                      value={q.percentual}
                      onChange={(e) => muda(i, "percentual", e.target.value)}
                      className={`${campo} font-mono tabular-nums sm:max-w-[12rem]`}
                    />
                    <span className="text-sm text-fg-muted">{t.percentualNota}</span>
                  </label>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
        {conta ? <ResumoCelular conta={conta} /> : null}
        {linhas.length < MAX_COTACOES ? (
          <div>
            <button
              type="button"
              onClick={() => setLinhas((ls) => [...ls, novaLinha(ls.length, "regular")])}
              className="inline-flex items-center gap-2 rounded-control border border-line-strong px-5 py-3 font-medium text-fg transition-colors hover:border-fg"
            >
              <Plus size={16} /> {t.adicionar}
            </button>
          </div>
        ) : null}

        <label className="flex flex-col gap-1.5 sm:max-w-[20rem]">
          <span className={rotulo}>{t.vezes}</span>
          <input inputMode="numeric" value={vezes} onChange={(e) => setVezes(e.target.value)} className={`${campo} font-mono tabular-nums`} />
        </label>

        <details className="border border-line p-4">
          <summary className="cursor-pointer font-medium text-fg">{t.avancado}</summary>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className={rotulo}>{t.cbsRef}</span>
              <input inputMode="decimal" value={cbsRef} onChange={(e) => setCbsRef(e.target.value)} className={`${campo} font-mono tabular-nums`} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={rotulo}>{t.ibsRef}</span>
              <input inputMode="decimal" value={ibsRef} onChange={(e) => setIbsRef(e.target.value)} className={`${campo} font-mono tabular-nums`} />
            </label>
            <p className="text-sm text-fg-muted sm:col-span-2">{t.avancadoNota}</p>
          </div>
        </details>
      </form>

      <div className="lg:col-span-5">
        <div className="flex flex-col gap-6">
          <section id="resultado" aria-live="polite" aria-labelledby="resultado-titulo" className="scroll-mt-24 flex flex-col gap-5 border border-line bg-surface p-6 sm:p-8">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="resultado-titulo" className="text-2xl font-medium tracking-[-0.02em] text-fg">
                {t.resultadoTitulo}
              </h2>
              {conta ? (
                <span className="text-right text-sm text-fg-muted">
                  {t.taxa}: <b className="font-mono font-medium text-fg">{pct(conta.taxa)}</b>
                </span>
              ) : null}
            </div>
            {!conta ? (
              <p className="text-fg-muted">{t.preencha}</p>
            ) : (
              <>
                <ol className="flex flex-col gap-3">
                  {conta.resultados.map((r, i) => (
                    <li key={i} className={`flex flex-col gap-2 border p-4 ${r.melhor ? "border-accent bg-accent/[0.06]" : "border-line"}`}>
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-medium text-fg">{r.nome}</span>
                        {r.melhor ? <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent-text">{t.melhor}</span> : null}
                      </div>
                      <span className="text-xs text-fg-muted">{t.regimes[r.regime]}</span>
                      <dl className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <dt className="text-fg-muted">{t.colunas.nota}</dt>
                          <dd className="font-mono tabular-nums text-fg">{reais(r.valor)}</dd>
                        </div>
                        <div>
                          <dt className="text-fg-muted">{t.colunas.credito}</dt>
                          <dd className="font-mono tabular-nums text-fg">{reais(r.credito)}</dd>
                        </div>
                        <div>
                          <dt className="text-fg-muted">{t.colunas.liquido}</dt>
                          <dd className="font-mono font-medium tabular-nums text-fg">{reais(r.liquido)}</dd>
                        </div>
                      </dl>
                      {!r.melhor ? (
                        <p className="text-sm text-fg-muted">
                          {t.colunas.diferenca}: <b className="font-mono font-medium text-fg">{reais(r.acimaDaMelhor)}</b>
                        </p>
                      ) : null}
                      {r.empate !== null && !r.melhor ? (
                        <p className="text-sm text-fg-muted">
                          {t.empate} <b className="font-mono font-medium text-fg">{reais(r.empate)}</b>.
                        </p>
                      ) : null}
                      {r.semPercentual ? <p className="text-sm text-accent-text">{t.semPercentual}</p> : null}
                    </li>
                  ))}
                </ol>
                {ano < 2033 ? <p className="border-t border-line pt-4 text-sm leading-relaxed text-fg-muted">{t.avisoTransicao}</p> : null}
                {conta.diferencaAnual !== null ? (
                  <p className="border-t border-line pt-4 text-fg">
                    {t.anual}: <b className="font-mono font-medium">{reais(conta.diferencaAnual)}</b>
                  </p>
                ) : null}
                <div className="flex flex-col gap-3 border-t border-line pt-5">
                  <a href="#pedir-comparativo" onClick={() => registrarEvento("reforma_cta_resultado")} className={`${botao} justify-center`}>
                    <span>{t.pedirCta}</span>
                    <ArrowDown size={17} className="transition-transform duration-300 group-hover:translate-y-0.5" />
                  </a>
                  <p className="text-sm leading-relaxed text-fg-muted">{t.pedirNota}</p>
                </div>
              </>
            )}
          </section>
          <PedirPorEmail cenario={cenario} />
        </div>
      </div>
    </div>
  );
}

/** No celular o resultado fica abaixo dos campos: este resumo diz a melhor na hora e leva até lá. */
function ResumoCelular({ conta }: { conta: ReturnType<typeof calcular> }) {
  const melhor = conta.resultados.find((r) => r.melhor);
  if (!melhor) return null;
  return (
    <a href="#resultado" className="flex items-center justify-between gap-3 border border-accent bg-accent/[0.06] p-4 text-fg lg:hidden" aria-hidden="true" tabIndex={-1}>
      <span className="text-sm">
        {t.melhor}: <b className="font-medium">{melhor.nome}</b>, <b className="font-mono font-medium">{reais(melhor.liquido)}</b>
      </span>
      <ArrowDown size={16} />
    </a>
  );
}

type Envio = "parado" | "enviando" | "ok" | "okSemEmail";

function PedirPorEmail({ cenario }: { cenario: Cenario | null }) {
  const [d, setD] = useState({ nome: "", email: "", empresa: "", cargo: "", consentimento: false, avisarAliquotas: false, site: "" });
  const [estado, setEstado] = useState<Envio>("parado");
  const [erro, setErro] = useState<string | null>(null);
  const iniciou = useRef(false);

  /* Todo erro do pedido vira também um evento, para saber o que trava (sem o que foi digitado). */
  const falhar = (m: (typeof MOTIVOS_REFORMA)[number]) => {
    registrarEvento(`reforma_erro_${m}` as const);
    setErro(l.erros[m]);
  };

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!cenario) return falhar("cenario");
    if (d.nome.trim().length < 2) return falhar("nome");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email.trim())) return falhar("email");
    if (!d.consentimento) return falhar("consentimento");
    registrarEvento("reforma_formulario_envio");
    setEstado("enviando");
    try {
      const r = await fetch("/api/reforma", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...d, cenario }) });
      const j = (await r.json().catch(() => ({}))) as { enviado?: boolean; error?: string };
      if (r.ok) {
        registrarEvento("reforma_formulario_ok");
        return setEstado(j.enviado ? "ok" : "okSemEmail");
      }
      setEstado("parado");
      const motivos = ["cenario", "nome", "email", "consentimento"] as const;
      const motivo = motivos.find((m) => m === j.error);
      falhar(r.status === 429 ? "limite" : (motivo ?? "falha"));
    } catch {
      setEstado("parado");
      falhar("falha");
    }
  }

  if (estado === "ok" || estado === "okSemEmail") {
    return (
      <p role="status" className="border border-accent bg-accent/[0.06] p-6 font-medium text-fg">
        {estado === "ok" ? l.ok : l.okSemEmail}
      </p>
    );
  }

  const texto = (k: "nome" | "email" | "empresa" | "cargo", tipo: string, auto: string, nota?: string) => (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className={rotulo}>
        {l[k]}
        {nota ? <span className="ml-2 normal-case tracking-normal">({nota})</span> : null}
      </span>
      <input type={tipo} name={k} autoComplete={auto} value={d[k]} onChange={(e) => setD((x) => ({ ...x, [k]: e.target.value }))} className={campo} />
    </label>
  );

  return (
    <form
      onSubmit={enviar}
      onFocusCapture={() => {
        if (iniciou.current) return;
        iniciou.current = true;
        registrarEvento("reforma_formulario_inicio");
      }}
      noValidate
      id="pedir-comparativo"
      className="flex scroll-mt-24 flex-col gap-5 border border-line p-6 sm:p-8"
      aria-labelledby="lead-titulo"
    >
      <div className="flex flex-col gap-2">
        <h2 id="lead-titulo" className="text-xl font-medium tracking-[-0.02em] text-fg">
          {l.titulo}
        </h2>
        <p className="text-sm leading-relaxed text-fg-muted">{l.texto}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {texto("nome", "text", "name")}
        {texto("email", "email", "email")}
        {texto("empresa", "text", "organization", l.opcional)}
        {texto("cargo", "text", "organization-title", l.opcional)}
      </div>
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Site
          <input type="text" name="site" tabIndex={-1} autoComplete="off" value={d.site} onChange={(e) => setD((x) => ({ ...x, site: e.target.value }))} />
        </label>
      </div>
      <label className="flex items-start gap-3 text-sm leading-relaxed text-fg-muted">
        <input
          type="checkbox"
          checked={d.consentimento}
          onChange={(e) => setD((x) => ({ ...x, consentimento: e.target.checked }))}
          className="mt-1 size-4 shrink-0 accent-[var(--accent)]"
        />
        <span>
          {l.consentimento}{" "}
          <Link href="/privacidade" className="text-fg underline" prefetch={false}>
            {l.privacidade}
          </Link>
          .
        </span>
      </label>
      <label className="flex items-start gap-3 text-sm leading-relaxed text-fg-muted">
        <input
          type="checkbox"
          checked={d.avisarAliquotas}
          onChange={(e) => setD((x) => ({ ...x, avisarAliquotas: e.target.checked }))}
          className="mt-1 size-4 shrink-0 accent-[var(--accent)]"
        />
        <span>{l.avisar}</span>
      </label>
      {erro ? (
        <p role="alert" className="text-sm font-medium text-accent-text">
          {erro}
        </p>
      ) : null}
      <div>
        <button type="submit" className={botao} disabled={estado === "enviando"}>
          <span className="whitespace-nowrap">{estado === "enviando" ? l.enviando : l.enviar}</span>
          {estado === "enviando" ? <CircleNotch size={17} className="animate-spin" /> : <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />}
        </button>
      </div>
    </form>
  );
}
