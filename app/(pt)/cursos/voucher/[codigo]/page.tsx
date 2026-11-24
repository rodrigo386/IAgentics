import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { AssinaturaForm } from "@/components/sections/cursos/AssinaturaForm";
import { bolsas } from "@/lib/content";
import { voucherPorCodigo } from "@/lib/bolsas/inscricoes";
import { agoraBolsas } from "@/lib/bolsas/regras";
import { estadoDoVoucher } from "@/lib/bolsas/voucher";
import { hojeSP } from "@/lib/assinatura/regras";

const t = bolsas.voucher;

export const metadata: Metadata = { title: { absolute: t.meta.titulo }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const data = (iso: string) => iso.split("-").reverse().join("/");

/**
 * Página do voucher do Desafio Prova Real (2026-11-18). O código chega por
 * e-mail e é difícil de adivinhar; a página só mostra o primeiro nome. Fora do
 * sitemap e do robots, noindex. Código inexistente responde 404.
 */
export default async function PaginaVoucher({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const v = await voucherPorCodigo(codigo);
  if (!v) notFound();
  const estado = estadoDoVoucher(v, hojeSP(agoraBolsas()));
  const primeiroNome = v.nome.split(" ")[0];

  return (
    <>
      <Nav />
      <main id="conteudo" className="pt-16">
        <section className="mx-auto grid max-w-[1100px] gap-12 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.eyebrow}</p>
            {estado === "valido" ? (
              <>
                <h1 className="mt-5 text-4xl font-medium tracking-[-0.03em] text-fg sm:text-5xl">{t.ola(primeiroNome)}</h1>
                <p className="mt-8 flex flex-wrap items-baseline gap-x-3 text-fg">
                  <strong className="tnum text-6xl font-medium tracking-[-0.04em]">{t.preco}</strong>{" "}
                  <span className="text-lg text-fg-muted">{t.porMes}</span>
                </p>
                <p className="mt-2 text-sm text-fg-muted">{t.deixaDeSer}</p>
                <p className="mt-8 max-w-[60ch] leading-relaxed text-fg-muted">{t.texto}</p>
                <p className="mt-6 inline-block rounded-control border border-line-strong px-4 py-1.5 text-sm font-medium text-fg">
                  {t.validoAte(data(v.validoAte ?? ""))}
                </p>
              </>
            ) : (
              <>
                <h1 className="mt-5 text-4xl font-medium tracking-[-0.03em] text-fg sm:text-5xl">{t.estados[estado].titulo}</h1>
                <p className="mt-6 max-w-[60ch] text-lg leading-relaxed text-fg-muted">{t.estados[estado].texto}</p>
                <Link href="/cursos" className="mt-8 inline-block rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on hover:bg-accent-hover">
                  {t.conhecer}
                </Link>
              </>
            )}
          </div>
          {estado === "valido" ? (
            <div className="border border-line bg-surface p-6 sm:p-8">
              <h2 className="mb-6 text-xl font-medium tracking-[-0.02em] text-fg">{t.formularioTitulo}</h2>
              <AssinaturaForm
                endereco="/cursos/voucher/assinar"
                extra={{ codigo }}
                medir={false}
                textos={{ consentimento: t.consentimento, botao: t.botao, erros: { voucher: t.erroVoucher } }}
              />
            </div>
          ) : null}
        </section>
      </main>
      <Footer />
    </>
  );
}
