import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { plataforma } from "@/lib/content-plataforma";
import { buscarCatalogo, temAcesso } from "@/lib/plataforma/dados";

export const metadata: Metadata = { title: "Planos", description: plataforma.planos.descricaoMeta };
// Consulta banco e sessão a cada request — o build do Railway não tem rede
// para o banco, então esta página NÃO pode ser prerenderizada (força dinâmica,
// mesmo incidente já documentado em app/app/layout.tsx).
export const dynamic = "force-dynamic";

export default async function PaginaPlanos() {
  const t = plataforma.planos;
  const sessao = await auth();
  const assinante = sessao?.user?.id ? await temAcesso(sessao.user.id) : false;
  const cursos = await buscarCatalogo();
  const destino = sessao?.user?.id ? "/app/assinar" : "/app/criar-conta?voltar=/app/assinar";

  return (
    <>
      <Nav />
      <main className="pt-16">
        <section className="mx-auto flex max-w-[1400px] flex-col gap-12 px-5 py-16 sm:px-8 lg:flex-row lg:items-start lg:gap-20 lg:py-24">
          <div className="flex flex-1 flex-col gap-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent-text">{t.eyebrow}</p>
            <h1 className="max-w-[16ch] text-4xl font-medium leading-tight tracking-[-0.03em] text-fg sm:text-5xl">
              {t.titulo}
            </h1>
            <p className="flex items-baseline gap-1">
              <span className="text-5xl font-medium tracking-[-0.03em] text-fg">{t.preco}</span>
              <span className="text-lg text-fg-muted">{t.porMes}</span>
            </p>
            <ul className="flex flex-col gap-3">
              {t.beneficios.map((b) => (
                <li key={b} className="flex items-start gap-3 text-fg">
                  <span aria-hidden className="mt-[9px] h-1.5 w-1.5 shrink-0 bg-accent" />
                  {b}
                </li>
              ))}
            </ul>
            {assinante ? (
              <div className="flex flex-col items-start gap-2">
                <p className="text-fg">{t.jaAssinante}</p>
                <Link href="/app" className="text-accent-text underline-offset-4 hover:underline">
                  {t.irParaPlataforma}
                </Link>
              </div>
            ) : (
              <Link
                href={destino}
                className="self-start rounded-control bg-accent px-8 py-4 font-medium text-accent-on transition-colors hover:bg-accent-hover"
              >
                {t.cta}
              </Link>
            )}
          </div>

          <div className="flex-1">
            <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.cursosTitulo}</p>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {cursos.map((curso) => (
                <li
                  key={curso.id}
                  data-testid="capa-plano"
                  className="relative aspect-[3/4] overflow-hidden border border-line"
                >
                  <Image
                    src={curso.capaUrl}
                    alt={curso.titulo}
                    fill
                    sizes="(min-width: 1024px) 220px, 33vw"
                    style={{ objectPosition: "center top" }}
                    className="object-cover"
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
