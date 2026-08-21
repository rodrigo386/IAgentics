"use server";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { criarUsuario, emitirEEnviarConfirmacao } from "@/lib/plataforma/usuarios";
import { vincularMembroPorEmail } from "@/lib/plataforma/vinculo";
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

  /* Venda B2B: se este e-mail foi pré-autorizado num contrato, a conta recém
     criada assume a vaga agora. Fica AQUI, e não dentro de criarUsuario, de
     propósito — aquela função é usada por script e por teste, e efeito
     colateral escondido nela surpreende quem a chamar depois.
     Antes do redirect da confirmação para valer nos DOIS caminhos (com e sem
     canal de e-mail ativo). Nunca derruba o cadastro: a conta já existe, e
     ficar sem acesso é recuperável pelo /admin — perder o cadastro, não. */
  try {
    await vincularMembroPorEmail(resultado.id, email);
  } catch (e) {
    console.error("[criar-conta] vínculo de contrato falhou", { userId: resultado.id });
  }

  if (resultado.confirmacaoPendente) {
    try {
      await emitirEEnviarConfirmacao(resultado.id, nome.trim(), email.trim().toLowerCase());
    } catch (e) {
      // A conta já existe (criarUsuario deu ok) — a tela de confirmação tem
      // reenvio, então uma falha aqui não pode travar o cadastro. Log só com
      // o userId: nunca token, nunca e-mail.
      console.error("[criar-conta] emissão da confirmação falhou", { userId: resultado.id });
    }
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
