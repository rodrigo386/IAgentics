import { TrendUp, TrendDown } from "@phosphor-icons/react/dist/ssr";
import { admin } from "@/lib/content-admin";

/**
 * Chip de comparação com o período anterior de mesmo tamanho. Regras:
 * - anterior null (período "tudo"): não existe base - não renderiza nada;
 * - delta zero: silêncio vale mais que "0%";
 * - base zero: % é indefinida - mostra o delta absoluto (+N), nunca "∞%".
 * Verde não existe na paleta: alta usa o acento, queda usa o cinza - a seta
 * carrega o sentido, a cor só hierarquiza.
 */
export function Variacao({ atual, anterior }: { atual: number; anterior: number | null }) {
  if (anterior === null) return null;
  const delta = atual - anterior;
  if (delta === 0) return null;
  const subiu = delta > 0;
  const texto =
    anterior === 0 ? `${subiu ? "+" : ""}${delta}` : `${subiu ? "+" : ""}${Math.round((delta / anterior) * 100)}%`;
  const Icone = subiu ? TrendUp : TrendDown;
  return (
    <span
      title={admin.metricas.variacao.vsAnterior}
      className={`tnum inline-flex items-center gap-1 font-mono text-[11px] ${subiu ? "text-accent-text" : "text-fg-muted"}`}
    >
      <Icone size={12} weight="bold" aria-hidden="true" />
      {texto}
      <span className="sr-only"> {admin.metricas.variacao.vsAnterior}</span>
    </span>
  );
}
