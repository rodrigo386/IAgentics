import { admin } from "@/lib/content-admin";
import { BotaoGerarLink, FormExcluir } from "@/components/admin/AcoesAluno";

/**
 * As ações rápidas da ficha, como SERVER component com FORM HTML PURO: cada
 * botão posta em /admin/alunos/[id]/acoes (route handler) que responde 303
 * com ?msg=/?erro=; a mensagem renderiza aqui mesmo, vinda do servidor.
 *
 * Nada de server action nesse caminho DE PROPÓSITO (2026-08-15): sob carga o
 * React 19 descartava a resposta da action de forma intermitente - POST 200,
 * banco gravado, botão preso em pending, e até o redirect da action se perdia
 * (viaja na mesma resposta descartada). Com form nativo é o NAVEGADOR que
 * posta e segue o 303 - não existe camada que possa perder o resultado.
 *
 * "Gerar link de reset" e "Excluir conta" continuam client (AcoesAluno.tsx):
 * o link de reset não pode passar por querystring (nunca é logado) e a
 * exclusão precisa do campo de confirmação por e-mail.
 *
 * Restrições "a si mesmo" são recusadas NA FUNÇÃO (lib/admin/alunos.ts),
 * nunca só escondidas aqui; esta UI só evita o clique inútil quando `souEu`.
 */
export function AcoesRapidas({
  alunoId,
  role,
  ativo,
  temAcesso,
  emailConfirmado,
  souEu,
  mensagem,
}: {
  alunoId: string;
  role: string;
  ativo: boolean;
  temAcesso: boolean;
  emailConfirmado: boolean;
  souEu: boolean;
  mensagem: { tipo: "sucesso" | "erro"; texto: string } | null;
}) {
  const t = admin.alunos.acoes;
  const botao = (destaque: boolean) =>
    destaque
      ? "rounded-control bg-accent px-5 py-2.5 text-sm font-medium text-accent-on transition-colors hover:bg-accent-hover"
      : "rounded-control border border-line-strong px-5 py-2.5 text-sm font-medium transition-colors hover:border-fg";

  return (
    <section className="flex flex-col gap-6 border border-line p-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{admin.alunos.detalhe.acoes}</p>

      {mensagem ? (
        <p
          role={mensagem.tipo === "erro" ? "alert" : "status"}
          className={`text-sm ${mensagem.tipo === "erro" ? "text-fg" : "text-accent-text"}`}
        >
          {mensagem.texto}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-4">
        <form method="post" action={`/admin/alunos/${alunoId}/acoes`}>
          <input type="hidden" name="acao" value={temAcesso ? "revogar" : "liberar"} />
          <button type="submit" className={botao(true)}>
            {temAcesso ? t.revogarAcesso : t.liberarAcesso}
          </button>
        </form>

        {!emailConfirmado ? (
          <form method="post" action={`/admin/alunos/${alunoId}/acoes`}>
            <input type="hidden" name="acao" value="confirmar-email" />
            <button type="submit" className={botao(false)}>
              {t.confirmarEmail}
            </button>
          </form>
        ) : null}

        <BotaoGerarLink alunoId={alunoId} />

        {!souEu ? (
          <>
            <form method="post" action={`/admin/alunos/${alunoId}/acoes`}>
              <input type="hidden" name="acao" value={role === "admin" ? "tornar-aluno" : "tornar-admin"} />
              <button type="submit" className={botao(false)}>
                {role === "admin" ? t.tornarAluno : t.tornarAdmin}
              </button>
            </form>
            <form method="post" action={`/admin/alunos/${alunoId}/acoes`}>
              <input type="hidden" name="acao" value={ativo ? "desativar" : "reativar"} />
              <button type="submit" className={botao(false)}>
                {ativo ? t.desativarConta : t.reativarConta}
              </button>
            </form>
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
