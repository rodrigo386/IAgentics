import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { IndiceCurso } from "@/components/plataforma/IndiceCurso";
import { plataforma } from "@/lib/content-plataforma";
import { destinoCta } from "@/lib/admin/configuracoes";
import { buscarConcluidas, buscarCurso, temAcesso as verificarAcesso } from "@/lib/plataforma/dados";
import { derivarProgresso, proximaAula } from "@/lib/plataforma/progresso";

export default async function PaginaCurso({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sessao = await auth();
  // O middleware já barra /app sem sessão; esta checagem é defesa em profundidade,
  // no mesmo padrão do painel — sem ela, sessao.user.id não tipa como string.
  if (!sessao?.user?.id) redirect("/app/entrar");
  const userId = sessao.user.id;

  const curso = await buscarCurso(slug);
  if (!curso) notFound();

  const [concluidas, temAcesso, destino] = await Promise.all([
    buscarConcluidas(userId),
    verificarAcesso(userId),
    destinoCta(),
  ]);

  const aulaIds = curso.modulos.flatMap((m) => m.aulas.map((a) => a.id));
  const progresso = derivarProgresso(aulaIds, concluidas);
  const proxima = proximaAula(curso.modulos, concluidas);

  const t = plataforma.curso;

  return (
    <div className="flex flex-col gap-10">
      <header className="hero-editorial border border-line">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:gap-10 sm:p-8">
          <div className="relative aspect-[3/4] w-full max-w-[200px] shrink-0 overflow-hidden border border-line">
            <Image
              src={curso.capaUrl}
              alt=""
              fill
              sizes="200px"
              style={{ objectPosition: "center top" }}
              className="object-cover"
            />
          </div>
          <div className="flex flex-1 flex-col justify-center gap-4">
            <div>
              <nav className="text-sm text-fg-muted">
                <Link href="/app" className="hover:text-fg">
                  {plataforma.shell.meusCursos}
                </Link>
                <span aria-hidden> → </span>
                <span className="text-fg">{curso.titulo}</span>
              </nav>
              <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-fg-muted">
                {curso.nivel} · {curso.cargaHoras}
                {plataforma.painel.horas} · {aulaIds.length} {t.aulas}
              </p>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h1 className="text-3xl font-medium leading-snug tracking-[-0.03em] text-fg sm:text-4xl">{curso.titulo}</h1>
                {/* Selo só com aula de verdade concluída — mesma regra de antes (M1).
                    É o ponto de encaixe do botão "Ver certificado" do ciclo 2. */}
                {!proxima && aulaIds.length > 0 ? (
                  <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-text">
                    {plataforma.painel.cursoConcluido}
                  </span>
                ) : null}
              </div>
              <p className="mt-3 max-w-[65ch] text-fg-muted">{curso.descricao}</p>
            </div>
            <div className="flex flex-col gap-3">
              {progresso.total > 0 ? (
                <div data-testid="barra-progresso-curso" className="h-1 w-full max-w-[360px] bg-line">
                  <div className="h-full bg-accent" style={{ width: `${progresso.pct}%` }} />
                </div>
              ) : null}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <p className="text-sm text-fg-muted">
                  {progresso.total > 0 ? t.concluidaDe(progresso.feitas, progresso.total) : t.emProducao}
                </p>
                {proxima ? (
                  <Link
                    href={`/app/curso/${curso.slug}/${proxima.slug}`}
                    className="rounded-control bg-accent px-6 py-3 text-center font-medium text-accent-on transition-colors hover:bg-accent-hover"
                  >
                    {progresso.feitas > 0 ? t.continuar : t.comecar}
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </header>

      {!temAcesso ? (
        <section className="flex flex-col items-start gap-4 border border-line bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-fg">{plataforma.painel.seloAssine}</p>
          <a
            href={destino}
            className="rounded-control bg-accent px-6 py-2.5 text-sm font-medium text-accent-on transition-colors hover:bg-accent-hover"
          >
            {plataforma.painel.ctaAssinar}
          </a>
        </section>
      ) : null}

      <IndiceCurso cursoSlug={curso.slug} modulos={curso.modulos} concluidas={[...concluidas]} />
    </div>
  );
}
