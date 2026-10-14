import Image from "next/image";
import { Logo } from "@/components/ui/Logo";
import { cursos } from "@/lib/content";

/**
 * As formações da IAgentics na /cursos. Desde 2026-10-14 (pedido do Rodrigo):
 * o título leva o LOGO da IAgentics no lugar da palavra, e cada formação abre
 * com um banner do professor (Vinícius no Fundamentos, Carol no Marketing com
 * IA): fundo escuro, foto à direita fundindo no escuro, nome e crédito à
 * esquerda — o formato dos banners de série que o catálogo teve em outubro.
 *
 * Embaixo do banner, só o que estiver preenchido em `cursos.formacoes`
 * (descrição, carga horária, formato, público, ementa).
 */
const t = cursos.formacoes;

export function CursosFormacoes() {
  return (
    <section
      aria-labelledby="formacoes"
      className="border-t border-line py-20 sm:py-24"
    >
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <h2
          id="formacoes"
          aria-label={`${t.titulo} ${t.marca}`}
          className="flex flex-wrap items-center gap-x-4 gap-y-2 text-3xl font-medium tracking-[-0.02em] text-fg sm:text-4xl"
        >
          <span aria-hidden="true">{t.titulo}</span>
          <span aria-hidden="true" className="inline-flex text-fg">
            <Logo label={t.marca} className="w-[170px] sm:w-[210px]" />
          </span>
        </h2>
        <ul className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {t.itens.map((f) => {
            const fatos: { rotulo: string; valor: string }[] = [
              f.cargaHoraria
                ? { rotulo: t.rotulos.cargaHoraria, valor: f.cargaHoraria }
                : null,
              f.formato
                ? { rotulo: t.rotulos.formato, valor: f.formato }
                : null,
              f.publico
                ? { rotulo: t.rotulos.publico, valor: f.publico }
                : null,
            ].flatMap((x) => (x ? [x] : []));
            return (
              <li
                key={f.nome}
                className="flex flex-col self-start overflow-hidden border border-line bg-surface"
              >
                {/* O banner: escuro fixo (tinta da marca), como um cartaz. */}
                <div className="relative aspect-[16/9] overflow-hidden bg-brand-ink text-brand-paper">
                  <div
                    className="absolute inset-y-0 right-0 w-[68%]"
                    style={{
                      maskImage:
                        "linear-gradient(to right, transparent, black 40%)",
                      WebkitMaskImage:
                        "linear-gradient(to right, transparent, black 40%)",
                    }}
                  >
                    <Image
                      src={f.foto}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 460px, 70vw"
                      className="object-cover"
                      style={{ objectPosition: f.enquadre }}
                    />
                  </div>
                  <div className="relative flex h-full max-w-[58%] flex-col justify-end gap-2 p-6 sm:p-8">
                    {f.professor ? (
                      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand-paper/75">
                        {t.rotulos.com} {f.professor}
                      </p>
                    ) : null}
                    <h3 className="text-2xl font-medium leading-[1.05] tracking-[-0.02em] [text-wrap:balance] sm:text-3xl">
                      {f.nome}
                    </h3>
                  </div>
                </div>
                {/* Sem descrição, fatos nem ementa, o card é só o banner: caixa
                    vazia embaixo pareceria conteúdo faltando. */}
                {f.descricao || fatos.length > 0 || f.ementa.length > 0 ? (
                  <div className="flex flex-1 flex-col p-6 sm:p-8">
                    {f.descricao ? (
                      <p className="leading-relaxed text-fg-muted">
                        {f.descricao}
                      </p>
                    ) : null}
                    {fatos.length > 0 ? (
                      <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-line pt-5 sm:grid-cols-3">
                        {fatos.map((x) => (
                          <div key={x.rotulo}>
                            <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-muted">
                              {x.rotulo}
                            </dt>
                            <dd className="mt-1 text-fg">{x.valor}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : null}
                    {f.ementa.length > 0 ? (
                      <div className="mt-6 border-t border-line pt-5">
                        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-muted">
                          {t.rotulos.ementa}
                        </p>
                        <ul className="mt-3 list-disc space-y-1 pl-5 text-fg-muted">
                          {f.ementa.map((e) => (
                            <li key={e}>{e}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>

        {/* As demais formações, em capas no formato das do Pecege. */}
        <h3 className="mt-16 font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.mais.titulo}</h3>
        <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
          {t.mais.itens.map((c) => (
            <li key={c.src}>
              <div className="relative aspect-[2/3] overflow-hidden border border-line bg-brand-ink">
                <Image src={c.src} alt="" fill sizes="(min-width: 1024px) 220px, (min-width: 640px) 30vw, 45vw" className="object-cover" />
              </div>
              <p className="mt-3 text-sm leading-snug text-fg">{c.nome}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
