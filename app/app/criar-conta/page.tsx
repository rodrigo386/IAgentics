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
        <Link href="/app/entrar" className="text-accent-text underline-offset-4 hover:underline">
          {t.entrar}
        </Link>
      </p>
    </div>
  );
}
