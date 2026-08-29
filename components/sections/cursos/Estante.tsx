import Image from "next/image";
import { ListaEspera } from "@/components/sections/cursos/ListaEspera";
import { Logo } from "@/components/ui/Logo";
import { LogoSolution } from "@/components/ui/LogoSolution";
import { cursos as t } from "@/lib/content";

/**
 * Hero "Prateleira viva" (/cursos), agora servindo o aviso de "em breve" da
 * parceria IAgentics + Pecege.
 *
 * O layout é o mesmo de quando a página vendia a plataforma própria (pedido do
 * Rodrigo em 2026-08-28: "mantém a hero, troca o texto e tira os botões") — o
 * que mudou foi o conteúdo: dois logos no lugar do wordmark da Academy, o
 * anúncio no lugar da promessa de acervo, e nenhum CTA, porque não há nada
 * para clicar ainda.
 *
 * Motion: colunas em velocidades diferentes (e a do meio invertida) para a
 * estante parecer viva, não um bloco que desliza. CSS puro (.estante-rolagem);
 * em repouso é uma grade parada e completa — doutrina do site.
 *
 * A estante é decorativa para leitor de tela (role img + label): ela ilustra o
 * que a IAgentics já produziu, e as capas vêm de content.ts desde que o
 * catálogo saiu do banco.
 */
const DURACOES = ["72s", "88s", "80s"];

export function CursosEstante() {
  const colunas: string[][] = [[], [], []];
  t.capasEstante.forEach((capa, i) => colunas[i % 3].push(capa));

  return (
    <section className="overflow-hidden border-b border-line">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-12 lg:gap-10 lg:py-24">
        <div className="lg:col-span-5">
          {/* As TRÊS marcas na abertura, e a ordem conta uma frase: quem
              produz (IAgentics), com quem (Pecege) e onde vai estar
              (Solution).

              Cada uma é dimensionada pelo eixo que respeita sua proporção
              nativa: IAgentics 4,25:1 e Solution 3:1 são horizontais e vão por
              LARGURA; o Pecege é empilhado (1,86:1 — símbolo em cima, palavra
              embaixo) e vai por ALTURA. Igualar altura nas três deixaria a
              palavra "pecege" com um terço dela, ilegível; igualar largura
              faria o Pecege dominar a linha. As medidas abaixo dão peso visual
              equivalente às três.

              IAgentics e Solution são inline (máscara CSS e SVG com
              currentColor) porque os arquivos originais trazem o texto em
              branco e sumiriam no tema claro. O do Pecege já é colorido e
              funciona nos dois temas, então continua <Image>. */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-5 sm:gap-x-5">
            <Logo label={t.hero.logoIagenticsAlt} className="w-[124px] sm:w-[136px]" />
            <span aria-hidden="true" className="hidden h-9 w-px shrink-0 bg-line-strong sm:block" />
            <Image
              src="/partner-pecege.png"
              alt={t.hero.logoPecegeAlt}
              width={500}
              height={269}
              priority
              className="h-12 w-auto sm:h-[52px]"
            />
            <span aria-hidden="true" className="hidden h-9 w-px shrink-0 bg-line-strong sm:block" />
            <LogoSolution label={t.hero.logoSolutionAlt} className="w-[118px] sm:w-[130px]" />
          </div>

          <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.24em] text-fg-muted">{t.hero.eyebrow}</p>
          <h1 className="mt-4 max-w-[14ch] text-4xl font-medium leading-[1.05] tracking-[-0.03em] text-fg sm:text-5xl lg:text-6xl">
            {t.hero.headline}
          </h1>
          <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-fg-muted">{t.hero.subtext}</p>
          <p className="mt-4 max-w-[46ch] text-lg leading-relaxed text-fg-muted">{t.hero.subtextDois}</p>
          <ListaEspera />
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
                    coluna.map((capa) => (
                      <div
                        key={`${copia}-${capa}`}
                        className="relative aspect-[3/4] w-full shrink-0 overflow-hidden border border-line bg-surface"
                      >
                        <Image
                          src={capa}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 260px, 33vw"
                          priority={copia === 0 && i === 0 && capa === coluna[0]}
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
