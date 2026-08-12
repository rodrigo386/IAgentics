"use client";
import { useState, type FormEvent } from "react";
import { salvarNome, trocarSenha } from "@/app/app/conta/actions";
import { plataforma } from "@/lib/content-plataforma";

const campo = "w-full border border-line bg-surface px-4 py-3 text-fg placeholder:text-fg-subtle focus-visible:outline-2 focus-visible:outline-accent-text";

/** Dois formulários independentes (nome, senha) — cada um com sua própria
 *  server action e mensagem de sucesso, sem lib de toast nova. */
export function FormConta({ nomeInicial }: { nomeInicial: string }) {
  const t = plataforma.conta;

  const [nome, setNome] = useState(nomeInicial);
  const [salvandoNome, setSalvandoNome] = useState(false);
  const [nomeSalvo, setNomeSalvo] = useState(false);

  const [novaSenha, setNovaSenha] = useState("");
  const [trocandoSenha, setTrocandoSenha] = useState(false);
  const [senhaTrocada, setSenhaTrocada] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [erroSenha, setErroSenha] = useState<string | null>(null);

  async function aoSalvarNome(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSalvandoNome(true);
    setNomeSalvo(false);
    const r = await salvarNome(nome);
    setSalvandoNome(false);
    if (r.ok) setNomeSalvo(true);
  }

  async function aoTrocarSenha(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTrocandoSenha(true);
    setSenhaTrocada(false);
    setErroSenha(null);
    const r = await trocarSenha(senhaAtual, novaSenha);
    setTrocandoSenha(false);
    if (r.ok) {
      setSenhaTrocada(true);
      setSenhaAtual("");
      setNovaSenha("");
    } else if (r.erro) {
      setErroSenha(r.erro);
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <form onSubmit={aoSalvarNome} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {t.nome}
          <input
            type="text"
            name="nome"
            required
            minLength={2}
            autoComplete="name"
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              setNomeSalvo(false);
            }}
            className={campo}
          />
        </label>
        {nomeSalvo ? (
          <p role="status" className="text-sm text-accent-text">
            {t.salvo}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={salvandoNome}
          className="rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {t.salvar}
        </button>
      </form>

      <form onSubmit={aoTrocarSenha} className="flex flex-col gap-4 border-t border-line pt-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.trocarSenha}</p>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {t.senhaAtual}
          <input
            type="password"
            name="senhaAtual"
            required
            autoComplete="current-password"
            value={senhaAtual}
            onChange={(e) => {
              setSenhaAtual(e.target.value);
              setSenhaTrocada(false);
              setErroSenha(null);
            }}
            className={campo}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {t.novaSenha}
          <input
            type="password"
            name="novaSenha"
            required
            minLength={8}
            autoComplete="new-password"
            value={novaSenha}
            onChange={(e) => {
              setNovaSenha(e.target.value);
              setSenhaTrocada(false);
            }}
            className={campo}
          />
        </label>
        {senhaTrocada ? (
          <p role="status" className="text-sm text-accent-text">
            {t.senhaTrocada}
          </p>
        ) : null}
        {erroSenha ? (
          <p role="alert" className="text-sm text-fg">
            {erroSenha}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={trocandoSenha}
          className="rounded-control border border-line-strong px-7 py-3.5 font-medium transition-colors hover:border-fg disabled:opacity-60"
        >
          {t.trocarSenha}
        </button>
      </form>
    </div>
  );
}
