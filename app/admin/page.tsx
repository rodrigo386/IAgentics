import Link from "next/link";
import { admin } from "@/lib/content-admin";
import {
  analiticoDoApp,
  analiticoDoSite,
  conclusaoPorCurso,
  funilDoCurso,
  resumo,
  seriesSemanais,
  trafegoDoSite,
  type Periodo,
} from "@/lib/admin/metricas";
import { GraficoBarras } from "@/components/admin/GraficoBarras";
import { GraficoArea } from "@/components/admin/GraficoArea";
import { EstadoVazio } from "@/components/admin/EstadoVazio";
import { FunilNegocio } from "@/components/admin/FunilNegocio";
import { Variacao } from "@/components/admin/Variacao";

const PERIODOS: Periodo[] = ["7", "30", "90", "tudo"];
type Aba = "app" | "site";

function ehPeriodoValido(v: string | undefined): v is Periodo {
  return !!v && (PERIODOS as string[]).includes(v);
}

/* Filtros (aba, período, curso) navegam por <a> NATIVO, não <Link>: navegação
   só-de-querystring via roteador do cliente nesta página morria de forma
   intermitente no Next 15.5 (fetch RSC abortado sem erro; diagnóstico de
   2026-08-15, cresce com o tamanho do payload). Âncora nativa = recarga de
   documento, determinística, e o admin é server-first de qualquer jeito. */
function hrefFiltro(aba: Aba, periodo: Periodo, curso?: string): string {
  const params = new URLSearchParams({ aba, periodo });
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

function CartaoKpi({
  rotulo,
  valor,
  variacao,
  nota,
  indice,
}: {
  rotulo: string;
  valor: string | number;
  variacao?: { atual: number; anterior: number | null };
  nota?: string;
  indice: number;
}) {
  return (
    <div
      className="painel-entra flex flex-col gap-2 border-t border-line-strong pt-4"
      style={{ "--i": indice } as React.CSSProperties}
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-muted">{rotulo}</p>
      <p className="flex flex-wrap items-baseline gap-2">
        <span title={nota} className="tnum text-3xl font-medium tracking-[-0.02em] text-fg">
          {valor}
        </span>
        {variacao ? <Variacao atual={variacao.atual} anterior={variacao.anterior} /> : null}
      </p>
    </div>
  );
}

/**
 * Painel do admin em duas abas server-first (links, como o filtro de período):
 * APP é o negócio (alunos, assinaturas, receita, engajamento, conteúdo);
 * SITE é o topo do funil (tráfego por dia e página, e o funil que liga visita
 * a assinatura). Toda métrica vem de tabela real - a única aritmética é o MRR,
 * declarado no próprio cartão (title) como ativas × R$ 39,90.
 */
export default async function PaginaAdmin({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; curso?: string; aba?: string }>;
}) {
  const { periodo: periodoParam, curso: cursoParam, aba: abaParam } = await searchParams;
  const periodo: Periodo = ehPeriodoValido(periodoParam) ? periodoParam : "30";
  const aba: Aba = abaParam === "site" ? "site" : "app";
  const t = admin.metricas;

  // Dados aguardados AQUI e filhos chamados como função (síncronos no fluxo):
  // com filho async no JSX a página vira resposta STREAMADA, e o Next 15.5
  // abortava de forma intermitente o fetch RSC de navegações só-de-querystring
  // disparadas dela - clique no filtro de período morria sem erro nenhum
  // (diagnóstico de 2026-08-15: ERR_ABORTED no /admin?periodo=7&_rsc=...).
  // O skeleton de loading.tsx segue cobrindo a espera; o streaming aqui não
  // pagava nada. NÃO voltar a <AbaApp/> como elemento async sem re-testar o
  // clique de período repetidas vezes.
  const conteudo = aba === "app" ? await AbaApp({ periodo, cursoParam }) : await AbaSite({ periodo });

  return (
    <div className="flex flex-col gap-10">
      <div className="painel-entra flex flex-wrap items-center justify-between gap-4" style={{ "--i": 0 } as React.CSSProperties}>
        <div className="flex flex-wrap items-center gap-5">
          <h1 className="text-3xl font-medium tracking-[-0.03em]">{t.titulo}</h1>
          <nav aria-label={t.abas.rotulo} className="flex gap-1 border border-line p-1">
            {(["app", "site"] as const).map((a) => (
              <a
                key={a}
                href={hrefFiltro(a, periodo, a === "app" ? cursoParam : undefined)}
                aria-current={a === aba ? "page" : undefined}
                className={`rounded-control px-4 py-1.5 text-sm font-medium transition-colors ${
                  a === aba ? "bg-accent text-accent-on" : "text-fg-muted hover:text-fg"
                }`}
              >
                {t.abas[a]}
              </a>
            ))}
          </nav>
        </div>
        <nav aria-label={t.periodo.rotulo} className="flex gap-1">
          {PERIODOS.map((p) => (
            <a
              key={p}
              href={hrefFiltro(aba, p, cursoParam)}
              aria-current={p === periodo ? "page" : undefined}
              className={`rounded-control px-4 py-2 text-sm font-medium transition-colors ${
                p === periodo ? "bg-accent text-accent-on" : "text-fg-muted hover:text-fg"
              }`}
            >
              {t.periodo[p]}
            </a>
          ))}
        </nav>
      </div>

      {conteudo}
    </div>
  );
}

async function AbaApp({ periodo, cursoParam }: { periodo: Periodo; cursoParam?: string }) {
  const t = admin.metricas;
  const [dadosResumo, analitico, series, conclusao] = await Promise.all([
    resumo(periodo),
    analiticoDoApp(periodo),
    seriesSemanais(periodo),
    conclusaoPorCurso(),
  ]);
  const cursoAtual = conclusao.find((c) => c.slug === cursoParam)?.slug ?? conclusao[0]?.slug;
  const funil = cursoAtual ? await funilDoCurso(cursoAtual) : null;
  const maximoFunil = funil?.length ? Math.max(...funil.map((f) => f.concluiram), 1) : 1;
  const maiorTopAula = Math.max(...analitico.topAulas.map((a) => a.concluidas), 1);
  const mrrFormatado = analitico.mrr.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const saude: { rotulo: string; valor: number }[] = [
    { rotulo: t.saude.ativas, valor: analitico.status.ativas },
    { rotulo: t.saude.cortesias, valor: analitico.status.manuais },
    { rotulo: t.saude.novas, valor: analitico.novasAssinaturas },
    { rotulo: t.saude.pendentes, valor: analitico.status.pendentes },
    { rotulo: t.saude.inadimplentes, valor: analitico.status.inadimplentes },
    { rotulo: t.saude.canceladas, valor: analitico.status.canceladas },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
        <CartaoKpi rotulo={t.cartoes.alunosTotais} valor={dadosResumo.alunosTotais} indice={1} />
        <CartaoKpi
          rotulo={t.cartoes.novos}
          valor={dadosResumo.novos}
          variacao={{ atual: dadosResumo.novos, anterior: analitico.novosAnterior }}
          indice={2}
        />
        <CartaoKpi rotulo={t.cartoes.assinaturasAtivas} valor={dadosResumo.assinaturasAtivas} indice={3} />
        <CartaoKpi rotulo={t.cartoes.mrr} valor={mrrFormatado} nota={t.mrrNota} indice={4} />
        <CartaoKpi rotulo={t.cartoes.alunosAtivos} valor={dadosResumo.alunosAtivos} indice={5} />
        <CartaoKpi
          rotulo={t.cartoes.aulasConcluidas}
          valor={dadosResumo.aulasConcluidas}
          variacao={{ atual: dadosResumo.aulasConcluidas, anterior: analitico.aulasConcluidasAnterior }}
          indice={6}
        />
        <CartaoKpi
          rotulo={t.cartoes.certificados}
          valor={analitico.certificados}
          variacao={{ atual: analitico.certificados, anterior: analitico.certificadosAnterior }}
          indice={7}
        />
      </div>

      <section className="painel-entra flex flex-col gap-4 border border-line p-6" style={{ "--i": 8 } as React.CSSProperties}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="font-medium text-fg">{t.saude.titulo}</p>
          <Link href="/admin/alunos" prefetch={false} className={classeLinkCsv}>
            {t.saude.verAlunos}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
          {saude.map((s) => (
            <div key={s.rotulo} className="flex flex-col gap-1">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-muted">{s.rotulo}</p>
              <p className="tnum text-xl font-medium text-fg">{s.valor}</p>
            </div>
          ))}
        </div>
        {analitico.pendentesConfirmacao > 0 ? (
          <p className="border-t border-line pt-4 text-sm text-fg-muted">
            <span className="tnum font-medium text-fg">{analitico.pendentesConfirmacao}</span> {t.saude.aguardandoConfirmacao}
          </p>
        ) : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="painel-entra flex flex-col gap-4 border border-line p-6" style={{ "--i": 9 } as React.CSSProperties}>
          <div className="flex items-center justify-between gap-4">
            <p className="font-medium text-fg">{t.graficos.cadastros}</p>
            <a href={hrefCsv("cadastros", periodo)} className={classeLinkCsv}>
              {t.exportarCsv}
            </a>
          </div>
          <GraficoBarras pontos={series.cadastros} rotulo={t.graficos.cadastros} />
        </div>
        <div className="painel-entra flex flex-col gap-4 border border-line p-6" style={{ "--i": 10 } as React.CSSProperties}>
          <div className="flex items-center justify-between gap-4">
            <p className="font-medium text-fg">{t.graficos.atividade}</p>
            <a href={hrefCsv("atividade", periodo)} className={classeLinkCsv}>
              {t.exportarCsv}
            </a>
          </div>
          <GraficoBarras pontos={series.atividade} rotulo={t.graficos.atividade} />
        </div>
      </section>

      <section className="painel-entra flex flex-col gap-4 border border-line p-6" style={{ "--i": 11 } as React.CSSProperties}>
        <p className="font-medium text-fg">{t.topAulas.titulo}</p>
        {analitico.topAulas.length ? (
          <ol className="flex flex-col gap-3">
            {analitico.topAulas.map((a) => (
              <li key={`${a.curso}-${a.aula}`} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-4 text-sm">
                  <span className="text-fg">
                    {a.aula}
                    <span className="ml-2 text-fg-subtle">{a.curso}</span>
                  </span>
                  <span className="tnum shrink-0 font-mono text-[11px] text-fg-muted">{a.concluidas}</span>
                </div>
                <div
                  aria-hidden="true"
                  className="h-1 bg-accent"
                  style={{ width: `${Math.max(Math.round((a.concluidas / maiorTopAula) * 100), 2)}%` }}
                />
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-fg-muted">{t.topAulas.vazio}</p>
        )}
      </section>

      <section className="painel-entra flex flex-col gap-4 border border-line p-6" style={{ "--i": 12 } as React.CSSProperties}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <p className="font-medium text-fg">{t.conclusao.titulo}</p>
            <p className="tnum font-mono text-[11px] uppercase tracking-[0.14em] text-fg-muted">
              {t.catalogo(analitico.catalogo.cursos, analitico.catalogo.aulas, analitico.catalogo.horas)}
            </p>
          </div>
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

      <section className="painel-entra flex flex-col gap-4 border border-line p-6" style={{ "--i": 13 } as React.CSSProperties}>
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
              <a
                key={c.slug}
                href={hrefFiltro("app", periodo, c.slug)}
                aria-current={c.slug === cursoAtual ? "page" : undefined}
                className={`rounded-control px-3 py-1.5 text-xs font-medium transition-colors ${
                  c.slug === cursoAtual ? "bg-accent text-accent-on" : "border border-line-strong text-fg-muted hover:text-fg"
                }`}
              >
                {c.titulo}
              </a>
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
    </>
  );
}

async function AbaSite({ periodo }: { periodo: Periodo }) {
  const t = admin.metricas;
  const [trafego, analitico] = await Promise.all([trafegoDoSite(periodo), analiticoDoSite(periodo)]);
  const maiorRota = Math.max(...trafego.porRota.map((l) => l.visitas), 1);
  const melhorDia = trafego.porDia.reduce<{ dia: string; valor: number } | null>(
    (melhor, p) => (melhor && melhor.valor >= p.valor ? melhor : p),
    null,
  );
  const ddmm = (dia: string) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;
  const paginaMaisVista = trafego.porRota[0] ? (t.trafego.rotas[trafego.porRota[0].rota] ?? trafego.porRota[0].rota) : null;

  return (
    <>
      <div className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3">
        <CartaoKpi
          rotulo={t.cartoes.visitas}
          valor={trafego.total}
          variacao={{ atual: trafego.total, anterior: analitico.visitasAnterior }}
          indice={1}
        />
        <CartaoKpi
          rotulo={t.cartoes.melhorDia}
          valor={melhorDia ? `${melhorDia.valor}` : "0"}
          nota={melhorDia ? ddmm(melhorDia.dia) : undefined}
          indice={2}
        />
        <CartaoKpi rotulo={t.cartoes.paginaMaisVista} valor={paginaMaisVista ?? "-"} indice={3} />
      </div>

      <section className="painel-entra flex flex-col gap-4 border border-line p-6" style={{ "--i": 4 } as React.CSSProperties}>
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

      <section className="painel-entra flex flex-col gap-4 border border-line p-6" style={{ "--i": 5 } as React.CSSProperties}>
        <p className="font-medium text-fg">{t.funilNegocio.titulo}</p>
        <FunilNegocio
          visitas={trafego.total}
          contas={analitico.contas}
          confirmadas={analitico.confirmadas}
          assinantes={analitico.novasAssinaturas}
        />
      </section>
    </>
  );
}
