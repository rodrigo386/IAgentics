import { nexoPage } from "@/lib/content";

/**
 * ORQUESTRADOR GRAPH - o visual da capa da /nexo.
 *
 * Descende do grafo dos cinco agentes que a home teve até 2026-09-04
 * (AgentGraph, hoje removido), com nove nós: o mesmo hub (o ícone
 * real do app Nexo, geometria copiada verbatim do kit), as mesmas linhas
 * desenhando para fora, o mesmo ciclo de execução em que o Nexo entrega uma
 * tarefa, o módulo acende enquanto trabalha e o resultado volta. O pedido foi
 * literalmente "layout e animação similar à home" — então o que muda aqui é
 * só o que a aritmética de nove obriga a mudar, e nada mais.
 *
 * O que a aritmética obriga:
 *  - Posições calculadas (seno/cosseno num anel de raio 30), não tabeladas:
 *    nove pontos à mão convidam erro, e o anel precisa ser regular para a
 *    leitura de "tudo ao redor do centro".
 *  - Ciclo próprio (classes orq-*, ver globals.css): cada módulo tem 11,1% do
 *    lap, não 20%, e keyframe é percentual.
 *  - Rótulos ancorados por quadrante (acima / direita / abaixo / esquerda),
 *    porque com nove em volta, "acima ou abaixo" só não basta — os das
 *    laterais invadiriam o vizinho.
 *
 * O que NÃO muda, e é deliberado (as três armadilhas que aquele grafo
 * documentava): posicionar e animar em elementos separados; pulsos pintados
 * ANTES do hub e dos nós, que são opacos; e repouso = grafo pronto, sem JS e
 * com movimento reduzido.
 *
 * Rótulo com destino vira <a> (leva à seção que detalha o módulo); sem destino
 * é <span>. Só o rótulo é link, nunca o grafo — um leitor de tela receberia um
 * único link enorme no lugar de uma figura com legenda.
 */

const CENTER = { x: 50, y: 50 };
const HUB_TILE = 24;
/* 30, não os 35 que caberiam no quadrado: o rótulo fica FORA do anel, e é a
   soma anel + folga + rótulo que precisa caber na coluna. Com 35, os da direita
   cortavam na borda da viewport em 1440 e no celular. */
const RAIO = 30;

/** Ciclo de execução. TURN × 9 = o lap de 10,8s declarado em globals.css. */
const TURN = 1.2;
/** Segura o loop até a entrada terminar: último nó pousa em 360 + 8·60 + 700ms,
 *  último rótulo em 430 + 8·60 + 800ms. */
const CYCLE_START = 1.8;
/** O resultado chega ao hub a 10,6% do lap — ver @keyframes orq-pulse. */
const RETURN_AT = TURN * 9 * 0.106;

const NEXO_SCALE = HUB_TILE / 64;

/* "abaixo" se divide em dois: com nove nós, dois caem no fundo do anel a 40°
   um do outro, e centrados sob o nó eles se tocam em lg. Cada um cresce para
   o lado oposto ao vizinho. No topo só há um nó, então "acima" fica centrado. */
type Quadrante = "acima" | "direita" | "abaixo-dir" | "abaixo-esq" | "esquerda";

/** Começa no topo (-90°) e anda no sentido horário, como no slide 5. */
function no(indice: number, total: number) {
  const angulo = (-90 + (360 / total) * indice) * (Math.PI / 180);
  const cos = Math.cos(angulo);
  const sin = Math.sin(angulo);
  const quadrante: Quadrante =
    sin < -0.85 ? "acima" : sin > 0.85 ? (cos > 0 ? "abaixo-dir" : "abaixo-esq") : cos > 0 ? "direita" : "esquerda";
  return { x: CENTER.x + RAIO * cos, y: CENTER.y + RAIO * sin, quadrante };
}

/** Posição do rótulo em relação ao nó — só posiciona; quem anima é o filho.
 *  A folga de 24px é medida do CENTRO do nó: o círculo tem raio 3,2 em 100,
 *  ou seja ~17px no grafo de 525px do desktop — 14px deixava o texto dentro
 *  do círculo. 24 cobre o raio nos dois extremos (9px no celular, 17px no
 *  desktop) e ainda respira. */
const FOLGA = "24px";
const POSICAO: Record<Quadrante, { transform: string; align: string }> = {
  acima: { transform: `translate(-50%, calc(-100% - ${FOLGA}))`, align: "text-center" },
  "abaixo-dir": { transform: `translate(-15%, ${FOLGA})`, align: "text-left" },
  "abaixo-esq": { transform: `translate(-85%, ${FOLGA})`, align: "text-right" },
  direita: { transform: `translate(${FOLGA}, -50%)`, align: "text-left" },
  esquerda: { transform: `translate(calc(-100% - ${FOLGA}), -50%)`, align: "text-right" },
};

export function OrquestradorGraph() {
  const modulos = nexoPage.orquestrador.modulos;
  const total = modulos.length;
  const nos = modulos.map((_, i) => no(i, total));

  /* px-8 abaixo de sm: no celular o quadrado ocupa a largura toda e os rótulos
     laterais, que ficam fora do anel, passariam da tela. O padding encolhe o
     quadrado e devolve espaço para eles — a seção tem overflow-hidden por causa
     da aurora, então o que passa, some. */
  return (
    <div className="hero-graph mx-auto w-full max-w-[560px] px-8 sm:px-0">
      <div className="relative aspect-square w-full">
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full text-accent-text"
          role="img"
          aria-label={nexoPage.hero.grafoAlt}
        >
          <defs>
            <linearGradient id="orq-hub" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#7B5EED" />
              <stop offset="1" stopColor="#397CEF" />
            </linearGradient>
          </defs>

          {/* Linhas primeiro: os círculos dos nós pintam por cima das pontas. */}
          {nos.map((n, i) => (
            <line
              key={`l-${i}`}
              className="graph-line"
              x1={CENTER.x}
              y1={CENTER.y}
              x2={n.x}
              y2={n.y}
              pathLength={100}
              stroke="currentColor"
              strokeWidth={0.6}
              strokeOpacity={0.5}
              strokeLinecap="round"
              style={{ animationDelay: `${200 + i * 60}ms` }}
            />
          ))}

          {/* A tarefa em trânsito — por baixo do hub e dos nós, que são opacos. */}
          {nos.map((n, i) => (
            <line
              key={`p-${i}`}
              className="orq-pulse"
              x1={CENTER.x}
              y1={CENTER.y}
              x2={n.x}
              y2={n.y}
              pathLength={100}
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              style={{ animationDelay: `${CYCLE_START + i * TURN}s` }}
            />
          ))}

          {/* O Nexo acusando um resultado recebido. */}
          <circle
            className="orq-hub-ring"
            cx={CENTER.x}
            cy={CENTER.y}
            r={13}
            fill="none"
            stroke="currentColor"
            strokeWidth={0.8}
            style={{ animationDelay: `${CYCLE_START + RETURN_AT}s` }}
          />

          {/* O hub: o ícone real do app, verbatim do kit. Grupo externo posiciona,
              interno anima (transform-box: fill-box no .graph-node). */}
          <g transform={`translate(${CENTER.x} ${CENTER.y}) scale(${NEXO_SCALE}) translate(-32 -32)`}>
            <g className="graph-node" style={{ animationDelay: "120ms" }}>
              <rect width="64" height="64" rx="15" fill="url(#orq-hub)" />
              <g transform="translate(32,32) scale(0.76) translate(-32,-32)">
                <circle
                  cx="32"
                  cy="32"
                  r="22"
                  stroke="#FFFFFF"
                  strokeWidth={5}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="108 30.2"
                  transform="rotate(-58 32 32)"
                />
                <g stroke="#FFFFFF" strokeWidth={2.8} strokeLinecap="round" fill="none">
                  <line x1="32" y1="35" x2="32" y2="24" />
                  <line x1="32" y1="35" x2="23" y2="41" />
                  <line x1="32" y1="35" x2="41" y2="41" />
                </g>
                <g fill="#FFFFFF">
                  <circle cx="32" cy="35" r="4.6" />
                  <circle cx="32" cy="23" r="3" />
                  <circle cx="22.2" cy="41.5" r="3" />
                  <circle cx="41.8" cy="41.5" r="3" />
                </g>
              </g>
            </g>
          </g>

          {/* O módulo disparando quando a tarefa chega — por baixo do nó. */}
          {nos.map((n, i) => (
            <circle
              key={`g-${i}`}
              className="orq-ping"
              cx={n.x}
              cy={n.y}
              r={3.2}
              fill="none"
              stroke="currentColor"
              strokeWidth={0.9}
              style={{ animationDelay: `${CYCLE_START + i * TURN}s` }}
            />
          ))}

          {/* Os nove módulos. Preenchidos com o fundo da página para ocultar a
              ponta da linha, como os anéis do lockup da IAgentics. */}
          {nos.map((n, i) => (
            <circle
              key={`n-${i}`}
              className="graph-node"
              cx={n.x}
              cy={n.y}
              r={3.2}
              fill="var(--bg)"
              stroke="currentColor"
              strokeWidth={1}
              style={{ animationDelay: `${360 + i * 60}ms` }}
            />
          ))}

          {/* O módulo com a tarefa na mão — círculo próprio, não o nó restilizado:
              o nó já tem um transform para o pop de entrada. */}
          {nos.map((n, i) => (
            <circle
              key={`c-${i}`}
              className="orq-core"
              cx={n.x}
              cy={n.y}
              r={3}
              fill="currentColor"
              style={{ animationDelay: `${CYCLE_START + i * TURN}s` }}
            />
          ))}
        </svg>

        {/* Rótulos em HTML, para tipografia de verdade. Externo posiciona,
            do meio entra (hero-fade), interno acende no turno (orq-label). */}
        {modulos.map((m, i) => {
          const n = nos[i];
          const pos = POSICAO[n.quadrante];
          const href = "href" in m ? m.href : undefined;
          const texto = (
            <span className="block text-[11px] font-medium leading-snug sm:text-[12px] xl:text-[13px]">{m.nome}</span>
          );
          return (
            <div key={m.id} className="absolute" style={{ left: `${n.x}%`, top: `${n.y}%`, transform: pos.transform }}>
              {/* Largura por breakpoint, calculada para anel + folga + rótulo
                  caber na coluna com a calha do grid: 76 no celular, 92 em lg,
                  108 em xl. */}
              <div className={`hero-fade w-[76px] sm:w-[92px] xl:w-[108px] ${pos.align}`} style={{ animationDelay: `${430 + i * 60}ms` }}>
                <div className="orq-label" style={{ animationDelay: `${CYCLE_START + i * TURN}s` }}>
                  {href ? (
                    <a
                      href={href}
                      className="decoration-line-strong underline-offset-4 transition-colors hover:text-fg hover:underline motion-reduce:transition-none"
                    >
                      {texto}
                    </a>
                  ) : (
                    texto
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
