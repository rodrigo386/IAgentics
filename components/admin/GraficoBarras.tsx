import { admin } from "@/lib/content-admin";
import type { PontoSemana } from "@/lib/admin/metricas";

const ALTURA_BARRAS = 140;
const ALTURA_EIXO = 24;
const LARGURA_BARRA = 28;
const GAP = 14;
const MARGEM_ESQUERDA = 28;
const MARGEM_DIREITA = 8;

/** Server Component puro: SVG com viewBox fixo, sem estado nem JS no cliente.
 *  Altura das barras proporcional ao máximo da série; eixo mostra 0 e o
 *  máximo; cada barra carrega um <title> com "semana: valor" (tooltip nativo,
 *  sem JS); abaixo do SVG, uma tabela sr-only espelha os mesmos pares para
 *  leitor de tela. Sem dado nenhum, nem o SVG é renderizado. */
export function GraficoBarras({ pontos, rotulo }: { pontos: PontoSemana[]; rotulo: string }) {
  if (pontos.length === 0) {
    // O título visível fica no card que envolve o gráfico (app/admin/page.tsx);
    // repetir o rotulo aqui duplicava a mesma string na tela.
    return <p className="text-fg-muted">{admin.metricas.semDados}</p>;
  }

  const maximo = Math.max(...pontos.map((p) => p.valor), 1);
  // Largura mínima de 8 colunas no viewBox: com 1-2 pontos o SVG ficava quase
  // quadrado e, esticado em w-full no celular, virava uma barra de ~870px de altura.
  const colunas = Math.max(pontos.length, 8);
  const largura = MARGEM_ESQUERDA + colunas * (LARGURA_BARRA + GAP) - GAP + MARGEM_DIREITA;
  const alturaTotal = ALTURA_BARRAS + ALTURA_EIXO;

  return (
    <div className="flex flex-col gap-3">
      <svg
        viewBox={`0 0 ${largura} ${alturaTotal}`}
        role="img"
        aria-label={rotulo}
        className="h-auto w-full max-w-full text-fg"
      >
        <g className="text-fg-muted">
          <line
            x1={MARGEM_ESQUERDA}
            y1={ALTURA_BARRAS}
            x2={largura - MARGEM_DIREITA}
            y2={ALTURA_BARRAS}
            className="stroke-current"
            strokeOpacity={0.25}
          />
          <text x={0} y={10} fontSize={10} className="fill-current" opacity={0.7}>
            {maximo}
          </text>
          <text x={0} y={ALTURA_BARRAS} fontSize={10} className="fill-current" opacity={0.7}>
            0
          </text>
        </g>
        <g className="text-accent">
          {pontos.map((p, i) => {
            const alturaBarra = Math.max(Math.round((p.valor / maximo) * (ALTURA_BARRAS - 6)), p.valor > 0 ? 2 : 0);
            const x = MARGEM_ESQUERDA + i * (LARGURA_BARRA + GAP);
            const y = ALTURA_BARRAS - alturaBarra;
            return (
              <g key={p.semana}>
                <title>{`${p.semana}: ${p.valor}`}</title>
                <rect x={x} y={y} width={LARGURA_BARRA} height={alturaBarra} className="fill-current" />
                <text
                  x={x + LARGURA_BARRA / 2}
                  y={ALTURA_BARRAS + 16}
                  fontSize={9}
                  textAnchor="middle"
                  className="fill-current text-fg-muted"
                >
                  {p.semana.slice(5)}
                </text>
              </g>
            );
          })}
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
            <tr key={p.semana}>
              <td>{p.semana}</td>
              <td>{p.valor}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
