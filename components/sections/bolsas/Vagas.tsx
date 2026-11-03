import { bolsas } from "@/lib/content";

/**
 * As 50 vagas, uma por quadrado, coloridas pela cota (2026-11-03). É a capa
 * dizendo em imagem o que o regulamento diz em texto: 30 praticantes, 10
 * gestores, 10 vozes da área. Acendem em sequência na entrada (CSS, fill
 * `backwards`: sem animação, já estão todas lá).
 *
 * Desenho, não informação nova: a lista com os números vai em texto logo
 * abaixo, e o grid fica fora da árvore de acessibilidade.
 */
const CORES = ["bg-brand-violet", "bg-brand-periwinkle", "bg-brand-sky"];

export function Vagas() {
  const { grupos, rotulo } = bolsas.vagas;
  const quadrados = grupos.flatMap((g, gi) => Array.from({ length: g.total }, () => gi));

  return (
    <figure className="flex flex-col gap-5">
      <figcaption className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand-paper/65">{rotulo}</figcaption>
      <div aria-hidden="true" className="grid grid-cols-10 gap-1.5 sm:gap-2">
        {quadrados.map((gi, i) => (
          <span
            key={i}
            className={`bolsas-vaga aspect-square ${CORES[gi]}`}
            style={{ "--i": i } as React.CSSProperties}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-brand-paper/80">
        {grupos.map((g, gi) => (
          <li key={g.nome} className="flex items-center gap-2">
            <span aria-hidden="true" className={`size-2.5 ${CORES[gi]}`} />
            <span>
              <span className="tnum font-medium text-brand-paper">{g.total}</span> {g.nome}
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
