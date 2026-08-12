import Link from "next/link";
import { admin } from "@/lib/content-admin";
import { listarCursosAdmin } from "@/lib/admin/conteudo";
import { NovoCursoForm } from "@/components/admin/FormCurso";

export default async function PaginaConteudo({
  searchParams,
}: {
  searchParams: Promise<{ excluido?: string }>;
}) {
  const { excluido } = await searchParams;
  const cursos = await listarCursosAdmin();
  const t = admin.conteudo;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-medium tracking-[-0.03em]">{t.titulo}</h1>
      </div>

      {excluido === "1" ? (
        <p role="status" className="border border-line bg-surface px-4 py-3 text-sm text-fg">
          {t.mensagens.excluido}
        </p>
      ) : null}

      <NovoCursoForm />

      {cursos.length === 0 ? (
        <p className="text-fg-muted">{t.vazio}</p>
      ) : (
        <div className="overflow-x-auto border border-line">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left font-mono text-[11px] uppercase tracking-[0.14em] text-fg-muted">
                <th className="px-4 py-3 font-normal">{t.colunas.titulo}</th>
                <th className="px-4 py-3 font-normal">{t.colunas.status}</th>
                <th className="px-4 py-3 font-normal">{t.colunas.aulas}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {cursos.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-surface">
                  <td className="px-0 py-0">
                    <Link href={`/admin/conteudo/${c.slug}`} className="flex flex-col gap-0.5 px-4 py-3">
                      <span className="font-medium text-fg">{c.titulo}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        c.publicado
                          ? "rounded-control bg-accent/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-accent-text"
                          : "rounded-control border border-line-strong px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-fg-muted"
                      }
                    >
                      {c.publicado ? t.seloPublicado : t.seloOculto}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-fg-muted">
                    {c.totalAulas}
                    {c.aulasSemVideo > 0 ? (
                      <span className="ml-2 font-mono text-[11px] uppercase tracking-[0.12em] text-fg-subtle">
                        {t.seloSemVideo(c.aulasSemVideo)}
                      </span>
                    ) : null}
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
