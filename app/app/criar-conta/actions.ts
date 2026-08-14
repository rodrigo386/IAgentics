"use server";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { criarUsuario, emitirEEnviarConfirmacao } from "@/lib/plataforma/usuarios";
import { plataforma } from "@/lib/content-plataforma";

export async function criarContaAction(_: unknown, formData: FormData):
  Promise<{ erro: string } | never> {
  const nome = String(formData.get("nome") ?? "");
  const email = String(formData.get("email") ?? "");
  const senha = String(formData.get("senha") ?? "");

  // Server Actions são endpoints POST invocáveis diretamente (header Next-Action),
  // sem passar pela UI/HTML — o minLength do form é só UX de primeira linha, a
  // validação que conta é esta aqui, do lado do servidor.
  if (nome.trim().length < 2) return { erro: plataforma.criarConta.nomeCurto };
  if (senha.length < 8) return { erro: plataforma.criarConta.senhaCurta };

  const resultado = await criarUsuario({ nome, email, senha });
  if (!resultado.ok) {
    return { erro: plataforma.criarConta.emailExiste };
  }

  if (resultado.confirmacaoPendente) {
    await emitirEEnviarConfirmacao(resultado.id, nome, email);
    redirect(`/app/confirmar-email?para=${encodeURIComponent(email.trim().toLowerCase())}`);
  }
  // canal inativo: segue o signIn de hoje

  try {
    // "voltar" vem do querystring de quem navegou até aqui (ex.: CTA do /planos).
    // Mesma sanitização de entrar/actions.ts: só caminho relativo interno
    // (começa com "/" e não com "//"), senão cai no padrão /app.
    const brutoVoltar = String(formData.get("voltar") || "/app");
    const voltar = /^\/(?!\/)/.test(brutoVoltar) ? brutoVoltar : "/app";
    await signIn("credentials", { email, senha, redirectTo: voltar });
    return undefined as never; // signIn redireciona (lança NEXT_REDIRECT)
  } catch (e) {
    if (e instanceof AuthError) return { erro: plataforma.entrar.erroCredenciais };
    throw e; // NEXT_REDIRECT e afins seguem o fluxo
  }
}
