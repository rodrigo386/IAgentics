"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CircleNotch } from "@phosphor-icons/react";
import { diagnose } from "@/lib/content";
import {
  chave,
  decimal,
  faltasDaIdentificacao,
  maiorSalto,
  marcar,
  nivel,
  respondido,
  resumir,
  type Identificacao,
  type Nota,
  type Respostas,
} from "@/lib/diagnose";
import { Radar } from "./Radar";

/**
 * A Diagnose de Compras (2026-10-31), trazida do `diagnose-compras.html` da
 * Academy para o desenho do site. Etapas: 0 abertura, 1 identificação,
 * 2 a 8 os sete pilares, 9 a prévia com o radar.
 *
 * O progresso fica no localStorage, como no original ("dá para parar e voltar
 * depois"), e é lido só DEPOIS de montar: ler no primeiro render faria o HTML
 * do servidor (abertura) divergir do cliente (etapa salva). Leitura e escrita
 * em try/catch, porque navegador com dado de site bloqueado lança exceção.
 *
 * A cada troca de etapa a rolagem volta ao topo da ferramenta e o foco vai
 * para o título, para o leitor de tela anunciar onde a pessoa está.
 */
const NP = diagnose.pilares.length;
const PREVIA = NP + 2;

/** `isca`: o campo escondido que só robô preenche; vai como `site` no envio. */
type Estado = { passo: number; id: Identificacao; r: Respostas; enviado: boolean; isca: string };
const ID_VAZIA: Identificacao = { nome: "", email: "", empresa: "", cargo: "", whatsapp: "", papel: "", consentimento: false };
const NOVO: Estado = { passo: 0, id: ID_VAZIA, r: {}, enviado: false, isca: "" };

const rotulo = "font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted";
const campo = "w-full rounded-control border border-line bg-bg px-4 py-3 text-fg outline-none focus-visible:border-fg";
const botao =
  "group inline-flex items-center gap-2 rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-[background-color,transform] duration-200 hover:bg-accent-hover active:scale-[0.98] disabled:opacity-60";
const fantasma =
  "inline-flex items-center rounded-control border border-line-strong px-7 py-3.5 font-medium text-fg transition-colors duration-200 hover:border-fg active:scale-[0.98]";
const cartao = "flex flex-col gap-5 border border-line bg-surface p-6 sm:p-8";

export function Diagnose() {
  const [s, setS] = useState<Estado>(NOVO);
  const [carregado, setCarregado] = useState(false);
  const topo = useRef<HTMLDivElement>(null);
  const primeiraTroca = useRef(true);

  useEffect(() => {
    try {
      const salvo = JSON.parse(localStorage.getItem(diagnose.chaveProgresso) ?? "null");
      if (salvo && typeof salvo === "object" && salvo.r) {
        // Voltar à etapa salva não é navegação: a página não rola sozinha ao abrir.
        if (salvo.passo) primeiraTroca.current = true;
        setS({ ...NOVO, ...salvo, id: { ...ID_VAZIA, ...salvo.id } });
      }
    } catch {}
    setCarregado(true);
  }, []);

  useEffect(() => {
    if (!carregado) return;
    try {
      localStorage.setItem(diagnose.chaveProgresso, JSON.stringify(s));
    } catch {}
  }, [s, carregado]);

  useEffect(() => {
    if (primeiraTroca.current) {
      primeiraTroca.current = false;
      return;
    }
    topo.current?.scrollIntoView({ block: "start" });
    topo.current?.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
  }, [s.passo]);

  const irPara = (passo: number) => setS((x) => ({ ...x, passo }));

  let etapa;
  if (s.passo === 0) etapa = <Abertura temProgresso={carregado && (Object.keys(s.r).length > 0 || s.passo > 0 || s.id.nome !== "")} s={s} setS={setS} />;
  else if (s.passo === 1) etapa = <Identificar s={s} setS={setS} irPara={irPara} />;
  else if (s.passo < PREVIA) etapa = <Pilar s={s} setS={setS} irPara={irPara} />;
  else etapa = <Previa s={s} setS={setS} />;

  return (
    <div ref={topo} className="scroll-mt-24">
      {etapa}
    </div>
  );
}

type Props = { s: Estado; setS: React.Dispatch<React.SetStateAction<Estado>> };

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <h2 tabIndex={-1} className="text-3xl font-medium tracking-[-0.03em] text-fg outline-none sm:text-4xl">
      {children}
    </h2>
  );
}

/* ---------- 0. abertura ---------- */
function Abertura({ temProgresso, s, setS }: Props & { temProgresso: boolean }) {
  const t = diagnose.abertura;
  return (
    <div className={cartao}>
      <Titulo>{t.titulo}</Titulo>
      <p className="max-w-[62ch] leading-relaxed text-fg-muted">{t.texto}</p>
      <p className="text-sm text-fg-muted">{t.nota}</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" className={botao} onClick={() => setS((x) => ({ ...x, passo: Math.max(1, s.passo) }))}>
          <span className="whitespace-nowrap">{temProgresso ? t.continuar : t.comecar}</span>
          <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
        </button>
        {temProgresso ? (
          <button type="button" className={fantasma} onClick={() => setS({ ...NOVO, passo: 1 })}>
            {t.zerar}
          </button>
        ) : null}
      </div>
    </div>
  );
}

/* ---------- 1. identificação ---------- */
function Identificar({ s, setS, irPara }: Props & { irPara: (n: number) => void }) {
  const t = diagnose.identificacao;
  const [faltas, setFaltas] = useState<string[]>([]);
  const muda = (k: keyof Identificacao, v: string | boolean) => setS((x) => ({ ...x, id: { ...x.id, [k]: v } }));

  const seguir = () => {
    const f = faltasDaIdentificacao(s.id);
    setFaltas(f.map((k) => t.faltas[k]));
    if (f.length === 0) irPara(2);
  };

  const texto = (k: "nome" | "email" | "empresa" | "cargo" | "whatsapp", tipo: string, auto: string, nota?: string) => (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className={rotulo}>
        {t[k]}{" "}
        {nota ? <span className="ml-2 normal-case tracking-normal">({nota})</span> : null}
      </span>
      <input type={tipo} name={k} autoComplete={auto} value={s.id[k]} onChange={(e) => muda(k, e.target.value)} className={campo} />
    </label>
  );

  return (
    <div className={cartao}>
      <p className={rotulo}>{t.eyebrow}</p>
      <Titulo>{t.titulo}</Titulo>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {texto("nome", "text", "name")}
        {texto("email", "email", "email")}
        {texto("empresa", "text", "organization", t.empresaNota)}
        {texto("cargo", "text", "organization-title")}
        <div className="sm:col-span-2">{texto("whatsapp", "tel", "tel", t.opcional)}</div>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className={`${rotulo} mb-3`}>{t.papel}</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(["gestor", "time"] as const).map((p) => (
            <label
              key={p}
              className="flex cursor-pointer items-start gap-3 border border-line p-4 transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent/[0.06]"
            >
              <input
                type="radio"
                name="papel"
                value={p}
                checked={s.id.papel === p}
                onChange={() => muda("papel", p)}
                className="mt-1 size-4 shrink-0 accent-[var(--accent)]"
              />
              <span className="flex flex-col">
                <span className="font-medium text-fg">{t.papeis[p].titulo}</span>
                <span className="text-sm text-fg-muted">{t.papeis[p].nota}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Isca para robô: fora da tela e fora do teclado. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Site
          <input type="text" name="site" tabIndex={-1} autoComplete="off" value={s.isca} onChange={(e) => setS((x) => ({ ...x, isca: e.target.value }))} />
        </label>
      </div>

      <label className="flex items-start gap-3 text-sm leading-relaxed text-fg-muted">
        <input
          type="checkbox"
          checked={s.id.consentimento}
          onChange={(e) => muda("consentimento", e.target.checked)}
          className="mt-1 size-4 shrink-0 accent-[var(--accent)]"
        />
        <span>
          {t.consentimento}{" "}
          <Link href="/privacidade" className="text-fg underline" prefetch={false}>
            {t.privacidade}
          </Link>
        </span>
      </label>

      {faltas.length ? (
        <p role="alert" className="text-sm font-medium text-accent-text">
          {t.falta} {faltas.join(", ")}.
        </p>
      ) : null}

      <div className="flex flex-wrap justify-between gap-3">
        <button type="button" className={fantasma} onClick={() => irPara(0)}>
          {t.voltar}
        </button>
        <button type="button" className={botao} onClick={seguir}>
          <span className="whitespace-nowrap">{t.seguir}</span>
          <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}

/* ---------- 2..8. pilares ---------- */
function Escala({ nome, valor, rotuloGrupo, aoMarcar }: { nome: string; valor?: number; rotuloGrupo: string; aoMarcar: (n: number) => void }) {
  return (
    <fieldset className="grid grid-cols-5 gap-2">
      <legend className="sr-only">{rotuloGrupo}</legend>
      {[1, 2, 3, 4, 5].map((n) => (
        <label key={n} className="relative">
          <input
            type="radio"
            name={nome}
            value={n}
            checked={valor === n}
            onChange={() => aoMarcar(n)}
            className="peer absolute inset-0 opacity-0"
          />
          <span className="flex h-11 cursor-pointer items-center justify-center rounded-control border border-line-strong font-mono text-[15px] text-fg transition-colors hover:border-fg peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-on peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-fg">
            {n}
          </span>
        </label>
      ))}
    </fieldset>
  );
}

function Pilar({ s, setS, irPara }: Props & { irPara: (n: number) => void }) {
  const t = diagnose.pilar;
  const pi = s.passo - 2;
  const P = diagnose.pilares[pi];
  const gestor = s.id.papel === "gestor";
  const ultimo = pi === NP - 1;
  const [destacar, setDestacar] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState(false);

  const nota = (k: string, campoNota: keyof Nota, n: number) => {
    setS((x) => ({ ...x, r: { ...x.r, [k]: marcar(x.r[k], campoNota, n) } }));
    setDestacar((d) => d.filter((c) => c !== k));
  };

  async function enviar() {
    setEnviando(true);
    setErroEnvio(false);
    try {
      const r = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...s.id, site: s.isca, respostas: s.r }),
      });
      if (!r.ok) throw new Error(String(r.status));
      setS((x) => ({ ...x, enviado: true, passo: PREVIA }));
    } catch {
      setErroEnvio(true);
      setEnviando(false);
    }
  }

  const seguir = () => {
    const faltam = P.processos.map((_, ii) => chave(pi, ii)).filter((k) => !respondido(s.r[k], s.id.papel));
    setDestacar(faltam);
    if (faltam.length) {
      document.getElementById(`processo-${faltam[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (ultimo) enviar();
    else irPara(s.passo + 1);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className={`flex flex-wrap justify-between gap-3 ${rotulo}`}>
          <span>{t.contagem(pi + 1, NP)}</span>
          <span>{t.processos(P.processos.length)}</span>
        </div>
        <div className="h-1 bg-line" aria-hidden="true">
          <div className="h-full bg-accent transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${Math.round((pi / NP) * 100)}%` }} />
        </div>
        <ol className="flex flex-wrap gap-1.5" aria-hidden="true">
          {diagnose.pilares.map((p, i) => (
            <li
              key={p.nome}
              className={`rounded-control border px-2.5 py-1 font-mono text-[11px] ${
                i === pi ? "border-accent text-accent-text" : i < pi ? "border-transparent bg-accent/[0.08] text-fg" : "border-line text-fg-muted"
              }`}
            >
              {p.curto}
            </li>
          ))}
        </ol>
      </div>

      <Titulo>{P.nome}</Titulo>
      <p className="max-w-[62ch] text-sm leading-relaxed text-fg-muted">{t.instrucao}</p>

      {P.processos.map((pr, ii) => {
        const k = chave(pi, ii);
        const v = s.r[k] ?? {};
        const falta = destacar.includes(k);
        return (
          <article
            key={k}
            id={`processo-${k}`}
            className={`flex scroll-mt-24 flex-col gap-4 border bg-surface p-5 sm:p-6 ${falta ? "border-accent outline outline-2 outline-accent/30" : "border-line"}`}
          >
            <div>
              <h3 className="text-xl font-medium tracking-[-0.02em] text-fg">{pr.nome}</h3>
              <p className="mt-1 text-fg-muted">{pr.oque}</p>
            </div>
            <ol className="grid gap-1.5 border-l-2 border-line pl-3">
              {pr.regua.map((frase, j) => (
                <li key={j} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-2 text-sm leading-relaxed text-fg">
                  <b className="font-mono font-medium text-accent-text">{j * 2 + 1}</b>
                  <span>{frase}</span>
                </li>
              ))}
            </ol>
            <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4">
              <span className="text-sm font-medium text-fg">{t.hoje}</span>
              <Escala nome={`h-${k}`} valor={v.h} rotuloGrupo={`${pr.nome}: ${t.hoje}`} aoMarcar={(n) => nota(k, "h", n)} />
              {gestor ? (
                <>
                  <span className="text-sm font-medium text-fg">
                    {t.potencial}
                    <span className="block text-xs font-normal text-fg-muted">{t.potencialNota}</span>
                  </span>
                  <Escala nome={`p-${k}`} valor={v.p} rotuloGrupo={`${pr.nome}: ${t.potencial}`} aoMarcar={(n) => nota(k, "p", n)} />
                  <span className="text-sm font-medium text-fg">
                    {t.impacto}
                    <span className="block text-xs font-normal text-fg-muted">{t.impactoNota}</span>
                  </span>
                  <Escala nome={`i-${k}`} valor={v.i} rotuloGrupo={`${pr.nome}: ${t.impacto}`} aoMarcar={(n) => nota(k, "i", n)} />
                </>
              ) : null}
            </div>
          </article>
        );
      })}

      {destacar.length ? (
        <p role="alert" className="text-sm font-medium text-accent-text">
          {destacar.length === 1 ? t.faltaUm : t.faltam(destacar.length)}
        </p>
      ) : null}
      {erroEnvio ? (
        <p role="alert" className="text-sm font-medium text-accent-text">
          {t.erroEnvio} {diagnose.contato}.
        </p>
      ) : null}

      <div className="flex flex-wrap justify-between gap-3">
        <button type="button" className={fantasma} onClick={() => irPara(s.passo - 1)} disabled={enviando}>
          {t.voltar}
        </button>
        <button type="button" className={botao} onClick={seguir} disabled={enviando}>
          <span className="whitespace-nowrap">
            {enviando ? t.enviando : erroEnvio ? t.tentarDeNovo : ultimo ? t.enviar : t.proximo}
          </span>
          {enviando ? (
            <CircleNotch size={17} className="animate-spin" />
          ) : (
            <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
          )}
        </button>
      </div>
    </div>
  );
}

/* ---------- 9. prévia ---------- */
function Previa({ s, setS }: Props) {
  const t = diagnose.previa;
  const gestor = s.id.papel === "gestor";
  const r = resumir(s.r, s.id.papel);
  const [copiado, setCopiado] = useState<string | null>(null);
  if (r.geral === null) return null;
  const lv = nivel(r.geral);
  const salto = gestor ? maiorSalto(r) : null;

  const copiar = async () => {
    const link = `${window.location.origin}/diagnose-compras`;
    try {
      await navigator.clipboard.writeText(t.mensagemTime(link, s.id.empresa));
      setCopiado(t.copiado);
    } catch {
      setCopiado(link);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className={cartao}>
        <div className={`flex flex-wrap justify-between gap-3 ${rotulo}`}>
          <span>{t.eyebrow}</span>
          <span>{s.id.empresa}</span>
        </div>
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <div className="flex flex-col gap-3">
            <span className="text-sm text-fg-muted">{t.media}</span>
            <span className="font-mono text-7xl font-medium tracking-[-0.04em] text-accent-text tabular-nums sm:text-8xl">{decimal(r.geral)}</span>
            <Titulo>{lv.nome}</Titulo>
            <p className="text-sm leading-relaxed text-fg-muted">{lv.texto.split(". ")[0]}.</p>
          </div>
          <div className="flex justify-center">
            <Radar pilares={r.pilares} rotulo={t.radar} />
          </div>
        </div>
        <div className="flex flex-wrap gap-5 text-sm text-fg-muted">
          <span className="inline-flex items-center gap-2">
            <i className="inline-block h-[3px] w-4 bg-accent" aria-hidden="true" />
            {t.hoje}
          </span>
          {gestor ? (
            <span className="inline-flex items-center gap-2">
              <i className="inline-block w-4 border-t-2 border-dashed border-fg" aria-hidden="true" />
              {t.em12}
            </span>
          ) : null}
          <span>{t.escala}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-l-2 border-accent bg-accent/[0.06] p-5 sm:p-6">
        <h3 className="text-xl font-medium tracking-[-0.02em] text-fg">{gestor ? t.gestorTitulo : t.timeTitulo}</h3>
        <p className="leading-relaxed text-fg-muted">
          {gestor ? (
            <>
              {t.gestorTexto}
              {salto ? (
                <>
                  {" "}
                  {t.maiorSalto} <b className="font-medium text-fg">{salto.nome}</b>.
                </>
              ) : null}
            </>
          ) : (
            t.timeTexto(s.id.empresa)
          )}
        </p>
      </div>

      {gestor ? (
        <div className={cartao}>
          <h3 className="text-xl font-medium tracking-[-0.02em] text-fg">{t.convidarTitulo}</h3>
          <p className="max-w-[62ch] leading-relaxed text-fg-muted">{t.convidarTexto}</p>
          <div>
            <button type="button" className={fantasma} onClick={copiar}>
              {copiado ?? t.copiar}
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-fg-muted">
          {t.duvidas}{" "}
          <a href={`mailto:${diagnose.contato}`} className="text-fg underline">
            {diagnose.contato}
          </a>
        </p>
        <button type="button" className={fantasma} onClick={() => setS({ ...NOVO, passo: 1 })}>
          {t.refazer}
        </button>
      </div>
    </div>
  );
}
