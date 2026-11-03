import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  Broadcast,
  CalendarCheck,
  CalendarDots,
  ChartLineUp,
  Medal,
  PencilSimpleLine,
  Scales,
  SealPercent,
  Star,
  Tag,
  Target,
  Ticket,
  UsersThree,
  VideoCamera,
  WhatsappLogo,
  Wrench,
} from "@phosphor-icons/react/dist/ssr";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Marquee } from "@/components/ui/Marquee";
import { PausaAnimacao } from "@/components/ui/PausaAnimacao";
import { Reveal } from "@/components/ui/Reveal";
import { FilmeHero } from "@/components/sections/cursos/FilmeHero";
import { SecaoFaq } from "@/components/sections/Faq";
import { BarraBolsas } from "@/components/sections/bolsas/BarraBolsas";
import { Contagem } from "@/components/sections/bolsas/Contagem";
import { InscricaoForm } from "@/components/sections/bolsas/InscricaoForm";
import { JsonLd } from "@/components/seo/JsonLd";
import { bolsas as t, cursos, PRECO_FUNDADOR, PRECO_MENSAL } from "@/lib/content";
import { agoraBolsas, descontoFundador, faseDasInscricoes, INSCRICOES_ABREM, INSCRICOES_FECHAM } from "@/lib/bolsas/regras";
import { VALOR_ASSINATURA_CENTAVOS } from "@/lib/assinatura/regras";
import { faqJsonLd, ogDaPagina } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: t.meta.titulo },
  description: t.meta.descricao,
  alternates: { canonical: "/bolsas" },
  openGraph: ogDaPagina("/bolsas", t.meta.titulo, t.meta.descricao),
};

/* Dinâmica porque o formulário e a contagem dependem da hora: abre em 05/11 e
   fecha às 23h59 de 11/11. Estática, a página ficaria presa na fase do build. */
export const dynamic = "force-dynamic";

/**
 * Desafio das 50 Bolsas (2026-11-03, docs/PLANO-BOLSAS.md).
 *
 * Redesenhada no mesmo dia, a pedido do Rodrigo ("falta um botão grande para
 * cadastro, a página tá muito poluída, precisa ser mais visual e convidativa,
 * use motions"): capa escura com a oferta, o botão grande e a contagem; cada
 * seção com UMA imagem que diz o essencial
 * (linha do tempo, os números da entrega, a régua dos 60 segundos, as barras
 * dos pesos) e o detalhe nas perguntas frequentes e no regulamento. Um botão
 * fixo acompanha a rolagem até o formulário.
 *
 * Critérios e pesos continuam na página por inteiro: o desafio é processo
 * seletivo por mérito, e régua escondida não é mérito.
 */
const eyebrow = "font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted";
const h2 = "mt-5 max-w-[20ch] text-4xl font-medium tracking-[-0.03em] text-fg sm:text-5xl lg:text-6xl";
const ICONES_GANHA = [CalendarCheck, WhatsappLogo, Broadcast, Ticket, Tag];
const ICONES_EXCLUSIVO = [UsersThree, Medal, SealPercent, CalendarDots];
const CORES_ROTEIRO = ["bg-brand-violet", "bg-brand-indigo", "bg-brand-periwinkle", "bg-brand-blue"];
const CORES_PESO = ["bg-brand-violet", "bg-brand-indigo", "bg-brand-periwinkle", "bg-brand-blue", "bg-brand-sky"];
const ICONES_ETAPA = [PencilSimpleLine, VideoCamera, Scales, Broadcast];
const ICONES_SEMANA = [Target, Wrench, ChartLineUp, VideoCamera];

/* A vitrine da /cursos, achatada: as capas da faixa e os números da seção
   "O que a bolsa abre" saem dela, então mudam sozinhos quando ela muda. */
type CapaVitrine = { nome: string; capa: string; emBreve?: boolean };
const capas: CapaVitrine[] = cursos.vitrine.linhas.flatMap((l): CapaVitrine[] => [...l.cursos]);
const cursosNoAr = capas.filter((c) => !c.emBreve).length;
const cursosChegando = capas.length - cursosNoAr;
const trilhas = cursos.vitrine.linhas.length;

export default function PaginaBolsas() {
  const agora = agoraBolsas();
  const fase = faseDasInscricoes(agora);
  const { capa, oferta } = t;
  const desconto = descontoFundador(VALOR_ASSINATURA_CENTAVOS);
  const contagem =
    fase === "antes"
      ? { alvo: INSCRICOES_ABREM.getTime(), rotulo: "abre" as const }
      : fase === "abertas"
        ? { alvo: INSCRICOES_FECHAM.getTime(), rotulo: "fecha" as const }
        : null;
  const segundos = t.roteiro.partes.map((p) => Number.parseInt(p.tempo, 10));

  return (
    <>
      <JsonLd dados={faqJsonLd(t.faq.itens)} />
      <Nav />
      <main id="conteudo" className="pt-16">
        {/* CAPA (redesenhada em 2026-11-03, pedido do Rodrigo: "mais destaque
            aos benefícios", "mostrar exclusividade", "ser mais ousado no
            layout", sem animação na capa). A foto sangra até a borda direita;
            a oferta é a manchete; o "50" vazado e a faixa de baixo dizem que
            é exclusivo. Superfície escura nos dois temas (.bolsas-capa). */}
        <section className="bolsas-capa relative isolate flex min-h-[calc(100dvh-4rem)] flex-col overflow-hidden">
          <div aria-hidden="true" className="absolute inset-0 -z-10 lg:left-auto lg:w-[60%] lg:[mask-image:linear-gradient(to_right,transparent_0%,black_50%)]">
            <Image src={oferta.foto.src} alt="" fill priority sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover object-[70%_center] opacity-35 lg:opacity-100" />
            {/* No desktop a foto se dissolve no fundo por máscara (um degradê de
                cor deixava emenda, porque o fundo da capa não é uma cor só); no
                celular ela fica atrás do texto, escurecida. */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d1017] via-[#0d1017]/40 to-transparent lg:hidden" />
            <p className="bolsas-contorno absolute right-6 bottom-24 hidden text-[13rem] leading-[0.8] font-medium tracking-[-0.06em] lg:block xl:text-[16rem]">
              {oferta.vagasNumero}
            </p>
          </div>

          <div className="relative mx-auto flex w-full max-w-[1400px] flex-1 items-center px-5 py-12 sm:px-8 sm:py-14">
            <div className="max-w-[640px]">
              <p className="hero-fade font-mono text-[11px] uppercase tracking-[0.22em] text-brand-paper/70" style={{ animationDelay: "40ms" }}>
                {capa.kicker}
              </p>
              <h1 className="mt-6 text-brand-paper">
                <span className="block overflow-hidden pb-[0.08em]">
                  <span
                    className="hero-line block text-[min(19vw,5.5rem)] font-medium leading-[0.92] tracking-[-0.055em] text-brand-sky sm:text-[6.5rem] xl:text-[7.25rem]"
                    style={{ animationDelay: "100ms" }}
                  >
                    {oferta.gratis}
                  </span>
                </span>{" "}
                <span
                  className="hero-fade mt-4 block max-w-[26ch] text-[min(7vw,1.75rem)] font-medium leading-[1.15] tracking-[-0.03em] sm:text-[2rem]"
                  style={{ animationDelay: "200ms" }}
                >
                  {capa.titulo}.
                </span>
              </h1>

              <div className="hero-fade mt-7 flex flex-wrap items-end gap-x-5 gap-y-3" style={{ animationDelay: "300ms" }}>
                <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-brand-paper">
                  <span className="text-xl text-brand-paper/75">{oferta.depois}</span>{" "}
                  <span className="sr-only">{oferta.de}</span>{" "}
                  <del className="tnum text-2xl text-brand-paper/50 decoration-2">{PRECO_MENSAL}</del>{" "}
                  <span className="sr-only">{oferta.por}</span>{" "}
                  <strong className="tnum text-6xl font-medium tracking-[-0.04em]">{PRECO_FUNDADOR}</strong>{" "}
                  <span className="text-lg text-brand-paper/75">{oferta.porMes}</span>
                </p>
                <p className="mb-2 -rotate-6 bg-brand-sky px-3 py-1.5 font-mono text-lg font-medium text-brand-ink">
                  <span aria-hidden="true">{oferta.desconto(desconto)}</span>
                  <span className="sr-only">{oferta.descontoLongo(desconto)}</span>
                </p>
              </div>
              <p className="hero-fade mt-3 max-w-[52ch] text-sm leading-relaxed text-brand-paper/65" style={{ animationDelay: "320ms" }}>
                {oferta.nota}
              </p>

              <div className="hero-fade mt-8 flex flex-col gap-8 sm:flex-row sm:items-center sm:gap-10" style={{ animationDelay: "400ms" }}>
                {fase !== "encerradas" ? (
                  <a
                    id="cta-bolsas"
                    href="#inscricao"
                    className="bolsas-cta group inline-flex w-full shrink-0 items-center justify-center gap-3 rounded-control bg-accent px-10 py-5 text-lg font-medium text-accent-on transition-[background-color,transform] duration-200 hover:bg-accent-hover active:scale-[0.98] sm:w-fit sm:px-12 sm:text-xl"
                  >
                    <span className="whitespace-nowrap">{capa.cta}</span>
                    <ArrowDown size={22} weight="bold" className="transition-transform duration-300 group-hover:translate-y-1" />
                  </a>
                ) : (
                  <p className="max-w-[46ch] text-lg font-medium text-brand-paper">{t.fases.encerradas}</p>
                )}
                {/* No celular a contagem fica aqui; no desktop, no selo sobre a foto. */}
                {contagem ? (
                  <div className="lg:hidden">
                    <Contagem alvo={contagem.alvo} agora={agora.getTime()} rotulo={contagem.rotulo} claro />
                  </div>
                ) : null}
              </div>
              {fase !== "encerradas" ? <p className="mt-4 text-sm text-brand-paper/60">{capa.gratis}</p> : null}
            </div>
            {contagem ? (
              <div className="cinehero-chip absolute top-12 right-8 hidden p-6 lg:block">
                <Contagem alvo={contagem.alvo} agora={agora.getTime()} rotulo={contagem.rotulo} claro />
              </div>
            ) : null}
          </div>

          {/* A faixa da exclusividade, de ponta a ponta no pé da capa. */}
          <div className="relative border-t border-white/10 bg-black/30 backdrop-blur-sm">
            <ul className="mx-auto flex max-w-[1400px] flex-wrap gap-x-10 gap-y-3 px-5 py-5 sm:px-8">
              {oferta.exclusivos.map((item, i) => {
                const Icone = ICONES_EXCLUSIVO[i] ?? Star;
                return (
                  <li key={item} className="flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.14em] text-brand-paper/85">
                    <Icone size={18} aria-hidden="true" className="text-brand-sky" />
                    {item}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* O QUE A BOLSA ABRE (pedido do Rodrigo: "use prints e vídeos do site
            cursos"): o filme da hero da /cursos e as capas da vitrine
            correndo, com os números calculados da própria vitrine. */}
        <section aria-labelledby="plataforma" className="bolsas-capa relative overflow-hidden py-24 sm:py-32">
          <div className="mx-auto grid max-w-[1400px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-12 lg:gap-10">
            <Reveal className="lg:col-span-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand-paper/65">{t.plataforma.eyebrow}</p>
              <h2 id="plataforma" className="mt-5 max-w-[18ch] text-4xl font-medium tracking-[-0.03em] text-brand-paper sm:text-5xl lg:text-6xl">
                {t.plataforma.titulo}
              </h2>
              <p className="mt-6 max-w-[48ch] text-lg leading-relaxed text-brand-paper/75">{t.plataforma.texto}</p>
              <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-white/15 pt-6">
                {[
                  [cursosNoAr, t.plataforma.cursosNoAr],
                  [trilhas, t.plataforma.trilhas],
                  [cursosChegando, t.plataforma.chegando],
                ].map(([n, rotulo]) => (
                  <div key={rotulo} className="flex flex-col-reverse gap-1">
                    <dt className="text-sm leading-snug text-brand-paper/65">{rotulo}</dt>
                    <dd className="tnum text-5xl font-medium tracking-[-0.04em] text-brand-sky sm:text-6xl">{n}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
            {/* O filme tem fundo claro: numa faixa escura, solto, parecia um
                bloco branco. Na moldura escura, lê como a tela de um tablet. */}
            <div className="lg:col-span-5 lg:col-start-8">
              <div className="mx-auto w-fit rounded-[2rem] border border-white/10 bg-brand-ink p-3 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9)] sm:p-4">
                <div className="w-[min(78vw,440px)] overflow-hidden rounded-[1.25rem]">
                  <FilmeHero src={cursos.filmeHero.video} poster={cursos.filmeHero.poster} rotulos={t.plataforma.filme} />
                </div>
              </div>
            </div>
          </div>
          <PausaAnimacao textos={t.plataforma.faixa} className="mt-20 flex flex-col gap-3">
            <p className="sr-only">{t.plataforma.faixa.rotulo}</p>
            {[capas.slice(0, Math.ceil(capas.length / 2)), capas.slice(Math.ceil(capas.length / 2))].map((fileira, f) => (
              <Marquee key={f} duration={f === 0 ? "120s" : "140s"} className={f === 1 ? "[&_.marquee-track]:[animation-direction:reverse]" : ""}>
                {fileira.map((c) => (
                  <Image key={c.capa} src={c.capa} alt={c.nome} width={140} height={213} sizes="140px" className="h-[213px] w-[140px] shrink-0" />
                ))}
              </Marquee>
            ))}
          </PausaAnimacao>
        </section>

        {/* COMO FUNCIONA: a linha do tempo se desenha com a rolagem. */}
        <section aria-labelledby="etapas" className="py-24 sm:py-32">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
            <Reveal>
              <p className={eyebrow}>{t.etapas.eyebrow}</p>
              <h2 id="etapas" className={h2}>
                {t.etapas.titulo}
              </h2>
            </Reveal>
            <div className="relative mt-16">
              <div aria-hidden="true" className="absolute top-7 right-0 left-0 hidden h-0.5 bg-line lg:block">
                <div className="bolsas-barra h-full bg-accent" />
              </div>
              <ol className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
                {t.etapas.itens.map((e, i) => {
                  const Icone = ICONES_ETAPA[i] ?? CalendarCheck;
                  return (
                    <li key={e.nome} className="relative">
                      <Reveal>
                        <span aria-hidden="true" className="relative grid size-14 place-items-center rounded-full bg-accent text-accent-on shadow-[0_12px_30px_-12px_rgba(118,7,232,0.8)]">
                          <Icone size={26} />
                        </span>
                        <p className="mt-6 font-mono text-sm uppercase tracking-[0.12em] text-accent-text">{e.quando}</p>
                        <h3 className="mt-2 text-2xl font-medium tracking-[-0.02em] text-fg">{e.nome}</h3>
                        <p className="mt-2 max-w-[30ch] text-fg-muted">{e.texto}</p>
                      </Reveal>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </section>

        {/* A TROCA: o que se entrega em três números; o que se ganha em blocos. */}
        <section aria-labelledby="trocas" className="border-t border-line bg-surface py-24 sm:py-32">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
            <Reveal>
              <p className={eyebrow}>{t.trocas.eyebrow}</p>
              <h2 id="trocas" className={h2}>
                {t.trocas.titulo}
              </h2>
            </Reveal>
            <div className="mt-16 grid gap-16 lg:grid-cols-12 lg:gap-10">
              <div className="lg:col-span-5">
                <h3 className={eyebrow}>{t.trocas.entrega.titulo}</h3>
                <ul className="mt-6 flex flex-col">
                  {t.trocas.numeros.map((n) => (
                    <li key={n.rotulo} className="border-t border-line">
                      <Reveal className="flex items-baseline gap-6 py-5">
                        <span className="tnum w-[1.2ch] text-7xl font-medium leading-none tracking-[-0.05em] text-accent-text sm:text-8xl">{n.valor}</span>
                        <span className="text-xl leading-snug text-fg">{n.rotulo}</span>
                      </Reveal>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="lg:col-span-6 lg:col-start-7">
                <h3 className={eyebrow}>{t.trocas.ganha.titulo}</h3>
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {t.trocas.ganha.itens.map((item, i) => {
                    const Icone = ICONES_GANHA[i] ?? Tag;
                    return (
                      <li key={item} className={i === t.trocas.ganha.itens.length - 1 ? "sm:col-span-2" : ""}>
                        <Reveal className={`flex h-full flex-col gap-5 border p-6 ${i === t.trocas.ganha.itens.length - 1 ? "border-accent bg-accent text-accent-on" : "border-line bg-bg"}`}>
                          <Icone size={30} aria-hidden="true" className={i === t.trocas.ganha.itens.length - 1 ? "" : "text-accent-text"} />
                          <span className={`text-lg leading-snug ${i === t.trocas.ganha.itens.length - 1 ? "" : "text-fg"}`}>{item}</span>
                        </Reveal>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
            <Reveal className="mt-16 grid gap-6 border-t border-line pt-8 md:grid-cols-2 md:gap-10">
              <p className="max-w-[56ch] leading-relaxed text-fg-muted">{t.trocas.naoSelecionado}</p>
              <p className="max-w-[56ch] leading-relaxed text-fg-muted">
                <span className="font-medium text-fg">{t.quem.titulo}: </span>
                {t.quem.texto}
              </p>
            </Reveal>
          </div>
        </section>

        {/* O VÍDEO: um celular gravando, com as barrinhas de Stories do roteiro
            enchendo com a rolagem. Desenho; o roteiro está escrito ao lado. */}
        <section aria-labelledby="roteiro" className="border-t border-line py-24 sm:py-32">
          <div className="mx-auto grid max-w-[1400px] items-center gap-16 px-5 sm:px-8 lg:grid-cols-12 lg:gap-10">
            <div aria-hidden="true" className="bolsas-celular relative mx-auto w-[280px] lg:col-span-5 sm:w-[310px]">
              <div className="relative aspect-[9/19] overflow-hidden rounded-[2.6rem] border-[10px] border-brand-ink bg-brand-ink shadow-[0_40px_80px_-30px_rgba(19,23,35,0.6)]">
                <Image src={t.celular.foto} alt="" fill sizes="310px" className="object-cover object-[50%_center]" />
                <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute inset-x-3 top-4 flex gap-1">
                  {t.roteiro.partes.map((p, i) => (
                    <div key={p.nome} className="h-1 overflow-hidden rounded-full bg-white/35" style={{ flexGrow: segundos[i], flexBasis: 0 }}>
                      <div className="bolsas-story h-full bg-white" style={{ animationRange: `cover ${22 + i * 12}% cover ${33 + i * 12}%` }} />
                    </div>
                  ))}
                </div>
                <p className="absolute top-8 left-4 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-white">
                  <span className="bolsas-ao-vivo size-2 rounded-full bg-red-500" />
                  {t.celular.gravando}
                </p>
                <p className="absolute inset-x-5 bottom-6 text-lg font-medium leading-snug text-white">{t.roteiro.partes.at(-1)?.texto}</p>
              </div>
            </div>
            <div className="lg:col-span-6 lg:col-start-7">
              <Reveal>
                <p className={eyebrow}>{t.roteiro.eyebrow}</p>
                <h2 id="roteiro" className={h2}>
                  {t.roteiro.titulo}
                </h2>
              </Reveal>
              <ol aria-label={t.roteiro.regua} className="mt-10 flex flex-col">
                {t.roteiro.partes.map((p, i) => (
                  <li key={p.nome} className="border-t border-line">
                    <Reveal className="flex items-start gap-5 py-5">
                      <span className={`${CORES_ROTEIRO[i]} tnum shrink-0 px-2.5 py-1 font-mono text-sm font-medium text-brand-paper`}>{p.tempo}</span>
                      <span>
                        <span className="block text-xl font-medium text-fg">{p.nome}</span>
                        <span className="mt-1 block text-fg-muted">{p.texto}</span>
                      </span>
                    </Reveal>
                  </li>
                ))}
              </ol>
              <Reveal className="mt-8 flex flex-col gap-3 border-t border-line pt-6">
                <p className="max-w-[56ch] leading-relaxed text-fg-muted">{t.roteiro.envio}</p>
                <p className="max-w-[56ch] font-medium leading-relaxed text-fg">{t.roteiro.cuidado}</p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* A BANCA: os 100 pontos numa barra só, cada critério com a sua cor. */}
        <section aria-labelledby="criterios" className="border-t border-line bg-surface py-24 sm:py-32">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
            <div className="grid gap-10 lg:grid-cols-12">
              <Reveal className="lg:col-span-6">
                <p className={eyebrow}>{t.criterios.eyebrow}</p>
                <h2 id="criterios" className={h2}>
                  {t.criterios.titulo}
                </h2>
              </Reveal>
              <Reveal className="lg:col-span-5 lg:col-start-8 lg:self-end">
                <p className="border-l-2 border-accent pl-5 text-2xl leading-snug tracking-[-0.02em] text-fg">{t.criterios.seguidores}</p>
              </Reveal>
            </div>
            <div className="mt-16">
              <p className="flex items-baseline justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-fg-muted">
                <span>{t.pontos.rotulo}</span>
                <span>{t.pontos.total}</span>
              </p>
              <div aria-hidden="true" className="mt-3 overflow-hidden">
                <div className="bolsas-barra flex h-16 gap-1 sm:h-20">
                  {t.criterios.itens.map((c, i) => (
                    <div key={c.nome} className={`${CORES_PESO[i]} flex items-end p-3`} style={{ flexGrow: c.peso, flexBasis: 0 }}>
                      <span className="tnum text-2xl font-medium text-brand-paper sm:text-3xl">{c.peso}</span>
                    </div>
                  ))}
                </div>
              </div>
              <ul className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
                {t.criterios.itens.map((c, i) => (
                  <li key={c.nome}>
                    <Reveal>
                      <p className="flex items-center gap-2">
                        <span aria-hidden="true" className={`size-3 shrink-0 ${CORES_PESO[i]}`} />
                        <span className="tnum font-mono text-sm text-fg-muted">{t.criterios.pesoDe(c.peso)}</span>
                      </p>
                      <h3 className="mt-2 text-lg font-medium leading-snug text-fg">{c.nome}</h3>
                      <p className="mt-1 text-sm text-fg-muted">{c.alta}</p>
                    </Reveal>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* O MÊS: faixa escura, uma semana por bloco, um ícone por missão. */}
        <section aria-labelledby="mes" className="bolsas-capa py-24 sm:py-32">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
            <Reveal>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand-paper/65">{t.mes.eyebrow}</p>
              <h2 id="mes" className="mt-5 max-w-[20ch] text-4xl font-medium tracking-[-0.03em] text-brand-paper sm:text-5xl lg:text-6xl">
                {t.mes.titulo}
              </h2>
              <p className="mt-5 text-lg text-brand-paper/70">{t.mes.periodo}</p>
            </Reveal>
            <ol className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {t.mes.semanas.map((s, i) => {
                const Icone = ICONES_SEMANA[i] ?? Target;
                return (
                  <li key={s.prazo}>
                    <Reveal className="flex h-full flex-col gap-4 border border-white/12 bg-white/[0.04] p-6">
                      <div className="flex items-center justify-between">
                        <span aria-hidden="true" className="grid size-12 place-items-center rounded-full bg-brand-sky/15 text-brand-sky">
                          <Icone size={24} />
                        </span>
                        <p className="tnum bg-brand-sky px-2 py-1 font-mono text-sm font-medium text-brand-ink">
                          <span className="sr-only">{t.mes.colunas.prazo}: </span>
                          {s.prazo}
                        </p>
                      </div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand-paper/60">
                        {t.mes.colunas.semana} {i + 1}
                      </p>
                      <h3 className="text-xl font-medium leading-snug text-brand-paper">{s.missao}</h3>
                      <p className="mt-auto border-t border-white/12 pt-4 text-brand-paper/70">
                        <span className="sr-only">{t.mes.colunas.post}: </span>
                        {s.post}
                      </p>
                    </Reveal>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* INSCRIÇÃO */}
        <section id="inscricao" aria-labelledby="inscricao-titulo" className="scroll-mt-16 border-t border-line bg-surface py-24 sm:py-32">
          <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 px-5 sm:px-8 lg:grid-cols-12">
            <div className="lg:sticky lg:top-24 lg:col-span-5 lg:self-start">
              <p className={eyebrow}>{t.formulario.eyebrow}</p>
              <h2 id="inscricao-titulo" className={h2}>
                {t.formulario.titulo}
              </h2>
              <p className="mt-6 max-w-[40ch] text-lg leading-relaxed text-fg-muted">
                {fase === "abertas" ? t.formulario.lead : t.fases[fase]}
              </p>
              {contagem ? (
                <div className="mt-10">
                  <Contagem alvo={contagem.alvo} agora={agora.getTime()} rotulo={contagem.rotulo} />
                </div>
              ) : null}
              <p className="mt-10 text-sm">
                <Link href="/bolsas/regulamento" className="text-fg underline" prefetch={false}>
                  {t.regulamentoPagina.titulo}
                </Link>
              </p>
              {/* Três capas da vitrine em leque: o que a inscrição pode abrir. */}
              <div aria-hidden="true" className="relative mt-14 hidden h-[260px] lg:block">
                {capas.slice(0, 3).map((c, i) => (
                  <Image
                    key={c.capa}
                    src={c.capa}
                    alt=""
                    width={150}
                    height={228}
                    sizes="150px"
                    className="absolute top-0 h-[228px] w-[150px] shadow-[0_24px_50px_-20px_rgba(19,23,35,0.55)]"
                    style={{ left: `${i * 110}px`, transform: `rotate(${(i - 1) * 6}deg) translateY(${i === 1 ? -10 : 8}px)`, zIndex: i === 1 ? 2 : 1 }}
                  />
                ))}
              </div>
            </div>
            {fase === "abertas" ? (
              <div className="border border-line bg-bg p-6 sm:p-8 lg:col-span-6 lg:col-start-7">
                <InscricaoForm />
              </div>
            ) : null}
          </div>
        </section>

        <SecaoFaq eyebrow={t.faq.eyebrow} titulo={t.faq.titulo} itens={t.faq.itens} />
      </main>
      {fase !== "encerradas" ? <BarraBolsas /> : null}
      <Footer />
    </>
  );
}
