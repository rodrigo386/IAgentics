"use server";
import { redirect } from "next/navigation";
import { plataforma } from "@/lib/content-plataforma";
import { redefinirSenhaComToken } from "@/lib/plataforma/usuarios";

export async function redefinirSenhaAction(
  token: string,
  _: unknown,
  formData: FormData,
): Promise<{ erro: string }> {
  const senha = String(formData.get("senha") ?? "");
  if (senha.length < 8) return { erro: plataforma.recuperarSenha.senhaCurta };
  const ok = await redefinirSenhaComToken(token, senha);
  if (!ok) redirect("/app/recuperar-senha?erro=1");
  redirect("/app/entrar?redefinida=1");
}
