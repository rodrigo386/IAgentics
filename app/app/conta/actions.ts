"use server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { contaAtiva } from "@/lib/plataforma/dados";
import { trocarSenhaVerificando } from "@/lib/plataforma/usuarios";
import { plataforma } from "@/lib/content-plataforma";

// Fix round final (I1): auth() só confirma o JWT, não que a conta segue
// ativa — desativar não derruba a sessão já aberta. contaAtiva consulta o
// banco a cada chamada (mesmo padrão de exigirAdmin/ehAdminAtivo) para que um
// aluno desativado não consiga mais escrever no próprio nome/senha.

export async function salvarNome(nome: string) {
  const sessao = await auth(); if (!sessao?.user?.id) return { ok: false };
  if (!(await contaAtiva(sessao.user.id))) return { ok: false };
  // Mesmo piso de criarUsuario (lib/plataforma/usuarios.ts): Server Actions são
  // endpoints POST invocáveis direto (header Next-Action), sem passar pelo
  // minLength do HTML — o piso real é aqui, o minLength é só UX de primeira linha.
  if (nome.trim().length < 2) return { ok: false };
  await db.update(users).set({ nome: nome.trim() }).where(eq(users.id, sessao.user.id));
  return { ok: true };
}
export async function trocarSenha(atual: string, nova: string): Promise<{ ok: boolean; erro?: string }> {
  const sessao = await auth();
  // Fix (Minor — review final): estes três retornos eram { ok: false } sem
  // erro — FormConta só exibe algo quando r.erro está presente, então o
  // aluno via o botão voltar ao normal e nenhuma explicação nenhuma. Mensagem
  // genérica porque a causa real (sessão caiu, conta foi desativada) não é
  // algo que o aluno resolve sozinho; "recarregue e tente de novo" cobre os
  // três casos sem vazar detalhe de autorização.
  if (!sessao?.user?.id) return { ok: false, erro: plataforma.conta.senhaTrocaFalhou };
  if (!(await contaAtiva(sessao.user.id))) return { ok: false, erro: plataforma.conta.senhaTrocaFalhou };
  if (nova.length < 8) return { ok: false, erro: plataforma.conta.senhaTrocaFalhou };
  const r = await trocarSenhaVerificando(sessao.user.id, atual, nova);
  if (!r.ok) return { ok: false, erro: plataforma.conta.senhaAtualErrada };
  return { ok: true };
}
