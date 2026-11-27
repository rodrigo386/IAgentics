"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { PaperPlaneRight, Sparkle, X } from "@phosphor-icons/react";
import { ALCADAS, FORNECEDORES, SEMENTES, SPEND } from "@/lib/nexo-demo/dados";
import { nexoDemo as t } from "@/lib/nexo-demo/textos";
import type { Bloco } from "@/lib/nexo-demo/mia";
import { codigoRc, codigoRfq, estimadoCentavos, itemDoCatalogo, reais, type Estado } from "@/lib/nexo-demo/regras";
import { Barra, Selo, TOM_URGENCIA, cartao, type PropsTela } from "./pecas";

/**
 * A MIA no Nexo Demo (2026-11-27): a conversa da tela inicial e o botão roxo
 * que acompanha todas as telas, como no produto. As respostas vêm de
 * lib/nexo-demo/mia.ts (regras, no navegador); aqui é só a tela.
 */
export type Mensagem = { de: "voce" | "mia"; texto: string; bloco?: Bloco };
export type PropsMia = { e: Estado; mensagens: Mensagem[]; perguntar: (texto: string) => boolean };

const m = t.mia;

function BlocoMia({ bloco, e }: { bloco: Bloco; e: Estado }) {
  if (bloco === "ajuda") {
    return (
      <ul className="flex flex-col gap-1 text-sm">
        {m.comandos.map((c) => (
          <li key={c.cmd}>
            <code className="rounded bg-bg px-1.5 py-0.5 font-mono text-xs text-accent-text">{c.cmd}</code> <span className="text-fg-muted">{c.desc}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (bloco === "grafico") {
    const maior = Math.max(...SPEND.categorias.map((c) => c.centavos));
    return (
      <ul className="flex flex-col gap-3">
        {SPEND.categorias.map((c) => (
          <Barra key={c.nome} nome={c.nome} valor={reais(c.centavos)} fracao={c.centavos / maior} />
        ))}
      </ul>
    );
  }
  if (bloco === "rcs") {
    if (!e.rc) return null;
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold text-fg">{codigoRc()}</span>
        <Selo tom={TOM_URGENCIA[e.rc.urgencia]}>{e.rc.urgencia}</Selo>
        <span className="text-fg-muted">
          {e.rc.itens.map((l) => `${l.qtd} × ${itemDoCatalogo(l.item)!.nome}`).join(" · ")} · {reais(estimadoCentavos(e.rc))}
        </span>
      </div>
    );
  }
  if (bloco === "cotacoes" || bloco === "atrasadas") {
    return (
      <ul className="flex flex-col gap-1.5 text-sm">
        {[...SEMENTES]
          .filter((s) => s.ate !== "oc" && (bloco === "cotacoes" || s.diasAberto > 10))
          .sort((a, b) => b.diasAberto - a.diasAberto)
          .slice(0, 4)
          .map((s) => (
            <li key={s.numero} className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-fg">{codigoRfq(s.numero)}</span>
              <Selo tom={TOM_URGENCIA[s.urgencia]}>{s.urgencia}</Selo>
              <span className="text-fg-muted">
                {itemDoCatalogo(s.itens[0].item)!.nome} · {t.cotacoes.diasAberto(s.diasAberto)}
              </span>
            </li>
          ))}
      </ul>
    );
  }
  if (bloco === "fornecedores") {
    return (
      <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-fg">
        {FORNECEDORES.map((f) => (
          <li key={f.id}>{f.nome}</li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="flex flex-col gap-1 text-sm">
      {ALCADAS.map((a) => (
        <li key={a.aprovador} className="flex flex-wrap gap-x-2">
          <span className="text-fg-muted">{a.faixa}:</span>
          <span className="font-medium text-fg">{a.aprovador}</span>
        </li>
      ))}
    </ul>
  );
}

/** A conversa: mensagens, atalhos e o campo. Usada na tela inicial e no painel flutuante. */
export function ChatMia({ e, mensagens, perguntar, compacto = false }: PropsMia & { compacto?: boolean }) {
  const [texto, setTexto] = useState("");
  const fim = useRef<HTMLDivElement>(null);
  const primeira = useRef(true);
  useEffect(() => {
    /* Não rola a página ao abrir; só quando chega resposta nova. */
    if (primeira.current) primeira.current = false;
    else fim.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [mensagens.length]);

  const enviar = (ev: FormEvent) => {
    ev.preventDefault();
    if (texto.trim() === "") return;
    perguntar(texto.trim());
    setTexto("");
  };
  const sugestoes = texto.startsWith("/") ? m.comandos.filter((c) => c.cmd.startsWith(texto.trim().split(" ")[0])) : [];
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className={`flex flex-col gap-3 ${compacto ? "min-h-0 flex-1 overflow-y-auto pr-1" : ""}`} role="log" aria-live="polite" aria-label={m.nome}>
        <Fala de="mia" texto={m.fala} />
        {mensagens.map((msg, i) => (
          <Fala key={i} de={msg.de} texto={msg.texto}>
            {msg.bloco ? <BlocoMia bloco={msg.bloco} e={e} /> : null}
          </Fala>
        ))}
        <div ref={fim} />
      </div>
      <div className="flex flex-wrap gap-2">
        {m.atalhos.map((a) => (
          <button key={a} type="button" onClick={() => perguntar(a)} className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-medium text-accent-text hover:border-line-strong">
            {a}
          </button>
        ))}
      </div>
      {sugestoes.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {sugestoes.map((c) => (
            <li key={c.cmd}>
              <button type="button" onClick={() => setTexto(c.cmd)} className="rounded bg-bg px-2 py-1 font-mono text-xs text-accent-text hover:bg-[#dfe6ff]">
                {c.cmd}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <form onSubmit={enviar} className="flex items-center gap-2 rounded-xl border border-line bg-surface p-1.5 focus-within:border-accent">
        <input value={texto} onChange={(ev) => setTexto(ev.target.value)} placeholder={m.campo} aria-label={m.campo} maxLength={200} autoComplete="off" className="min-w-0 flex-1 bg-transparent px-2.5 py-2 text-sm text-fg outline-none" />
        <button type="submit" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-text text-white hover:opacity-90" aria-label={m.enviar}>
          <PaperPlaneRight size={16} weight="fill" aria-hidden="true" />
        </button>
      </form>
      <p className="text-xs text-fg-muted">{m.rodape}</p>
    </div>
  );
}

function Fala({ de, texto, children }: { de: "voce" | "mia"; texto: string; children?: React.ReactNode }) {
  if (de === "voce") {
    return (
      <p className="max-w-[85%] self-end rounded-xl bg-accent px-4 py-2.5 text-sm text-white">
        <span className="sr-only">{m.voce}: </span>
        {texto}
      </p>
    );
  }
  return (
    <div className="flex max-w-[92%] items-start gap-2.5">
      <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-text text-white" aria-hidden="true">
        <Sparkle size={14} weight="fill" />
      </span>
      <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-line bg-surface px-4 py-3">
        <p className="text-sm leading-relaxed text-fg">
          <span className="sr-only">{m.nome}: </span>
          {texto}
        </p>
        {children}
      </div>
    </div>
  );
}

export function TelaMia({ nome, ...mia }: Pick<PropsTela, "nome"> & PropsMia) {
  return (
    <>
      <header className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-text text-white">
          <Sparkle size={22} weight="fill" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.01em] text-fg">{m.ola(nome)}</h1>
          <p className="text-sm text-fg-muted">{m.sub}</p>
        </div>
      </header>
      <div className="max-w-[76ch]">
        <ChatMia {...mia} />
      </div>
    </>
  );
}

/** O botão roxo que acompanha as telas e o painel que ele abre. */
export function MiaFlutuante(mia: PropsMia) {
  const [aberta, setAberta] = useState(false);
  return (
    <>
      {aberta ? (
        <section aria-label={m.nome} className={`${cartao} fixed bottom-24 right-4 z-40 flex h-[min(560px,calc(100dvh-8rem))] w-[min(400px,calc(100vw-2rem))] flex-col gap-3 !p-4 shadow-[0_18px_50px_rgb(19_23_35/0.22)]`}>
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-fg">
              <Sparkle size={16} weight="fill" className="text-accent-text" aria-hidden="true" />
              {m.nome}
            </h2>
            <button type="button" onClick={() => setAberta(false)} className="rounded-lg p-1.5 text-fg-muted hover:bg-bg" aria-label={t.app.miaFechar}>
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          <ChatMia {...mia} perguntar={(texto) => {
            const levou = mia.perguntar(texto);
            if (levou) setAberta(false);
            return levou;
          }} compacto />
        </section>
      ) : null}
      <button
        type="button"
        onClick={() => setAberta(!aberta)}
        aria-expanded={aberta}
        aria-label={aberta ? t.app.miaFechar : t.app.miaAbrir}
        className="fixed bottom-6 right-4 z-40 flex size-13 items-center justify-center rounded-full bg-accent-text text-white shadow-[0_10px_30px_rgb(91_33_230/0.45)] transition-transform hover:scale-105 active:scale-95"
      >
        <Sparkle size={24} weight="fill" aria-hidden="true" />
      </button>
    </>
  );
}
