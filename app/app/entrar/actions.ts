"use server";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { plataforma } from "@/lib/content-plataforma";
import { credenciaisValidasMasNaoConfirmadas } from "@/lib/plataforma/usuarios";

export async function entrarAction(
  _: unknown,
  formData: FormData,
): Promise<{ erro: string | null; naoConfirmado?: boolean; email?: string | null } | never> {
  const email = String(formData.get("email") ?? "");
  const senha = String(formData.get("senha") ?? "");
  try {
    // Fix round final (I1): "voltar" vem do querystring de quem navegou até
    // aqui — não confiável. Um valor malformado (ex.: "app", "http://evil")
    // fazia o Auth.js lançar dentro do signIn, e o aluno com credenciais
    // CORRETAS caía em /api/auth/error em inglês, sem sessão. Só aceitamos
    // caminho absoluto interno (começa com "/", não "//" — protocol-relative
    // sairia do site).
    const bruto = String(formData.get("voltar") || "/app");
    const voltar = /^\/(?!\/)/.test(bruto) ? bruto : "/app";
    await signIn("credentials", { email, senha, redirectTo: voltar });
    return undefined as never; // signIn redireciona (lança NEXT_REDIRECT)
  } catch (e) {
    if (e instanceof AuthError) {
      // Distingue "senha errada" de "falta confirmar" SÓ depois da falha —
      // caminho raro, custo extra de bcrypt aceitável.
      if (await credenciaisValidasMasNaoConfirmadas(email, senha)) {
        return { erro: null, naoConfirmado: true, email: email.trim().toLowerCase() };
      }
      return { erro: plataforma.entrar.erroCredenciais, naoConfirmado: false, email: null };
    }
    throw e; // NEXT_REDIRECT e afins seguem o fluxo
  }
}
