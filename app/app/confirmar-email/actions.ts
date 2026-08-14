"use server";
import { redirect } from "next/navigation";
import { plataforma } from "@/lib/content-plataforma";
import { reenviarConfirmacaoPorEmail } from "@/lib/plataforma/usuarios";

export async function reenviarConfirmacaoAction(
  _: unknown,
  formData: FormData,
): Promise<{ mensagem: string }> {
  const email = String(formData.get("email") ?? "");
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) await reenviarConfirmacaoPorEmail(email);
  return { mensagem: plataforma.confirmacao.reenviado }; // neutra, sempre
}

/** Reenvio disparado pelo PRÓPRIO form de login (botão com formAction) — evita
 *  aninhar um <form> de reenvio dentro do <form> de entrar (HTML inválido,
 *  React descarta o form interno). Sem estado de retorno: redireciona sempre
 *  para a tela de confirmação, que já mostra a mensagem neutra. */
export async function reenviarDoLoginAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "");
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) await reenviarConfirmacaoPorEmail(email);
  redirect(`/app/confirmar-email?para=${encodeURIComponent(email.trim().toLowerCase())}`);
}
