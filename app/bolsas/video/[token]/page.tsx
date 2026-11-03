import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { VideoForm } from "@/components/sections/bolsas/VideoForm";
import { bolsas } from "@/lib/content";
import { agoraBolsas, tokenValido, videoAberto } from "@/lib/bolsas/regras";
import { inscricaoPorToken } from "@/lib/bolsas/inscricoes";

const t = bolsas.video;

/* Página pessoal: fora do Google e sem cache. */
export const metadata: Metadata = { title: { absolute: t.meta.titulo }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Onde o inscrito manda o link do vídeo de entrada (Fase 2 do plano). O link
 * desta página chega no e-mail da inscrição; quem o tem fala por aquela
 * inscrição, e a página mostra só o primeiro nome e o link já enviado.
 */
export default async function PaginaVideo({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const inscricao = tokenValido(token) ? await inscricaoPorToken(token) : null;
  const aberto = videoAberto(agoraBolsas());

  return (
    <>
      <Nav />
      <main id="conteudo" className="pt-16">
        <section className="mx-auto max-w-[680px] px-5 py-20 sm:px-8 sm:py-24">
          <h1 className="text-4xl font-medium tracking-[-0.03em] text-fg sm:text-5xl">{t.titulo}</h1>
          {!inscricao ? (
            <p className="mt-8 text-lg text-fg-muted">{t.invalido}</p>
          ) : (
            <>
              <p className="mt-8 text-lg text-fg">{t.ola(inscricao.nome.split(/\s+/)[0])}</p>
              <p className="mt-3 leading-relaxed text-fg-muted">{t.lead}</p>
              <p className="mt-3 font-medium text-fg">{aberto ? t.prazo : t.encerrado}</p>
              <div className="mt-10 border border-line bg-surface p-6 sm:p-8">
                <VideoForm token={token} atual={inscricao.videoUrl} aberto={aberto} />
              </div>
            </>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
