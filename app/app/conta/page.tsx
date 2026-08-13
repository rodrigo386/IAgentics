import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { FormConta } from "@/components/plataforma/FormConta";
import { plataforma } from "@/lib/content-plataforma";
import { listarDoAluno } from "@/lib/plataforma/certificados";
import { buscarAssinatura, buscarFimAssinatura } from "@/lib/plataforma/dados";
import { buscarUsuario } from "@/lib/plataforma/usuarios";

export default async function PaginaConta() {
  const sessao = await auth();
  // O middleware já barra /app sem sessão; defesa em profundidade, como em painel.tsx.
  if (!sessao?.user?.id) redirect("/app/entrar");
  const userId = sessao.user.id;

  const [usuario, status, certificados] = await Promise.all([
    buscarUsuario(userId),
    buscarAssinatura(userId),
    // Isolado: mesma régua do ciclo de certificados (seção secundária, nunca
    // derruba o fluxo crítico) — cobre a janela entre o deploy e a migração 0004.
    listarDoAluno(userId).catch((e) => {
      console.error("certificados (conta)", e);
      return [];
    }),
  ]);
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
  } else if (status === "pendente") {
    textoAssinatura = t.statusPendente;
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

      <section className="flex flex-col gap-3 border-t border-line pt-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.certificados}</p>
        {certificados.length === 0 ? (
          <p className="text-sm text-fg-muted">{t.semCertificados}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {certificados.map((c) => (
              <li key={c.codigo} className="flex items-center justify-between gap-4">
                <span className="min-w-0 truncate text-fg">{c.cursoTitulo}</span>
                <Link
                  href={`/certificados/${c.codigo}`}
                  className="shrink-0 text-sm text-accent-text underline-offset-4 hover:underline"
                >
                  {plataforma.certificado.verCertificado}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2 border-t border-line pt-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.assinatura}</p>
        <p className="text-fg">{textoAssinatura}</p>
      </section>
    </div>
  );
}
