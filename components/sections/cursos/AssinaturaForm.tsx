"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { cursos } from "@/lib/content";

/**
 * Formulário da assinatura da Solution (2026-10-14). Manda nome, e-mail, CPF,
 * celular, a autorização da cobrança e a ciência do compartilhamento; o servidor decide o valor (R$ 49,90) e devolve a
 * URL da primeira fatura no Asaas, para onde a pessoa vai em seguida.
 *
 * O erro volta como um `motivo` só (o primeiro campo que falhou); a mensagem
 * aparece junto do botão, num `role="alert"` que o leitor de tela anuncia.
 */
const t = cursos.assinatura.formulario;

export function AssinaturaForm() {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setEnviando(true);
    setErro(null);
    try {
      const r = await fetch("/cursos/assinar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: f.get("nome"),
          email: f.get("email"),
          cpf: f.get("cpf"),
          telefone: f.get("telefone"),
          consentimento: f.get("consentimento") === "on",
          compartilhamento: f.get("compartilhamento") === "on",
        }),
      });
      const corpo = await r.json().catch(() => ({}));
      if (r.ok && corpo.url) {
        window.location.href = corpo.url;
        return;
      }
      setErro(t.erros[corpo.error] ?? t.erros.falha);
    } catch {
      setErro(t.erros.falha);
    }
    setEnviando(false);
  }

  const campo = "rounded-control border border-line bg-bg px-4 py-3 text-fg outline-none focus-visible:border-fg";
  const rotulo = "font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted";

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className={rotulo}>{t.nome}</span>
        <input name="nome" required autoComplete="name" className={campo} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={rotulo}>{t.email}</span>
        <input name="email" type="email" required autoComplete="email" className={campo} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={rotulo}>{t.cpf}</span>{" "}
        <input name="cpf" required inputMode="numeric" autoComplete="off" className={campo} />{" "}
        {/* Os espaços entre os itens não mudam nada no flex, mas separam
            rótulo e nota na leitura em texto ("CPFPedido pelo Asaas…"). */}
        <span className="text-xs text-fg-muted">{t.cpfNota}</span>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={rotulo}>{t.telefone}</span>
        <input name="telefone" type="tel" required autoComplete="tel" className={campo} />
      </label>
      <label className="flex items-start gap-3 text-sm leading-relaxed text-fg-muted">
        <input name="consentimento" type="checkbox" required className="mt-1 size-4 shrink-0 accent-[var(--accent)]" />
        <span>{t.consentimento}</span>
      </label>
      <label className="flex items-start gap-3 text-sm leading-relaxed text-fg-muted">
        <input name="compartilhamento" type="checkbox" required className="mt-1 size-4 shrink-0 accent-[var(--accent)]" />
        <span>
          {t.compartilhamento}{" "}
          <Link href="/privacidade" className="text-fg underline" prefetch={false}>
            {t.privacidade}
          </Link>
        </span>
      </label>
      <button
        type="submit"
        disabled={enviando}
        className="mt-2 rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-colors hover:bg-accent-hover disabled:opacity-60"
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
