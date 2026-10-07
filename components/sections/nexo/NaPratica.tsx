import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { VideoVitrine } from "@/components/ui/VideoVitrine";
import { nexo, nexoPage } from "@/lib/content";
import posterSpendNf from "@/public/nexo/nexo-spend-nf-poster.jpg";

/**
 * "Na prática" (pitch Hacktown, slides 8–11): um módulo por seção, no formato
 * do deck — três passos numerados, as telas do produto e um número de prova.
 *
 * As telas ficam em pranchas de borda a borda com legenda na margem, como as
 * do fluxo de Compras: a página é um dossiê e o print é a evidência. Quando
 * um módulo não tem tela ainda (Orçamento), a prancha simplesmente não
 * existe e o número ocupa a linha — nada de caixa vazia fingindo imagem.
 *
 * MÓDULO COM FILME (`video` em content.ts, 2026-10-07): o filme SUBSTITUI as
 * telas, pedido do Rodrigo. Hoje só o Spend via NF (remotion/nexo-nf). As telas
 * continuam em content.ts como registro e fonte dos dados do filme. A capa de
 * cada filme é import estático (o placeholder desfocado sai dele), por isso o
 * mapa abaixo, por id.
 */
const capas = { nf: posterSpendNf } as const;
type Item = (typeof nexoPage.naPratica.itens)[number];

function Prancha({ tela }: { tela: Item["telas"][number] }) {
  return (
    <figure className="min-w-0">
      {/* Moldura de proporção FIXA (4:3) com object-contain: os prints têm
          formatos diferentes (o mapa é largo, o gráfico de ocupação é alto) e
          lado a lado com altura livre o mais alto dominava a linha. Contido na
          mesma moldura, cada um ocupa o que precisa e as duas pranchas alinham.
          O fundo é papel porque as telas são claras — a "sobra" da moldura
          continua a tela, não vira faixa. */}
      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden border border-line bg-brand-paper p-2">
        <Image
          src={tela.src}
          alt={tela.alt}
          width={tela.w}
          height={tela.h}
          className="max-h-full w-auto max-w-full object-contain"
          sizes="(min-width: 1024px) 40vw, 100vw"
        />
      </div>
      <figcaption className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">{tela.legenda}</figcaption>
    </figure>
  );
}

function Filme({ item }: { item: Item }) {
  if (!("video" in item) || !(item.id in capas)) return null;
  return (
    <figure className="min-w-0 lg:col-span-8">
      <VideoVitrine
        className="aspect-video w-full"
        src={item.video.src}
        poster={capas[item.id as keyof typeof capas]}
        label={item.video.label}
        textos={nexo.controlesVideo}
      />
      <figcaption className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">{item.video.legenda}</figcaption>
    </figure>
  );
}

function Modulo({ item }: { item: Item }) {
  const temFilme = "video" in item && item.id in capas;
  const temTelas = temFilme || item.telas.length > 0;
  return (
    <article id={`na-pratica-${item.id}`} className="border-t border-line py-20 sm:py-24">
      <Reveal>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-text">{nexoPage.naPratica.eyebrow}</p>
        <h3 className="mt-4 flex flex-wrap items-baseline gap-x-3 text-3xl font-medium tracking-[-0.03em] text-fg sm:text-4xl lg:text-5xl">
          <span>{item.nome[0]}</span>
          <span className="text-fg-muted">{item.nome[1]}</span>
        </h3>
      </Reveal>

      <ol className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        {item.passos.map((p, i) => (
          <li key={p.nome} className="border-t border-line-strong pt-4">
            <span className="font-mono text-[11px] tracking-[0.16em] text-accent-text">{String(i + 1).padStart(2, "0")}</span>
            <p className="mt-2 text-lg font-medium leading-snug text-fg">{p.nome}</p>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">{p.texto}</p>
          </li>
        ))}
      </ol>

      <div className={`mt-12 grid grid-cols-1 gap-8 ${temTelas ? "lg:grid-cols-12" : ""}`}>
        {temFilme ? (
          <Filme item={item} />
        ) : temTelas ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:col-span-8">
            {item.telas.map((tela) => (
              <Prancha key={tela.src} tela={tela} />
            ))}
          </div>
        ) : null}

        <aside className={`border border-line-strong p-6 ${temTelas ? "lg:col-span-4" : "max-w-[46ch]"}`}>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-text">{item.prova.rotulo}</p>
          <p className="tnum mt-3 text-5xl font-medium tracking-[-0.03em] text-fg sm:text-6xl">{item.prova.numero}</p>
          <p className="mt-2 text-sm text-fg-muted">{item.prova.unidade}</p>
          <p className="mt-6 border-t border-line pt-5 leading-relaxed text-fg-muted">{item.prova.texto}</p>
        </aside>
      </div>
    </article>
  );
}

export function NexoNaPratica() {
  return (
    <section id="na-pratica">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        {nexoPage.naPratica.itens.map((item) => (
          <Modulo key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
