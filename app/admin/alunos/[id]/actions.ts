"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/admin/sessao";
import { alunoExiste, excluirAluno } from "@/lib/admin/alunos";
import { emitirToken } from "@/lib/plataforma/tokens";
import { urlBase } from "@/lib/plataforma/email";
import { admin } from "@/lib/content-admin";
import { mensagemErro } from "@/lib/admin/mensagens-aluno";

type Estado = { erro: string | null; sucesso: string | null };
type EstadoLink = { erro: string | null; url: string | null };

function revalidarAluno(alunoId: string) {
  revalidatePath("/admin/alunos");
  revalidatePath(`/admin/alunos/${alunoId}`);
}

export async function excluirAlunoAction(alunoId: string, _estado: Estado, formData: FormData): Promise<Estado> {
  const executor = await exigirAdmin();
  const email = String(formData.get("email") ?? "");
  const r = await excluirAluno(executor.id, alunoId, email);
  if (!r.ok) return { erro: mensagemErro(r.motivo), sucesso: null };
  revalidatePath("/admin/alunos");
  redirect("/admin/alunos?excluido=1"); // a conta some — não há mais /admin/alunos/[id] para revalidar
}

/** Gera um link de reset de uso único para o admin repassar por outro canal.
 *  Nunca loga o segredo nem a URL — só trafega no retorno da action, direto
 *  para a tela. Nada muda na ficha do aluno (o token não aparece em lugar
 *  nenhum da página), então não há revalidatePath aqui.
 *
 *  Checa existência ANTES de emitirToken: a ficha pode ficar aberta em outra
 *  aba depois de uma exclusão (a mesma tela tem "Excluir conta") — sem essa
 *  guarda, o INSERT em auth_tokens estouraria a FK (23503) sem tratamento,
 *  em vez de cair no {erro,url} do padrão local, como todas as outras ações
 *  desta tela já fazem para "não encontrado". */
export async function gerarLinkResetAction(alunoId: string, _estado: EstadoLink, _formData: FormData): Promise<EstadoLink> {
  await exigirAdmin();
  if (!(await alunoExiste(alunoId))) return { erro: admin.alunos.mensagens.erroGenerico, url: null };
  const r = await emitirToken(alunoId, "reset");
  if (!r.ok) return { erro: admin.alunos.mensagens.aguardeReenvio, url: null };
  return { erro: null, url: `${urlBase()}/app/redefinir-senha/${r.segredo}` };
}
