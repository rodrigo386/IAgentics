import Link from "next/link";
import { admin } from "@/lib/content-admin";
import { plataforma } from "@/lib/content-plataforma";
import { listarAlunos } from "@/lib/admin/alunos";
import type { StatusAssinatura } from "@/lib/plataforma/tipos";

function rotuloStatus(status: StatusAssinatura): string {
  const t = plataforma.conta;
  if (status === "manual") return t.statusManual;
  // "ativa" é inatingível com dado real no Ciclo 1 (só SQL grava "manual"); sem
  // data de vencimento por linha aqui — buscá-la por aluno faria N+1 na lista.
  if (status === "ativa") return t.statusAtiva("—");
  if (status === "inadimplente") return t.statusInadimplente;
  if (status === "cancelada") return t.statusCancelada;
  return t.statusNenhuma;
}

function formatarData(d: Date | null): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}

export default async function PaginaAlunos({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; pagina?: string; excluido?: string }>;
}) {
  const { q, pagina: paginaStr, excluido } = await searchParams;
  const pagina = Number(paginaStr) || 1;
  const { linhas, total, porPagina } = await listarAlunos({ q, pagina });
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const t = admin.alunos;

  function hrefPagina(p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("pagina", String(p));
    return `/admin/alunos?${params.toString()}`;
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-medium tracking-[-0.03em]">{t.titulo}</h1>

      {excluido === "1" ? (
        <p role="status" className="border border-line bg-surface px-4 py-3 text-sm text-fg">
          {t.mensagens.contaExcluida}
        </p>
      ) : null}

      <form action="/admin/alunos" method="get" className="flex gap-3">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder={t.buscarPlaceholder}
          aria-label={t.buscarPlaceholder}
          className="w-full max-w-sm border border-line bg-surface px-4 py-2.5 text-fg placeholder:text-fg-subtle focus-visible:outline-2 focus-visible:outline-accent-text sm:max-w-md"
        />
        <button
          type="submit"
          className="shrink-0 rounded-control border border-line-strong px-5 py-2.5 text-sm font-medium transition-colors hover:border-fg"
        >
          {t.buscarBotao}
        </button>
      </form>

      {linhas.length === 0 ? (
        <p className="text-fg-muted">{t.vazio}</p>
      ) : (
        <div className="overflow-x-auto border border-line">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left font-mono text-[11px] uppercase tracking-[0.14em] text-fg-muted">
                <th className="px-4 py-3 font-normal">{t.colunas.nome}</th>
                <th className="px-4 py-3 font-normal">{t.colunas.status}</th>
                <th className="px-4 py-3 font-normal">{t.colunas.ultimoAcesso}</th>
                <th className="px-4 py-3 font-normal">{t.colunas.criadoEm}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {linhas.map((a) => (
                <tr key={a.id} className="transition-colors hover:bg-surface">
                  <td className="px-0 py-0">
                    <Link href={`/admin/alunos/${a.id}`} className="flex flex-col gap-0.5 px-4 py-3">
                      <span className="flex flex-wrap items-center gap-2 font-medium text-fg">
                        {a.nome || "—"}
                        {a.role === "admin" ? (
                          <span className="rounded-control border border-line-strong px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-fg-muted">
                            {t.seloAdmin}
                          </span>
                        ) : null}
                        {!a.ativo ? (
                          <span className="rounded-control bg-brand-ink/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-paper">
                            {t.seloDesativada}
                          </span>
                        ) : null}
                      </span>
                      <span className="text-fg-muted">{a.email}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-fg-muted">{rotuloStatus(a.status)}</td>
                  <td className="px-4 py-3 text-fg-muted">{formatarData(a.ultimoAcesso)}</td>
                  <td className="px-4 py-3 text-fg-muted">{formatarData(a.criadoEm)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPaginas > 1 ? (
        <div className="flex items-center justify-between">
          <Link
            href={hrefPagina(pagina - 1)}
            aria-disabled={pagina <= 1}
            tabIndex={pagina <= 1 ? -1 : undefined}
            className={`rounded-control border border-line-strong px-5 py-2.5 text-sm font-medium transition-colors ${
              pagina <= 1 ? "pointer-events-none opacity-40" : "hover:border-fg"
            }`}
          >
            {t.paginacao.anterior}
          </Link>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-muted">
            {pagina} / {totalPaginas}
          </span>
          <Link
            href={hrefPagina(pagina + 1)}
            aria-disabled={pagina >= totalPaginas}
            tabIndex={pagina >= totalPaginas ? -1 : undefined}
            className={`rounded-control border border-line-strong px-5 py-2.5 text-sm font-medium transition-colors ${
              pagina >= totalPaginas ? "pointer-events-none opacity-40" : "hover:border-fg"
            }`}
          >
            {t.paginacao.proxima}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
