import Link from "next/link";
import { exigirAdmin } from "@/lib/admin/sessao";
import { listarEmpresas } from "@/lib/admin/contratos";
import { admin } from "@/lib/content-admin";
import { ehSucessoEmpresa, SUCESSO_EMPRESA } from "@/lib/admin/mensagens-empresa";

export const dynamic = "force-dynamic";

/**
 * Lista de empresas com contrato de acesso em grupo.
 *
 * O feedback das ações vem por CHAVE na querystring, renderizada no servidor —
 * nunca useActionState (armadilha 6: sob carga o React 19 descartava a
 * resposta da action e o botão ficava preso em pending para sempre).
 */
export default async function PaginaEmpresas({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  await exigirAdmin();
  const { msg } = await searchParams;
  const t = admin.empresas;
  const empresas = await listarEmpresas();

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-medium tracking-[-0.03em] text-fg">{t.titulo}</h1>
        <p className="mt-2 text-fg-muted">{t.lead}</p>
      </header>

      {ehSucessoEmpresa(msg) ? (
        <p className="border border-line bg-surface px-4 py-3 text-sm text-fg">{SUCESSO_EMPRESA[msg]}</p>
      ) : null}

      <section className="border border-line bg-surface p-6">
        <h2 className="text-lg font-medium text-fg">{t.novaEmpresa}</h2>
        {/* Form HTML nativo + 303, como todas as ações do /admin. */}
        <form action="/admin/empresas/acoes" method="post" className="mt-4 flex flex-wrap items-end gap-4">
          <input type="hidden" name="acao" value="criarEmpresa" />
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-subtle">{t.form.nome}</span>
            <input
              name="nome"
              required
              minLength={2}
              className="w-64 border border-line bg-bg px-3 py-2 text-sm text-fg"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-subtle">{t.form.cnpj}</span>
            <input name="cnpj" className="w-56 border border-line bg-bg px-3 py-2 text-sm text-fg" />
          </label>
          <button
            type="submit"
            className="rounded-control bg-accent px-5 py-2.5 text-sm font-medium text-accent-on transition-colors hover:bg-accent-hover"
          >
            {t.form.salvar}
          </button>
        </form>
      </section>

      {empresas.length === 0 ? (
        <p className="text-fg-muted">{t.vazio}</p>
      ) : (
        <div className="overflow-x-auto border border-line">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line">
                {[t.colunas.empresa, t.colunas.contratos, t.colunas.vagas].map((c) => (
                  <th
                    key={c}
                    className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.16em] text-fg-subtle"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {empresas.map((e) => (
                <tr key={e.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/empresas/${e.id}`} prefetch={false} className="text-accent-text hover:underline">
                      {e.nome}
                    </Link>
                    {e.cnpj ? <span className="ml-2 font-mono text-xs text-fg-subtle">{e.cnpj}</span> : null}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-fg-muted">{e.contratos}</td>
                  <td className="px-4 py-3 tabular-nums text-fg-muted">
                    {e.vagasUsadas} / {e.vagas}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
