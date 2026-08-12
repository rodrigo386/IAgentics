"use client";
import { useState, type FormEvent } from "react";
import { salvarConfiguracoesAction } from "@/app/admin/configuracoes/actions";
import { admin } from "@/lib/content-admin";

const campo =
  "w-full border border-line bg-surface px-4 py-3 text-fg placeholder:text-fg-subtle focus-visible:outline-2 focus-visible:outline-accent-text";

/** Formulário único (padrão components/plataforma/FormConta.tsx): estado
 *  local por campo, submit chama a action direto e trata { ok } / { erro }
 *  — sem lib de toast nova, mesma mensagem "Salvo." de sempre. */
export function FormConfiguracoes({
  valoresIniciais,
}: {
  valoresIniciais: { cta_destino: string; aviso_topo: string; email_contato: string };
}) {
  const t = admin.configuracoes;

  const [ctaDestino, setCtaDestino] = useState(valoresIniciais.cta_destino);
  const [avisoTopo, setAvisoTopo] = useState(valoresIniciais.aviso_topo);
  const [emailContato, setEmailContato] = useState(valoresIniciais.email_contato);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  function limparMensagens() {
    setErro(null);
    setSalvo(false);
  }

  async function aoSalvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSalvando(true);
    limparMensagens();
    const r = await salvarConfiguracoesAction({ ctaDestino, avisoTopo, emailContato });
    setSalvando(false);
    if (r.ok) setSalvo(true);
    else setErro(r.erro);
  }

  return (
    <form onSubmit={aoSalvar} className="flex max-w-xl flex-col gap-5">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {t.campos.ctaDestino}
        <input
          type="text"
          name="ctaDestino"
          value={ctaDestino}
          onChange={(e) => {
            setCtaDestino(e.target.value);
            limparMensagens();
          }}
          className={campo}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {t.campos.avisoTopo}
        <input
          type="text"
          name="avisoTopo"
          value={avisoTopo}
          onChange={(e) => {
            setAvisoTopo(e.target.value);
            limparMensagens();
          }}
          className={campo}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {t.campos.emailContato}
        <input
          type="email"
          name="emailContato"
          value={emailContato}
          onChange={(e) => {
            setEmailContato(e.target.value);
            limparMensagens();
          }}
          className={campo}
        />
      </label>
      {erro ? (
        <p role="alert" className="text-sm text-fg">
          {erro}
        </p>
      ) : null}
      {salvo ? (
        <p role="status" className="text-sm text-accent-text">
          {t.salvo}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={salvando}
        className="w-fit rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        {t.salvar}
      </button>
    </form>
  );
}
