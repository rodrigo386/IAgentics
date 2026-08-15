import { admin } from "@/lib/content-admin";
import type { PontoDia } from "@/lib/admin/metricas";

const LARGURA = 640;
const ALTURA_SERIE = 170;
const ALTURA_EIXO = 26;
const MARGEM_ESQ = 34;
const MARGEM_DIR = 10;

/**
 * Série diária como linha + área (visitas do site). Server Component puro,
 * mesmo contrato do GraficoBarras: viewBox fixo, tooltip nativo por <title>,
 * tabela sr-only espelhando os pares, nada de JS no cliente.
 *
 * A entrada anima em CSS: a linha se desenha da esquerda para a direita
 * (pathLength=1 + stroke-dashoffset) e o preenchimento surge depois - a
 * série "acontece" na direção do tempo. Com reduced-motion, tudo já está lá.
 */
export function GraficoArea({ pontos, rotulo }: { pontos: PontoDia[]; rotulo: string }) {
  if (pontos.length === 0) return null;

  const maximo = Math.max(...pontos.map((p) => p.valor), 1);
  const larguraUtil = LARGURA - MARGEM_ESQ - MARGEM_DIR;
  const x = (i: number) => MARGEM_ESQ + (pontos.length === 1 ? larguraUtil / 2 : (i / (pontos.length - 1)) * larguraUtil);
  const y = (v: number) => ALTURA_SERIE - (v / maximo) * (ALTURA_SERIE - 12);

  const linha = pontos.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.valor).toFixed(1)}`).join(" ");
  const area = `${linha} L${x(pontos.length - 1).toFixed(1)},${ALTURA_SERIE} L${x(0).toFixed(1)},${ALTURA_SERIE} Z`;

  // Rótulos de X esparsos: primeiro, meio e último dia (dd/mm).
  const indicesRotulo = pontos.length <= 2 ? pontos.map((_, i) => i) : [0, Math.floor((pontos.length - 1) / 2), pontos.length - 1];
  const ddmm = (dia: string) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;

  return (
    <div className="flex flex-col gap-3">
      <svg
        viewBox={`0 0 ${LARGURA} ${ALTURA_SERIE + ALTURA_EIXO}`}
        role="img"
        aria-label={rotulo}
        className="h-auto w-full max-w-full"
      >
        <g className="text-fg-muted">
          {[0.5, 1].map((f) => (
            <line
              key={f}
              x1={MARGEM_ESQ}
              y1={ALTURA_SERIE - f * (ALTURA_SERIE - 12)}
              x2={LARGURA - MARGEM_DIR}
              y2={ALTURA_SERIE - f * (ALTURA_SERIE - 12)}
              className="stroke-current"
              strokeOpacity={0.12}
            />
          ))}
          <line
            x1={MARGEM_ESQ}
            y1={ALTURA_SERIE}
            x2={LARGURA - MARGEM_DIR}
            y2={ALTURA_SERIE}
            className="stroke-current"
            strokeOpacity={0.25}
          />
          <text x={0} y={16} fontSize={10} className="fill-current" opacity={0.7}>
            {maximo}
          </text>
          <text x={0} y={ALTURA_SERIE} fontSize={10} className="fill-current" opacity={0.7}>
            0
          </text>
          {indicesRotulo.map((i) => (
            <text
              key={pontos[i].dia}
              x={x(i)}
              y={ALTURA_SERIE + 18}
              fontSize={10}
              textAnchor={i === 0 ? "start" : i === pontos.length - 1 ? "end" : "middle"}
              className="fill-current"
              opacity={0.7}
            >
              {ddmm(pontos[i].dia)}
            </text>
          ))}
        </g>
        <g className="text-accent">
          <path d={area} className="area-surge fill-current" fillOpacity={0.1} stroke="none" />
          <path
            d={linha}
            pathLength={1}
            className="linha-desenha stroke-current"
            fill="none"
            strokeWidth={2}
          />
          {pontos.map((p, i) => (
            <circle key={p.dia} cx={x(i)} cy={y(p.valor)} r={7} fillOpacity={0} className="fill-current">
              <title>{`${ddmm(p.dia)}: ${p.valor}`}</title>
            </circle>
          ))}
        </g>
      </svg>
      <table className="sr-only">
        <caption>{rotulo}</caption>
        <thead>
          <tr>
            <th>{admin.metricas.graficos.colunaSemana}</th>
            <th>{admin.metricas.graficos.colunaValor}</th>
          </tr>
        </thead>
        <tbody>
          {pontos.map((p) => (
            <tr key={p.dia}>
              <td>{p.dia}</td>
              <td>{p.valor}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
