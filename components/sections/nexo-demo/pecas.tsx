import type { ReactNode } from "react";
import type { Acao, Estado } from "@/lib/nexo-demo/regras";

/** Peças comuns das telas do Nexo Demo (2026-11-27). As cores vêm dos tokens redefinidos em `.nexo-demo` (globals.css). */
export type Tela = "mia" | "abrir" | "minhas" | "aprovacoes" | "requisicoes" | "cotacoes" | "fecho";
export type PropsTela = { e: Estado; despachar: (a: Acao) => void; ir: (t: Tela) => void; empresa: string; nome: string };

export const cartao = "rounded-xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgb(19_23_35/0.05)]";
export const botao =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-on transition-colors hover:bg-accent-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45";
export const botaoLinha =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium text-fg transition-colors hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-45";
export const rotulo = "text-[11px] font-medium uppercase tracking-[0.08em] text-fg-muted";
export const campo = "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-fg outline-none focus-visible:border-accent";

const TONS = {
  neutro: "bg-[#eef0f6] text-[#454b5a]",
  azul: "bg-[#dfe6ff] text-[#0b2bd0]",
  verde: "bg-[#dcf5e7] text-[#0b6b3a]",
  ambar: "bg-[#fdf0d5] text-[#8a5200]",
  vermelho: "bg-[#fde4e1] text-[#a1201a]",
} as const;

export function Selo({ tom = "neutro", children }: { tom?: keyof typeof TONS; children: ReactNode }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${TONS[tom]}`}>{children}</span>;
}

export function TituloTela({ titulo, sub }: { titulo: string; sub?: string }) {
  return (
    <header className="flex flex-col gap-1">
      <h1 className="text-xl font-semibold tracking-[-0.01em] text-fg">{titulo}</h1>
      {sub ? <p className="max-w-[80ch] text-sm text-fg-muted">{sub}</p> : null}
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

export const dataCurta = (iso: string) => iso.split("-").reverse().join("/");
