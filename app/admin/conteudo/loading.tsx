/** Skeleton do catálogo do admin: título + cartões de curso. */
export default function CarregandoConteudo() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="skeleton h-9 w-36" />
        <div className="skeleton h-11 w-40 rounded-control" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton h-40 w-full" />
        ))}
      </div>
    </div>
  );
}
