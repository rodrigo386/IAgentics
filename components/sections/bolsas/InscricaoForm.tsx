"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { bolsas } from "@/lib/content";

/**
 * Formulário do Desafio Prova Real (2026-11-03; refeito em 2026-11-18). O servidor valida tudo de
 * novo (lib/bolsas/regras.ts); aqui o navegador só ajuda com `required` e o
 * contador do problema. O erro volta como um `motivo` só e aparece junto do
 * botão, num `role="alert"`.
 */
const t = bolsas.formulario;
const MAX = 600;

const campo = "w-full rounded-control border border-line bg-bg px-4 py-3 text-fg outline-none focus-visible:border-fg";
const rotulo = "font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted";
const caixa = "flex items-start gap-3 text-sm leading-relaxed text-fg-muted";
const check = "mt-1 size-4 shrink-0 accent-[var(--accent)]";
/* A caixa do problema não é pílula: com cinco linhas, o raio dos campos a
   transformava numa oval. */

export function InscricaoForm() {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [problema, setProblema] = useState("");
  const [isca, setIsca] = useState("");

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setEnviando(true);
    setErro(null);
    try {
      const r = await fetch("/api/bolsas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: f.get("nome"),
          email: f.get("email"),
          whatsapp: f.get("whatsapp"),
          empresa: f.get("empresa"),
          instagram: f.get("instagram"),
          linkedin: f.get("linkedin"),
          problema,
          regulamento: f.get("regulamento") === "on",
          cienciaDados: f.get("cienciaDados") === "on",
          contatoComercial: f.get("contatoComercial") === "on",
          grupoWhatsapp: f.get("grupoWhatsapp") === "on",
          usoImagem: f.get("usoImagem") === "on",
          site: isca,
        }),
      });
      const corpo = await r.json().catch(() => ({}));
      if (r.ok) {
        setOk(true);
        return;
      }
      setErro(t.erros[corpo.error] ?? t.erros.falha);
    } catch {
      setErro(t.erros.falha);
    }
    setEnviando(false);
  }

  if (ok) {
    return (
      <div role="status" className="flex flex-col gap-3">
        <h3 className="text-2xl font-medium tracking-[-0.02em] text-fg">{t.ok.titulo}</h3>
        <p className="leading-relaxed text-fg-muted">{t.ok.texto}</p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className={rotulo}>{t.nome}</span>
        <input name="nome" required autoComplete="name" className={campo} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className={rotulo}>{t.email}</span>
          <input name="email" type="email" required autoComplete="email" className={campo} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={rotulo}>{t.whatsapp}</span>
          <input name="whatsapp" type="tel" required autoComplete="tel" className={campo} />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className={rotulo}>{t.empresa}</span>
        <input name="empresa" required autoComplete="organization" className={campo} />
      </label>
      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">{t.perfisNota}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={rotulo}>{t.instagram}</span>
            <input name="instagram" placeholder="@seuperfil" autoComplete="off" className={campo} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={rotulo}>{t.linkedin}</span>
            <input name="linkedin" placeholder="linkedin.com/in/seuperfil" autoComplete="off" className={campo} />
          </label>
        </div>
        <p className="text-xs text-fg-muted" aria-hidden="true">
          {t.perfisNota}
        </p>
      </fieldset>
      <label className="flex flex-col gap-1.5">
        <span className="text-base font-medium text-fg">{t.problema}</span>{" "}
        <span className="text-sm text-fg-muted">{t.problemaNota}</span>{" "}
        <textarea
          name="problema"
          required
          rows={5}
          minLength={20}
          maxLength={MAX}
          value={problema}
          onChange={(e) => setProblema(e.target.value)}
          className={`${campo.replace("rounded-control", "rounded-[1.25rem]")} mt-1 resize-y`}
        />
      </label>
      <p className="-mt-2 text-right font-mono text-xs tabular-nums text-fg-muted" aria-live="polite">
        {problema.length}/{MAX}
      </p>
      {/* Isca para robôs: fora da tela e da ordem de tabulação. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Site
          <input name="site" tabIndex={-1} autoComplete="off" value={isca} onChange={(e) => setIsca(e.target.value)} />
        </label>
      </div>
      <label className={caixa}>
        <input name="regulamento" type="checkbox" required className={check} />
        <span>
          {t.regulamento}{" "}
          <Link href="/bolsas/regulamento" className="text-fg underline" prefetch={false} target="_blank">
            {t.regulamentoLink}
          </Link>
          .
        </span>
      </label>
      <label className={caixa}>
        <input name="cienciaDados" type="checkbox" required className={check} />
        <span>
          {t.cienciaDados}{" "}
          <Link href="/privacidade" className="text-fg underline" prefetch={false} target="_blank">
            {t.privacidade}
          </Link>
          .
        </span>
      </label>
      <label className={caixa}>
        <input name="contatoComercial" type="checkbox" className={check} />
        <span>{t.contatoComercial}</span>
      </label>
      <label className={caixa}>
        <input name="grupoWhatsapp" type="checkbox" className={check} />
        <span>{t.grupoWhatsapp}</span>
      </label>
      <label className={caixa}>
        <input name="usoImagem" type="checkbox" className={check} />
        <span>{t.usoImagem}</span>
      </label>
      <button
        type="submit"
        disabled={enviando}
        className="mt-2 rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-colors hover:bg-accent-hover active:scale-[0.98] disabled:opacity-60"
      >
        {enviando ? t.enviando : t.botao}
      </button>
      {erro ? (
        <p role="alert" className="text-sm text-fg">
          {erro}
        </p>
      ) : null}
    </form>
  );
}
