import { admin } from "@/lib/content-admin";
import { EstadoVazio } from "@/components/admin/EstadoVazio";

/**
 * O funil que liga o site ao negócio: visitas → contas → e-mails confirmados
 * → novas assinaturas, no MESMO período do filtro. Cada etapa mostra o número
 * e a conversão sobre a etapa anterior; a barra é proporcional à primeira
 * etapa não-zero, então a forma do funil é a informação.
 */
export function FunilNegocio({
  visitas,
  contas,
  confirmadas,
  assinantes,
}: {
  visitas: number;
  contas: number;
  confirmadas: number;
  assinantes: number;
}) {
  const t = admin.metricas.funilNegocio;
  const etapas = [
    { rotulo: t.visitas, valor: visitas },
    { rotulo: t.contas, valor: contas },
    { rotulo: t.confirmadas, valor: confirmadas },
    { rotulo: t.assinantes, valor: assinantes },
  ];
  const base = etapas.find((e) => e.valor > 0)?.valor ?? 0;

  if (base === 0) {
    return <EstadoVazio titulo={t.vazio.titulo} texto={t.vazio.texto} />;
  }

  return (
    <ol className="flex flex-col gap-4">
      {etapas.map((etapa, i) => {
        const anterior = i > 0 ? etapas[i - 1].valor : null;
        const conversao = anterior && anterior > 0 ? Math.round((etapa.valor / anterior) * 100) : null;
        return (
          <li key={etapa.rotulo} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-4 text-sm">
              <span className="text-fg">{etapa.rotulo}</span>
              <span className="tnum shrink-0 font-mono text-[11px] text-fg-muted">
                <span className="text-fg">{etapa.valor}</span>
                {conversao !== null ? ` (${conversao}%)` : ""}
              </span>
            </div>
            {/* min 2% para valor>0 ser visível; max 100% porque uma etapa PODE
                superar a base (conta criada sem visita contada), e a barra não
                pode vazar do card - o número entre parênteses conta a verdade. */}
            <div
              aria-hidden="true"
              className="h-2 bg-accent"
              style={{ width: `${Math.min(Math.max(Math.round((etapa.valor / base) * 100), etapa.valor > 0 ? 2 : 0), 100)}%` }}
            />
          </li>
        );
      })}
    </ol>
  );
}
