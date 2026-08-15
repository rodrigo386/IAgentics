/** Skeleton da lista de alunos: título, busca e linhas de tabela. */
export default function CarregandoAlunos() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-8">
      <div className="skeleton h-9 w-36" />
      <div className="skeleton h-11 w-full max-w-md rounded-control" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="skeleton h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
