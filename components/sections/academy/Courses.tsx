import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { academy } from "@/lib/content";

/**
 * Os nove cursos. Kicker, título, lead e etiquetas são os do site de vocês.
 *
 * O lead da primeira versão ("Nove formações, da base ao aplicado...") era texto
 * meu, não de vocês. O real é "Para profissionais que desejam ser protagonistas
 * e que sonham com um ensino diferente e envolvente."
 *
 * As três etiquetas por curso (Iniciante / OnDemand / Negócios etc.) estavam
 * faltando por completo e são o que permite escolher por assunto, não só por
 * carga horária.
 *
 * Cards com a foto no topo, como no site de vocês. A versão anterior era um índice
 * com régua - melhor para comparar carga horária de nove cursos de uma vez, pior
 * para reconhecer a página. O time pediu a semelhança, e a semelhança venceu.
 *
 * A carga horária continua em mono e ganha destaque no card, porque continua sendo
 * o primeiro filtro de quem monta agenda de treinamento.
 *
 * As fotos são retrato 4:5 e aqui aparecem em 16/10, então `object-cover` corta.
 * Aceitável: são fotos de ambiente, sem texto nem detalhe que o corte destrua - o
 * oposto de um print de produto, que nunca corto.
 */
export function AcademyCourses() {
  return (
    <section id="cursos" className="scroll-mt-24 border-t border-line py-24 sm:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">
            {academy.courses.kicker}
          </p>
          <h2 className="mt-6 max-w-[14ch] text-4xl font-medium tracking-[-0.03em] text-fg sm:text-5xl lg:text-6xl">
            {academy.courses.title}
          </h2>
          <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-fg-muted">
            {academy.courses.lead}
          </p>
        </Reveal>

        <ul className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {academy.courses.items.map((course) => (
            <Reveal key={course.name}>
              <li className="flex h-full flex-col border border-line bg-surface">
                <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-line">
                  <Image
                    src={course.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 420px"
                    className="object-cover"
                  />
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <p className="flex flex-wrap items-baseline gap-x-3 font-mono text-[11px]">
                    <span className="text-accent-text tabular-nums">
                      {course.hours}
                    </span>
                    <span className="text-fg-muted">{course.mode}</span>
                  </p>

                  <h3 className="mt-3 text-xl font-medium leading-snug tracking-[-0.02em] text-fg">
                    {course.name}
                  </h3>
                  <p className="mt-2 leading-relaxed text-fg-muted">
                    {course.body}
                  </p>

                  <ul className="mt-auto flex flex-wrap gap-2 pt-5">
                    {course.tags.map((tag) => (
                      <li
                        key={tag}
                        className="border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-fg-muted"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            </Reveal>
          ))}
        </ul>

        <Reveal className="mt-12 border-t border-line-strong pt-12">
          <a
            href="#contato"
            className="group inline-flex items-center gap-2 rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-[background-color,transform] duration-200 hover:bg-accent-hover active:scale-[0.98]"
          >
            <span className="whitespace-nowrap">{academy.courses.cta}</span>
            <ArrowRight
              size={17}
              weight="regular"
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </a>
          <p className="mt-4 text-sm text-fg-muted">
            Diga qual formação interessa e montamos a turma para a sua equipe.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
