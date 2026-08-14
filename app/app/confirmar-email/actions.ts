"use server";
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
