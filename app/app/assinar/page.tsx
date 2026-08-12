import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { FormAssinar } from "@/components/plataforma/FormAssinar";
import { plataforma } from "@/lib/content-plataforma";
import { temAcesso } from "@/lib/plataforma/dados";

export default async function PaginaAssinar() {
  const sessao = await auth();
  // Middleware já barra /app sem sessão; defesa em profundidade, como nas irmãs.
  if (!sessao?.user?.id) redirect("/app/entrar");
  const t = plataforma.assinar;

  if (await temAcesso(sessao.user.id)) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <h1 className="text-3xl font-medium tracking-[-0.03em]">{t.titulo}</h1>
        <p className="text-fg">{t.jaAssinante}</p>
        <Link href="/app" className="text-accent-text underline-offset-4 hover:underline">
          {plataforma.shell.meusCursos}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-medium tracking-[-0.03em]">{t.titulo}</h1>
        <p className="text-fg-muted">{t.resumo}</p>
      </div>
      <FormAssinar />
    </div>
  );
}
