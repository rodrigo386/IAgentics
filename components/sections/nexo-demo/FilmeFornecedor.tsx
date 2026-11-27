"use client";

import { useEffect, useState } from "react";
import { Check, EnvelopeSimple, LinkSimple, X } from "@phosphor-icons/react";
import { nexoDemo as t } from "@/lib/nexo-demo/textos";
import { FILME_PROPOSTA_MS, RITMO_FILME, codigoRfq, fornecedorDe, itemDoCatalogo, reais, type Cotacao, type Estado } from "@/lib/nexo-demo/regras";
import { botaoLinha, rotulo, secao } from "./pecas";

/**
 * O outro lado do convite (2026-11-27, pedido do Rodrigo: "mostrar uma
 * animação do fornecedor recebendo o e-mail com o link mágico, preenchendo o
 * form e depois aparecendo a proposta preenchida"). Três cenas, com os
 * números da PRÓPRIA proposta que chega em seguida: o e-mail com o link
 * único, o Portal do Fornecedor sendo preenchido e a proposta enviada.
 *
 * Dura `FILME_PROPOSTA_MS`, o mesmo tempo que a moldura espera para fazer as
 * propostas chegarem (Aplicativo). Toca uma vez, não em laço, e tem "Pular".
 * Sob reduced motion não anima: mostra as três etapas escritas de uma vez.
 * O palco é `aria-hidden`; quem usa leitor de tela recebe a descrição.
 */
const f = t.cotacoes.filme;
const CENA = { portal: 2800, enviada: 7000 } as const;
const semCifra = (centavos: number) => reais(centavos).replace(/^R\$\s/, "");
/** Quantos caracteres de `texto` já foram "digitados" entre `de` e `ate`. */
const digitado = (texto: string, ms: number, de: number, ate: number) => texto.slice(0, Math.max(0, Math.min(texto.length, Math.ceil(((ms - de) / (ate - de)) * texto.length))));

export function FilmeFornecedor({ e, numero, cotacao, outros, pular, fechar }: { e: Estado; numero: string; cotacao: Cotacao; outros: number; pular?: () => void; fechar?: () => void }) {
  const [parado] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [ms, setMs] = useState(0);
  useEffect(() => {
    if (parado) return;
    const inicio = performance.now();
    const id = window.setInterval(() => {
      const agora = (performance.now() - inicio) / RITMO_FILME;
      setMs(agora);
      if (agora >= FILME_PROPOSTA_MS) window.clearInterval(id);
    }, 70);
    return () => window.clearInterval(id);
  }, [parado]);

  const fornecedor = fornecedorDe(e, cotacao.fornecedor)!;
  const linhas = e.rc!.itens.filter((l) => cotacao.linhas[l.item]).map((l) => ({ nome: itemDoCatalogo(l.item)!.nome, qtd: l.qtd, preco: semCifra(cotacao.linhas[l.item]!.unitarioCentavos) }));
  const campos = [...linhas.map((l) => ({ nome: `${l.qtd} × ${l.nome}`, valor: l.preco, sufixo: "" })), { nome: t.cotacoes.portal.prazo, valor: String(cotacao.prazoDias), sufixo: "" }];
  const cena = parado ? 3 : ms < CENA.portal ? 0 : ms < CENA.enviada ? 1 : 2;
  /* A digitação ocupa de 3,3 s a 6,1 s, um campo depois do outro. */
  const fatia = 2800 / campos.length;
  const endereco = `portal.nexo.example/convite/${cotacao.fornecedor}`;

  const email = (aberto: boolean, apertado: boolean) => (
    <div className="flex flex-col gap-3">
      <p className={rotulo}>{f.caixa}</p>
      <div className="nexo-demo-chega flex items-start gap-3 rounded-lg border border-line bg-surface p-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#dfe6ff] text-accent">
          <EnvelopeSimple size={16} weight="fill" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="flex items-baseline justify-between gap-2 text-xs text-fg-muted">
            <span className="font-semibold text-fg">{f.remetente}</span>
            <span>{f.agora}</span>
          </p>
          <p className="text-sm font-semibold text-fg">{t.cotacoes.emailAssunto(codigoRfq(numero))}</p>
          {aberto ? (
            <div className="nexo-demo-chega flex flex-col items-start gap-2 pt-1">
              <p className="text-sm text-fg-muted">{f.corpo(linhas.map((l) => `${l.qtd} × ${l.nome}`).join("; "))}</p>
              <span className={`inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white transition-transform duration-150 ${apertado ? "scale-95 ring-4 ring-[#1238f5]/30" : ""}`}>
                <LinkSimple size={14} weight="bold" />
                {t.cotacoes.emailLink}
              </span>
              <p className="text-[11px] text-fg-muted">{f.linkUnico}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  const portal = (tempo: number, apertado: boolean) => (
    <div className="nexo-demo-chega flex flex-col gap-3">
      <p className="text-sm font-semibold text-fg">
        {t.cotacoes.portal.titulo} <span className="font-normal text-fg-muted">· {codigoRfq(numero)}</span>
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {campos.map((cp, i) => {
          const de = 3300 + i * fatia;
          const texto = digitado(cp.valor, tempo, de, de + fatia * 0.8);
          const ativo = tempo >= de && tempo < de + fatia;
          return (
            <div key={cp.nome} className="flex min-w-0 flex-col gap-1">
              <span className="truncate text-[11px] text-fg-muted">{cp.nome}</span>
              <span className={`flex h-9 items-center rounded-lg border bg-surface px-3 text-sm tabular-nums text-fg ${ativo ? "border-accent ring-2 ring-[#1238f5]/15" : "border-line"}`}>
                {texto}
                {ativo ? <span className="ml-px h-4 w-px animate-pulse bg-accent" /> : null}
              </span>
            </div>
          );
        })}
      </div>
      <span className={`self-start rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white transition-transform duration-150 ${apertado ? "scale-95 ring-4 ring-[#1238f5]/30" : ""}`}>{t.cotacoes.portal.enviar}</span>
    </div>
  );

  const enviada = (
    <div className="nexo-demo-chega flex flex-col items-center gap-2 py-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-[#0f8a4b] text-white">
        <Check size={24} weight="bold" />
      </span>
      <p className="text-base font-semibold text-fg">{f.enviadaTitulo}</p>
      <p className="text-sm tabular-nums text-fg-muted">{f.enviadaTotal(reais(cotacao.totalCentavos), cotacao.prazoDias)}</p>
    </div>
  );

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-[#5b21e6]/25 bg-[#f4f1ff] p-4" aria-label={f.titulo(cotacao.nome)} data-filme>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={secao}>{f.sobre}</p>
          <h3 className="text-sm font-semibold text-fg">{f.titulo(cotacao.nome)}</h3>
          <p className="text-xs text-fg-muted">{fornecedor.email}</p>
        </div>
        {pular ? (
          <button type="button" onClick={pular} className={`${botaoLinha} !px-3 !py-1.5 !text-xs`}>
            {f.pular}
          </button>
        ) : fechar ? (
          <button type="button" onClick={fechar} className={`${botaoLinha} !px-2.5 !py-1.5`} aria-label={f.fechar}>
            <X size={14} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <p className="sr-only">{f.descricao(cotacao.nome, reais(cotacao.totalCentavos))}</p>

      {parado ? (
        /* Sem animação: as três etapas escritas, de uma vez. */
        <ol className="flex flex-col gap-2 text-sm text-fg" aria-hidden="true">
          {f.passos.map((p, i) => (
            <li key={p} className="flex items-start gap-2 rounded-lg bg-surface p-3">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#0f8a4b] text-[11px] font-semibold text-white">{i + 1}</span>
              <span>
                <strong className="font-semibold">{p}.</strong> {[f.legendas.email, f.legendas.portal, f.enviadaTotal(reais(cotacao.totalCentavos), cotacao.prazoDias)][i]}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <div aria-hidden="true" className="flex flex-col gap-3">
          <ol className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {f.passos.map((p, i) => (
              <li key={p} className={`flex items-center gap-1.5 ${i === cena ? "font-semibold text-accent-text" : i < cena ? "text-fg" : "text-fg-muted"}`}>
                <span className={`flex size-5 items-center justify-center rounded-full text-[11px] font-semibold ${i < cena || cena === 2 ? "bg-[#0f8a4b] text-white" : i === cena ? "bg-accent-text text-white" : "bg-[#e3e6f2] text-fg-muted"}`}>
                  {i < cena || cena === 2 ? <Check size={12} weight="bold" /> : i + 1}
                </span>
                {p}
              </li>
            ))}
          </ol>
          <div className="overflow-hidden rounded-lg border border-line bg-bg">
            <div className="flex items-center gap-2 border-b border-line bg-surface px-3 py-2">
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="size-2 rounded-full bg-[#d5d9e6]" />
                ))}
              </span>
              <span className="min-w-0 flex-1 truncate rounded bg-bg px-2 py-0.5 text-[11px] text-fg-muted">{cena === 0 ? fornecedor.email : endereco}</span>
            </div>
            <div key={cena} className="min-h-[236px] p-4">
              {cena === 0 ? (ms < 350 ? <p className={rotulo}>{f.caixa}</p> : email(ms >= 1100, ms >= 2300)) : cena === 1 ? portal(ms, ms >= 6400) : enviada}
            </div>
          </div>
          <p className="text-sm text-fg">{[f.legendas.email, f.legendas.portal, f.legendas.enviada][cena]}</p>
          <span className="h-1 overflow-hidden rounded-full bg-[#e3e6f2]">
            <span className="block h-full rounded-full bg-accent-text" style={{ width: `${Math.min(100, (ms / FILME_PROPOSTA_MS) * 100)}%` }} />
          </span>
        </div>
      )}
      {outros > 0 ? <p className="text-xs text-fg-muted">{f.outros(outros)}</p> : null}
    </section>
  );
}
