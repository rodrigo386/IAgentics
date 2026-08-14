"use client";
import { useActionState } from "react";
import { reenviarConfirmacaoAction } from "@/app/app/confirmar-email/actions";
import { plataforma } from "@/lib/content-plataforma";

// text-base (16px): abaixo disso o iOS dá zoom automático ao focar o campo.
const campo = "w-full border border-line bg-surface px-4 py-3 text-base text-fg placeholder:text-fg-subtle focus-visible:outline-2 focus-visible:outline-accent-text";

export function FormReenviarConfirmacao({ emailInicial }: { emailInicial: string }) {
  const t = plataforma.confirmacao;
  const [estado, acao, enviando] = useActionState(reenviarConfirmacaoAction, null as { mensagem: string } | null);
  return (
    <form action={acao} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {plataforma.entrar.email}
        <input type="email" name="email" required defaultValue={emailInicial} autoComplete="email" className={campo} />
      </label>
      {estado ? <p role="status" className="text-sm text-accent-text">{estado.mensagem}</p> : null}
      <button disabled={enviando} className="rounded-control border border-line-strong px-6 py-3 font-medium transition-colors hover:border-fg disabled:opacity-60">
        {t.reenviar}
      </button>
    </form>
  );
}
