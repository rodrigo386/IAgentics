import Image from "next/image";
import { cursos } from "@/lib/content";
import { LinhaVitrine } from "./LinhaVitrine";

/**
 * A vitrine dos cursos da Solution na /cursos (2026-10-14, pedido do Rodrigo,
 * com a planilha "Estrutura Plataforma" de referência): uma linha por trilha,
 * cards em retrato correndo na horizontal, como num streaming.
 *
 * Dois estados de card:
 *  - publicado: a capa da plataforma, que já traz desenhados o título, o
 *    professor e o ícone de salvar. O nome e o professor vão no `alt`, que é
 *    o que leitor de tela e buscador alcançam.
 *  - em breve: card cinza (#D9D9D9) com o nome. O selo "Em breve" está
 *    escrito porque a página vende a assinatura: quem assina não pode achar
 *    que o curso já está lá.
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
                  {"capa" in c ? (
                    <div className="relative aspect-[306/466] overflow-hidden rounded-[10px] bg-brand-ink">
                      <Image
                        src={c.capa}
                        alt={`${c.nome}, ${c.professor}`}
                        fill
                        sizes="(min-width: 1024px) 184px, (min-width: 640px) 160px, 132px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[306/466] flex-col justify-between rounded-[10px] bg-[#D9D9D9] p-3 text-brand-ink sm:p-4">
                      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-brand-ink/70">
                        {t.emBreve}
                      </span>
                      <span className="text-sm font-medium leading-snug [text-wrap:balance] sm:text-base">
                        {c.nome}
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </LinhaVitrine>
          ))}
        </div>
      </div>
    </section>
  );
}
