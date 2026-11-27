"use client";

import type { ReactNode } from "react";
import { ArrowRight, ArrowsClockwise, Check } from "@phosphor-icons/react";
import { nexoDemo as t } from "@/lib/nexo-demo/textos";
import { FASES, faseDe, proximaAcao, type Estado } from "@/lib/nexo-demo/regras";
import { botao, botaoLinha, proximo } from "./pecas";

/**
 * O guia do Nexo Demo (refeito em 2026-11-27, pedido do Rodrigo: "crie uma
 * forma mais intuitiva de guiar o usuário pelo fluxo, deixando claro onde ele
 * está e o que falta"). Três camadas:
 *
 * 1. A TRILHA: os oito passos sempre à vista, feitos com visto, o atual
 *    marcado, os que faltam apagados (no celular, barra de progresso e a
 *    lista sob "Ver os passos").
 * 2. "AGORA": o papel da vez e o clique seguinte, com o nome do botão
 *    (`proximaAcao`, lib/nexo-demo/regras.ts), e o botão que leva à tela.
 * 3. O DESTAQUE: o botão citado em "Agora" pulsa na tela (`proximo`, pecas).
 *
 * A janela da cotação é modal e cobre o guia: lá dentro vai o `GuiaJanela`,
 * com o mesmo "Agora".
 */
const g = t.guia;

function Passo({ i, atual, lista = false }: { i: number; atual: number; lista?: boolean }) {
  const feito = i < atual;
  const aqui = i === atual;
  const nome = g.fases[FASES[i]].nome;
  const bola = `flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${feito ? "bg-[#0f8a4b] text-white" : aqui ? "bg-accent-text text-white ring-4 ring-[#5b21e6]/20" : "border border-line-strong bg-surface text-fg-muted"}`;
  return (
    <li aria-current={aqui ? "step" : undefined} className={lista ? "flex items-center gap-2.5 py-1" : "flex min-w-0 flex-1 flex-col items-center gap-1.5"}>
      {lista ? null : (
        <span className="flex w-full items-center" aria-hidden="true">
          <span className={`h-0.5 flex-1 ${i === 0 ? "opacity-0" : i <= atual ? "bg-[#0f8a4b]" : "bg-line"}`} />
          <span className={bola}>{feito ? <Check size={12} weight="bold" /> : i + 1}</span>
          <span className={`h-0.5 flex-1 ${i === FASES.length - 1 ? "opacity-0" : feito ? "bg-[#0f8a4b]" : "bg-line"}`} />
        </span>
      )}
      {lista ? (
        <span className={bola} aria-hidden="true">
          {feito ? <Check size={12} weight="bold" /> : i + 1}
        </span>
      ) : null}
      <span className={`text-xs leading-tight ${lista ? "" : "px-1 text-center"} ${aqui ? "font-semibold text-accent-text" : feito ? "text-fg" : "text-fg-muted"}`}>
        {nome}
        {feito || aqui ? <span className="sr-only"> ({feito ? g.feito : g.aqui})</span> : null}
      </span>
    </li>
  );
}

export function Guia({ e, noDestino, irDestino, reiniciar }: { e: Estado; noDestino: boolean; irDestino: () => void; reiniciar: () => void }) {
  const fase = faseDe(e);
  const atual = FASES.indexOf(fase);
  const f = g.fases[fase];
  const { acao } = proximaAcao(e);
  const faltam = FASES.length - 1 - atual;
  return (
    <section aria-label={g.trilha} className="border-b border-line bg-surface">
      {/* A trilha: inteira no desktop; no celular, progresso e a lista sob demanda. */}
      <ol className="mx-auto hidden max-w-[1160px] px-4 pb-1 pt-4 md:flex">
        {FASES.map((id, i) => (
          <Passo key={id} i={i} atual={atual} />
        ))}
      </ol>
      <details className="group px-4 pt-3 md:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e3e6f2]" aria-hidden="true">
            <span className="block h-full rounded-full bg-[#0f8a4b] transition-[width] duration-500" style={{ width: `${(atual / (FASES.length - 1)) * 100}%` }} />
          </span>
          <span className="shrink-0 text-xs font-medium text-accent-text underline-offset-2 group-open:underline">{g.verPassos}</span>
        </summary>
        <ol className="flex flex-col pt-2">
          {FASES.map((id, i) => (
            <Passo key={id} i={i} atual={atual} lista />
          ))}
        </ol>
      </details>

      {/* Agora: onde a pessoa está, no papel de quem, e o clique seguinte. */}
      <div role="status" className="mx-auto flex max-w-[1160px] flex-wrap items-center gap-x-4 gap-y-2.5 px-4 py-3">
        <div className="flex min-w-0 flex-1 basis-72 flex-col gap-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span className="rounded-full bg-accent-text px-2.5 py-0.5 font-medium text-white">{g.rotulo(atual + 1, FASES.length)}</span>
            <span className="font-semibold text-fg">{f.nome}</span>
            <span className="text-fg-muted">· {f.papel}</span>
            <span className="text-fg-muted">· {g.faltam(faltam)}</span>
          </p>
          <p className="text-sm leading-snug text-fg">
            <strong className="font-semibold text-accent-text">{g.agora}:</strong> {g.acoes[acao]}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {noDestino ? null : (
            <button type="button" onClick={irDestino} className={`${botao} !py-2 ${proximo}`} data-guia>
              {fase === "fim" ? g.verResumo : g.ir}
              <ArrowRight size={14} weight="bold" aria-hidden="true" />
            </button>
          )}
          {e.rc ? (
            <button type="button" onClick={reiniciar} className={`${botaoLinha} !py-2`}>
              <ArrowsClockwise size={14} aria-hidden="true" />
              {t.app.reiniciar}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/**
 * O "Agora" dentro da janela da cotação da pessoa. `aba` é a aba aberta: se o
 * botão da vez mora em outra, o guia oferece ir até ela; quando o passo
 * seguinte é fora da janela (a aprovação), oferece sair.
 */
export function GuiaJanela({ e, aba, irAba, sair, nomeAba }: { e: Estado; aba: string; irAba: (a: "fornecedores" | "propostas" | "selecao") => void; sair: (para: "aprovacoes" | "fecho") => void; nomeAba: (a: string) => string }) {
  const fase = faseDe(e);
  const atual = FASES.indexOf(fase);
  const p = proximaAcao(e);
  let acaoBotao: ReactNode = null;
  if (p.aba && p.aba !== aba) {
    const destino = p.aba;
    acaoBotao = (
      <button type="button" onClick={() => irAba(destino)} className={`${botao} !py-2 ${proximo}`} data-guia-janela>
        {g.irAba(nomeAba(destino))}
        <ArrowRight size={14} weight="bold" aria-hidden="true" />
      </button>
    );
  } else if (p.acao === "aprovarSelecao" || p.acao === "fim") {
    const para = p.acao === "fim" ? "fecho" : "aprovacoes";
    acaoBotao = (
      <button type="button" onClick={() => sair(para)} className={`${botao} !py-2 ${proximo}`} data-guia-janela>
        {para === "fecho" ? g.verResumo : g.irAprovacoes}
        <ArrowRight size={14} weight="bold" aria-hidden="true" />
      </button>
    );
  }
  return (
    <div role="status" className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-[#5b21e6]/25 bg-[#f4f1ff] px-4 py-3">
      <div className="flex min-w-0 flex-1 basis-64 flex-col gap-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="rounded-full bg-accent-text px-2.5 py-0.5 font-medium text-white">{g.rotulo(atual + 1, FASES.length)}</span>
          <span className="font-semibold text-fg">{g.fases[fase].nome}</span>
          <span className="text-fg-muted">· {g.faltam(FASES.length - 1 - atual)}</span>
        </p>
        <p className="text-sm leading-snug text-fg">
          <strong className="font-semibold text-accent-text">{g.agora}:</strong> {g.acoes[p.acao]}
        </p>
      </div>
      {acaoBotao}
    </div>
  );
}
