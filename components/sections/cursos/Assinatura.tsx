import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { cursos } from "@/lib/content";
import { AssinaturaForm } from "./AssinaturaForm";

/**
 * Como funciona + a oferta com o formulário (2026-10-14). A oferta é um cartão
 * só, com o preço grande e o resumo do que inclui, porque é um produto só: não
 * há plano para comparar.
 */
const t = cursos.assinatura;

export function CursosComoFunciona() {
  return (
    <section aria-labelledby="como-funciona" className="border-t border-line bg-surface py-16 sm:py-20">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <h2 id="como-funciona" className="font-mono text-[11px] uppercase tracking-[0.24em] text-fg-muted">
          {t.comoFunciona.titulo}
        </h2>
        <ol className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {t.comoFunciona.passos.map((p, i) => (
            <li key={p.titulo} className="border-t-2 border-line pt-5">
              <p className="tnum text-4xl font-medium leading-none tracking-[-0.04em] text-fg-subtle">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-4 text-xl font-medium tracking-[-0.02em] text-fg">{p.titulo}</h3>
              <p className="mt-2 max-w-[34ch] text-fg-muted">{p.texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function CursosAssinar() {
  return (
    <section id="assinar" aria-labelledby="assinar-titulo" className="scroll-mt-20 border-t border-line py-20 sm:py-24">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 px-5 sm:px-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h2 id="assinar-titulo" className="text-3xl font-medium tracking-[-0.02em] text-fg sm:text-4xl">
            {t.formulario.titulo}
          </h2>
          <p className="mt-8 flex items-baseline gap-2">
            <span className="tnum text-6xl font-medium tracking-[-0.04em] text-fg">{t.preco}</span>{" "}
            <span className="text-lg text-fg-muted">{t.porMes}</span>
          </p>
          <p className="mt-4 max-w-[40ch] text-lg leading-relaxed text-fg-muted">{t.resumo}</p>
          <p className="mt-5 flex max-w-[44ch] items-start gap-2 text-base font-medium text-fg">
            <ShieldCheck size={22} weight="regular" aria-hidden="true" className="mt-0.5 shrink-0 text-accent-text" />
            {t.garantia}
          </p>
        </div>
        <div className="border border-line bg-surface p-6 sm:p-8 lg:col-span-6 lg:col-start-7">
          <AssinaturaForm />
        </div>
      </div>
    </section>
  );
}
