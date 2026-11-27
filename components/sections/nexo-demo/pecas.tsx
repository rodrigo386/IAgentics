"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CornersIn, CornersOut, X } from "@phosphor-icons/react";
import { nexoDemo as t } from "@/lib/nexo-demo/textos";
import type { Acao, Estado, Tela } from "@/lib/nexo-demo/regras";

/** Peças comuns das telas do Nexo Demo (2026-11-27). As cores vêm dos tokens redefinidos em `.nexo-demo` (globals.css). */
export type { Tela };
export type PropsTela = { e: Estado; despachar: (a: Acao) => void; ir: (t: Tela) => void; empresa: string; nome: string; hoje: Date };

export const cartao = "rounded-xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgb(19_23_35/0.05)]";
export const botao =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-on transition-colors hover:bg-accent-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45";
export const botaoLinha =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium text-fg transition-colors hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-45";
export const botaoVerde = `${botao} !bg-[#0f8a4b] hover:!bg-[#0b6b3a]`;
export const botaoMia = "inline-flex items-center justify-center gap-2 rounded-lg bg-accent-text px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-45";
export const linque = "text-sm font-medium text-accent hover:underline";
export const rotulo = "text-[11px] font-medium uppercase tracking-[0.08em] text-fg-muted";
export const campo = "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-fg outline-none focus-visible:border-accent";
/** O botão que o guia manda clicar agora: anel que pulsa (globals.css). `destaque(cond)` liga só quando é a vez dele. */
export const proximo = "nexo-demo-proximo";
export const destaque = (vez: boolean) => (vez ? proximo : "");
export const secao = "text-[11px] font-semibold uppercase tracking-[0.08em] text-accent";

const TONS = {
  neutro: "bg-[#eef0f6] text-[#454b5a]",
  azul: "bg-[#dfe6ff] text-[#0b2bd0]",
  verde: "bg-[#dcf5e7] text-[#0b6b3a]",
  ambar: "bg-[#fdf0d5] text-[#8a5200]",
  vermelho: "bg-[#fde4e1] text-[#a1201a]",
  violeta: "bg-[#ece5ff] text-[#5b21e6]",
} as const;
export type Tom = keyof typeof TONS;

export function Selo({ tom = "neutro", children }: { tom?: Tom; children: ReactNode }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${TONS[tom]}`}>{children}</span>;
}

export const TOM_URGENCIA: Record<string, Tom> = { Baixa: "verde", Média: "azul", Alta: "ambar", Crítica: "vermelho" };

export function TituloTela({ titulo, sub, lado }: { titulo: string; sub?: string; lado?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-[-0.01em] text-fg">{titulo}</h1>
        {sub ? <p className="max-w-[80ch] text-sm text-fg-muted">{sub}</p> : null}
      </div>
      {lado}
    </header>
  );
}

export function Vazio({ children }: { children: ReactNode }) {
  return <div className="rounded-lg bg-bg px-4 py-6 text-center text-sm text-fg-muted">{children}</div>;
}

/** Par rótulo/valor dos cabeçalhos de RC e RFQ. */
export function Dado({ nome, valor }: { nome: string; valor: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className={rotulo}>{nome}</dt>
      <dd className="text-sm font-medium text-fg">{valor}</dd>
    </div>
  );
}

export function Indicador({ nome, valor, alerta = false }: { nome: string; valor: ReactNode; alerta?: boolean }) {
  return (
    <div className={`${cartao} !p-4`}>
      <dd className={`text-2xl font-semibold tabular-nums ${alerta ? "text-[#a1201a]" : "text-fg"}`}>{valor}</dd>
      <dt className={rotulo}>{nome}</dt>
    </div>
  );
}

export function Lista({ titulo, itens, alerta = false }: { titulo: string; itens: readonly string[]; alerta?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className={secao}>{titulo}</h3>
      <ul className={`flex list-disc flex-col gap-1 pl-5 text-sm ${alerta ? "text-[#a1201a]" : "text-fg"}`}>
        {itens.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}

/** Barra horizontal dos gráficos (CSS puro; o número vai escrito ao lado). */
export function Barra({ nome, valor, fracao }: { nome: string; valor: string; fracao: number }) {
  return (
    <li className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 text-sm">
      <span className="text-fg">{nome}</span>
      <span className="tabular-nums text-fg-muted">{valor}</span>
      <span className="col-span-2 h-2 rounded-full bg-bg" aria-hidden="true">
        <span className="block h-2 rounded-full bg-accent" style={{ width: `${Math.max(2, fracao * 100)}%` }} />
      </span>
    </li>
  );
}

export const dataCurta = (iso: string) => iso.split("-").reverse().join("/");

/**
 * Janela sobre a tela, como o detalhe da cotação e a análise da RC no Nexo
 * real, com "Tela cheia". É um <dialog> nativo aberto com showModal(): o foco
 * fica preso dentro, Esc fecha e o resto da página fica inerte.
 */
export function Janela({ titulo, sobre, selos, fechar, children, larga = true }: { titulo: string; sobre?: string; selos?: ReactNode; fechar: () => void; children: ReactNode; larga?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [cheia, setCheia] = useState(false);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    return () => d?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onClose={fechar}
      onClick={(ev) => {
        if (ev.target === ref.current) fechar();
      }}
      aria-label={titulo}
      className={`m-auto flex-col overflow-hidden border border-line bg-surface p-0 text-fg shadow-[0_24px_60px_rgb(19_23_35/0.25)] backdrop:bg-[#131723]/55 open:flex ${
        cheia ? "h-dvh max-h-none w-screen max-w-none rounded-none" : `max-h-[calc(100dvh-1.5rem)] max-w-none rounded-xl ${larga ? "w-[min(1080px,calc(100vw-1.5rem))]" : "w-[min(720px,calc(100vw-1.5rem))]"}`
      }`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          {sobre ? <p className={secao}>{sobre}</p> : null}
          <h2 className="text-lg font-semibold text-fg">{titulo}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selos}
          <button type="button" onClick={() => setCheia(!cheia)} className={`${botaoLinha} !px-2.5 !py-1.5 max-sm:hidden`} aria-pressed={cheia}>
            {cheia ? <CornersIn size={14} aria-hidden="true" /> : <CornersOut size={14} aria-hidden="true" />}
            <span className="text-xs">{cheia ? t.app.janela.sairTelaCheia : t.app.janela.telaCheia}</span>
          </button>
          <button type="button" onClick={fechar} className={`${botaoLinha} !px-2.5 !py-1.5`} aria-label={t.app.janela.fechar}>
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-5 [&>*]:shrink-0">{children}</div>
    </dialog>
  );
}
