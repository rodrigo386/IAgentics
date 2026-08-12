import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { FormConta } from "@/components/plataforma/FormConta";
import { plataforma } from "@/lib/content-plataforma";
import { buscarAssinatura, buscarFimAssinatura } from "@/lib/plataforma/dados";
import { buscarUsuario } from "@/lib/plataforma/usuarios";

export default async function PaginaConta() {
  const sessao = await auth();
  // O middleware já barra /app sem sessão; defesa em profundidade, como em painel.tsx.
  if (!sessao?.user?.id) redirect("/app/entrar");
  const userId = sessao.user.id;

  const [usuario, status] = await Promise.all([buscarUsuario(userId), buscarAssinatura(userId)]);
  if (!usuario) redirect("/app/entrar");

  const t = plataforma.conta;
  let textoAssinatura: string;
  if (status === "ativa") {
    // No Ciclo 1 esta branch é inatingível com dado real (ver buscarFimAssinatura).
    const ate = await buscarFimAssinatura(userId);
    textoAssinatura = t.statusAtiva(ate ? new Intl.DateTimeFormat("pt-BR").format(ate) : "—");
  } else if (status === "manual") {
    textoAssinatura = t.statusManual;
  } else if (status === "inadimplente") {
    textoAssinatura = t.statusInadimplente;
  } else if (status === "cancelada") {
    textoAssinatura = t.statusCancelada;
  } else {
    textoAssinatura = t.statusNenhuma;
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-10">
      <h1 className="text-3xl font-medium tracking-[-0.03em]">{t.titulo}</h1>

      <section className="flex flex-col gap-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.email}</p>
        <p className="text-fg">{usuario.email}</p>
      </section>

      <FormConta nomeInicial={usuario.nome} />

      <section className="flex flex-col gap-2 border-t border-line pt-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.assinatura}</p>
        <p className="text-fg">{textoAssinatura}</p>
      </section>
    </div>
  );
}
