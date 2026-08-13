import Image from "next/image";
import Link from "next/link";
import { plataforma } from "@/lib/content-plataforma";
import type { Curso } from "@/lib/plataforma/tipos";

/** Anel de progresso simples (SVG), só aparece quando pct > 0 — não é um
 *  controle (não segue radius-control), é um indicador circular por natureza. */
function AnelProgresso({ pct }: { pct: number }) {
  const raio = 14;
  const circunferencia = 2 * Math.PI * raio;
  const offset = circunferencia * (1 - pct / 100);
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden className="shrink-0">
      <circle cx="17" cy="17" r={raio} fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <circle
        cx="17"
        cy="17"
        r={raio}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circunferencia}
        strokeDashoffset={offset}
        transform="rotate(-90 17 17)"
      />
      <text x="17" y="18" textAnchor="middle" dominantBaseline="middle" fontSize="9" className="fill-current font-mono">
        {pct}
      </text>
    </svg>
  );
}

/** Card do catálogo: capa 3:4, nível + carga horária, título. Sem assinatura,
 *  mostra o selo "Assine para acessar" mas o card continua clicável — quem
 *  vende é a página do curso, não o painel. */
export function CardCurso({ curso, pct, temAcesso }: { curso: Curso; pct: number; temAcesso: boolean }) {
  return (
    <Link
      href={`/app/curso/${curso.slug}`}
      data-testid="card-curso"
      className="group flex h-full flex-col border border-line bg-surface transition-colors hover:border-line-strong"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden border-b border-line">
        <Image
          src={curso.capaUrl}
          alt=""
          fill
          sizes="240px" // card fixo 220–240px nos trilhos (ver Trilho em app/app/page.tsx)
          style={{ objectPosition: "center top" }}
          className="object-cover"
        />
        {!temAcesso ? (
          <span className="absolute right-3 top-3 rounded-control bg-brand-ink/80 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-paper">
            {plataforma.painel.seloAssine}
          </span>
        ) : null}
        {pct === 100 ? (
          <span className="absolute left-3 top-3 rounded-control bg-accent px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-accent-on">
            {plataforma.painel.seloConcluida}
          </span>
        ) : null}
        {pct > 0 ? (
          <span className="absolute bottom-3 right-3 flex h-[34px] w-[34px] items-center justify-center rounded-control bg-brand-ink/80 text-brand-paper">
            <AnelProgresso pct={pct} />
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-muted">
          {curso.nivel} · {curso.cargaHoras}
          {plataforma.painel.horas}
        </p>
        <h3 className="mt-2 text-lg font-medium leading-snug tracking-[-0.02em] text-fg">{curso.titulo}</h3>
      </div>
    </Link>
  );
}
