"use client";
import { useActionState, useState } from "react";
import { assinarAction } from "@/app/app/assinar/actions";
import { plataforma } from "@/lib/content-plataforma";

const ESTADO_INICIAL: { erro: string | null } = { erro: null };

export function FormAssinar() {
  const t = plataforma.assinar;
  const [cpf, setCpf] = useState("");
  const [estado, acao, enviando] = useActionState(assinarAction, ESTADO_INICIAL);

  // text-base (16px): abaixo disso o iOS dá zoom automático ao focar o campo.
  const campo =
    "w-full border border-line bg-surface px-4 py-3 text-base text-fg placeholder:text-fg-subtle focus-visible:outline-2 focus-visible:outline-accent-text";

  return (
    <form action={acao} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {t.cpf}
        <input
          type="text"
          name="cpf"
          required
          inputMode="numeric"
          autoComplete="off"
          placeholder="000.000.000-00"
          value={cpf}
          onChange={(e) => setCpf(e.target.value)}
          className={campo}
        />
      </label>
      <p className="text-sm text-fg-muted">{t.cpfAjuda}</p>
      {estado?.erro ? (
        <p role="alert" className="text-sm text-fg">
          {estado.erro}
        </p>
      ) : null}
      <button
        disabled={enviando}
        className="rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        {t.botao}
      </button>
    </form>
  );
}
