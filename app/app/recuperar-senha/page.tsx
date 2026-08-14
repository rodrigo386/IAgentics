import { plataforma } from "@/lib/content-plataforma";
import { FormRecuperarSenha } from "@/components/plataforma/FormRecuperarSenha";

export const dynamic = "force-dynamic";

export default async function RecuperarSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const t = plataforma.recuperarSenha;
  return (
    <main className="mx-auto w-full max-w-md px-5 py-16">
      <h1 className="text-3xl font-medium tracking-[-0.02em] text-fg">
        {erro ? t.linkInvalidoTitulo : t.titulo}
      </h1>
      <p className="mt-4 leading-relaxed text-fg-muted">
        {erro ? t.linkInvalidoTexto : t.texto}
      </p>
      <div className="mt-8"><FormRecuperarSenha /></div>
    </main>
  );
}
