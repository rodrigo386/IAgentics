/**
 * "Em breve" — o que ocupa um quadro de tela ainda não entregue.
 *
 * Substituiu um quadro de briefing que mostrava, para qualquer visitante, o nome do
 * arquivo que faltava e a especificação: "/nexo-print-contratos.jpg · 1920x1080 · JPG".
 * Isso servia ao time e vazava para o cliente numa página de venda. A especificação
 * continua existindo onde o time lê — em lib/content.ts, ao lado do `src` a preencher.
 *
 * Não é um PNG de "Em breve". É desenhado em CSS pelo mesmo motivo de sempre: fica
 * nítido em qualquer tamanho e densidade, acompanha claro e escuro sem um segundo
 * arquivo, e não pesa nada. O resultado na tela é o mesmo que uma imagem daria.
 *
 * O selo usa o acento da marca para ler como decisão, não como buraco. A trama
 * diagonal fica em opacidade baixa: distingue o espaço reservado de conteúdo real
 * numa olhada, que é honesto, sem parecer imagem quebrada.
 */
export function ComingSoon({
  label,
  compact = false,
  className = "",
}: {
  /** O que vai entrar aqui, dito ao visitante. */
  label: string;
  /** Versão reduzida, para o painel de preview do índice. */
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative grid place-items-center bg-surface ${className}`}
      role="img"
      aria-label={`${label} — em breve`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.05] [background-image:repeating-linear-gradient(45deg,currentColor_0_1px,transparent_1px_12px)]"
      />
      <div className="relative flex flex-col items-center gap-2 px-6 text-center">
        <span
          className={`font-mono uppercase tracking-[0.2em] text-accent-text ${
            compact ? "text-[10px]" : "text-[11px]"
          }`}
        >
          Em breve
        </span>
        <p
          className={`font-medium text-fg ${compact ? "text-[13px]" : "text-base sm:text-lg"}`}
        >
          {label}
        </p>
      </div>
    </div>
  );
}
