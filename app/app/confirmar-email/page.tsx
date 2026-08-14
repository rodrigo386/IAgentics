import { plataforma } from "@/lib/content-plataforma";
import { FormReenviarConfirmacao } from "@/components/plataforma/FormReenviarConfirmacao";

export const dynamic = "force-dynamic";

export default async function ConfirmarEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ para?: string; erro?: string }>;
}) {
  const { para, erro } = await searchParams;
  const t = plataforma.confirmacao;
  return (
    <main className="mx-auto w-full max-w-md px-5 py-16">
      <h1 className="text-3xl font-medium tracking-[-0.02em] text-fg">
        {erro ? t.linkInvalidoTitulo : t.titulo}
      </h1>
      <p className="mt-4 leading-relaxed text-fg-muted">
        {erro ? t.linkInvalidoTexto : para ? t.enviamos(para) : t.linkInvalidoTexto}
      </p>
      <div className="mt-8">
        <FormReenviarConfirmacao emailInicial={para ?? ""} />
      </div>
    </main>
  );
}
