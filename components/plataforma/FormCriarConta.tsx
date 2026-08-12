"use client";
import { useActionState, useState } from "react";
import { criarContaAction } from "@/app/app/criar-conta/actions";
import { plataforma } from "@/lib/content-plataforma";

const ESTADO_INICIAL: { erro: string | null } = { erro: null };

export function FormCriarConta({ voltar }: { voltar: string }) {
  const t = plataforma.criarConta;
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [estado, acao, enviando] = useActionState(criarContaAction, ESTADO_INICIAL);

  const campo = "w-full border border-line bg-surface px-4 py-3 text-fg placeholder:text-fg-subtle focus-visible:outline-2 focus-visible:outline-accent-text";

  return (
    <form action={acao} className="flex flex-col gap-4">
      <input type="hidden" name="voltar" value={voltar} />
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {t.nome}
        <input
          type="text"
          name="nome"
          required
          minLength={2}
          autoComplete="name"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className={campo}
        />
      </label>
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
          minLength={8}
          autoComplete="new-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className={campo}
        />
      </label>
      {estado?.erro ? <p role="alert" className="text-sm text-fg">{estado.erro}</p> : null}
      <button disabled={enviando} className="rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-colors hover:bg-accent-hover disabled:opacity-60">
        {t.botao}
      </button>
    </form>
  );
}
