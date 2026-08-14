import { UserCirclePlus, MonitorPlay, ChartLineUp, Certificate } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/ui/Reveal";
import { cursos as t } from "@/lib/content";

/**
 * O ciclo do aluno em quatro colunas de hairline (sem cards - a elevação não
 * comunicaria nada aqui). Cada passo é verbo direto, sem "passo 1/2/3":
 * o conteúdo é o rótulo.
 */
const ICONES = [UserCirclePlus, MonitorPlay, ChartLineUp, Certificate];

export function CursosComoFunciona() {
  return (
    <section className="border-t border-line py-20 sm:py-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal>
          <h2 className="max-w-[22ch] text-4xl font-medium tracking-[-0.03em] text-fg sm:text-5xl">
            {t.comoFunciona.titulo}
          </h2>
        </Reveal>
        <ol className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
          {t.comoFunciona.passos.map((passo, i) => {
            const Icone = ICONES[i];
            return (
              <li key={passo.nome} className="border-t border-line-strong pt-6">
                <Reveal>
                  <Icone size={28} weight="regular" aria-hidden="true" className="text-accent-text" />
                  <h3 className="mt-4 text-xl font-medium tracking-[-0.02em] text-fg">{passo.nome}</h3>
                  <p className="mt-3 max-w-[32ch] leading-relaxed text-fg-muted">{passo.texto}</p>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
