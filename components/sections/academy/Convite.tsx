import { Reveal } from "@/components/ui/Reveal";
import { academy } from "@/lib/content";

/**
 * O convite em vídeo da Academy.
 *
 * NÃO É AutoplayVideo, e a diferença importa: os outros vídeos do site
 * (empresas-bg.mp4 aqui mesmo, o cabeçalho do Spend Lab) são decoração muda em
 * loop, e tocar sozinho é o comportamento certo para eles. Este tem alguém
 * falando. Vídeo com voz que começa sem ninguém pedir é hostil — o visitante
 * ouve som e não sabe de onde veio. Aqui é <video> comum, com controles.
 *
 * `preload="none"` faz o custo ser zero até o play: os 25 MB só saem do
 * servidor para quem realmente quer assistir, e quem sustenta o quadro até lá é
 * o poster de 80 KB. É por isso que o poster não é opcional.
 *
 * LEGENDAS DE VERDADE, em <track>, não queimadas na imagem. O vídeo do Spend
 * Lab tem as legendas dentro do pixel: elas aparecem para quem vê, mas não são
 * texto que um leitor de tela alcance nem que um buscador leia. Aqui o VTT é um
 * arquivo à parte, então o navegador pode exibi-las, o usuário pode desligá-las
 * e a máquina pode lê-las.
 */
export function AcademyConvite() {
  const { convite } = academy;

  return (
    <section id="convite" className="scroll-mt-24 border-t border-line py-24 sm:py-32">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-y-10 px-5 sm:px-8 lg:grid-cols-12 lg:items-center lg:gap-x-12">
        <Reveal className="lg:col-span-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-text">{convite.eyebrow}</p>
          <h2 className="mt-4 max-w-[16ch] text-4xl font-medium tracking-[-0.03em] text-fg sm:text-5xl">
            {convite.titulo}
          </h2>
          <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-fg-muted">{convite.lead}</p>
          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-fg-subtle">{convite.duracao}</p>
        </Reveal>

        <Reveal className="lg:col-span-7">
          {/* Fundo tinta atrás do quadro: se a proporção do arquivo não bater
              exatamente com 16:9, a sobra lê como moldura e não como falha. */}
          <div className="aspect-video w-full overflow-hidden border border-line bg-brand-ink">
            <video
              className="h-full w-full"
              src={convite.src}
              poster={convite.poster}
              controls
              preload="none"
              playsInline
            >
              <track kind="captions" src={convite.legendas} srcLang="pt-BR" label="Português" default />
              {convite.label}
            </video>
          </div>
          <p className="mt-3 text-xs text-fg-subtle">{convite.notaLegendas}</p>
        </Reveal>
      </div>
    </section>
  );
}
