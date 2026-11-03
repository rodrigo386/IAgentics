"use client";

import { useState, type FormEvent } from "react";
import { bolsas } from "@/lib/content";

/** O link do vídeo de entrada (2026-11-03). Vale o último enviado até o prazo. */
const t = bolsas.video;

export function VideoForm({ token, atual, aberto }: { token: string; atual: string | null; aberto: boolean }) {
  const [enviado, setEnviado] = useState(atual);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const url = new FormData(e.currentTarget).get("url");
    setEnviando(true);
    setErro(null);
    setOk(false);
    try {
      const r = await fetch("/api/bolsas/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, url }),
      });
      const corpo = await r.json().catch(() => ({}));
      if (r.ok) {
        setEnviado(corpo.url);
        setOk(true);
      } else setErro(t.erros[corpo.error] ?? t.erros.falha);
    } catch {
      setErro(t.erros.falha);
    }
    setEnviando(false);
  }

  return (
    <div className="flex flex-col gap-5">
      {enviado ? (
        <p className="break-all text-sm text-fg-muted">
          {t.atual}{" "}
          <a href={enviado} className="text-fg underline" target="_blank" rel="noopener noreferrer">
            {enviado}
          </a>
        </p>
      ) : null}
      {ok ? (
        <p role="status" className="font-medium text-fg">
          {t.ok}
        </p>
      ) : null}
      {aberto ? (
        <form onSubmit={enviar} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">{t.rotulo}</span>
            <input
              name="url"
              type="url"
              required
              placeholder="https://"
              className="rounded-control border border-line bg-bg px-4 py-3 text-fg outline-none focus-visible:border-fg"
            />
          </label>
          <button
            type="submit"
            disabled={enviando}
            className="rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {enviando ? t.enviando : enviado ? t.trocar : t.botao}
          </button>
          {erro ? (
            <p role="alert" className="text-sm text-fg">
              {erro}
            </p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
