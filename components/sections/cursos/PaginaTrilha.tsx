import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { cursos } from "@/lib/content";
import { BASE_TRILHAS, dadosDaTrilha } from "@/lib/cursos-trilhas";

/**
 * Página de uma trilha da Solution (2026-11-25, plano de SEO da /cursos). Os
 * cursos, professores e o "em breve" vêm da vitrine (`cursos.vitrine`), a
 * moldura de `cursos.paginasTrilha`. Nasce em /preview/cursos/<slug>; quando
 * o Rodrigo aprovar, troque BASE_TRILHAS para "/cursos" e mova a rota.
 */
const t = cursos.paginasTrilha;

export function PaginaTrilha({ slug }: { slug: string }) {
  const d = dadosDaTrilha(slug);
  if (!d) return null;
  const { pagina } = d;
  const outras = t.itens.filter((i) => i.slug !== slug);
  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:py-20">
          <nav aria-label="Trilha de navegação" className="text-sm text-fg-muted">
            <Link href="/cursos" className="underline decoration-line-strong underline-offset-4 hover:text-fg">
              {t.migalha}
            </Link>
            <span aria-hidden="true"> / </span>
            <span aria-current="page">{pagina.linha}</span>
          </nav>
          <h1 className="mt-6 max-w-[24ch] text-3xl font-medium leading-[1.08] tracking-[-0.03em] text-fg [text-wrap:balance] sm:text-4xl lg:text-5xl">
            {pagina.titulo}
          </h1>
          <p className="mt-6 max-w-[60ch] text-lg leading-relaxed text-fg-muted">{pagina.intro}</p>
          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">
            {d.publicados > 0 ? t.publicados(d.publicados) : null}
            {d.publicados > 0 && d.emBreve > 0 ? " · " : null}
            {d.emBreve > 0 ? t.emBreve(d.emBreve) : null}
          </p>
          <a
            href="/cursos#assinar"
            className="mt-8 inline-block rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-colors hover:bg-accent-hover active:translate-y-px"
          >
            {cursos.assinatura.cta}
          </a>
          <p className="mt-3 text-sm text-fg-muted">{cursos.assinatura.porDia}</p>
        </div>
      </section>

      <section aria-labelledby="lista-cursos" className="py-20 sm:py-24">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <h2 id="lista-cursos" className="text-2xl font-medium tracking-[-0.02em] text-fg sm:text-3xl">
            {t.listaTitulo}
          </h2>
          <ul className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
            {d.cursos.map((c) => (
              <li key={c.nome}>
                {/* Capa decorativa: o nome e o professor estão em texto logo abaixo. */}
                <div className="relative aspect-[306/466] overflow-hidden rounded-[10px] bg-brand-ink">
                  <Image src={c.capa} alt="" fill sizes="(min-width: 1024px) 240px, (min-width: 640px) 30vw, 45vw" className="object-cover" />
                </div>
                <h3 className="mt-3 text-base font-medium leading-snug text-fg">{c.nome}</h3>
                <p className="mt-1 text-sm text-fg-muted">{c.emBreve ? cursos.vitrine.emBreve : c.professor}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="outras-trilhas" className="border-t border-line py-20 sm:py-24">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <h2 id="outras-trilhas" className="text-2xl font-medium tracking-[-0.02em] text-fg sm:text-3xl">
            {t.outrasTitulo}
          </h2>
          <ul className="mt-8 grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
            {outras.map((o) => (
              <li key={o.slug} className="border-t border-line-strong">
                <Link href={`${BASE_TRILHAS}/${o.slug}`} className="group flex items-center justify-between gap-4 py-5 text-lg text-fg">
                  {o.titulo}
                  <ArrowRight size={18} aria-hidden="true" className="shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
