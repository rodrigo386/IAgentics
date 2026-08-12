"use client";
import { useActionState } from "react";
import {
  definirAtivoAction,
  definirRoleAction,
  excluirAlunoAction,
  liberarAcessoAction,
  revogarAcessoAction,
} from "@/app/admin/alunos/[id]/actions";
import { admin } from "@/lib/content-admin";

type Estado = { erro: string | null; sucesso: string | null };
const ESTADO_INICIAL: Estado = { erro: null, sucesso: null };

function BotaoAcao({
  acao,
  rotulo,
  destaque = false,
}: {
  acao: (estado: Estado, formData: FormData) => Promise<Estado>;
  rotulo: string;
  destaque?: boolean;
}) {
  const [estado, dispatch, pendente] = useActionState(acao, ESTADO_INICIAL);
  return (
    <form action={dispatch} className="flex flex-col gap-2">
      <button
        type="submit"
        disabled={pendente}
        className={
          destaque
            ? "rounded-control bg-accent px-5 py-2.5 text-sm font-medium text-accent-on transition-colors hover:bg-accent-hover disabled:opacity-60"
            : "rounded-control border border-line-strong px-5 py-2.5 text-sm font-medium transition-colors hover:border-fg disabled:opacity-60"
        }
      >
        {rotulo}
      </button>
      {estado.erro ? (
        <p role="alert" className="text-sm text-fg">
          {estado.erro}
        </p>
      ) : null}
      {estado.sucesso ? (
        <p role="status" className="text-sm text-accent-text">
          {estado.sucesso}
        </p>
      ) : null}
    </form>
  );
}

function FormExcluir({ alunoId }: { alunoId: string }) {
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
          className="w-full max-w-sm border border-line bg-surface px-4 py-2.5 text-fg placeholder:text-fg-subtle focus-visible:outline-2 focus-visible:outline-accent-text"
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

/**
 * As cinco ações do aluno. Liberar/revogar acesso NÃO tem restrição de "a si
 * mesmo" (o admin pode se auto-liberar acesso pago para testar a área paga
 * como aluno) — as outras três (promover/rebaixar, ativar/desativar, excluir)
 * são recusadas NA FUNÇÃO de lib/admin/alunos.ts, nunca só escondidas aqui;
 * esta UI só evita o clique inútil trocando os botões por uma nota quando
 * `souEu` é true.
 */
export function AcoesAluno({
  alunoId,
  role,
  ativo,
  temAcesso,
  souEu,
}: {
  alunoId: string;
  role: string;
  ativo: boolean;
  temAcesso: boolean;
  souEu: boolean;
}) {
  const t = admin.alunos.acoes;

  return (
    <section className="flex flex-col gap-6 border border-line p-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{admin.alunos.detalhe.acoes}</p>

      <div className="flex flex-wrap gap-4">
        <BotaoAcao
          acao={temAcesso ? revogarAcessoAction.bind(null, alunoId) : liberarAcessoAction.bind(null, alunoId)}
          rotulo={temAcesso ? t.revogarAcesso : t.liberarAcesso}
          destaque
        />

        {!souEu ? (
          <>
            <BotaoAcao
              acao={definirRoleAction.bind(null, alunoId, role === "admin" ? "aluno" : "admin")}
              rotulo={role === "admin" ? t.tornarAluno : t.tornarAdmin}
            />
            <BotaoAcao
              acao={definirAtivoAction.bind(null, alunoId, !ativo)}
              rotulo={ativo ? t.desativarConta : t.reativarConta}
            />
          </>
        ) : null}
      </div>

      {souEu ? <p className="text-sm text-fg-muted">{admin.alunos.mensagens.erroAuto}</p> : null}

      {!souEu ? (
        <details className="border-t border-line pt-6">
          <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">
            {t.excluirConta}
          </summary>
          <FormExcluir alunoId={alunoId} />
        </details>
      ) : null}
    </section>
  );
}
