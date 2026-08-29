"use client";
import { useState } from "react";
import Link from "next/link";
import { cursos as t } from "@/lib/content";

/**
 * Formulário da lista de espera do lançamento na Solution.
 *
 * Cliente porque tem estado de envio e mensagem de erro por campo. Envia para
 * /api/lista-espera, que revalida tudo — inclusive o consentimento. O checkbox
 * aqui é conveniência do visitante, não a garantia: o servidor é quem decide.
 *
 * O consentimento é CHECKBOX, não um aviso em letra miúda abaixo do botão. A
 * lista vai ser compartilhada com o Pecege, e consentimento para repassar dado
 * pessoal a terceiro pede ação afirmativa e específica — clicar em "enviar"
 * não é consentir com o compartilhamento, é querer entrar na lista. Custa
 * conversão; é o preço de estar correto.
 */
export function ListaEspera() {
  const s = t.listaEspera;
  const [estado, setEstado] = useState<"parado" | "enviando" | "pronto">("parado");
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const form = new FormData(evento.currentTarget);
    const corpo = {
      nome: String(form.get("nome") ?? ""),
      email: String(form.get("email") ?? ""),
      consentimento: form.get("consentimento") === "on",
    };

    setErro(null);
    setEstado("enviando");
    try {
      const resposta = await fetch("/api/lista-espera", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      if (resposta.ok) {
        setEstado("pronto");
        return;
      }
      const { error } = await resposta.json().catch(() => ({ error: null }));
      setErro(
        error === "nome" ? s.erroNome
        : error === "email" ? s.erroEmail
        : error === "consentimento" ? s.erroConsentimento
        : s.erroGeral,
      );
    } catch {
      setErro(s.erroGeral);
    }
    setEstado("parado");
  }

  if (estado === "pronto") {
    return (
      <div role="status" className="mt-10 border border-line bg-surface p-6">
        <p className="text-lg font-medium text-fg">{s.sucessoTitulo}</p>
        <p className="mt-2 max-w-[46ch] text-fg-muted">{s.sucessoTexto}</p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="mt-10 flex max-w-[26rem] flex-col gap-4">
      <p className="text-lg font-medium text-fg">{s.titulo}</p>
      <p className="max-w-[42ch] text-fg-muted">{s.lead}</p>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">{s.nome}</span>
        <input
          name="nome"
          type="text"
          required
          autoComplete="name"
          className="rounded-control border border-line bg-bg px-4 py-3 text-fg outline-none focus-visible:border-fg"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">{s.email}</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-control border border-line bg-bg px-4 py-3 text-fg outline-none focus-visible:border-fg"
        />
      </label>

      <label className="flex items-start gap-3 text-sm text-fg-muted">
        <input name="consentimento" type="checkbox" required className="mt-1 size-4 shrink-0 accent-accent" />
        <span>{s.consentimento}</span>
      </label>

      {erro ? (
        <p role="alert" className="text-sm text-accent-text">
          {erro}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={estado === "enviando"}
        className="rounded-control bg-accent px-8 py-4 font-medium text-accent-on transition-colors hover:bg-accent-hover active:translate-y-px disabled:opacity-60"
      >
        {estado === "enviando" ? s.enviando : s.botao}
      </button>

      <Link href="/privacidade" className="text-sm text-fg-muted underline-offset-4 hover:underline">
        {s.privacidade}
      </Link>
    </form>
  );
}
