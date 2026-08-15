import { ChartBar } from "@phosphor-icons/react/dist/ssr";

/**
 * Estado vazio intencional dos blocos do painel: diz o que o bloco É e por que
 * está vazio, no lugar de uma linha solta de texto que parece erro. Borda
 * cheia (não tracejada) e raio 0 - mesma gramática das demais superfícies.
 */
export function EstadoVazio({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="flex flex-col items-center gap-3 border border-line px-6 py-12 text-center">
      <ChartBar size={28} weight="regular" aria-hidden="true" className="text-accent-text" />
      <p className="font-medium text-fg">{titulo}</p>
      <p className="max-w-[44ch] text-sm leading-relaxed text-fg-muted">{texto}</p>
    </div>
  );
}
