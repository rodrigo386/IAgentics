"use server";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { plataforma } from "@/lib/content-plataforma";

export async function entrarAction(_: unknown, formData: FormData):
  Promise<{ erro: string } | never> {
  try {
    // Fix round final (I1): "voltar" vem do querystring de quem navegou até
    // aqui — não confiável. Um valor malformado (ex.: "app", "http://evil")
    // fazia o Auth.js lançar dentro do signIn, e o aluno com credenciais
    // CORRETAS caía em /api/auth/error em inglês, sem sessão. Só aceitamos
    // caminho absoluto interno (começa com "/", não "//" — protocol-relative
    // sairia do site).
    const bruto = String(formData.get("voltar") || "/app");
    const voltar = /^\/(?!\/)/.test(bruto) ? bruto : "/app";
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      senha: String(formData.get("senha") ?? ""),
      redirectTo: voltar,
    });
    return undefined as never; // signIn redireciona (lança NEXT_REDIRECT)
  } catch (e) {
    if (e instanceof AuthError) return { erro: plataforma.entrar.erroCredenciais };
    throw e; // NEXT_REDIRECT e afins seguem o fluxo
  }
}
