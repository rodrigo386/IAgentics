import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { cursos } from "@/lib/content";
import { buscarAssinatura } from "@/lib/assinatura/assinaturas";

export const metadata: Metadata = { title: cursos.assinatura.pagina.titulo, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Para onde a pessoa volta depois de assinar (2026-10-14). O id é um uuid
 * difícil de adivinhar, e a página só mostra o status e o primeiro nome —
 * nada que identifique alguém para quem não tem o link.
 */
export default async function PaginaAssinatura({ params }: { params: Promise<{ id: string }> }) {
  const a = await buscarAssinatura((await params).id);
  if (!a) notFound();
  const t = cursos.assinatura.pagina;
  const estado = t.estados[a.status] ?? t.estados.pendente;
  const primeiroNome = a.nome.split(" ")[0];

  return (
    <>
      <Nav />
      <main id="conteudo" className="pt-16">
        <section className="mx-auto max-w-[760px] px-5 py-24 sm:px-8 sm:py-32">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.eyebrow}</p>
          <h1 className="mt-5 text-4xl font-medium tracking-[-0.03em] text-fg sm:text-5xl">{t.ola(primeiroNome)}</h1>
          <p role="status" className="mt-8 inline-block rounded-control border border-line-strong px-4 py-1.5 text-sm font-medium text-fg">
            {estado.rotulo}
          </p>
          <p className="mt-6 text-lg leading-relaxed text-fg-muted">{estado.texto}</p>
          {a.status === "pendente" && a.urlFatura ? (
            <a href={a.urlFatura} className="mt-8 inline-block rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on hover:bg-accent-hover">
              {t.pagar}
            </a>
          ) : null}
          <p className="mt-10 border-t border-line pt-6 text-sm text-fg-muted">{t.cancelar}</p>
          <Link href="/cursos" className="mt-6 inline-block text-sm text-fg underline">
            {t.voltar}
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
