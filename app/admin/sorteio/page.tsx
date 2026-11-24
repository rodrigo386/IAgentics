import type { Metadata } from "next";
import Link from "next/link";
import { admin } from "@/lib/content-admin";
import { Cartao } from "@/components/admin/Cartao";
import { listarCadastros, resumoSorteio } from "@/lib/sorteio/cadastros";
import { formatarNumero } from "@/lib/sorteio/regras";

const t = admin.sorteio;
export const metadata: Metadata = { title: t.meta.titulo, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const dataHora = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
const numero = new Intl.NumberFormat("pt-BR");

/** Painel do sorteio no Case 2026 (2026-11-23). Atrás do Basic Auth do middleware, como todo /admin. */
export default async function AdminSorteio() {
  const [resumo, linhas] = await Promise.all([resumoSorteio(), listarCadastros()]);
  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-10 px-5 py-12 sm:px-8">
      <header className="flex flex-col gap-2">
        <Link href="/admin" className="text-sm text-fg-muted hover:text-fg">
          {t.voltar}
        </Link>
        <h1 className="text-3xl font-medium tracking-[-0.03em] text-fg">{t.titulo}</h1>
        <p className="max-w-[80ch] text-fg-muted">{t.lead}</p>
        <p className="text-sm text-fg-muted">{t.fecha}</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        <Cartao rotulo={t.cartoes.cadastros} valor={numero.format(resumo.cadastros)} />
        <Cartao rotulo={t.cartoes.comunicacoes} valor={numero.format(resumo.comunicacoes)} />
        <Cartao rotulo={t.cartoes.emails} valor={numero.format(resumo.emails)} />
      </div>
      <section className="flex flex-col gap-4">
        {linhas.length > 0 ? (
          <a
            href="/admin/sorteio.csv"
            className="self-start rounded-control bg-accent px-5 py-2.5 text-sm font-medium text-accent-on transition-colors hover:bg-accent-hover"
          >
            {t.exportar}
          </a>
        ) : (
          <p className="text-fg-muted">{t.vazio}</p>
        )}
        {linhas.length > 0 ? (
          <div className="overflow-x-auto border border-line">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-surface font-mono text-[11px] uppercase tracking-[0.14em] text-fg-muted">
                <tr>
                  {Object.values(t.colunas).map((c) => (
                    <th key={c} className="px-4 py-3 font-normal">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.id} className="border-t border-line align-top">
                    <td className="px-4 py-3 font-mono tabular-nums text-fg">{formatarNumero(l.numero)}</td>
                    <td className="px-4 py-3 text-fg">{l.nome}</td>
                    <td className="px-4 py-3 text-fg-muted">
                      {l.email}
                      <br />
                      {l.whatsapp}
                    </td>
                    <td className="px-4 py-3 text-fg-muted">{l.area}</td>
                    <td className="px-4 py-3 text-fg-muted">{[l.empresa, l.cargo].filter(Boolean).join(" · ")}</td>
                    <td className="px-4 py-3 text-fg-muted">{dataHora.format(l.criadoEm)}</td>
                    <td className="px-4 py-3 text-fg-muted">{l.comunicacoesEm ? "sim" : "não"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        <p className="max-w-[70ch] text-xs text-fg-muted">{t.lgpd}</p>
      </section>
    </div>
  );
}
