"use client";
/**
 * Sobraram aqui só as duas ações que PRECISAM de estado no cliente: gerar
 * link de reset (a URL só pode trafegar na resposta da action, nunca em
 * querystring/log) e excluir conta (campo de confirmação por e-mail). As
 * ações rápidas (liberar/revogar, role, ativo, confirmar e-mail) migraram
 * para forms server-first em AcoesRapidas.tsx - ver o porquê lá (2026-08-15).
 */
import { useActionState } from "react";
import { excluirAlunoAction, gerarLinkResetAction } from "@/app/admin/alunos/[id]/actions";
import { admin } from "@/lib/content-admin";

type Estado = { erro: string | null; sucesso: string | null };
const ESTADO_INICIAL: Estado = { erro: null, sucesso: null };

type EstadoLink = { erro: string | null; url: string | null };
const ESTADO_LINK_INICIAL: EstadoLink = { erro: null, url: null };

/** Botão de gerar link de reset: sucesso não vira um texto de status como os
 *  outros — precisa mostrar a URL de verdade para o admin copiar e repassar
 *  ao aluno por outro canal (nunca o servidor loga isso, só a resposta desta
 *  action chega até aqui). */
export function BotaoGerarLink({ alunoId }: { alunoId: string }) {
  const t = admin.alunos.acoes;
  const [estado, dispatch, pendente] = useActionState(gerarLinkResetAction.bind(null, alunoId), ESTADO_LINK_INICIAL);
  return (
    <form action={dispatch} className="flex max-w-md flex-col gap-2">
      <button
        type="submit"
        disabled={pendente}
        className="rounded-control border border-line-strong px-5 py-2.5 text-sm font-medium transition-colors hover:border-fg disabled:opacity-60"
      >
        {t.gerarLinkReset}
      </button>
      {estado.erro ? (
        <p role="alert" className="text-sm text-fg">
          {estado.erro}
        </p>
      ) : null}
      {estado.url ? (
        <div className="flex flex-col gap-1.5">
          <code className="block select-all break-all border border-line bg-surface px-3 py-2 text-xs">{estado.url}</code>
          <p className="text-sm text-fg-muted">{t.linkResetAjuda}</p>
        </div>
      ) : null}
    </form>
  );
}

export function FormExcluir({ alunoId }: { alunoId: string }) {
  const t = admin.alunos.acoes;
  const [estado, dispatch, pendente] = useActionState(excluirAlunoAction.bind(null, alunoId), ESTADO_INICIAL);
  return (
    <form action={dispatch} className="mt-4 flex flex-col gap-3">
      <p className="text-sm text-fg-muted">{t.confirmarExclusaoTexto}</p>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {t.campoEmailConfirmacao}
        <input
          type="email"
          name="email"
          required
          className="w-full max-w-sm border border-line bg-surface px-4 py-2.5 text-base text-fg placeholder:text-fg-subtle focus-visible:outline-2 focus-visible:outline-accent-text"
        />
      </label>
      {estado.erro ? (
        <p role="alert" className="text-sm text-fg">
          {estado.erro}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pendente}
        className="w-fit rounded-control border border-line-strong px-5 py-2.5 text-sm font-medium transition-colors hover:border-fg disabled:opacity-60"
      >
        {t.botaoConfirmarExclusao}
      </button>
    </form>
  );
}
