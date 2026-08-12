import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CardCurso } from "@/components/plataforma/CardCurso";
import { plataforma } from "@/lib/content-plataforma";
import { destinoCta } from "@/lib/admin/configuracoes";
import { buscarCatalogo, buscarConcluidas, buscarCurso, temAcesso as verificarAcesso } from "@/lib/plataforma/dados";
import { derivarProgresso, proximaAula } from "@/lib/plataforma/progresso";
import type { Aula, Curso } from "@/lib/plataforma/tipos";

export default async function Painel() {
  const sessao = await auth();
  // O middleware já barra /app sem sessão; esta checagem é defesa em profundidade,
  // não o portão principal — sem ela, sessao.user.id não tipa como string.
  if (!sessao?.user?.id) redirect("/app/entrar");
  const userId = sessao.user.id;

  // Fonte de verdade única: temAcesso(userId) de dados.ts, não uma comparação
  // local reimplementada (subscriptions guarda histórico; "ativa"/"manual" só
  // conta na linha mais recente, e só dados.ts sabe fazer essa checagem direito).
  const [catalogo, concluidas, temAcesso, destino] = await Promise.all([
    buscarCatalogo(),
    buscarConcluidas(userId),
    verificarAcesso(userId),
    destinoCta(),
  ]);

  // Índice de cada curso do catálogo, para derivar pct e "próxima aula" por curso.
  const indices = await Promise.all(catalogo.map((c) => buscarCurso(c.slug)));
  const progressoPorCurso = new Map<string, { pct: number; proxima: Aula | null }>();
  for (const indice of indices) {
    if (!indice) continue;
    const aulaIds = indice.modulos.flatMap((m) => m.aulas.map((a) => a.id));
    const progresso = derivarProgresso(aulaIds, concluidas);
    progressoPorCurso.set(indice.slug, { pct: progresso.pct, proxima: proximaAula(indice.modulos, concluidas) });
  }

  // "Continue de onde parou": maior progresso entre 0 e 100 exclusive.
  let continuar: { curso: Curso; aula: Aula; pct: number } | null = null;
  for (const curso of catalogo) {
    const p = progressoPorCurso.get(curso.slug);
    if (p && p.proxima && p.pct > 0 && p.pct < 100 && (!continuar || p.pct > continuar.pct)) {
      continuar = { curso, aula: p.proxima, pct: p.pct };
    }
  }

  return (
    <div>
      <h1 className="sr-only">{plataforma.shell.meusCursos}</h1>

      {continuar ? (
        <section className="mb-12">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">
            {plataforma.painel.continuar}
          </p>
          <Link
            href={`/app/curso/${continuar.curso.slug}/${continuar.aula.slug}`}
            className="mt-4 flex flex-col gap-5 border border-line bg-surface p-5 transition-colors hover:border-line-strong sm:flex-row sm:items-center"
          >
            <div className="relative aspect-[3/4] w-full max-w-[160px] shrink-0 overflow-hidden border border-line">
              <Image
                src={continuar.curso.capaUrl}
                alt=""
                fill
                sizes="160px"
                style={{ objectPosition: "center top" }}
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-fg-muted">{continuar.curso.titulo}</p>
              <h2 className="mt-1 text-xl font-medium leading-snug tracking-[-0.02em] text-fg">
                {continuar.aula.titulo}
              </h2>
              <div className="mt-4 h-1 w-full max-w-[320px] bg-line">
                <div className="h-full bg-accent" style={{ width: `${continuar.pct}%` }} />
              </div>
            </div>
          </Link>
        </section>
      ) : null}

      {!temAcesso ? (
        <section className="mb-10 flex flex-col items-start gap-4 border border-line bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-fg">{plataforma.painel.seloAssine}</p>
          <a
            href={destino}
            className="rounded-control bg-accent px-6 py-2.5 text-sm font-medium text-accent-on transition-colors hover:bg-accent-hover"
          >
            {plataforma.painel.ctaAssinar}
          </a>
        </section>
      ) : null}

      <section>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{plataforma.painel.catalogo}</p>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {catalogo.map((curso) => (
            <CardCurso key={curso.id} curso={curso} pct={progressoPorCurso.get(curso.slug)?.pct ?? 0} temAcesso={temAcesso} />
          ))}
        </div>
      </section>
    </div>
  );
}
