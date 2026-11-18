import type { Metadata } from "next";
import Link from "next/link";
import { admin } from "@/lib/content-admin";
import { Cartao } from "@/components/admin/Cartao";
import { bolsasPorDia, resumoBolsas } from "@/lib/bolsas/inscricoes";

const t = admin.bolsas;
export const metadata: Metadata = { title: t.meta.titulo, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const numero = new Intl.NumberFormat("pt-BR");

/**
 * Painel do Desafio Prova Real (2026-11-03; refeito em 2026-11-18). Atrás do
 * Basic Auth do middleware, como todo /admin. Mostra os inscritos (meta 400,
 * do mapa da campanha) e exporta o CSV que a equipe preenche na avaliação.
 */
export default async function PainelBolsas() {
  const [r, porDia] = await Promise.all([resumoBolsas(), bolsasPorDia()]);

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-12 px-5 py-12 sm:px-8">
      <header>
        <Link href="/admin" className="text-sm text-fg-muted hover:text-fg">
          {t.voltar}
        </Link>
        <h1 className="mt-3 text-3xl font-medium tracking-[-0.03em] text-fg">{t.titulo}</h1>
        <p className="mt-2 text-fg-muted">{t.lead}</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Cartao rotulo={t.cartoes.inscritos} valor={numero.format(r.inscritos)} nota={t.cartoes.metaInscritos} />
        <Cartao rotulo={t.cartoes.grupo} valor={numero.format(r.grupoWhatsapp)} />
        <Cartao rotulo={t.cartoes.contato} valor={numero.format(r.contatoComercial)} />
        <Cartao rotulo={t.cartoes.imagem} valor={numero.format(r.usoImagem)} />
      </section>

      <section className="flex flex-col gap-2">
        <a href="/admin/bolsas/inscricoes.csv" className="w-fit rounded-control bg-accent px-4 py-2 text-sm font-medium text-accent-on">
          {t.exportar}
        </a>
        <p className="max-w-[70ch] text-xs text-fg-muted">{t.exportarNota}</p>
      </section>

      {r.inscritos === 0 ? (
        <p className="text-fg-muted">{t.semDados}</p>
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.porDia.titulo}</h2>
            <table className="w-full max-w-[480px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line-strong text-fg-muted">
                  <th scope="col" className="py-2 pr-4 font-normal">{t.porDia.dia}</th>
                  <th scope="col" className="py-2 text-right font-normal">{t.porDia.inscritos}</th>
                </tr>
              </thead>
              <tbody>
                {porDia.map((d) => (
                  <tr key={d.dia} className="border-b border-line">
                    <td className="py-2 pr-4 tabular-nums text-fg">{d.dia.split("-").reverse().slice(0, 2).join("/")}</td>
                    <td className="py-2 text-right tabular-nums text-fg">{numero.format(d.inscritos)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}
