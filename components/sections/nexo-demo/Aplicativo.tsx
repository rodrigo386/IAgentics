"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import Image from "next/image";
import { ArrowRight, ArrowsClockwise, ChatCircleDots, SignOut } from "@phosphor-icons/react";
import { nexoDemo as t } from "@/lib/nexo-demo/textos";
import { responder } from "@/lib/nexo-demo/mia";
import { FASES, NUMERO, faseDe, reduzir, type Acao, type Estado, type Tela } from "@/lib/nexo-demo/regras";
import { MiaFlutuante, TelaMia, type Mensagem } from "./Mia";
import { TelaAbrirRc, TelaAprovacoes, TelaMinhas, TelaRequisicoes, type Prefill } from "./TelasRequisicao";
import { TelaCotacoes } from "./TelaCotacoes";
import { TelaAlcada, TelaFornecedores, TelaSala, TelaSpend } from "./TelasPaineis";
import { TelaFecho } from "./TelaFecho";
import { botao, botaoLinha } from "./pecas";

/**
 * A moldura do Nexo Demo (2026-11-27): topo, menu, guia, a MIA flutuante e a
 * tela da vez. Guarda o estado da demonstração (redutor de
 * lib/nexo-demo/regras.ts), grava o avanço no navegador e avisa o servidor
 * do passo mais distante (só o índice).
 */
export type Acesso = { token: string; nome: string; empresa: string };

export function Aplicativo({ acesso, inicial, sair, guardar }: { acesso: Acesso; inicial: Estado; sair: () => void; guardar: (e: Estado) => void }) {
  const [e, despacharBase] = useReducer(reduzir, inicial);
  const fase = faseDe(e);
  const [tela, setTela] = useState<Tela>(fase === "fim" ? "fecho" : fase === "inicio" ? "mia" : (t.guia.fases[fase].tela as Tela));
  const telas = t.app.menu.flatMap((m) => m.itens.map((i) => i.id as Tela)).concat("fecho");
  /** A cotação aberta em janela (o número), ou nenhuma. */
  const [rfqAberta, setRfqAberta] = useState<string | null>(null);
  /** O que a MIA mandou preencher no formulário; a chave remonta o formulário a cada pedido. */
  const [prefill, setPrefill] = useState<{ chave: number; valor: Prefill }>({ chave: 0, valor: null });
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [hoje] = useState(() => new Date());
  const conteudo = useRef<HTMLDivElement>(null);
  const enviado = useRef(-1);
  const primeiroNome = acesso.nome.trim().split(/\s+/)[0] || acesso.empresa;

  useEffect(() => {
    guardar(e);
    const passo = FASES.indexOf(fase);
    if (passo <= enviado.current) return;
    enviado.current = passo;
    void fetch("/api/nexo-demo/passo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: acesso.token, passo }), keepalive: true }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `guardar` é recriada a cada render do pai; o que importa é o estado.
  }, [acesso.token, e, fase]);

  /* As propostas "chegam" um instante depois do envio dos convites, com a janela aberta ou não. */
  useEffect(() => {
    if (!e.convitesEnviados || e.propostasChegaram) return;
    const id = window.setTimeout(() => despacharBase({ tipo: "chegarPropostas" }), window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1400);
    return () => window.clearTimeout(id);
  }, [e.convitesEnviados, e.propostasChegaram]);

  /* Cada tela é uma entrada no histórico do navegador (#tela): o botão voltar
     anda DENTRO da demo, e recarregar volta à mesma tela. Achado do teste de
     uso de 2026-11-27: voltar tirava a pessoa da demonstração. */
  useEffect(() => {
    const daUrl = () => {
      const h = window.location.hash.slice(1) as Tela;
      if (telas.includes(h)) {
        setTela(h);
        setRfqAberta(null);
      }
    };
    /* A primeira entrada também ganha o #tela: sem ele, voltar até o começo
       mudava o endereço e deixava a tela anterior na frente. */
    if (telas.includes(window.location.hash.slice(1) as Tela)) daUrl();
    else window.history.replaceState(null, "", `#${tela}`);
    window.addEventListener("popstate", daUrl);
    return () => window.removeEventListener("popstate", daUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a lista de telas é fixa.
  }, []);

  const ir = (destino: Tela) => {
    if (destino !== tela) window.history.pushState(null, "", `#${destino}`);
    setTela(destino);
    setRfqAberta(null);
    conteudo.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  };
  const abrirMinhaRfq = () => {
    ir("cotacoes");
    setRfqAberta(NUMERO);
  };
  const despachar = (a: Acao) => {
    despacharBase(a);
    if (a.tipo === "reiniciar") {
      setMensagens([]);
      ir("mia");
    }
    if (a.tipo === "aprovarSelecao") ir("fecho");
  };
  const perguntar = (texto: string) => {
    const r = responder(texto, e);
    setMensagens((ms) => [...ms, { de: "voce", texto }, { de: "mia", texto: r.texto, bloco: r.bloco }]);
    if (r.preencher) setPrefill((p) => ({ chave: p.chave + 1, valor: r.preencher! }));
    if (r.ir) ir(r.ir);
  };

  const g = t.guia.fases[fase];
  const noDestino = tela === g.tela && (g.tela !== "cotacoes" || rfqAberta === NUMERO);
  const props = { e, despachar, ir, empresa: acesso.empresa, nome: primeiroNome, hoje };
  const mia = { e, mensagens, perguntar };
  const itens: { id: string; rotulo: string }[] = t.app.menu.flatMap((m) => [...m.itens]);
  return (
    <div className="nexo-demo flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface px-4">
        <Image src="/nexo-app-icon.svg" alt="" width={26} height={26} />
        <span className="text-base font-semibold text-fg">{t.app.marca}</span>
        <span className="rounded-full bg-[#ece5ff] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-accent-text">{t.app.selo}</span>
        <span className="ml-2 hidden text-xs text-fg-muted md:inline">{t.app.faixa}</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden text-right leading-tight sm:block">
            <p className="max-w-[22ch] truncate text-sm font-medium text-fg">{acesso.nome || acesso.empresa}</p>
            <p className="max-w-[28ch] truncate text-[11px] text-fg-muted">{acesso.nome ? acesso.empresa : t.app.perfil}</p>
          </div>
          <a href={t.fecho.whatsappHref} target="_blank" rel="noopener noreferrer" className={`${botao} !px-3 !py-2`}>
            <ChatCircleDots size={16} aria-hidden="true" />
            <span className="hidden sm:inline">{t.app.falar}</span>
            <span className="sr-only sm:hidden">{t.app.falar}</span>
          </a>
          <button
            type="button"
            onClick={() => {
              window.history.replaceState(null, "", window.location.pathname);
              sair();
            }}
            className={`${botaoLinha} !px-3 !py-2`} aria-label={t.app.sair} title={t.app.sair}>
            <SignOut size={16} aria-hidden="true" />
          </button>
        </div>
      </header>
      <p className="border-b border-line bg-surface px-4 py-1.5 text-center text-xs text-fg-muted md:hidden">{t.app.faixa}</p>

      <div className="flex min-h-0 flex-1">
        {/* Menu: coluna no desktop; no celular, faixa que rola de lado. */}
        <nav aria-label={t.app.marca} className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 flex-col gap-3 overflow-y-auto border-r border-line bg-surface p-3 lg:flex">
          {t.app.menu.map((grupo) => (
            <div key={grupo.grupo} className="flex flex-col gap-0.5">
              <p className="px-3 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-fg-subtle">{grupo.grupo}</p>
              {grupo.itens.map((i) => (
                <ItemMenu key={i.id} ativo={tela === i.id} rotulo={i.rotulo} onClick={() => ir(i.id as Tela)} />
              ))}
            </div>
          ))}
          <div className="flex flex-col gap-0.5 border-t border-line pt-3" aria-hidden="true">
            <p className="px-3 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-fg-subtle">{t.app.completa}</p>
            {t.app.menuCompleto.map((i) => (
              <span key={i} className="px-3 py-1 text-sm text-fg-subtle/70">
                {i}
              </span>
            ))}
          </div>
        </nav>

        <div className="flex min-w-0 flex-1 flex-col">
          <nav aria-label={t.app.marca} className="flex gap-1 overflow-x-auto border-b border-line bg-surface px-2 py-2 lg:hidden">
            {itens.map((i) => (
              <ItemMenu key={i.id} ativo={tela === i.id} rotulo={i.rotulo} onClick={() => ir(i.id as Tela)} compacto />
            ))}
          </nav>

          {/* O guia: papel da vez, o que fazer e o botão que leva à tela certa. */}
          <div role="status" className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-[#f4f1ff] px-4 py-3 sm:px-6">
            <span className="rounded-full bg-accent-text px-2.5 py-0.5 text-xs font-medium text-white">{t.guia.rotulo(FASES.indexOf(fase) + 1, FASES.length)}</span>
            <p className="min-w-0 flex-1 basis-60 text-sm text-fg">
              <strong className="font-semibold">{g.papel}.</strong> {g.texto}
            </p>
            <div className="flex gap-2">
              {noDestino ? null : (
                <button type="button" onClick={() => (g.tela === "cotacoes" ? abrirMinhaRfq() : ir(g.tela as Tela))} className={`${botao} !py-2`} data-guia>
                  {t.guia.ir}
                  <ArrowRight size={14} weight="bold" aria-hidden="true" />
                </button>
              )}
              {e.rc ? (
                <button type="button" onClick={() => despachar({ tipo: "reiniciar" })} className={`${botaoLinha} !py-2`}>
                  <ArrowsClockwise size={14} aria-hidden="true" />
                  {t.app.reiniciar}
                </button>
              ) : null}
            </div>
          </div>

          <main id="conteudo" ref={conteudo} tabIndex={-1} className="flex-1 px-4 pb-28 pt-6 outline-none sm:px-6 sm:pt-8">
            <div className={`mx-auto flex flex-col gap-5 ${tela === "cotacoes" || tela === "requisicoes" ? "max-w-[1160px]" : "max-w-[980px]"}`}>
              {tela === "mia" ? <TelaMia nome={primeiroNome} {...mia} /> : null}
              {tela === "abrir" ? <TelaAbrirRc key={prefill.chave} {...props} prefill={prefill.valor} /> : null}
              {tela === "minhas" ? <TelaMinhas {...props} /> : null}
              {tela === "aprovacoes" ? <TelaAprovacoes {...props} abrirRfq={abrirMinhaRfq} /> : null}
              {tela === "requisicoes" ? <TelaRequisicoes {...props} /> : null}
              {tela === "cotacoes" ? <TelaCotacoes {...props} aberta={rfqAberta} abrir={setRfqAberta} /> : null}
              {tela === "spend" ? <TelaSpend /> : null}
              {tela === "sala" ? <TelaSala {...props} /> : null}
              {tela === "fornecedores" ? <TelaFornecedores /> : null}
              {tela === "alcada" ? <TelaAlcada {...props} /> : null}
              {tela === "fecho" ? <TelaFecho {...props} /> : null}
            </div>
          </main>
        </div>
      </div>
      {tela === "mia" || rfqAberta ? null : <MiaFlutuante {...mia} />}
    </div>
  );
}

function ItemMenu({ ativo, rotulo, onClick, compacto = false }: { ativo: boolean; rotulo: string; onClick: () => void; compacto?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={ativo ? "page" : undefined}
      className={`rounded-lg px-3 text-left text-sm transition-colors ${compacto ? "shrink-0 whitespace-nowrap py-1.5" : "py-1.5"} ${ativo ? "bg-[#e8ecff] font-medium text-accent" : "text-fg hover:bg-bg"}`}
    >
      {rotulo}
    </button>
  );
}
