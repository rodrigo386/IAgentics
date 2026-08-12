import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { IndiceCurso } from "@/components/plataforma/IndiceCurso";
import { PlayerAula } from "@/components/plataforma/PlayerAula";
import { plataforma } from "@/lib/content-plataforma";
import { buscarConcluidas, buscarCurso, buscarMidia, podeVerAula } from "@/lib/plataforma/dados";

export default async function PaginaAula({
  params,
}: {
  params: Promise<{ slug: string; aula: string }>;
}) {
  const { slug, aula: aulaSlug } = await params;
  const sessao = await auth();
  // O middleware já barra /app sem sessão; esta checagem é defesa em profundidade,
  // mesmo padrão do painel e da página do curso — sem ela, sessao.user.id não tipa como string.
  if (!sessao?.user?.id) redirect("/app/entrar");
  const userId = sessao.user.id;

  const curso = await buscarCurso(slug);
  if (!curso) notFound();

  // Sequência única módulo/ordem → aula/ordem: fonte tanto da aula atual quanto
  // da "próxima" para navegação. NÃO é proximaAula() de progresso.ts — aquela
  // devolve a próxima aula NÃO CONCLUÍDA (retomada); aqui é a próxima da
  // sequência, sempre, mesmo que o aluno já tenha assistido.
  const sequencia = [...curso.modulos]
    .sort((a, b) => a.ordem - b.ordem)
    .flatMap((m) => [...m.aulas].sort((x, y) => x.ordem - y.ordem));
  const indiceAtual = sequencia.findIndex((a) => a.slug === aulaSlug);
  if (indiceAtual === -1) notFound();
  const aula = sequencia[indiceAtual];
  const proxima = sequencia[indiceAtual + 1] ?? null;
  const hrefProxima = proxima ? `/app/curso/${curso.slug}/${proxima.slug}` : null;

  // Fix round final (I3): "sem acesso" (trava de assinatura) e "sem vídeo
  // cadastrado ainda" (aula publicada, lesson_media sem linha) são estados
  // diferentes e não podem cair no mesmo cartão de venda — quem JÁ é
  // assinante não deve ver CTA pedindo pra assinar de novo. podeVerAula
  // decide isso SEM tocar em lesson_media; só se ela liberar é que
  // buscarMidia é chamada para saber se o vídeo já existe.
  const [concluidas, podeVer] = await Promise.all([buscarConcluidas(userId), podeVerAula(userId, aula.id)]);
  const midia = podeVer ? await buscarMidia(userId, aula.id) : null;

  const t = plataforma.aula;

  return (
    <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-10">
      <div className="min-w-0">
        {!podeVer ? (
          // A página NUNCA é 404 por causa da trava de assinatura — a URL
          // compartilhada continua abrindo e vendendo o curso.
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 border border-line bg-brand-ink px-6 text-center text-brand-paper">
            <h2 className="text-xl font-medium leading-snug tracking-[-0.02em]">{t.bloqueadaTitulo}</h2>
            <p className="max-w-[45ch] text-brand-paper/80">{t.bloqueadaTexto}</p>
            <a
              href="/academy#contato"
              className="rounded-control bg-accent px-6 py-3 font-medium text-accent-on transition-colors hover:bg-accent-hover"
            >
              {t.bloqueadaCta}
            </a>
          </div>
        ) : midia ? (
          <PlayerAula
            videoId={midia.videoId}
            lessonId={aula.id}
            jaConcluida={concluidas.has(aula.id)}
            hrefProxima={hrefProxima}
          />
        ) : (
          // Aula com acesso liberado mas ainda sem vídeo cadastrado: quem já
          // tem acesso não leva cartão de venda, só um aviso discreto.
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 border border-line bg-surface px-6 text-center text-fg-muted">
            <p>{t.semVideo}</p>
          </div>
        )}

        <div className="mt-6">
          <h1 className="text-2xl font-medium leading-snug tracking-[-0.02em] text-fg">{aula.titulo}</h1>
          <p className="mt-3 max-w-[65ch] text-fg-muted">{aula.descricao}</p>
        </div>

        <details className="mt-8 border border-line lg:hidden">
          <summary className="cursor-pointer px-4 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">
            {t.aulasDoCurso}
          </summary>
          <div className="border-t border-line px-4 py-4">
            <IndiceCurso cursoSlug={curso.slug} modulos={curso.modulos} concluidas={[...concluidas]} aulaAtualId={aula.id} />
          </div>
        </details>
      </div>

      <aside className="hidden lg:block">
        <IndiceCurso cursoSlug={curso.slug} modulos={curso.modulos} concluidas={[...concluidas]} aulaAtualId={aula.id} />
      </aside>
    </div>
  );
}
