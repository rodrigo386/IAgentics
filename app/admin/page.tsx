import Link from "next/link";
import { admin } from "@/lib/content-admin";
import { conclusaoPorCurso, funilDoCurso, resumo, seriesSemanais, trafegoDoSite, type Periodo } from "@/lib/admin/metricas";
import { GraficoBarras } from "@/components/admin/GraficoBarras";
import { GraficoArea } from "@/components/admin/GraficoArea";
import { EstadoVazio } from "@/components/admin/EstadoVazio";

const PERIODOS: Periodo[] = ["7", "30", "90", "tudo"];

function ehPeriodoValido(v: string | undefined): v is Periodo {
  return !!v && (PERIODOS as string[]).includes(v);
}

function hrefFiltro(periodo: Periodo, curso: string | undefined): string {
  const params = new URLSearchParams({ periodo });
  if (curso) params.set("curso", curso);
  return `/admin?${params.toString()}`;
}

function hrefCsv(bloco: string, periodo: Periodo, curso?: string): string {
  const params = new URLSearchParams({ bloco, periodo });
  if (curso) params.set("curso", curso);
  return `/admin/metricas-csv?${params.toString()}`;
}

const classeLinkCsv =
  "shrink-0 rounded-control border border-line-strong px-4 py-2 text-xs font-medium text-fg-muted transition-colors hover:border-fg hover:text-fg";

/**
 * Painel do admin. Ordem de leitura: os cinco números que resumem o negócio,
 * o tráfego do site (de onde vem gente), as séries da plataforma (cadastro e
 * atividade), e o detalhe por curso (conclusão + funil). Os blocos entram em
 * cascata (.painel-entra) na mesma ordem - hierarquia, não decoração.
 */
export default async function PaginaAdmin({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; curso?: string }>;
}) {
  const { periodo: periodoParam, curso: cursoParam } = await searchParams;
  const periodo: Periodo = ehPeriodoValido(periodoParam) ? periodoParam : "30";

  const [dadosResumo, series, conclusao, trafego] = await Promise.all([
    resumo(periodo),
    seriesSemanais(periodo),
    conclusaoPorCurso(),
    trafegoDoSite(periodo),
  ]);

  const cursoAtual = conclusao.find((c) => c.slug === cursoParam)?.slug ?? conclusao[0]?.slug;
  const funil = cursoAtual ? await funilDoCurso(cursoAtual) : null;
  const maximoFunil = funil?.length ? Math.max(...funil.map((f) => f.concluiram), 1) : 1;

  const t = admin.metricas;
  const maiorRota = Math.max(...trafego.porRota.map((l) => l.visitas), 1);

  const cartoes: { rotulo: string; valor: number }[] = [
    { rotulo: t.cartoes.alunosTotais, valor: dadosResumo.alunosTotais },
    { rotulo: t.cartoes.novos, valor: dadosResumo.novos },
    { rotulo: t.cartoes.assinaturasAtivas, valor: dadosResumo.assinaturasAtivas },
    { rotulo: t.cartoes.alunosAtivos, valor: dadosResumo.alunosAtivos },
    { rotulo: t.cartoes.aulasConcluidas, valor: dadosResumo.aulasConcluidas },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div className="painel-entra flex flex-wrap items-center justify-between gap-4" style={{ "--i": 0 } as React.CSSProperties}>
        <h1 className="text-3xl font-medium tracking-[-0.03em]">{t.titulo}</h1>
        <nav aria-label={t.periodo.rotulo} className="flex gap-1">
          {PERIODOS.map((p) => (
            <Link
              key={p}
              href={hrefFiltro(p, cursoAtual)}
              aria-current={p === periodo ? "page" : undefined}
              className={`rounded-control px-4 py-2 text-sm font-medium transition-colors ${
                p === periodo ? "bg-accent text-accent-on" : "text-fg-muted hover:text-fg"
              }`}
            >
              {t.periodo[p]}
            </Link>
          ))}
        </nav>
      </div>

      {/* Os cinco números, em colunas de filete - sem caixa: a régua agrupa e o
          tamanho tipográfico hierarquiza, mesma gramática do site. */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
        {cartoes.map((c, i) => (
          <div
            key={c.rotulo}
            className="painel-entra flex flex-col gap-2 border-t border-line-strong pt-4"
            style={{ "--i": i + 1 } as React.CSSProperties}
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-muted">{c.rotulo}</p>
            <p className="tnum text-3xl font-medium tracking-[-0.02em] text-fg">{c.valor}</p>
          </div>
        ))}
      </div>

      <section className="painel-entra flex flex-col gap-4 border border-line p-6" style={{ "--i": 6 } as React.CSSProperties}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="font-medium text-fg">{t.trafego.titulo}</p>
          {trafego.total > 0 ? (
            <p className="tnum font-mono text-[11px] uppercase tracking-[0.14em] text-fg-muted">
              {t.trafego.total}: <span className="text-fg">{trafego.total}</span>
            </p>
          ) : null}
        </div>
        {trafego.porDia.length === 0 ? (
          <EstadoVazio titulo={t.trafego.vazio.titulo} texto={t.trafego.vazio.texto} />
        ) : (
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <GraficoArea pontos={trafego.porDia} rotulo={t.trafego.titulo} />
            </div>
            <div className="lg:col-span-4">
              <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-fg-muted">{t.trafego.porPagina}</p>
              <ul className="flex flex-col gap-4">
                {trafego.porRota.map((linha) => (
                  <li key={linha.rota} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between gap-4 text-sm">
                      <span className="text-fg">{t.trafego.rotas[linha.rota] ?? linha.rota}</span>
                      <span className="tnum shrink-0 font-mono text-[11px] text-fg-muted">{linha.visitas}</span>
                    </div>
                    <div
                      aria-hidden="true"
                      className="h-1 bg-accent"
                      style={{ width: `${Math.max(Math.round((linha.visitas / maiorRota) * 100), 2)}%` }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="painel-entra flex flex-col gap-4 border border-line p-6" style={{ "--i": 7 } as React.CSSProperties}>
          <div className="flex items-center justify-between gap-4">
            <p className="font-medium text-fg">{t.graficos.cadastros}</p>
            <a href={hrefCsv("cadastros", periodo)} className={classeLinkCsv}>
              {t.exportarCsv}
            </a>
          </div>
          <GraficoBarras pontos={series.cadastros} rotulo={t.graficos.cadastros} />
        </div>
        <div className="painel-entra flex flex-col gap-4 border border-line p-6" style={{ "--i": 8 } as React.CSSProperties}>
          <div className="flex items-center justify-between gap-4">
            <p className="font-medium text-fg">{t.graficos.atividade}</p>
            <a href={hrefCsv("atividade", periodo)} className={classeLinkCsv}>
              {t.exportarCsv}
            </a>
          </div>
          <GraficoBarras pontos={series.atividade} rotulo={t.graficos.atividade} />
        </div>
      </section>

      <section className="painel-entra flex flex-col gap-4 border border-line p-6" style={{ "--i": 9 } as React.CSSProperties}>
        <div className="flex items-center justify-between gap-4">
          <p className="font-medium text-fg">{t.conclusao.titulo}</p>
          <a href={hrefCsv("conclusao", periodo)} className={classeLinkCsv}>
            {t.exportarCsv}
          </a>
        </div>
        {conclusao.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left font-mono text-[11px] uppercase tracking-[0.14em] text-fg-muted">
                  <th className="px-0 py-3 font-normal">{t.conclusao.curso}</th>
                  <th className="px-4 py-3 font-normal">{t.conclusao.comecaram}</th>
                  <th className="px-4 py-3 font-normal">{t.conclusao.concluiram}</th>
                  <th className="px-4 py-3 font-normal">{t.conclusao.percentual}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {conclusao.map((c) => (
                  <tr key={c.slug} className="transition-colors hover:bg-surface">
                    <td className="px-0 py-3 text-fg">{c.titulo}</td>
                    <td className="tnum px-4 py-3 text-fg-muted">{c.comecaram}</td>
                    <td className="tnum px-4 py-3 text-fg-muted">{c.concluiram}</td>
                    <td className="tnum px-4 py-3 text-fg-muted">{c.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EstadoVazio titulo={t.conclusao.vazio} texto={t.semDados} />
        )}
      </section>

      <section className="painel-entra flex flex-col gap-4 border border-line p-6" style={{ "--i": 10 } as React.CSSProperties}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="font-medium text-fg">{t.funil.titulo}</p>
          {cursoAtual ? (
            <a href={hrefCsv("funil", periodo, cursoAtual)} className={classeLinkCsv}>
              {t.exportarCsv}
            </a>
          ) : null}
        </div>

        {conclusao.length > 1 ? (
          <nav aria-label={t.conclusao.curso} className="flex flex-wrap gap-1">
            {conclusao.map((c) => (
              <Link
                key={c.slug}
                href={hrefFiltro(periodo, c.slug)}
                aria-current={c.slug === cursoAtual ? "page" : undefined}
                className={`rounded-control px-3 py-1.5 text-xs font-medium transition-colors ${
                  c.slug === cursoAtual ? "bg-accent text-accent-on" : "border border-line-strong text-fg-muted hover:text-fg"
                }`}
              >
                {c.titulo}
              </Link>
            ))}
          </nav>
        ) : null}

        {!cursoAtual ? (
          <p className="text-fg-muted">{t.funil.semCurso}</p>
        ) : funil && funil.length ? (
          <ul className="flex flex-col gap-3">
            {funil.map((f) => (
              <li key={f.ordemGlobal} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-fg">
                    {f.ordemGlobal}. {f.aula}
                    <span className="ml-2 text-fg-subtle">{f.modulo}</span>
                  </span>
                  <span className="tnum shrink-0 font-mono text-[11px] text-fg-muted">{f.concluiram}</span>
                </div>
                <div className="h-2 w-full bg-line">
                  <div className="h-full bg-accent" style={{ width: `${Math.round((f.concluiram / maximoFunil) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-fg-muted">{t.funil.vazio}</p>
        )}
      </section>
    </div>
  );
}
