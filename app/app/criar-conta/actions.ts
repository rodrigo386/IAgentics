"use server";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { criarUsuario } from "@/lib/plataforma/usuarios";
import { plataforma } from "@/lib/content-plataforma";

export async function criarContaAction(_: unknown, formData: FormData):
  Promise<{ erro: string } | never> {
  const nome = String(formData.get("nome") ?? "");
  const email = String(formData.get("email") ?? "");
  const senha = String(formData.get("senha") ?? "");

  const resultado = await criarUsuario({ nome, email, senha });
  if (!resultado.ok) {
    return { erro: plataforma.criarConta.emailExiste };
  }

  try {
    await signIn("credentials", { email, senha, redirectTo: "/app" });
    return undefined as never; // signIn redireciona (lança NEXT_REDIRECT)
  } catch (e) {
    if (e instanceof AuthError) return { erro: plataforma.entrar.erroCredenciais };
    throw e; // NEXT_REDIRECT e afins seguem o fluxo
  }
}
