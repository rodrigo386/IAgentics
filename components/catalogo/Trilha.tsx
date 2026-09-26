"use client";
import { useEffect, useRef, useState } from "react";
import { catalogo as t, type Tema } from "@/lib/content";
import { calcularCarrinho, formatarReais } from "@/lib/catalogo/preco";
import { recomendarTrilha, type ItemTrilha, type Respostas } from "@/lib/catalogo/trilha";

/**
 * "Monte sua trilha" (2026-09-26): cinco perguntas de um clique, uma por vez,
 * que terminam numa trilha pronta para o carrinho.
 *
 * Um clique por pergunta é o que cabe nos dois minutos: escolher a opção já
 * avança, sem botão "próximo". "Voltar" desfaz a última resposta.
 *
 * Nada sai do navegador: as respostas vivem só neste estado e a recomendação é
 * calculada aqui (lib/catalogo/trilha.ts). O carrinho recebe apenas os slugs.
 */

const ROTULO = "font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted";
const BOTAO_CHEIO =
  "rounded-control bg-accent px-6 py-3 font-medium text-accent-on transition-colors hover:bg-accent-hover active:translate-y-px motion-reduce:transition-none";
const BOTAO_CONTORNO =
  "rounded-control border border-line-strong px-6 py-3 font-medium text-fg transition-colors hover:border-fg active:translate-y-px motion-reduce:transition-none";

type Props = { precoBaseCentavos: number; aoAplicar: (slugs: string[]) => void };

export function Trilha({ precoBaseCentavos, aoAplicar }: Props) {
  const perguntas = t.trilha.perguntas;
  // null = fechado; 0..n-1 = pergunta; n = resultado.
  const [passo, setPasso] = useState<number | null>(null);
  const [respostas, setRespostas] = useState<string[]>([]);
  const [aplicada, setAplicada] = useState(false);
  const titulo = useRef<HTMLHeadingElement>(null);

  /* A cada passo o foco vai para o título novo: quem navega por teclado ou
     leitor de tela ouve a pergunta seguinte, em vez de ficar no botão que
     acabou de sumir. */
  useEffect(() => {
    if (passo !== null) titulo.current?.focus();
  }, [passo]);

  function responder(valor: string) {
    const novas = [...respostas.slice(0, passo!), valor];
    setRespostas(novas);
    setPasso(passo! + 1);
  }

  function comecar() {
    setRespostas([]);
    setAplicada(false);
    setPasso(0);
  }

  if (passo === null) {
    return (
      <section aria-labelledby="trilha-chamada" className="flex flex-col gap-5 border border-line bg-surface p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="max-w-[56ch]">
          <h2 id="trilha-chamada" className="text-2xl font-medium tracking-[-0.02em] text-fg">
            {t.trilha.chamadaTitulo}
          </h2>
          <p className="mt-2 text-fg-muted">{t.trilha.chamadaTexto}</p>
          {aplicada ? (
            <p role="status" className="mt-3 border-l-2 border-accent pl-3 text-sm text-fg">
              {t.trilha.aplicada}
            </p>
          ) : null}
        </div>
        <button type="button" onClick={comecar} className={`${BOTAO_CHEIO} shrink-0`}>
          {aplicada ? t.trilha.refazer : t.trilha.comecar}
        </button>
      </section>
    );
  }

  const cabecalho = (
    <div className="flex items-center justify-between gap-4">
      <p className={ROTULO}>
        {passo < perguntas.length ? t.trilha.passo(passo + 1, perguntas.length) : t.trilha.resultadoTitulo}
      </p>
      <button type="button" onClick={() => setPasso(null)} className="text-sm text-fg-muted underline-offset-4 hover:underline">
        {t.trilha.fechar}
      </button>
    </div>
  );

  /* Barra de progresso em CSS puro: a largura acompanha o passo. */
  const progresso = (
    <div aria-hidden="true" className="h-1 w-full bg-line">
      <div
        className="h-full bg-accent transition-[width] duration-300 motion-reduce:transition-none"
        style={{ width: `${(Math.min(passo, perguntas.length) / perguntas.length) * 100}%` }}
      />
    </div>
  );

  if (passo < perguntas.length) {
    const p = perguntas[passo];
    return (
      <section aria-labelledby="trilha-pergunta" className="flex flex-col gap-6 border border-accent bg-surface p-6 sm:p-8">
        {cabecalho}
        {progresso}
        <h2 id="trilha-pergunta" ref={titulo} tabIndex={-1} className="text-2xl font-medium tracking-[-0.02em] text-fg outline-none">
          {p.titulo}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {p.opcoes.map((o) => (
            <button
              key={o.valor}
              type="button"
              onClick={() => responder(o.valor)}
              className={`border px-5 py-4 text-left text-fg transition-colors hover:border-fg motion-reduce:transition-none ${
                respostas[passo] === o.valor ? "border-accent" : "border-line-strong"
              }`}
            >
              {o.rotulo}
            </button>
          ))}
        </div>
        {passo > 0 ? (
          <button type="button" onClick={() => setPasso(passo - 1)} className="self-start text-sm text-fg-muted underline-offset-4 hover:underline">
            {t.trilha.voltar}
          </button>
        ) : null}
      </section>
    );
  }

  const [momento, objetivo, junto, alcance, tamanho] = respostas;
  const r: Respostas = {
    momento: Number(momento) as Respostas["momento"],
    objetivo: objetivo as Tema,
    junto: junto as Respostas["junto"],
    alcance: Number(alcance) as Respostas["alcance"],
    tamanho: Number(tamanho) as Respostas["tamanho"],
  };
  const trilha: ItemTrilha[] = recomendarTrilha(r, t.cursos);
  const slugs = trilha.map((i) => i.slug);
  const preco = calcularCarrinho(slugs, slugs, precoBaseCentavos);
  const porSlug = new Map(t.cursos.map((c) => [c.slug, c]));

  return (
    <section aria-labelledby="trilha-resultado" className="flex flex-col gap-6 border border-accent bg-surface p-6 sm:p-8">
      {cabecalho}
      {progresso}
      <div>
        <h2 id="trilha-resultado" ref={titulo} tabIndex={-1} className="text-2xl font-medium tracking-[-0.02em] text-fg outline-none">
          {t.trilha.resultadoTitulo}
        </h2>
        <p className="mt-1 text-fg-muted">{t.trilha.resultadoTexto(trilha.length)}</p>
      </div>
      <ol className="divide-y divide-line border-y border-line" data-testid="trilha">
        {trilha.map((item, i) => {
          const curso = porSlug.get(item.slug)!;
          return (
            <li key={item.slug} className="grid grid-cols-[2rem_1fr] gap-x-3 py-3 sm:grid-cols-[2rem_1fr_auto]">
              <span className="tnum text-fg-subtle">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-fg">{curso.nome}</span>
              <span className={`${ROTULO} col-start-2 sm:col-start-3 sm:text-right`}>
                {t.niveis[curso.nivel]} · {item.motivo ? t.trilha.motivo(t.temas[item.motivo]) : t.trilha.motivoBase}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="flex flex-wrap items-baseline justify-between gap-2 text-fg">
        <span>{t.trilha.totalTrilha}</span>
        <span className="flex items-baseline gap-3">
          <s className="tnum text-sm text-fg-subtle">{formatarReais(preco.cheioCentavos)}</s>
          <span className="tnum text-2xl font-medium tracking-[-0.02em]">{formatarReais(preco.totalCentavos)}</span>
        </span>
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            aoAplicar(slugs);
            setAplicada(true);
            setPasso(null);
          }}
          className={BOTAO_CHEIO}
        >
          {t.trilha.aplicar}
        </button>
        <button type="button" onClick={comecar} className={BOTAO_CONTORNO}>
          {t.trilha.refazer}
        </button>
      </div>
    </section>
  );
}
