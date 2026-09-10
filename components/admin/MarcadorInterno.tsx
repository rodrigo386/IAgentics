"use client";
import { useEffect, useState } from "react";
import { admin as t } from "@/lib/content-admin";
import { definirNaoContar, naoContarEsteNavegador } from "@/lib/nao-contar";

/**
 * O interruptor "não conte este navegador".
 *
 * A marca vive em localStorage, então o SERVIDOR NÃO SABE o estado e não pode
 * renderizar a resposta certa. Por isso o componente nasce em `null` e só
 * decide depois de montar: qualquer chute na primeira renderização daria
 * divergência de hidratação, e o pior chute seria dizer "não estamos
 * contando" para quem está sendo contado.
 *
 * O estado é mostrado com a mesma ênfase nos dois sentidos, e quando ESTÁ
 * contando o texto diz o tamanho do problema. Um interruptor que ninguém
 * percebe não separa tráfego nenhum — e a única pessoa que vai clicar aqui é
 * quem já entrou no painel com credencial.
 */
export function MarcadorInterno() {
  const [marcado, setMarcado] = useState<boolean | null>(null);

  useEffect(() => setMarcado(naoContarEsteNavegador()), []);

  function alternar() {
    definirNaoContar(!marcado);
    /* Relê em vez de confiar no que acabamos de escrever: sem localStorage
       (Safari privado) a escrita é engolida, e o botão passaria a mentir. */
    setMarcado(naoContarEsteNavegador());
  }

  return (
    <div className="flex flex-col gap-4 border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">{t.interno.titulo}</p>
          {marcado === null ? (
            <p className="mt-2 text-fg-muted">{t.interno.carregando}</p>
          ) : marcado ? (
            <p className="mt-2 text-fg">{t.interno.naoContando}</p>
          ) : (
            <>
              <p className="mt-2 text-fg">{t.interno.contando}</p>
              <p className="mt-1 max-w-[60ch] text-xs text-fg-muted">{t.interno.contandoAviso}</p>
            </>
          )}
        </div>

        {marcado === null ? null : (
          <button
            type="button"
            onClick={alternar}
            aria-pressed={marcado}
            className="shrink-0 rounded-control border border-line px-5 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-brand-paper active:scale-[0.98]"
          >
            {marcado ? t.interno.ligar : t.interno.desligar}
          </button>
        )}
      </div>
      <p className="max-w-[70ch] text-xs text-fg-muted">{t.interno.nota}</p>
    </div>
  );
}
