/**
 * Skeleton do painel: espelha a FORMA da página real (título + pills, cinco
 * KPIs em colunas de filete, tráfego, dois gráficos, tabela) para o conteúdo
 * encaixar sem salto quando chegar. Shimmer em CSS (.skeleton), estático em
 * reduced-motion. Tudo aria-hidden: leitor de tela espera o dado, não o eco.
 */
export default function CarregandoPainel() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="skeleton h-9 w-40" />
        <div className="skeleton h-9 w-64 rounded-control" />
      </div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex flex-col gap-2 border-t border-line-strong pt-4">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-4 border border-line p-6">
        <div className="skeleton h-5 w-36" />
        <div className="skeleton h-48 w-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="flex flex-col gap-4 border border-line p-6">
            <div className="skeleton h-5 w-48" />
            <div className="skeleton h-40 w-full" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-4 border border-line p-6">
        <div className="skeleton h-5 w-44" />
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="skeleton h-8 w-full" />
        ))}
      </div>
    </div>
  );
}
