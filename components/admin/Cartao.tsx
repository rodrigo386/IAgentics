/** Cartão de indicador do painel (/admin e /admin/cursos). `alerta` pinta a
 *  borda quando o número pede ação do time. */
export function Cartao({ rotulo, valor, nota, alerta = false }: { rotulo: string; valor: string; nota?: string; alerta?: boolean }) {
  return (
    <div className={`border bg-surface p-5 ${alerta ? "border-accent" : "border-line"}`}>
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">{rotulo}</p>
      <p className="mt-2 text-3xl font-medium tabular-nums tracking-[-0.02em] text-fg">{valor}</p>
      {nota ? <p className="mt-1 text-xs text-fg-muted">{nota}</p> : null}
    </div>
  );
}
