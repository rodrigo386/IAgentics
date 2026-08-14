import { redirect } from "next/navigation";
import { confirmarEmailPorToken } from "@/lib/plataforma/usuarios";

export const dynamic = "force-dynamic";

/** Consome o token e leva ao login. Sem UI própria: sucesso vira aviso verde
 *  no login; falha cai na tela de reenvio com estado de erro. */
export default async function ConfirmarPorTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const ok = await confirmarEmailPorToken(token);
  redirect(ok ? "/app/entrar?confirmado=1" : "/app/confirmar-email?erro=1");
}
