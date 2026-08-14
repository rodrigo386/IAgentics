import { plataforma } from "@/lib/content-plataforma";
import { FormRedefinirSenha } from "@/components/plataforma/FormRedefinirSenha";

export const dynamic = "force-dynamic";

/** O token só é validado no SUBMIT (consumirToken é o juiz; pré-checar aqui
 *  duplicaria a lógica e abriria janela para o link vencer entre as duas). */
export default async function RedefinirSenhaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const t = plataforma.recuperarSenha;
  return (
    <main className="mx-auto w-full max-w-md px-5 py-16">
      <h1 className="text-3xl font-medium tracking-[-0.02em] text-fg">{t.novaTitulo}</h1>
      <p className="mt-4 leading-relaxed text-fg-muted">{t.novaTexto}</p>
      <div className="mt-8"><FormRedefinirSenha token={token} /></div>
    </main>
  );
}
