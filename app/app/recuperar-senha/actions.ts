"use server";
import { plataforma } from "@/lib/content-plataforma";
import { pedirResetPorEmail } from "@/lib/plataforma/usuarios";

export async function pedirResetAction(_: unknown, formData: FormData): Promise<{ mensagem: string }> {
  const email = String(formData.get("email") ?? "");
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) await pedirResetPorEmail(email);
  return { mensagem: plataforma.recuperarSenha.enviado };
}
