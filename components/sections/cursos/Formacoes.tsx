import { cursos } from "@/lib/content";

/**
 * As formações da /cursos (Prompt 4 de SEO, 2026-10-09): para cada uma, a
 * descrição, a ementa, a carga horária, o público-alvo e o formato — mas só o
 * que estiver preenchido em content.ts. Campo vazio não vira "a definir" na
 * tela: some, e a lista do que falta preencher mora no comentário de
 * `cursos.formacoes`.
 */
const t = cursos.formacoes;

export function CursosFormacoes() {
  return (
    <section aria-labelledby="formacoes" className="border-t border-line py-20 sm:py-24">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <h2 id="formacoes" className="text-3xl font-medium tracking-[-0.02em] text-fg sm:text-4xl">
          {t.titulo}
        </h2>
        <ul className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {t.itens.map((f) => {
            const fatos: { rotulo: string; valor: string }[] = [
              f.cargaHoraria ? { rotulo: t.rotulos.cargaHoraria, valor: f.cargaHoraria } : null,
              f.formato ? { rotulo: t.rotulos.formato, valor: f.formato } : null,
              f.publico ? { rotulo: t.rotulos.publico, valor: f.publico } : null,
            ].flatMap((x) => (x ? [x] : []));
            return (
              <li key={f.nome} className="flex flex-col border border-line bg-surface p-6 sm:p-8">
                {f.professor ? (
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-text">
                    {t.rotulos.com} {f.professor}
                  </p>
                ) : null}
                <h3 className="mt-3 text-2xl font-medium tracking-[-0.02em] text-fg">{f.nome}</h3>
                {f.descricao ? <p className="mt-3 leading-relaxed text-fg-muted">{f.descricao}</p> : null}
                {fatos.length > 0 ? (
                  <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-line pt-5 sm:grid-cols-3">
                    {fatos.map((x) => (
                      <div key={x.rotulo}>
                        <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-muted">{x.rotulo}</dt>
                        <dd className="mt-1 text-fg">{x.valor}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
                {f.ementa.length > 0 ? (
                  <div className="mt-6 border-t border-line pt-5">
                    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-muted">{t.rotulos.ementa}</p>
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-fg-muted">
                      {f.ementa.map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
