"use server";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { plataforma } from "@/lib/content-plataforma";

export async function entrarAction(_: unknown, formData: FormData):
  Promise<{ erro: string } | never> {
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      senha: String(formData.get("senha") ?? ""),
      redirectTo: String(formData.get("voltar") || "/app"),
    });
    return undefined as never; // signIn redireciona (lança NEXT_REDIRECT)
  } catch (e) {
    if (e instanceof AuthError) return { erro: plataforma.entrar.erroCredenciais };
    throw e; // NEXT_REDIRECT e afins seguem o fluxo
  }
}
