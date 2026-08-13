import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CardCurso } from "@/components/plataforma/CardCurso";
import { plataforma } from "@/lib/content-plataforma";
import { destinoCta } from "@/lib/admin/configuracoes";
import {
  buscarCatalogo,
  buscarConcluidas,
  buscarCurso,
  buscarUltimaAula,
  temAcesso as verificarAcesso,
} from "@/lib/plataforma/dados";
import { derivarProgresso, proximaAula } from "@/lib/plataforma/progresso";
import type { Aula, Curso } from "@/lib/plataforma/tipos";

type InfoCurso = { pct: number; feitas: number; total: number; proxima: Aula | null };

/** Trilho horizontal do painel: rótulo mono + cards de largura fixa. Só
 *  renderiza se houver conteúdo (regra do spec). */
function Trilho({
  titulo,
  cursos,
  info,
  temAcesso,
  esmaecido = false,
}: {
  titulo: string;
  cursos: Curso[];
  info: Map<string, InfoCurso>;
  temAcesso: boolean;
  esmaecido?: boolean;
}) {
  if (cursos.length === 0) return null;
  return (
    <section className="mb-12">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{titulo}</p>
      <div className={`trilho mt-5 ${esmaecido ? "opacity-60" : ""}`}>
        {cursos.map((curso) => (
          <div key={curso.id} className="w-[220px] sm:w-[240px]">
            <CardCurso curso={curso} pct={info.get(curso.slug)?.pct ?? 0} temAcesso={temAcesso} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function Painel() {
  const sessao = await auth();
  // O middleware já barra /app sem sessão; defesa em profundidade, como antes.
  if (!sessao?.user?.id) redirect("/app/entrar");
  const userId = sessao.user.id;

  const [catalogo, concluidas, temAcesso, destino, ultima] = await Promise.all([
    buscarCatalogo(),
    buscarConcluidas(userId),
    verificarAcesso(userId),
    destinoCta(),
    buscarUltimaAula(userId),
  ]);

  const indices = await Promise.all(catalogo.map((c) => buscarCurso(c.slug)));
  const info = new Map<string, InfoCurso>();
  for (const indice of indices) {
    if (!indice) continue;
    const aulaIds = indice.modulos.flatMap((m) => m.aulas.map((a) => a.id));
    const progresso = derivarProgresso(aulaIds, concluidas);
    info.set(indice.slug, { ...progresso, proxima: proximaAula(indice.modulos, concluidas) });
  }

  // Hero "continuar": curso da última atividade, se ainda tem próxima aula;
  // senão o de maior progresso em (0,100); senão boas-vindas.
  let heroCurso = ultima ? catalogo.find((c) => c.slug === ultima.cursoSlug) : undefined;
  if (!heroCurso || !info.get(heroCurso.slug)?.proxima) {
    heroCurso = undefined;
    for (const curso of catalogo) {
      const i = info.get(curso.slug);
      if (i?.proxima && i.pct > 0 && i.pct < 100) {
        if (!heroCurso || i.pct > (info.get(heroCurso.slug)?.pct ?? 0)) heroCurso = curso;
      }
    }
  }
  const heroInfo = heroCurso ? info.get(heroCurso.slug) : undefined;
  // Boas-vindas: primeira formação com aulas; sem nenhuma, a primeira do catálogo.
  const boasVindas = catalogo.find((c) => (info.get(c.slug)?.total ?? 0) > 0) ?? catalogo[0];

  const porEstado = (f: (i: InfoCurso) => boolean) => catalogo.filter((c) => {
    const i = info.get(c.slug);
    return i ? f(i) : false;
  });
  const emAndamento = porEstado((i) => i.total > 0 && i.pct > 0 && i.pct < 100);
  const formacoes = porEstado((i) => i.total > 0);
  const concluidos = porEstado((i) => i.total > 0 && i.pct === 100);
  const emGravacao = porEstado((i) => i.total === 0);

  const t = plataforma.painel;

  return (
    <div>
      <h1 className="sr-only">{plataforma.shell.meusCursos}</h1>

      {heroCurso && heroInfo?.proxima ? (
        <section className="hero-editorial mb-12 border border-line">
          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:gap-10 sm:p-8">
            {/* Navegação redundante: o CTA ao lado já cobre; fora da árvore de foco/leitura. */}
            <Link
              href={`/app/curso/${heroCurso.slug}`}
              aria-hidden
              tabIndex={-1}
              className="relative aspect-[3/4] w-full max-w-[200px] shrink-0 overflow-hidden border border-line"
            >
              <Image
                src={heroCurso.capaUrl}
                alt=""
                fill
                sizes="200px"
                style={{ objectPosition: "center top" }}
                className="object-cover"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent-text">{t.continuar}</p>
              <h2 className="mt-3 text-2xl font-medium leading-tight tracking-[-0.03em] text-fg sm:text-4xl">
                {heroCurso.titulo}
              </h2>
              <p className="mt-2 text-sm text-fg-muted">
                {plataforma.curso.concluidaDe(heroInfo.feitas, heroInfo.total)}
              </p>
              <div className="mt-5 h-1 w-full max-w-[360px] bg-line">
                <div className="h-full bg-accent" style={{ width: `${heroInfo.pct}%` }} />
              </div>
              <Link
                href={`/app/curso/${heroCurso.slug}/${heroInfo.proxima.slug}`}
                className="mt-6 inline-block max-w-full truncate rounded-control bg-accent px-7 py-3 font-medium text-accent-on transition-colors hover:bg-accent-hover"
              >
                {t.continuarAula(heroInfo.proxima.titulo)}
              </Link>
            </div>
          </div>
        </section>
      ) : boasVindas ? (
        <section className="hero-editorial mb-12 border border-line">
          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:gap-10 sm:p-8">
            {/* Navegação redundante: o CTA ao lado já cobre; fora da árvore de foco/leitura. */}
            <Link
              href={`/app/curso/${boasVindas.slug}`}
              aria-hidden
              tabIndex={-1}
              className="relative aspect-[3/4] w-full max-w-[200px] shrink-0 overflow-hidden border border-line"
            >
              <Image
                src={boasVindas.capaUrl}
                alt=""
                fill
                sizes="200px"
                style={{ objectPosition: "center top" }}
                className="object-cover"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent-text">{t.boasVindas}</p>
              <h2 className="mt-3 text-2xl font-medium leading-tight tracking-[-0.03em] text-fg sm:text-4xl">
                {boasVindas.titulo}
              </h2>
              <p className="mt-2 max-w-[55ch] text-sm text-fg-muted">{t.boasVindasTexto}</p>
              <Link
                href={`/app/curso/${boasVindas.slug}`}
                className="mt-6 inline-block rounded-control bg-accent px-7 py-3 font-medium text-accent-on transition-colors hover:bg-accent-hover"
              >
                {plataforma.curso.comecar}
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {!temAcesso ? (
        <section className="mb-10 flex flex-col items-start gap-4 border border-line bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-fg">{t.seloAssine}</p>
          <a
            href={destino}
            className="rounded-control bg-accent px-6 py-2.5 text-sm font-medium text-accent-on transition-colors hover:bg-accent-hover"
          >
            {t.ctaAssinar}
          </a>
        </section>
      ) : null}

      <Trilho titulo={t.emAndamento} cursos={emAndamento} info={info} temAcesso={temAcesso} />
      <Trilho titulo={t.formacoes} cursos={formacoes} info={info} temAcesso={temAcesso} />
      <Trilho titulo={t.concluidos} cursos={concluidos} info={info} temAcesso={temAcesso} />
      <Trilho titulo={t.emGravacao} cursos={emGravacao} info={info} temAcesso={temAcesso} esmaecido />
    </div>
  );
}
