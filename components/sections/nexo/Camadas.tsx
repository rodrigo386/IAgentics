import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { nexoPage } from "@/lib/content";

/**
 * As três camadas do Nexo Compras (pitch Hacktown, slide 6): agentes →
 * orquestração → ambiente do cliente.
 *
 * Três linhas com hairline, número e nome à esquerda, conteúdo à direita —
 * a mesma família de layout dos diferenciais (título pendurado), porque é
 * arquitetura, não vitrine. As placas de parceiros vão sobre `bg-brand-paper`
 * e não flipam com o tema: são arte registrada de terceiros (DESIGN.md §4).
 */
export function NexoCamadas() {
  const t = nexoPage.camadas;

  return (
    <section id="camadas" className="border-t border-line py-24 sm:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-text">{t.eyebrow}</p>
          <h2 className="mt-4 text-4xl font-medium tracking-[-0.03em] text-fg sm:text-5xl">{t.titulo}</h2>
        </Reveal>

        <ol className="mt-14 divide-y divide-line border-y border-line">
          {t.itens.map((c) => (
            <li key={c.numero} className="grid grid-cols-1 gap-6 py-10 lg:grid-cols-12 lg:gap-10">
              <div className="lg:col-span-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">{c.numero}</p>
                <h3 className="mt-2 text-2xl font-medium tracking-[-0.02em] text-fg sm:text-3xl">{c.nome}</h3>
              </div>

              <div className="lg:col-span-8">
                <p className="max-w-[52ch] text-lg leading-relaxed text-fg-muted">{c.texto}</p>

                {"modulos" in c ? (
                  /* Nove em três colunas: o nome carrega, o papel explica. Módulo
                     sem papel no pitch mostra só o nome — sem linha vazia
                     fingindo texto. */
                  <ul className="mt-6 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                    {c.modulos.map((m) => (
                      <li key={m.nome} className="border-t border-line-strong pt-3">
                        <p className="text-sm font-medium leading-snug text-fg">{m.nome}</p>
                        {"papel" in m ? <p className="mt-1 text-sm leading-snug text-fg-muted">{m.papel}</p> : null}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {"selo" in c ? (
                  <p className="mt-6 inline-flex items-center border border-line px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-fg">
                    {c.selo}
                  </p>
                ) : null}

                {"placas" in c ? (
                  <ul className="mt-6 flex flex-wrap items-center gap-3">
                    {c.placas.map((p) => (
                      <li key={p.src} className="flex h-16 items-center justify-center bg-brand-paper px-5">
                        <Image src={p.src} alt={p.alt} width={p.w} height={p.h} className="max-h-10 w-auto" />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
