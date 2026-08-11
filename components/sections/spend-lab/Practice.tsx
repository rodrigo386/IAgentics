import { Reveal } from "@/components/ui/Reveal";
import { spendLab } from "@/lib/content";

/**
 * "Veja o IA Spend Lab na prática" - a seção que faltava na nossa versão.
 *
 * No site de vocês ela existe entre a ementa das 8 semanas e os parceiros, e
 * carrega um embed do Google Drive com uma apresentação falada de 2min37. Eu tinha
 * apontado o `spendLab.video` para o vídeo do cabeçalho, que é outro arquivo. O
 * conteúdo real foi baixado do Drive e agora é servido daqui.
 *
 * NÃO É AutoplayVideo, E ISSO É A DIFERENÇA QUE IMPORTA. Os outros vídeos do site
 * são decoração muda em loop, e tocar sozinho é o comportamento certo para eles.
 * Este tem narração. Vídeo com voz que começa sem ninguém pedir é hostil, e o
 * visitante não tem como saber de onde veio o som. Aqui é <video> comum, com
 * controles, que só toca quando alguém aperta.
 *
 * `preload="none"` faz o custo ser zero até o play: os 16 MB só saem do servidor
 * para quem realmente quer assistir. O que sustenta o quadro até lá é o poster de
 * 64 KB, e é por isso que ele não é opcional aqui.
 *
 * Não há faixa <track> de legendas porque as legendas do vídeo são queimadas na
 * imagem - elas aparecem para todo mundo, mas não são texto que um leitor de tela
 * alcance. Uma transcrição resolveria isso, e eu não tenho como escrevê-la sem
 * inventar palavras que vocês não disseram.
 */
export function SpendLabPractice() {
  const { practice } = spendLab;

  return (
    <section
      id="pratica"
      className="scroll-mt-24 border-t border-line py-24 sm:py-32"
    >
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-y-10 px-5 sm:px-8 lg:grid-cols-12 lg:items-center lg:gap-x-12">
        <Reveal className="lg:col-span-5">
          <h2 className="max-w-[16ch] text-4xl font-medium tracking-[-0.03em] text-fg sm:text-5xl">
            {practice.title}
          </h2>
          <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-fg-muted">
            {practice.lead}
          </p>
          {/* A duração fica escrita porque com preload="none" o navegador não sabe
              quanto dura até o play - o controle mostraria "0:00" para quem só
              passou o olho. */}
          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-fg-subtle">
            Vídeo · 2 min 37
          </p>
        </Reveal>

        <Reveal className="lg:col-span-7">
          {/* Fundo tinta atrás do quadro: se a proporção do arquivo não bater
              exatamente com 16:9, a sobra lê como moldura e não como falha. */}
          <div className="aspect-video w-full overflow-hidden border border-line bg-brand-ink">
            <video
              className="h-full w-full"
              src={practice.src}
              poster={practice.poster}
              controls
              preload="none"
              playsInline
            >
              {practice.label}
            </video>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
