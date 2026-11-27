"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react";
import { nexoDemo as t } from "@/lib/nexo-demo/textos";
import { CODIGO_OC, economiaCentavos, estimadoCentavos, porcento, propostas, reais } from "@/lib/nexo-demo/regras";
import { Vazio, botao, botaoLinha, cartao, rotulo, type PropsTela } from "./pecas";

/**
 * Fecho do Nexo Demo (2026-11-27, decisão do Rodrigo: "agendar conversa"):
 * o resumo do que a pessoa fez, com os números da PRÓPRIA demonstração, e os
 * caminhos para falar com o time (WhatsApp e o formulário da home).
 */
export function TelaFecho({ e, despachar, ir }: PropsTela) {
  const f = t.fecho;
  if (!e.ocGerada || !e.rc) {
    return (
      <div className={`${cartao} flex flex-col items-center gap-3`}>
        <Vazio>{t.guia.fases.inicio.texto}</Vazio>
        <button type="button" onClick={() => ir("mia")} className={botao}>
          {t.app.menu[0].itens[0].rotulo}
        </button>
      </div>
    );
  }
  const economia = economiaCentavos(e);
  const numeros: [string, string][] = [
    [f.numeros.oc, CODIGO_OC],
    [f.numeros.fornecedores, String(e.convidados.length)],
    [f.numeros.propostas, String(propostas(e).length)],
    [f.numeros.rodadas, String(e.rodada)],
    [economia >= 0 ? f.numeros.economia : t.cotacoes.acima, `${reais(Math.abs(economia))} (${porcento(Math.abs(economia) / estimadoCentavos(e.rc))})`],
  ];
  return (
    <>
      <header className="flex flex-col gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-[#0b6b3a]">
          <CheckCircle size={20} weight="fill" aria-hidden="true" />
          {f.eyebrow}
        </p>
        <h1 className="max-w-[22ch] text-3xl font-semibold tracking-[-0.02em] text-fg sm:text-4xl">{f.titulo}</h1>
        <p className="max-w-[64ch] leading-relaxed text-fg-muted">{f.lead}</p>
      </header>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {numeros.map(([nome, valor], i) => (
          <div key={nome} className={`${cartao} !p-4 ${i === numeros.length - 1 ? "col-span-2 sm:col-span-1" : ""}`}>
            <dd className="text-lg font-semibold tabular-nums text-fg">{valor}</dd>
            <dt className={rotulo}>{nome}</dt>
          </div>
        ))}
      </dl>
      <section className="flex flex-col gap-4 rounded-xl bg-[#1a1140] p-6 text-white sm:p-8">
        <h2 className="text-2xl font-semibold tracking-[-0.02em]">{f.ctaTitulo}</h2>
        <p className="max-w-[60ch] text-[#d9d3f5]">{f.ctaTexto}</p>
        <div className="flex flex-wrap gap-3">
          <a href={f.whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#1a1140] hover:bg-[#ece5ff]">
            {f.whatsapp}
            <ArrowRight size={16} weight="bold" aria-hidden="true" />
          </a>
          <Link href={f.formularioHref} className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-5 py-3 text-sm font-semibold text-white hover:border-white">
            {f.formulario}
          </Link>
        </div>
      </section>
      <section className={`${cartao} flex flex-col gap-3`}>
        <h2 className="text-sm font-semibold text-fg">{f.naoViu}</h2>
        <ul className="grid list-disc gap-1 pl-5 text-sm text-fg sm:grid-cols-2">
          {f.naoViuItens.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3 pt-1">
          <Link href={f.conhecerHref} className={botaoLinha}>
            {f.conhecer}
          </Link>
          <button type="button" onClick={() => despachar({ tipo: "reiniciar" })} className={botaoLinha}>
            {f.refazer}
          </button>
        </div>
      </section>
    </>
  );
}
