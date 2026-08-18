import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { Logo } from "@/components/ui/Logo";
import { BotaoImprimir } from "@/components/plataforma/BotaoImprimir";
import { plataforma } from "@/lib/content-plataforma";
import { buscarPorCodigo } from "@/lib/plataforma/certificados";

// Consulta banco por request; o build do Railway não alcança o banco (incidente
// documentado) — nunca prerenderizar.
export const dynamic = "force-dynamic";

const t = plataforma.certificado;

async function urlDaPagina(codigo: string): Promise<string> {
  // Origem da requisição: funciona em localhost e produção sem env nova.
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  return `${proto}://${host}/certificados/${codigo}`;
}

export async function generateMetadata({ params }: { params: Promise<{ codigo: string }> }): Promise<Metadata> {
  const { codigo } = await params;
  const cert = await buscarPorCodigo(decodeURIComponent(codigo));
  /* `noindex` no CERTIFICADO (2026-08-18): a página é pública de propósito
     (é o que faz a verificação valer), mas ela estampa o NOME DO ALUNO, e um
     código por certificado gera URLs infinitas. Fora do índice do Google,
     acessível por link.
     Feito por meta, não por Disallow no robots.txt: o LinkedIn respeita o
     robots.txt e pararia de montar a prévia justamente de quem compartilha o
     certificado - que é o uso esperado. `follow` fica ligado para o link
     interno do rodapé continuar passando autoridade. */
  const semIndice = { robots: { index: false, follow: true } } satisfies Partial<Metadata>;
  if (!cert) return { title: t.titulo, ...semIndice };
  // og:image tem que ser ABSOLUTA (LinkedIn/scrapers ignoram relativa). O layout
  // define metadataBase, mas isso não ajuda aqui: só se aplica a URLs relativas,
  // e esta já é absoluta — por isso deriva a origem da própria requisição, o que
  // também funciona em localhost sem depender do valor fixo de site.url.
  const h = await headers();
  const origem = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host") ?? "localhost:3000"}`;
  return {
    title: t.metaTitulo(cert.cursoTitulo),
    description: t.metaDescricao(cert.alunoNome, cert.cursoTitulo),
    ...semIndice,
    openGraph: {
      title: t.metaTitulo(cert.cursoTitulo),
      description: t.metaDescricao(cert.alunoNome, cert.cursoTitulo),
      // Endereço do próprio certificado: sem isto o LinkedIn atribuiria o
      // compartilhamento à home (og:url herdado do layout).
      url: `${origem}/certificados/${codigo}`,
      images: [`${origem}/plataforma/og-certificado-v1.jpg`],
    },
  };
}

export default async function PaginaCertificado({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const cert = await buscarPorCodigo(decodeURIComponent(codigo));
  if (!cert) notFound();

  const sessao = await auth();
  const dono = sessao?.user?.id === cert.alunoId;
  const url = await urlDaPagina(cert.codigo);

  const dataEmissao = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(cert.emitidoEm);
  const emitido = new Date(cert.emitidoEm);

  const addLinkedin = `https://www.linkedin.com/profile/add?${new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: cert.cursoTitulo,
    organizationName: t.organizacaoLinkedin,
    issueYear: String(emitido.getFullYear()),
    issueMonth: String(emitido.getMonth() + 1),
    certUrl: url,
    certId: cert.codigo,
  }).toString()}`;
  const shareLinkedin = `https://www.linkedin.com/sharing/share-offsite/?${new URLSearchParams({ url }).toString()}`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-12 print:p-0">
      <div className="w-full max-w-3xl">
        <article className="hero-editorial relative border border-line p-8 sm:p-12">
          <div className="relative z-10 flex flex-col gap-8">
            <div className="flex items-center justify-between gap-6">
              <span aria-hidden className="w-[140px] text-fg">
                <Logo />
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.emissor}</span>
            </div>

            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-accent-text">{t.titulo}</p>
              <h1 className="mt-4 text-4xl font-medium leading-tight tracking-[-0.03em] text-fg sm:text-5xl">
                {cert.alunoNome}
              </h1>
              <p className="mt-3 text-fg-muted">
                {t.concluiuA} <span className="text-fg">{cert.cursoTitulo}</span>
              </p>
            </div>

            <dl className="grid grid-cols-1 gap-4 border-t border-line pt-6 sm:grid-cols-3">
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">{t.cargaHoraria}</dt>
                <dd className="mt-1 text-fg">{cert.cargaHoras}{plataforma.painel.horas}</dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">{t.emitidoEm}</dt>
                <dd className="mt-1 text-fg">{dataEmissao}</dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">{t.codigo}</dt>
                <dd className="mt-1 font-mono text-fg">{cert.codigo}</dd>
              </div>
            </dl>

            <p className="border-t border-line pt-6 text-sm text-fg-muted">
              <span className="font-medium text-accent-text">{t.seloValido}</span> — {t.autenticidade}
            </p>
          </div>
        </article>

        {dono ? (
          <div className="no-print mt-6 flex flex-wrap items-center gap-3">
            <a
              href={addLinkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-control bg-accent px-6 py-2.5 text-sm font-medium text-accent-on transition-colors hover:bg-accent-hover"
            >
              {t.adicionarLinkedin}
            </a>
            <a
              href={shareLinkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-control border border-line-strong px-6 py-2.5 text-sm font-medium transition-colors hover:border-fg"
            >
              {t.compartilharLinkedin}
            </a>
            <BotaoImprimir />
          </div>
        ) : null}
      </div>
    </main>
  );
}
