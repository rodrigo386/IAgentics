"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { X } from "@phosphor-icons/react";
import { catalogo as t } from "@/lib/content";

/**
 * Gaveta do catálogo (2026-09-26): o <dialog> nativo em modo modal.
 *
 * Nativo de propósito: showModal() já prende o foco, fecha no Esc, torna o
 * resto da página inerte e devolve o foco a quem abriu — tudo que uma gaveta
 * feita à mão teria de reimplementar (e costuma esquecer). A animação de
 * entrada está em globals.css (dialog.gaveta).
 *
 * `centro` troca a gaveta lateral por um painel no meio da tela — é como o
 * questionário abre, para não parecer que a pessoa saiu do catálogo.
 */
type Props = { aberta: boolean; aoFechar: () => void; titulo: string; centro?: boolean; children: ReactNode };

export function Gaveta({ aberta, aoFechar, titulo, centro = false, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  /* O evento "close" dispara também quando QUEM FECHA é o código (aberta virou
     false). Repassar esse caso a aoFechar desfazia a troca de gaveta: fechar o
     questionário para abrir o carrinho zerava a gaveta que acabara de abrir.
     Só conta como "a pessoa fechou" (Esc, botão) se ainda devíamos estar abertos. */
  const abertaAgora = useRef(aberta);
  abertaAgora.current = aberta;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (aberta && !d.open) d.showModal();
    if (!aberta && d.open) d.close();
  }, [aberta]);

  return (
    <dialog
      ref={ref}
      aria-label={titulo}
      onClose={() => {
        if (abertaAgora.current) aoFechar();
      }}
      // Clique no fundo (o próprio <dialog>, fora do conteúdo) fecha.
      onClick={(e) => {
        if (e.target === ref.current) aoFechar();
      }}
      className={`gaveta ${centro ? "gaveta-centro" : ""} border-l border-line bg-bg p-0 text-fg`}
    >
      <div className={centro ? "flex flex-col" : "flex h-full flex-col"}>
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">{titulo}</p>
          <button
            type="button"
            onClick={aoFechar}
            aria-label={t.gaveta.fechar}
            className="rounded-control p-2 text-fg-muted transition-colors hover:text-fg"
          >
            <X size={20} weight="regular" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </dialog>
  );
}
