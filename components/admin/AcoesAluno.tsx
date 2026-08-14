"use client";
import { useActionState } from "react";
import {
  confirmarEmailManualAction,
  definirAtivoAction,
  definirRoleAction,
  excluirAlunoAction,
  gerarLinkResetAction,
  liberarAcessoAction,
  revogarAcessoAction,
} from "@/app/admin/alunos/[id]/actions";
import { admin } from "@/lib/content-admin";

type Estado = { erro: string | null; sucesso: string | null };
const ESTADO_INICIAL: Estado = { erro: null, sucesso: null };

type EstadoLink = { erro: string | null; url: string | null };
const ESTADO_LINK_INICIAL: EstadoLink = { erro: null, url: null };

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

/** Botão de gerar link de reset: sucesso não vira um texto de status como os
 *  outros — precisa mostrar a URL de verdade para o admin copiar e repassar
 *  ao aluno por outro canal (nunca o servidor loga isso, só a resposta desta
 *  action chega até aqui). */
function BotaoGerarLink({ alunoId }: { alunoId: string }) {
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

/**
 * As ações do aluno. Liberar/revogar acesso, confirmar e-mail e gerar link de
 * reset NÃO têm restrição de "a si mesmo" (o admin pode se auto-liberar
 * acesso pago para testar a área paga como aluno, ou confirmar/resetar a
 * própria conta) — as outras três (promover/rebaixar, ativar/desativar,
 * excluir) são recusadas NA FUNÇÃO de lib/admin/alunos.ts, nunca só
 * escondidas aqui; esta UI só evita o clique inútil trocando os botões por
 * uma nota quando `souEu` é true.
 */
export function AcoesAluno({
  alunoId,
  role,
  ativo,
  temAcesso,
  emailConfirmado,
  souEu,
}: {
  alunoId: string;
  role: string;
  ativo: boolean;
  temAcesso: boolean;
  emailConfirmado: boolean;
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

        {!emailConfirmado ? (
          <BotaoAcao acao={confirmarEmailManualAction.bind(null, alunoId)} rotulo={t.confirmarEmail} />
        ) : null}

        <BotaoGerarLink alunoId={alunoId} />

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
