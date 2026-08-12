import Link from "next/link";
import { Suspense } from "react";
import { FormCriarConta } from "@/components/plataforma/FormCriarConta";
import { plataforma } from "@/lib/content-plataforma";

export default async function PaginaCriarConta({ searchParams }: { searchParams: Promise<{ voltar?: string }> }) {
  const { voltar } = await searchParams;
  const t = plataforma.criarConta;
  return (
    <div className="mx-auto flex max-w-md flex-col gap-8">
      <h1 className="text-3xl font-medium tracking-[-0.03em]">{t.titulo}</h1>
      <Suspense>
        <FormCriarConta voltar={voltar ?? ""} />
      </Suspense>
      <p className="text-sm text-fg-muted">
        {t.jaTem}{" "}
        {/* Preserva o destino de volta (funil do /planos): sem isto, quem
            veio do /planos com ?voltar=/planos e clica em "Entrar" em vez de
            criar conta perdia o retorno e caía no /app genérico depois de
            logar — FormEntrar/entrarAction já leem e propagam "voltar" do
            querystring, só faltava esta página repassar. */}
        <Link
          href={voltar ? `/app/entrar?voltar=${encodeURIComponent(voltar)}` : "/app/entrar"}
          className="text-accent-text underline-offset-4 hover:underline"
        >
          {t.entrar}
        </Link>
      </p>
    </div>
  );
}
