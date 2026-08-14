import Link from "next/link";
import { Check } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/ui/Reveal";
import { cursos as t } from "@/lib/content";

/**
 * A banda de decisão: preço e o que ele destrava, num bloco só (mesma banda
 * de tinta do /nexo - .assurance-band - porque aqui também é a seção que
 * fecha o argumento). O funil é o contrato herdado do antigo /planos:
 * `destino` já vem resolvido por sessão da página.
 */
export function CursosAssinatura({ destino, assinante }: { destino: string; assinante: boolean }) {
  return (
    <section id="assinar" className="assurance-band py-20 sm:py-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10">
          <Reveal className="lg:col-span-6 lg:self-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] opacity-60">{t.assinatura.eyebrow}</p>
            <h2 className="mt-4 max-w-[18ch] text-4xl font-medium leading-[1.1] tracking-[-0.03em] sm:text-5xl">
              {t.assinatura.titulo}
            </h2>
            <p className="tnum mt-6 flex items-baseline gap-1">
              <span className="text-6xl font-medium tracking-[-0.03em]">{t.assinatura.preco}</span>
              <span className="text-lg opacity-70">{t.assinatura.porMes}</span>
            </p>
            <div className="mt-8">
              {assinante ? (
                <div className="flex flex-col items-start gap-2">
                  <p>{t.assinatura.jaAssinante}</p>
                  <Link href="/app" className="underline underline-offset-4 hover:opacity-80">
                    {t.assinatura.irParaPlataforma}
                  </Link>
                </div>
              ) : (
                <Link
                  href={destino}
                  className="inline-block rounded-control bg-accent px-8 py-4 font-medium text-accent-on transition-colors hover:bg-accent-hover active:translate-y-px"
                >
                  {t.assinatura.cta}
                </Link>
              )}
            </div>
          </Reveal>
          <Reveal className="lg:col-span-6 lg:self-center">
            <ul className="divide-y divide-current/20 border-y border-current/20">
              {t.assinatura.beneficios.map((beneficio) => (
                <li key={beneficio} className="flex items-start gap-4 py-5">
                  <Check size={20} weight="bold" aria-hidden="true" className="mt-1 shrink-0 opacity-70" />
                  <span className="leading-relaxed">{beneficio}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
