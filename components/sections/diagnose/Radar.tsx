import { decimal, type ResumoPilar } from "@/lib/diagnose";

/**
 * O radar da prévia: um eixo por pilar, de 1 a 5. Hoje em área cheia na cor
 * de destaque; o potencial em 12 meses (só gestor) em linha tracejada na cor
 * do texto, para as duas camadas se distinguirem também sem cor.
 *
 * SVG desenhado à mão porque é um polígono por série: uma biblioteca de
 * gráficos para isso pesaria mais que a página inteira. As cores vêm dos
 * tokens do tema, então o radar acompanha o modo escuro sozinho.
 */
export function Radar({ pilares, rotulo }: { pilares: ResumoPilar[]; rotulo: string }) {
  const W = 600, H = 440, cx = 300, cy = 215, R = 128, n = pilares.length;
  const ang = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pt = (i: number, v: number) => [cx + Math.cos(ang(i)) * (R * v) / 5, cy + Math.sin(ang(i)) * (R * v) / 5];
  const poligono = (v: (p: ResumoPilar) => number | null) => pilares.map((p, i) => pt(i, v(p) ?? 0).join(",")).join(" ");
  const temPotencial = pilares.some((p) => p.potencial !== null);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={rotulo} className="h-auto w-full max-w-[520px]">
      {[1, 2, 3, 4, 5].map((nivel) => (
        <polygon key={nivel} points={pilares.map((_, i) => pt(i, nivel).join(",")).join(" ")} fill="none" stroke="var(--line)" />
      ))}
      {pilares.map((_, i) => {
        const [x, y] = pt(i, 5);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--line)" />;
      })}
      <polygon points={poligono((p) => p.hoje)} fill="var(--accent)" fillOpacity={0.16} stroke="var(--accent)" strokeWidth={2.5} />
      {temPotencial ? (
        <polygon points={poligono((p) => p.potencial)} fill="none" stroke="var(--fg)" strokeWidth={1.75} strokeDasharray="5 4" />
      ) : null}
      {pilares.map((p, i) => {
        const [x, y] = pt(i, 6.4);
        const c = Math.cos(ang(i));
        const ancora = Math.abs(c) < 0.2 ? "middle" : c > 0 ? "start" : "end";
        return (
          <g key={p.nome}>
            <text x={x} y={y + 4} textAnchor={ancora} fontSize={17} fill="var(--fg)">
              {p.curto}
            </text>
            <text x={x} y={y + 24} textAnchor={ancora} fontSize={15} fill="var(--fg-muted)" className="font-mono">
              {p.hoje === null ? "" : decimal(p.hoje)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
