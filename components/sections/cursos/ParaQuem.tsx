import { cursos } from "@/lib/content";

/**
 * "Para quem é" na /cursos (2026-11-25, plano de SEO e conversão do Rodrigo:
 * a página não mostrava o que a pessoa aprende). Quatro áreas, cada uma com os
 * cursos da vitrine que falam com ela, como texto (o buscador e o leitor de
 * tela leem). Os nomes vêm de `cursos.paraQuem` e o teste confere que existem
 * na vitrine; o "em breve" é lido da própria vitrine, então muda sozinho
 * quando o curso é lançado.
 */
const t = cursos.paraQuem;
type Curso = { nome: string; emBreve?: boolean };
const todos: readonly Curso[] = cursos.vitrine.linhas.flatMap((l): readonly Curso[] => l.cursos);

export function CursosParaQuem() {
  return (
    <section aria-labelledby="para-quem" className="border-t border-line py-20 sm:py-24">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.eyebrow}</p>
        <h2 id="para-quem" className="mt-4 max-w-[30ch] text-3xl font-medium tracking-[-0.02em] text-fg sm:text-4xl">
          {t.titulo}
        </h2>
        <ul className="mt-12 grid grid-cols-1 gap-x-8 md:grid-cols-2 xl:grid-cols-4">
          {t.areas.map((a) => (
            <li key={a.nome} className="border-t border-line-strong py-8">
              <h3 className="text-xl font-medium tracking-[-0.02em] text-fg">{a.nome}</h3>
              <p className="mt-3 text-fg-muted">{a.texto}</p>
              <ul className="mt-5 space-y-2">
                {a.cursos.map((nome) => {
                  const curso = todos.find((c) => c.nome === nome);
                  const emBreve = curso?.emBreve === true;
                  return (
                    <li key={nome} className="text-base text-fg">
                      {nome}
                      {emBreve ? <span className="ml-2 font-mono text-[11px] uppercase tracking-[0.16em] text-fg-subtle">{t.emBreve}</span> : null}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
