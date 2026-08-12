import Link from "next/link";
import { Suspense } from "react";
import { FormEntrar } from "@/components/plataforma/FormEntrar";
import { plataforma } from "@/lib/content-plataforma";

export default function PaginaEntrar() {
  const t = plataforma.entrar;
  return (
    <div className="mx-auto flex max-w-md flex-col gap-8">
      <h1 className="text-3xl font-medium tracking-[-0.03em]">{t.titulo}</h1>
      <Suspense>
        <FormEntrar />
      </Suspense>
      <p className="text-sm text-fg-muted">
        {t.semConta}{" "}
        <Link href="/app/criar-conta" className="text-accent-text underline-offset-4 hover:underline">
          {t.criarConta}
        </Link>
      </p>
    </div>
  );
}
