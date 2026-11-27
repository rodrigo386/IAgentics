import type { Metadata } from "next";
import Link from "next/link";
import { admin } from "@/lib/content-admin";
import { Cartao } from "@/components/admin/Cartao";
import { listarLeads, resumoLeads } from "@/lib/nexo-demo/leads";
import { PASSOS } from "@/lib/nexo-demo/regras";

const t = admin.nexoDemo;
export const metadata: Metadata = { title: t.meta.titulo, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const dataHora = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
const numero = new Intl.NumberFormat("pt-BR");

/** Painel do Nexo Demo (2026-11-27). Atrás do Basic Auth do middleware, como todo /admin. */
export default async function AdminNexoDemo() {
  const [resumo, linhas] = await Promise.all([resumoLeads(), listarLeads()]);
  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-10 px-5 py-12 sm:px-8">
      <header className="flex flex-col gap-2">
        <Link href="/admin" className="text-sm text-fg-muted hover:text-fg">
          {t.voltar}
        </Link>
        <h1 className="text-3xl font-medium tracking-[-0.03em] text-fg">{t.titulo}</h1>
        <p className="max-w-[80ch] text-fg-muted">{t.lead}</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        <Cartao rotulo={t.cartoes.cadastros} valor={numero.format(resumo.cadastros)} />
        <Cartao rotulo={t.cartoes.abriramRc} valor={numero.format(resumo.abriramRc)} />
        <Cartao rotulo={t.cartoes.concluiram} valor={numero.format(resumo.concluiram)} />
      </div>
      <section className="flex flex-col gap-4">
        {linhas.length > 0 ? (
          <a href="/admin/nexo-demo.csv" className="self-start rounded-control bg-accent px-5 py-2.5 text-sm font-medium text-accent-on transition-colors hover:bg-accent-hover">
            {t.exportar}
          </a>
        ) : (
          <p className="text-fg-muted">{t.vazio}</p>
        )}
        {linhas.length > 0 ? (
          <div className="overflow-x-auto border border-line">
            <table className="w-full min-w-[900px] text-left text-sm">
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
                    <td className="px-4 py-3 text-fg-muted">{dataHora.format(l.criadoEm)}</td>
                    <td className="px-4 py-3 text-fg">{l.nome || "—"}</td>
                    <td className="px-4 py-3 text-fg">{l.empresa}</td>
                    <td className="px-4 py-3 text-fg-muted">
                      {l.email}
                      <br />
                      {l.celular}
                    </td>
                    <td className="px-4 py-3 text-fg-muted">
                      <a href={l.linkedin} target="_blank" rel="noopener noreferrer" className="underline hover:text-fg">
                        {l.linkedin.replace("https://www.linkedin.com/", "")}
                      </a>
                    </td>
                    <td className={`px-4 py-3 ${l.concluiuEm ? "font-medium text-fg" : "text-fg-muted"}`}>
                      {l.passo + 1}/{PASSOS.length} · {PASSOS[l.passo] ?? PASSOS[0]}
                    </td>
                    <td className="px-4 py-3 text-fg-muted">{l.passoEm ? dataHora.format(l.passoEm) : "—"}</td>
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
