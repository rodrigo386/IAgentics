import Image from "next/image";
import { cursos } from "@/lib/content";
import { LinhaVitrine } from "./LinhaVitrine";

/**
 * A vitrine dos cursos da Solution na /cursos (2026-10-14, pedido do Rodrigo,
 * com a planilha "Estrutura Plataforma" de referência): uma linha por trilha,
 * cards em retrato correndo na horizontal, como num streaming.
 *
 * Todo card é uma capa: as da plataforma (prints recortados) e as geradas no
 * Remotion (`gerada` em content.ts), que trazem desenhados o título, o
 * professor ou o selo "Em breve", e o ícone de salvar. O que a capa diz vai
 * no `alt`, que é o que leitor de tela e buscador alcançam. Os cursos em breve
 * eram cards cinza (#D9D9D9) só com o nome até ganharem capa, no mesmo dia.
 *
 * Canto arredondado é exceção à trava de superfícies retas do site
 * (DESIGN.md): as capas vêm da plataforma com o canto arredondado no próprio
 * desenho, e num quadro reto as pontas da moldura apareceriam.
 */
const t = cursos.vitrine;

export function CursosVitrine() {
  return (
    <section aria-labelledby="cursos-solution" className="border-t border-line py-20 sm:py-24">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <h2 id="cursos-solution" className="text-3xl font-medium tracking-[-0.02em] text-fg sm:text-4xl">
          {t.titulo}
        </h2>
        <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-fg-muted">{t.lead}</p>
        <div className="mt-12 space-y-12">
          {t.linhas.map((linha, n) => (
            <LinhaVitrine
              key={linha.titulo}
              id={`trilha-${n + 1}`}
              titulo={linha.titulo}
              rotulos={{ anteriores: t.anteriores, proximos: t.proximos }}
            >
              {linha.cursos.map((c) => (
                <li key={c.nome} className="w-[132px] shrink-0 snap-start sm:w-[160px] lg:w-[184px]">
                  <div className="relative aspect-[306/466] overflow-hidden rounded-[10px] bg-brand-ink">
                    <Image
                      src={c.capa}
                      alt={"emBreve" in c ? `${c.nome}, ${t.emBreve.toLowerCase()}` : `${c.nome}, ${c.professor}`}
                      fill
                      sizes="(min-width: 1024px) 184px, (min-width: 640px) 160px, 132px"
                      className="object-cover"
                    />
                  </div>
                </li>
              ))}
            </LinhaVitrine>
          ))}
        </div>
      </div>
    </section>
  );
}
