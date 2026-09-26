import type { Tema } from "@/lib/content";
import { catalogo as t } from "@/lib/content";

/**
 * Capa de curso "estilo Netflix" (2026-09-26), gerada em SVG — a planilha do
 * Pecege não trouxe imagem, e 63 capas desenhadas à mão ficariam sem manutenção.
 *
 * Tudo sai do próprio curso: a cor e o motivo vêm do tema principal, e a
 * variação (posições, alturas, ângulos) vem de um sorteio SEMEADO pelo slug.
 * Mesma entrada, mesma capa — em todo carregamento, no servidor e no cliente,
 * sem risco de hidratação divergente e sem duas capas iguais no catálogo.
 *
 * Paleta: só a rampa oficial (DESIGN.md §1), sobre a tinta da marca. A capa é
 * ilustração, como o gradiente do Nexo — não é acento de interface, então não
 * disputa com o violeta dos botões.
 *
 * Server Component: nenhum hook, nenhum JS no cliente. O movimento (zoom no
 * hover) fica no CSS de quem a usa.
 */

const COR: Record<Tema, string> = {
  rotina: "#55AFED",
  dados: "#6693F8",
  custos: "#6020EE",
  estrategia: "#7607E8",
  pessoas: "#6C66F3",
  ia: "#8426EA",
};

/** Hash FNV-1a → semente do mulberry32. Determinístico e sem dependência. */
function sorteio(texto: string) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let r = Math.imul(a ^ (a >>> 15), 1 | a);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const r2 = (n: number) => Math.round(n * 10) / 10;

/** Segundo desenho de cada tema. Com 63 cursos e só seis temas, um desenho
 *  por tema fazia prateleiras inteiras parecerem a mesma capa repetida — o
 *  Iniciante, quase todo "rotina", virava uma parede de arcos iguais. */
function motivoB(tema: Tema, L: number, A: number, rnd: () => number, cor: string): React.ReactNode[] {
  switch (tema) {
    case "rotina": {
      // Agenda: faixas horizontais de tamanhos e começos diferentes, como um cronograma.
      const n = 5 + Math.floor(rnd() * 3);
      const alt = (A * 0.5) / n;
      return Array.from({ length: n }, (_, i) => {
        const x = L * (0.08 + rnd() * 0.35);
        const w = L * (0.2 + rnd() * 0.45);
        return <rect key={i} x={r2(x)} y={r2(A * 0.12 + i * alt)} width={r2(w)} height={r2(alt * 0.55)} rx={r2(alt * 0.27)} fill={cor} opacity={r2(0.45 + rnd() * 0.5)} />;
      });
    }
    case "dados": {
      // Série: uma linha subindo com os pontos marcados.
      const n = 6 + Math.floor(rnd() * 3);
      const pts = Array.from({ length: n }, (_, i) => [L * (0.1 + (0.8 * i) / (n - 1)), A * (0.62 - (0.4 * i) / (n - 1) + (rnd() - 0.5) * 0.12)]);
      return [
        <polyline key="l" points={pts.map((p) => `${r2(p[0])},${r2(p[1])}`).join(" ")} fill="none" stroke={cor} strokeWidth={L * 0.012} strokeLinejoin="round" />,
        ...pts.map((p, i) => <circle key={i} cx={r2(p[0])} cy={r2(p[1])} r={r2(L * 0.018)} fill={cor} />),
      ];
    }
    case "custos": {
      // Cascata de custo: barras que se decompõem da esquerda para a direita.
      const n = 5 + Math.floor(rnd() * 2);
      const larg = (L * 0.76) / n;
      let topo = A * 0.16;
      return Array.from({ length: n }, (_, i) => {
        const h = A * (0.06 + rnd() * 0.1);
        const el = <rect key={i} x={r2(L * 0.12 + i * larg)} y={r2(topo)} width={r2(larg * 0.7)} height={r2(h)} fill={cor} opacity={r2(0.95 - i * 0.1)} />;
        topo += h;
        return el;
      });
    }
    case "estrategia": {
      // Alvo: anéis concêntricos e a flecha que chega ao centro.
      const cx = L * (0.4 + rnd() * 0.25);
      const cy = A * 0.36;
      const R = Math.min(L, A) * 0.32;
      return [
        ...[1, 0.68, 0.36].map((k, i) => <circle key={i} cx={r2(cx)} cy={r2(cy)} r={r2(R * k)} fill="none" stroke={cor} strokeWidth={L * 0.012} opacity={r2(0.5 + i * 0.2)} />),
        <circle key="c" cx={r2(cx)} cy={r2(cy)} r={r2(R * 0.12)} fill={cor} />,
        <line key="f" x1={r2(cx + R * 1.2)} y1={r2(cy - R * 1.1)} x2={r2(cx)} y2={r2(cy)} stroke="#F8F8F8" strokeOpacity={0.7} strokeWidth={L * 0.008} />,
      ];
    }
    case "pessoas": {
      // Pessoas: cabeça e ombros, em fila, de alturas diferentes.
      const n = 3 + Math.floor(rnd() * 2);
      const passo = (L * 0.8) / n;
      return Array.from({ length: n }, (_, i) => {
        const cx = L * 0.1 + passo * (i + 0.5);
        const base = A * (0.55 + rnd() * 0.08);
        const r = passo * 0.22;
        return (
          <g key={i} opacity={r2(0.6 + rnd() * 0.4)}>
            <circle cx={r2(cx)} cy={r2(base - r * 3.2)} r={r2(r)} fill={cor} />
            <path d={`M ${r2(cx - r * 1.9)} ${r2(base)} A ${r2(r * 1.9)} ${r2(r * 1.9)} 0 0 1 ${r2(cx + r * 1.9)} ${r2(base)}`} fill={cor} />
          </g>
        );
      });
    }
    default: {
      // ia: órbitas com nós, como um modelo girando em torno de um núcleo.
      const cx = L * 0.5;
      const cy = A * 0.36;
      return [
        ...[0.14, 0.24, 0.34].map((k, i) => {
          const r = Math.min(L, A) * k * 1.3;
          const ang = rnd() * Math.PI * 2;
          return (
            <g key={i}>
              <circle cx={r2(cx)} cy={r2(cy)} r={r2(r)} fill="none" stroke={cor} strokeOpacity={0.45} strokeWidth={L * 0.006} />
              <circle cx={r2(cx + r * Math.cos(ang))} cy={r2(cy + r * Math.sin(ang))} r={r2(L * 0.022)} fill={cor} />
            </g>
          );
        }),
        <circle key="n" cx={r2(cx)} cy={r2(cy)} r={r2(L * 0.05)} fill={cor} />,
      ];
    }
  }
}

/** O desenho de cada tema, num quadro de L × A. */
function motivo(tema: Tema, L: number, A: number, rnd: () => number, cor: string) {
  switch (tema) {
    case "dados": {
      // Barras de Pareto: altas à esquerda, caindo.
      const n = 7 + Math.floor(rnd() * 4);
      const larg = (L * 0.72) / n;
      return Array.from({ length: n }, (_, i) => {
        const h = A * 0.62 * Math.pow(0.8, i) * (0.85 + rnd() * 0.3);
        return <rect key={i} x={r2(L * 0.14 + i * larg)} y={r2(A * 0.78 - h)} width={r2(larg * 0.62)} height={r2(h)} fill={cor} opacity={r2(0.85 - i * 0.06)} />;
      });
    }
    case "custos": {
      // Degraus descendo: custo caindo, com o ponto de chegada marcado.
      const n = 5 + Math.floor(rnd() * 3);
      let d = `M ${r2(L * 0.08)} ${r2(A * 0.18)}`;
      let y = A * 0.18;
      const passo = (L * 0.84) / n;
      for (let i = 0; i < n; i++) {
        const x = L * 0.08 + (i + 1) * passo;
        d += ` H ${r2(x)}`;
        y += A * (0.05 + rnd() * 0.07);
        d += ` V ${r2(y)}`;
      }
      return [
        <path key="d" d={d} fill="none" stroke={cor} strokeWidth={L * 0.018} strokeLinejoin="round" />,
        <circle key="c" cx={r2(L * 0.92)} cy={r2(y)} r={r2(L * 0.035)} fill={cor} />,
      ];
    }
    case "estrategia": {
      // Grade com um caminho escolhido em destaque.
      const n = 6;
      const lado = (Math.min(L, A) * 0.8) / n;
      const x0 = L * 0.5 - (lado * n) / 2;
      const y0 = A * 0.42 - (lado * n) / 2;
      const quadros = [];
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) {
          const on = rnd() > 0.72;
          quadros.push(
            <rect key={`${i}-${j}`} x={r2(x0 + i * lado + 2)} y={r2(y0 + j * lado + 2)} width={r2(lado - 4)} height={r2(lado - 4)} fill={on ? cor : "none"} stroke={cor} strokeOpacity={0.35} opacity={on ? 0.9 : 1} />,
          );
        }
      return quadros;
    }
    case "pessoas": {
      // Círculos que se cruzam — o mesmo gesto do símbolo IAgentics.
      const n = 3 + Math.floor(rnd() * 3);
      return Array.from({ length: n }, (_, i) => (
        <circle key={i} cx={r2(L * (0.25 + rnd() * 0.5))} cy={r2(A * (0.2 + rnd() * 0.4))} r={r2(Math.min(L, A) * (0.16 + rnd() * 0.14))} fill="none" stroke={cor} strokeWidth={L * 0.012} opacity={r2(0.55 + rnd() * 0.4)} />
      ));
    }
    case "ia": {
      // Rede de nós: cada nó liga aos dois mais próximos.
      const n = 9 + Math.floor(rnd() * 5);
      const pts = Array.from({ length: n }, () => [L * (0.1 + rnd() * 0.8), A * (0.1 + rnd() * 0.6)] as const);
      const linhas: React.ReactNode[] = [];
      pts.forEach((p, i) => {
        const perto = pts
          .map((q, j) => ({ j, d: Math.hypot(p[0] - q[0], p[1] - q[1]) }))
          .filter((o) => o.j !== i)
          .sort((a, b) => a.d - b.d)
          .slice(0, 2);
        for (const o of perto) if (o.j > i) linhas.push(<line key={`${i}-${o.j}`} x1={r2(p[0])} y1={r2(p[1])} x2={r2(pts[o.j][0])} y2={r2(pts[o.j][1])} stroke={cor} strokeOpacity={0.55} strokeWidth={L * 0.005} />);
      });
      return [
        ...linhas,
        ...pts.map((p, i) => <circle key={`n${i}`} cx={r2(p[0])} cy={r2(p[1])} r={r2(L * (0.012 + rnd() * 0.018))} fill={cor} />),
      ];
    }
    default: {
      // rotina: o ciclo — arcos concêntricos com uma volta aberta.
      const cx = L * (0.3 + rnd() * 0.45);
      const cy = A * (0.26 + rnd() * 0.16);
      return Array.from({ length: 4 }, (_, i) => {
        const r = Math.min(L, A) * (0.12 + i * 0.09);
        const ini = rnd() * Math.PI * 2;
        const fim = ini + Math.PI * (1.1 + rnd() * 0.7);
        const x1 = cx + r * Math.cos(ini);
        const y1 = cy + r * Math.sin(ini);
        const x2 = cx + r * Math.cos(fim);
        const y2 = cy + r * Math.sin(fim);
        return <path key={i} d={`M ${r2(x1)} ${r2(y1)} A ${r2(r)} ${r2(r)} 0 1 1 ${r2(x2)} ${r2(y2)}`} fill="none" stroke={cor} strokeWidth={L * 0.014} strokeLinecap="round" opacity={r2(0.9 - i * 0.15)} />;
      });
    }
  }
}

export type CursoCapa = { slug: string; nome: string; nivel: number; temas: readonly Tema[]; introdutorio?: boolean };

type Props = {
  curso: CursoCapa;
  /** retrato 2:3 (pôster) ou paisagem 16:9 (miniatura de prateleira). */
  formato?: "retrato" | "paisagem";
  /** Esconde o título impresso quando quem usa a capa escreve o nome ao lado. */
  semTitulo?: boolean;
  /** Ocupa o contêiner inteiro, sem proporção fixa (fundo do destaque). */
  preencher?: boolean;
  className?: string;
};

export function Capa({ curso, formato = "retrato", semTitulo = false, preencher = false, className = "" }: Props) {
  const [L, A] = formato === "retrato" ? [300, 450] : [480, 270];
  const tema = curso.temas[0] ?? "rotina";
  const cor = COR[tema];
  const rnd = sorteio(curso.slug);
  const id = `capa-${formato}-${curso.slug}`;
  const numeral = String(curso.nivel + 1).padStart(2, "0");
  const variante = rnd() < 0.5 ? motivo : motivoB;
  // Segundo brilho na cor do tema secundário: dois cursos do mesmo tema
  // principal ainda se diferenciam pela "luz" do outro canto.
  const cor2 = COR[curso.temas[1] ?? tema];

  return (
    <div
      className={`capa relative overflow-hidden bg-brand-ink [container-type:inline-size] ${preencher ? "h-full w-full" : formato === "retrato" ? "aspect-[2/3]" : "aspect-video"} ${className}`}
      // A capa é decorativa quando o nome aparece em texto ao lado; quando o
      // título está impresso nela, o próprio texto HTML é lido normalmente.
      aria-hidden={semTitulo ? true : undefined}
    >
      <svg viewBox={`0 0 ${L} ${A}`} preserveAspectRatio="xMidYMid slice" className="capa-arte absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <radialGradient id={`${id}-brilho`} cx={r2(0.3 + rnd() * 0.4)} cy={0.35} r={0.75}>
            <stop offset="0" stopColor={cor} stopOpacity={0.55} />
            <stop offset="1" stopColor="#131723" stopOpacity={0} />
          </radialGradient>
          <radialGradient id={`${id}-brilho2`} cx={r2(0.7 + rnd() * 0.3)} cy={r2(0.75 + rnd() * 0.25)} r={0.6}>
            <stop offset="0" stopColor={cor2} stopOpacity={0.35} />
            <stop offset="1" stopColor="#131723" stopOpacity={0} />
          </radialGradient>
          <linearGradient id={`${id}-veu`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.35" stopColor="#131723" stopOpacity={0} />
            <stop offset="1" stopColor="#131723" stopOpacity={0.95} />
          </linearGradient>
        </defs>
        <rect width={L} height={A} fill="#131723" />
        <rect width={L} height={A} fill={`url(#${id}-brilho)`} />
        <rect width={L} height={A} fill={`url(#${id}-brilho2)`} />
        {/* Numeral do nível ao fundo, vazado — o "top 10" da Netflix, aqui
            dizendo em que degrau da formação o curso está. */}
        <text x={L * 0.96} y={A * 0.98} textAnchor="end" fontSize={A * 0.62} fontWeight={700} fill="none" stroke="#F8F8F8" strokeOpacity={0.08} strokeWidth={2} letterSpacing="-0.04em" style={{ fontFamily: "var(--font-sans), sans-serif" }}>
          {numeral}
        </text>
        <g>{variante(tema, L, A, rnd, cor)}</g>
        <rect width={L} height={A} fill={`url(#${id}-veu)`} />
      </svg>

      {/* Sem marca IAgentics na capa: repetida 63 vezes, vira ruído. E sem
          rótulo nenhum quando a capa é miniatura ou fundo (semTitulo) — em 48px
          de largura o nível sairia cortado. */}
      {semTitulo ? null : (
        <span className="absolute left-0 top-0 p-[6%] font-mono text-[10px] uppercase tracking-[0.18em] text-brand-paper/80">
          {curso.introdutorio ? t.introdutorio : t.niveis[curso.nivel]}
        </span>
      )}

      {semTitulo ? null : (
        <p
          className={`absolute inset-x-0 bottom-0 p-[7%] font-medium leading-[1.05] tracking-[-0.02em] text-brand-paper [text-wrap:balance] ${
            formato === "retrato" ? "text-[clamp(1rem,7cqw,1.6rem)]" : "text-[clamp(0.95rem,5.5cqw,1.5rem)]"
          }`}
        >
          {curso.nome}
        </p>
      )}
    </div>
  );
}
