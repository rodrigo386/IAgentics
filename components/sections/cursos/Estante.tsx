import Image from "next/image";
import Link from "next/link";
import { cursos as t } from "@/lib/content";
import type { Curso } from "@/lib/plataforma/tipos";

/**
 * Hero "Prateleira viva" (/cursos): o argumento à esquerda e o produto à
 * direita - as capas REAIS do catálogo subindo em loop contínuo, como uma
 * estante que não acaba. A capa é o único asset que prova o que a assinatura
 * contém, então ela É o visual do hero, não uma ilustração.
 *
 * Motion: colunas em velocidades diferentes (e a do meio invertida) para a
 * estante parecer viva, não um bloco que desliza. CSS puro (.estante-rolagem);
 * em repouso é uma grade parada e completa - doutrina do site.
 *
 * A estante é decorativa para leitor de tela (role img + label): os títulos e
 * dados de cada curso estão na seção Catálogo logo abaixo, uma vez só.
 */
const DURACOES = ["72s", "88s", "80s"];

export function CursosEstante({
  cursos,
  destino,
  assinante,
  logado,
}: {
  cursos: Curso[];
  destino: string;
  assinante: boolean;
  logado: boolean;
}) {
  const colunas: Curso[][] = [[], [], []];
  cursos.forEach((c, i) => colunas[i % 3].push(c));

  return (
    <section className="overflow-hidden border-b border-line">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-12 lg:gap-10 lg:py-24">
        <div className="lg:col-span-5">
          <h1 className="max-w-[14ch] text-4xl font-medium leading-[1.05] tracking-[-0.03em] text-fg sm:text-5xl lg:text-6xl">
            {t.hero.headline}
          </h1>
          <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-fg-muted">{t.hero.subtext}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            {assinante ? (
              <Link
                href="/app"
                className="rounded-control bg-accent px-8 py-4 font-medium text-accent-on transition-colors hover:bg-accent-hover active:translate-y-px"
              >
                {t.assinatura.irParaPlataforma}
              </Link>
            ) : (
              <Link
                href={destino}
                className="rounded-control bg-accent px-8 py-4 font-medium text-accent-on transition-colors hover:bg-accent-hover active:translate-y-px"
              >
                {t.assinatura.cta}
              </Link>
            )}
            {!logado && (
              <Link
                href="/app/entrar"
                className="rounded-control border border-line-strong px-8 py-4 font-medium text-fg transition-colors hover:border-fg active:translate-y-px"
              >
                {t.hero.jaSouAluno}
              </Link>
            )}
          </div>
        </div>

        <div
          role="img"
          aria-label={t.hero.estanteAlt}
          className="relative h-[360px] sm:h-[440px] lg:col-span-7 lg:h-[600px]"
        >
          <div className="grid h-full grid-cols-3 gap-4" aria-hidden="true">
            {colunas.map((coluna, i) => (
              <div key={i} className="overflow-hidden">
                <div
                  className={`flex flex-col gap-4 ${i === 1 ? "estante-rolagem estante-rolagem-inversa" : "estante-rolagem"}`}
                  style={{ "--estante-dur": DURACOES[i] } as React.CSSProperties}
                >
                  {/* Conteúdo duplicado: o keyframe percorre -50% e o loop emenda. */}
                  {[0, 1].map((copia) =>
                    coluna.map((curso) => (
                      <div
                        key={`${copia}-${curso.id}`}
                        className="relative aspect-[3/4] w-full shrink-0 overflow-hidden border border-line bg-surface"
                      >
                        <Image
                          src={curso.capaUrl}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 260px, 33vw"
                          priority={copia === 0 && coluna === colunas[0] && curso === coluna[0]}
                          className="object-cover"
                        />
                      </div>
                    )),
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* Véus de borda: a estante nasce e morre no fundo da página, nos dois temas. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-16"
            style={{ background: "linear-gradient(to bottom, var(--bg), transparent)" }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
            style={{ background: "linear-gradient(to top, var(--bg), transparent)" }}
          />
        </div>
      </div>
    </section>
  );
}
