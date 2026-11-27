"use client";

import { useEffect, useRef, useState } from "react";
import { Check, EnvelopeSimple, X } from "@phosphor-icons/react";
import { nexoDemo as t } from "@/lib/nexo-demo/textos";
import { FILME_APROVACAO_MS, RITMO_FILME, alcadaDe, codigoRc, codigoRfq, economiaCentavos, estimadoCentavos, itemDoCatalogo, ordensDeCompra, reais, totalSelecionado, type Estado } from "@/lib/nexo-demo/regras";
import { Selo, TOM_URGENCIA, botaoLinha, rotulo, secao } from "./pecas";

/**
 * As duas aprovações vistas de fora (2026-11-27, pedido do Rodrigo: "faça uma
 * animação com a aprovação do gestor na requisição do requisitante e no
 * gerente de compras na OC"). Toca depois do clique de aprovar, com os dados
 * da PRÓPRIA demonstração, em três cenas:
 *
 * - `rc`: o gestor recebe o pedido por e-mail, aprova (o carimbo com nome,
 *   papel e hora) e a requisição vira cotação, com o solicitante avisado.
 * - `oc`: o aprovador da alçada recebe a seleção, aprova e as ordens de
 *   compra saem, uma por fornecedor, para o ERP e para os fornecedores.
 *
 * Mesmas regras do FilmeFornecedor: toca uma vez, tem "Pular", o palco é
 * `aria-hidden` com descrição para leitor de tela, e sob reduced motion as
 * três etapas vêm escritas de uma vez. `aoFim` é chamado quando termina.
 */
const f = t.aprovacoes.filme;
const CENA = { aprova: 2500, depois: 5300 } as const;

export function FilmeAprovacao({ tipo, e, nome, hoje, aoFim, pular, fechar }: { tipo: "rc" | "oc"; e: Estado; nome: string; hoje: Date; aoFim?: () => void; pular?: () => void; fechar?: () => void }) {
  const [parado] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [ms, setMs] = useState(0);
  const fim = useRef(aoFim);
  fim.current = aoFim;
  useEffect(() => {
    if (parado) return;
    const inicio = performance.now();
    const id = window.setInterval(() => {
      const agora = (performance.now() - inicio) / RITMO_FILME;
      setMs(agora);
      if (agora >= FILME_APROVACAO_MS) {
        window.clearInterval(id);
        fim.current?.();
      }
    }, 70);
    return () => window.clearInterval(id);
  }, [parado]);

  const rc = e.rc!;
  const x = f[tipo];
  const itens = rc.itens.map((l) => `${l.qtd} × ${itemDoCatalogo(l.item)!.nome}`);
  const total = totalSelecionado(e);
  const alcada = alcadaDe(total);
  const ocs = tipo === "oc" ? ordensDeCompra(e) : [];
  const papel = tipo === "rc" ? t.minhas.cadeiaPassos.gestor : alcada.aprovador;
  const codigo = tipo === "rc" ? codigoRc() : codigoRfq();
  const valor = tipo === "rc" ? reais(estimadoCentavos(rc)) : reais(total);
  const hora = hoje.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const corpo = tipo === "rc" ? f.rc.corpo(nome, itens.join("; "), valor, rc.centro.split(" · ")[0]) : f.oc.corpo(valor, alcada.faixa, alcada.aprovador);
  const depois: string[] = tipo === "rc" ? f.rc.depois(codigoRc(), codigoRfq()) : [...ocs.map((o) => f.oc.ordem(o.codigo, o.fornecedor.nome, reais(o.totalCentavos))), ...f.oc.depois];
  const cena = parado ? 3 : ms < CENA.aprova ? 0 : ms < CENA.depois ? 1 : 2;
  const carimbado = ms >= 3900;

  const carimbo = (
    <div className="nexo-demo-carimbo flex flex-col items-center rounded-lg border-2 border-[#0f8a4b] px-3 py-1.5 text-[#0b6b3a]">
      <span className="text-sm font-bold uppercase tracking-[0.14em]">{f.aprovada}</span>
      <span className="text-[11px]">{f.assinatura(nome, papel, hora)}</span>
    </div>
  );

  const palco =
    cena === 0 ? (
      <div className="flex flex-col gap-3">
        <p className={rotulo}>{t.cotacoes.filme.caixa}</p>
        {ms < 350 ? null : (
          <div className="nexo-demo-chega flex items-start gap-3 rounded-lg border border-line bg-surface p-3">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#dfe6ff] text-accent">
              <EnvelopeSimple size={16} weight="fill" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="flex items-baseline justify-between gap-2 text-xs text-fg-muted">
                <span className="font-semibold text-fg">{t.cotacoes.filme.remetente}</span>
                <span>{t.cotacoes.filme.agora}</span>
              </p>
              <p className="text-sm font-semibold text-fg">{x.assunto(codigo)}</p>
              {ms >= 1000 ? (
                <div className="nexo-demo-chega flex flex-col items-start gap-2 pt-1">
                  <p className="text-sm text-fg-muted">{corpo}</p>
                  <span className={`rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white transition-transform duration-150 ${ms >= 2050 ? "scale-95 ring-4 ring-[#1238f5]/30" : ""}`}>{f.abrir}</span>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    ) : cena === 1 ? (
      <div className="nexo-demo-chega flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-fg">{codigo}</span>
          {carimbado ? <Selo tom="verde">{f.seloAprovada}</Selo> : <Selo tom="ambar">{t.minhas.cadeiaPassos.pendente}</Selo>}
          {tipo === "rc" ? <Selo tom={TOM_URGENCIA[rc.urgencia]}>{rc.urgencia}</Selo> : null}
        </div>
        <ul className="flex flex-col gap-0.5 text-sm text-fg">
          {(tipo === "rc" ? itens : ocs.map((o) => `${o.fornecedor.nome} · ${reais(o.totalCentavos)}`)).map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <p className="text-sm tabular-nums text-fg-muted">{tipo === "rc" ? f.rc.resumo(valor, rc.centro.split(" · ")[0]) : f.oc.resumo(valor, economiaCentavos(e) >= 0 ? t.aprovacoes.economia : t.cotacoes.acima, reais(Math.abs(economiaCentavos(e))))}</p>
        <div className="flex min-h-[52px] flex-wrap items-center gap-3">
          {carimbado ? (
            carimbo
          ) : (
            <span className={`inline-flex items-center gap-1.5 rounded-lg bg-[#0f8a4b] px-3 py-2 text-xs font-medium text-white transition-transform duration-150 ${ms >= 3500 ? "scale-95 ring-4 ring-[#0f8a4b]/30" : ""}`}>
              <Check size={14} weight="bold" />
              {x.botao}
            </span>
          )}
        </div>
      </div>
    ) : (
      <ul className="flex flex-col gap-2">
        {depois.map((d, i) => (
          <li key={d} className="nexo-demo-chega flex items-start gap-2 rounded-lg border border-line bg-surface p-3 text-sm text-fg" style={{ animationDelay: `${i * 260}ms` }}>
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#0f8a4b] text-white">
              <Check size={12} weight="bold" />
            </span>
            {d}
          </li>
        ))}
      </ul>
    );

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-[#5b21e6]/25 bg-[#f4f1ff] p-4" aria-label={x.titulo(papel)} data-filme-aprovacao={tipo}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={secao}>{f.sobre}</p>
          <h2 className="text-sm font-semibold text-fg">{x.titulo(papel)}</h2>
          <p className="text-xs text-fg-muted">{f.quem(nome, papel)}</p>
        </div>
        {pular && !parado && ms < FILME_APROVACAO_MS ? (
          <button type="button" onClick={pular} className={`${botaoLinha} !px-3 !py-1.5 !text-xs`}>
            {t.cotacoes.filme.pular}
          </button>
        ) : fechar ? (
          <button type="button" onClick={fechar} className={`${botaoLinha} !px-2.5 !py-1.5`} aria-label={t.cotacoes.filme.fechar}>
            <X size={14} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <p className="sr-only">{x.descricao(nome, papel, codigo, valor)}</p>

      {parado ? (
        <ol className="flex flex-col gap-2 text-sm text-fg" aria-hidden="true">
          {[x.legendas[0], `${x.legendas[1]} ${f.assinatura(nome, papel, hora)}.`, depois.join(" ")].map((texto, i) => (
            <li key={i} className="flex items-start gap-2 rounded-lg bg-surface p-3">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#0f8a4b] text-[11px] font-semibold text-white">{i + 1}</span>
              <span>
                <strong className="font-semibold">{x.passos[i]}.</strong> {texto}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <div aria-hidden="true" className="flex flex-col gap-3">
          <ol className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {x.passos.map((p, i) => (
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
              <span className="min-w-0 flex-1 truncate rounded bg-bg px-2 py-0.5 text-[11px] text-fg-muted">{cena === 0 ? f.caixaDe(papel) : f.endereco}</span>
            </div>
            <div key={cena} className="min-h-[228px] p-4">
              {palco}
            </div>
          </div>
          <p className="text-sm text-fg">{x.legendas[Math.min(cena, 2)]}</p>
          <span className="h-1 overflow-hidden rounded-full bg-[#e3e6f2]">
            <span className="block h-full rounded-full bg-accent-text" style={{ width: `${Math.min(100, (ms / FILME_APROVACAO_MS) * 100)}%` }} />
          </span>
        </div>
      )}
    </section>
  );
}
