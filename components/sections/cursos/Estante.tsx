import Image from "next/image";
import { Logo } from "@/components/ui/Logo";
import { LogoSolution } from "@/components/ui/LogoSolution";
import { cursos as t } from "@/lib/content";
import { FilmeHero } from "./FilmeHero";

/**
 * Hero da /cursos. Serviu o aviso de "em breve" da parceria IAgentics + Pecege
 * até 2026-10-14; agora abre a venda da assinatura da Solution, com o CTA que
 * leva ao formulário.
 *
 * À direita, desde 2026-10-14, o filme de propaganda aprovado pelo Rodrigo (o
 * conceito 4 de remotion/hero-cursos/, ConceitoMisto) no lugar da estante de
 * capas que subia em loop ("Prateleira viva"). O filme é decorativo: tudo o
 * que ele diz (preço, cursos, cancelamento) está escrito na coluna ao lado.
 */
export function CursosEstante() {
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
          <h1 className="mt-4 max-w-[24ch] text-3xl font-medium leading-[1.08] tracking-[-0.03em] text-fg [text-wrap:balance] sm:text-4xl lg:text-5xl">
            {t.hero.headline}
          </h1>
          <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-fg-muted">
            {t.hero.subtextAntes}
            {/* Link para o parceiro em aba nova: quem está lendo o anúncio não
                deveria perder a página para conhecer a plataforma. `noopener`
                é obrigatório com target=_blank — sem ele a página aberta ganha
                referência ao nosso window. */}
            <a
              href={t.hero.urlSolution}
              target="_blank"
              rel="noopener noreferrer"
              className="text-fg underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-fg"
            >
              {t.hero.subtextLink}
            </a>
            {t.hero.subtextDepois}
          </p>
          <p className="mt-4 max-w-[46ch] text-lg leading-relaxed text-fg-muted">{t.hero.subtextDois}</p>
          {/* Desde 2026-10-14 a página vende a assinatura: o CTA leva ao
              formulário, mais abaixo (a lista de espera saiu). */}
          <a
            href="#assinar"
            className="mt-8 inline-block rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-colors hover:bg-accent-hover active:translate-y-px"
          >
            {t.assinatura.cta}
          </a>
        </div>

        <div className="lg:col-span-7">
          <FilmeHero
            src={t.filmeHero.video}
            poster={t.filmeHero.poster}
            rotulos={{ pausar: t.filmeHero.pausar, continuar: t.filmeHero.continuar }}
          />
        </div>
      </div>
    </section>
  );
}
