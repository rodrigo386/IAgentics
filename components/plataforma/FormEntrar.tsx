"use client";
import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { entrarAction } from "@/app/app/entrar/actions";
import { plataforma } from "@/lib/content-plataforma";
import { FormReenviarConfirmacao } from "@/components/plataforma/FormReenviarConfirmacao";

const ESTADO_INICIAL: { erro: string | null; naoConfirmado?: boolean; email?: string | null } = { erro: null };

export function FormEntrar() {
  const t = plataforma.entrar;
  const busca = useSearchParams();
  const voltar = busca.get("voltar") ?? "/app";
  const sessaoExpirada = busca.get("sessao") === "expirada";
  const confirmado = busca.get("confirmado") === "1";
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [estado, acao, enviando] = useActionState(entrarAction, ESTADO_INICIAL);

  // text-base (16px): abaixo disso o iOS dá zoom automático ao focar o campo.
  const campo = "w-full border border-line bg-surface px-4 py-3 text-base text-fg placeholder:text-fg-subtle focus-visible:outline-2 focus-visible:outline-accent-text";

  return (
    <form action={acao} className="flex flex-col gap-4">
      {confirmado ? (
        <p role="status" className="border border-line bg-surface px-4 py-3 text-sm text-accent-text">
          {plataforma.confirmacao.confirmadoAviso}
        </p>
      ) : null}
      {sessaoExpirada ? (
        <p className="border border-line bg-surface px-4 py-3 text-sm text-fg-muted">{t.sessaoExpirada}</p>
      ) : null}
      <input type="hidden" name="voltar" value={voltar} />
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {t.email}
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={campo}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {t.senha}
        <input
          type="password"
          name="senha"
          required
          autoComplete="current-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className={campo}
        />
      </label>
      {estado?.naoConfirmado ? (
        <div className="flex flex-col gap-4">
          <p role="alert" className="text-sm text-fg">{t.naoConfirmado}</p>
          <FormReenviarConfirmacao emailInicial={estado.email ?? email} />
        </div>
      ) : estado?.erro ? (
        <p role="alert" className="text-sm text-fg">{estado.erro}</p>
      ) : null}
      <button disabled={enviando} className="rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-colors hover:bg-accent-hover disabled:opacity-60">
        {t.botao}
      </button>
      <a href="/app/recuperar-senha" className="text-sm text-fg-muted hover:text-fg">{t.esqueciSenha}</a>
    </form>
  );
}
