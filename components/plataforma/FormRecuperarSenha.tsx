"use client";
import { useActionState } from "react";
import { pedirResetAction } from "@/app/app/recuperar-senha/actions";
import { plataforma } from "@/lib/content-plataforma";

// text-base (16px): abaixo disso o iOS dá zoom automático ao focar o campo.
const campo = "w-full border border-line bg-surface px-4 py-3 text-base text-fg placeholder:text-fg-subtle focus-visible:outline-2 focus-visible:outline-accent-text";

export function FormRecuperarSenha() {
  const t = plataforma.recuperarSenha;
  const [estado, acao, enviando] = useActionState(pedirResetAction, null as { mensagem: string } | null);
  return (
    <form action={acao} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        E-mail
        <input type="email" name="email" required autoComplete="email" className={campo} />
      </label>
      {estado ? <p role="status" className="text-sm text-accent-text">{estado.mensagem}</p> : null}
      <button disabled={enviando} className="rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-colors hover:bg-accent-hover disabled:opacity-60">
        {t.botao}
      </button>
    </form>
  );
}
