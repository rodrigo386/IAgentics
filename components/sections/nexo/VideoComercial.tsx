import { Reveal } from "@/components/ui/Reveal";
import { VideoVitrine } from "@/components/ui/VideoVitrine";
import { nexo, nexoPage } from "@/lib/content";
import poster from "@/public/nexo/nexo-comercial-poster.jpg";

/**
 * O Nexo Compras em um minuto, logo depois da capa (2026-10-06): a capa diz o
 * que o Nexo orquestra, o vídeo mostra uma compra acontecendo, e só então a
 * página desce para as camadas. Texto à esquerda e vídeo à direita, o mesmo
 * desenho do convite da /academy.
 */
export function NexoVideoComercial() {
  const t = nexoPage.videoComercial;

  return (
    <section aria-labelledby="video-comercial" className="border-t border-line py-24 sm:py-32">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-y-10 px-5 sm:px-8 lg:grid-cols-12 lg:items-center lg:gap-x-12">
        <Reveal className="lg:col-span-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-text">{t.eyebrow}</p>
          <h2 id="video-comercial" className="mt-4 max-w-[14ch] text-4xl font-medium tracking-[-0.03em] text-fg sm:text-5xl">
            {t.titulo}
          </h2>
          <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-fg-muted">{t.lead}</p>
        </Reveal>

        <Reveal className="lg:col-span-8">
          <VideoVitrine className="aspect-video w-full" src={t.src} poster={poster} label={t.label} textos={nexo.controlesVideo} />
        </Reveal>
      </div>
    </section>
  );
}
