"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/admin/sessao";
import {
  alunoExiste,
  confirmarEmailManual,
  definirAtivo,
  definirRole,
  excluirAluno,
  liberarAcesso,
  revogarAcesso,
  type ResultadoAcao,
} from "@/lib/admin/alunos";
import { emitirToken } from "@/lib/plataforma/tokens";
import { urlBase } from "@/lib/plataforma/email";
import { admin } from "@/lib/content-admin";

type Estado = { erro: string | null; sucesso: string | null };
type EstadoLink = { erro: string | null; url: string | null };

/** Mapeia o `motivo` tipado de ResultadoAcao para o texto pt-BR do content —
 *  a UI nunca inventa mensagem própria, sempre reflete o que a função decidiu. */
function mensagemErro(motivo: Exclude<ResultadoAcao, { ok: true }>["motivo"]): string {
  const t = admin.alunos;
  switch (motivo) {
    case "auto":
      return t.mensagens.erroAuto;
    case "ja_tem_acesso":
      return t.mensagens.jaTemAcesso;
    case "ja_sem_acesso":
      return t.mensagens.jaSemAcesso;
    case "email_nao_confere":
      return t.acoes.emailNaoConfere;
    case "nao_encontrado":
    case "curso_publicado":
    default:
      return t.mensagens.erroGenerico;
  }
}

function revalidarAluno(alunoId: string) {
  revalidatePath("/admin/alunos");
  revalidatePath(`/admin/alunos/${alunoId}`);
}

export async function liberarAcessoAction(alunoId: string, _estado: Estado, _formData: FormData): Promise<Estado> {
  const executor = await exigirAdmin();
  const r = await liberarAcesso(executor.id, alunoId);
  if (!r.ok) return { erro: mensagemErro(r.motivo), sucesso: null };
  revalidarAluno(alunoId);
  return { erro: null, sucesso: admin.alunos.mensagens.acessoLiberado };
}

export async function revogarAcessoAction(alunoId: string, _estado: Estado, _formData: FormData): Promise<Estado> {
  const executor = await exigirAdmin();
  const r = await revogarAcesso(executor.id, alunoId);
  if (!r.ok) return { erro: mensagemErro(r.motivo), sucesso: null };
  revalidarAluno(alunoId);
  return { erro: null, sucesso: admin.alunos.mensagens.acessoRevogado };
}

export async function definirRoleAction(
  alunoId: string,
  role: "aluno" | "admin",
  _estado: Estado,
  _formData: FormData,
): Promise<Estado> {
  const executor = await exigirAdmin();
  const r = await definirRole(executor.id, alunoId, role);
  if (!r.ok) return { erro: mensagemErro(r.motivo), sucesso: null };
  revalidarAluno(alunoId);
  return { erro: null, sucesso: admin.alunos.mensagens.salvo };
}

export async function definirAtivoAction(
  alunoId: string,
  ativo: boolean,
  _estado: Estado,
  _formData: FormData,
): Promise<Estado> {
  const executor = await exigirAdmin();
  const r = await definirAtivo(executor.id, alunoId, ativo);
  if (!r.ok) return { erro: mensagemErro(r.motivo), sucesso: null };
  revalidarAluno(alunoId);
  return {
    erro: null,
    sucesso: ativo ? admin.alunos.mensagens.contaReativada : admin.alunos.mensagens.contaDesativada,
  };
}

export async function excluirAlunoAction(alunoId: string, _estado: Estado, formData: FormData): Promise<Estado> {
  const executor = await exigirAdmin();
  const email = String(formData.get("email") ?? "");
  const r = await excluirAluno(executor.id, alunoId, email);
  if (!r.ok) return { erro: mensagemErro(r.motivo), sucesso: null };
  revalidatePath("/admin/alunos");
  redirect("/admin/alunos?excluido=1"); // a conta some — não há mais /admin/alunos/[id] para revalidar
}

export async function confirmarEmailManualAction(alunoId: string, _estado: Estado, _formData: FormData): Promise<Estado> {
  const executor = await exigirAdmin();
  const r = await confirmarEmailManual(executor.id, alunoId);
  if (!r.ok) return { erro: mensagemErro(r.motivo), sucesso: null };
  revalidarAluno(alunoId);
  return { erro: null, sucesso: admin.alunos.mensagens.emailConfirmadoOk };
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
