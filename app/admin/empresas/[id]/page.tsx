import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirAdmin } from "@/lib/admin/sessao";
import { buscarEmpresa, situacaoDoContrato } from "@/lib/admin/contratos";
import { buscarCatalogo } from "@/lib/plataforma/dados";
import { admin } from "@/lib/content-admin";
import { ehErroEmpresa, ehSucessoEmpresa, ERRO_EMPRESA, SUCESSO_EMPRESA } from "@/lib/admin/mensagens-empresa";

export const dynamic = "force-dynamic";

const dataCurta = (d: Date) => d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

/**
 * Ficha da empresa: contratos, membros e importação da lista.
 *
 * Só o catálogo PUBLICADO entra na escolha de cursos do contrato — vender
 * acesso a curso não publicado seria vender o que não existe, e o direito
 * (lib/plataforma/dados.ts) filtra publicado de qualquer forma.
 */
export default async function PaginaEmpresa({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string; erro?: string }>;
}) {
  await exigirAdmin();
  const { id } = await params;
  const { msg, erro } = await searchParams;
  const t = admin.empresas;

  const empresa = await buscarEmpresa(id);
  if (!empresa) notFound();
  const catalogo = await buscarCatalogo();

  return (
    <div className="flex flex-col gap-8">
      <header>
        <Link href="/admin/empresas" prefetch={false} className="font-mono text-xs text-fg-subtle hover:text-fg">
          ← {t.titulo}
        </Link>
        <h1 className="mt-3 text-3xl font-medium tracking-[-0.03em] text-fg">{empresa.nome}</h1>
        {empresa.cnpj ? <p className="mt-1 font-mono text-sm text-fg-subtle">{empresa.cnpj}</p> : null}
      </header>

      {ehSucessoEmpresa(msg) ? (
        <p className="border border-line bg-surface px-4 py-3 text-sm text-fg">{SUCESSO_EMPRESA[msg]}</p>
      ) : null}
      {ehErroEmpresa(erro) ? (
        <p className="border border-line-strong bg-surface px-4 py-3 text-sm text-fg">{ERRO_EMPRESA[erro]}</p>
      ) : null}

      {empresa.contratos.map((c) => {
        const situacao = situacaoDoContrato(c);
        return (
          <section key={c.id} className="border border-line bg-surface p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-lg font-medium text-fg">
                {t.contrato.titulo} · R$ {c.valor}
              </h2>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-fg-subtle">
                {t.contrato[situacao]} · {dataCurta(c.inicioEm)} →{" "}
                {c.fimEm ? dataCurta(c.fimEm) : t.contrato.semFim}
              </p>
            </div>

            <p className="mt-2 font-mono text-sm text-fg-muted">
              {c.vagasUsadas} / {c.vagas} {t.contrato.vagasUsadas}
            </p>

            <p className="mt-4 text-sm text-fg-muted">
              {c.cursos.length ? c.cursos.map((x) => x.titulo).join(" · ") : t.contrato.semCursos}
            </p>

            <h3 className="mt-8 font-mono text-[11px] uppercase tracking-[0.16em] text-fg-subtle">
              {t.membros.titulo}
            </h3>
            {c.membros.length === 0 ? (
              <p className="mt-3 text-sm text-fg-muted">{t.membros.vazio}</p>
            ) : (
              <ul className="mt-3 flex flex-col divide-y divide-line border-y border-line">
                {c.membros.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <span className="font-mono text-sm text-fg">{m.email}</span>
                    <span className="flex items-center gap-4">
                      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-subtle">
                        {m.removidoEm ? t.membros.removido : m.temConta ? t.membros.comConta : t.membros.aguardando}
                      </span>
                      <form action={`/admin/empresas/${empresa.id}/acoes`} method="post">
                        <input type="hidden" name="acao" value={m.removidoEm ? "readmitirMembro" : "removerMembro"} />
                        <input type="hidden" name="membroId" value={m.id} />
                        <button
                          type="submit"
                          className="rounded-control border border-line-strong px-4 py-1.5 text-xs text-fg transition-colors hover:border-fg"
                        >
                          {m.removidoEm ? t.membros.readmitir : t.membros.remover}
                        </button>
                      </form>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <h3 className="mt-8 font-mono text-[11px] uppercase tracking-[0.16em] text-fg-subtle">
              {t.importar.titulo}
            </h3>
            <p className="mt-2 max-w-[62ch] text-sm text-fg-muted">{t.importar.lead}</p>
            <form action={`/admin/empresas/${empresa.id}/acoes`} method="post" className="mt-4 flex flex-col gap-3">
              <input type="hidden" name="acao" value="importar" />
              <input type="hidden" name="contratoId" value={c.id} />
              <textarea
                name="emails"
                rows={4}
                required
                aria-label={t.importar.campo}
                className="w-full border border-line bg-bg px-3 py-2 font-mono text-sm text-fg"
              />
              <button
                type="submit"
                className="self-start rounded-control bg-accent px-5 py-2.5 text-sm font-medium text-accent-on transition-colors hover:bg-accent-hover"
              >
                {t.importar.confirmar}
              </button>
            </form>
          </section>
        );
      })}

      <section className="border border-line bg-surface p-6">
        <h2 className="text-lg font-medium text-fg">{t.contrato.novo}</h2>
        <form action={`/admin/empresas/${empresa.id}/acoes`} method="post" className="mt-4 flex flex-col gap-5">
          <input type="hidden" name="acao" value="criarContrato" />
          <div className="flex flex-wrap gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-subtle">
                {t.contrato.valor}
              </span>
              <input
                name="valor"
                required
                inputMode="decimal"
                defaultValue="0.00"
                className="w-40 border border-line bg-bg px-3 py-2 text-sm text-fg"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-subtle">
                {t.contrato.vagas}
              </span>
              <input
                name="vagas"
                type="number"
                min={1}
                required
                defaultValue={10}
                className="w-28 border border-line bg-bg px-3 py-2 text-sm text-fg"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-subtle">
                {t.contrato.inicio}
              </span>
              <input name="inicioEm" type="date" className="border border-line bg-bg px-3 py-2 text-sm text-fg" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-subtle">{t.contrato.fim}</span>
              <input name="fimEm" type="date" className="border border-line bg-bg px-3 py-2 text-sm text-fg" />
            </label>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-subtle">
              {t.contrato.cursos}
            </legend>
            {catalogo.map((curso) => (
              <label key={curso.id} className="flex items-center gap-2 text-sm text-fg">
                <input type="checkbox" name="cursos" value={curso.id} />
                {curso.titulo}
              </label>
            ))}
          </fieldset>

          <button
            type="submit"
            className="self-start rounded-control bg-accent px-5 py-2.5 text-sm font-medium text-accent-on transition-colors hover:bg-accent-hover"
          >
            {t.contrato.salvar}
          </button>
        </form>
      </section>
    </div>
  );
}
