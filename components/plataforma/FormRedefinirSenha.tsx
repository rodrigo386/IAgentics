"use client";
import { useActionState } from "react";
import { redefinirSenhaAction } from "@/app/app/redefinir-senha/[token]/actions";
import { plataforma } from "@/lib/content-plataforma";

// text-base (16px): abaixo disso o iOS dá zoom automático ao focar o campo.
const campo = "w-full border border-line bg-surface px-4 py-3 text-base text-fg placeholder:text-fg-subtle focus-visible:outline-2 focus-visible:outline-accent-text";

export function FormRedefinirSenha({ token }: { token: string }) {
  const t = plataforma.recuperarSenha;
  const acaoComToken = redefinirSenhaAction.bind(null, token);
  const [estado, acao, enviando] = useActionState(acaoComToken, { erro: "" });
  return (
    <form action={acao} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {t.novaSenha}
        <input type="password" name="senha" required minLength={8} autoComplete="new-password" className={campo} />
      </label>
      {estado.erro ? <p role="alert" className="text-sm text-fg">{estado.erro}</p> : null}
      <button disabled={enviando} className="rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-colors hover:bg-accent-hover disabled:opacity-60">
        {t.botaoSalvar}
      </button>
    </form>
  );
}
