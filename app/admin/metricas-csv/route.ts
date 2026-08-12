import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin/sessao";
import { ehPeriodoValido, gerarCsv, type Periodo } from "@/lib/admin/metricas";

// Espelha BLOCOS_CSV (lib/admin/metricas.ts, não exportado) só para validar
// aqui — ver comentário abaixo sobre por que a validação tem que acontecer
// ANTES de qualquer coisa, não dentro de gerarCsv.
const BLOCOS_VALIDOS = ["cadastros", "atividade", "conclusao", "funil"] as const;
type BlocoValido = (typeof BLOCOS_VALIDOS)[number];

export async function GET(request: Request) {
  // Portão ANTES de qualquer trabalho: aluno comum recebe o mesmo 404 que
  // exigirAdmin() dá em qualquer outra rota de /admin — não confirma nem nega
  // se o bloco/curso pedido existiria para um admin de verdade.
  await exigirAdmin();
  const url = new URL(request.url);
  const blocoParam = url.searchParams.get("bloco");
  const periodoParam = url.searchParams.get("periodo") ?? "30";

  // Fix round final (I5): bloco/periodo cru de searchParams iam direto para
  // um `as` sem checagem — um periodo tipo "xyz" não corta em nenhum WHERE
  // (vira "sem filtro" pro SQL, não um erro) e mesmo assim alimentava o
  // template do Content-Disposition abaixo, abrindo espaço pra injeção de
  // header via filename. Validar os dois ANTES de gerar qualquer coisa
  // garante que só literais conhecidos e seguros chegam no template.
  if (!blocoParam || !BLOCOS_VALIDOS.includes(blocoParam as BlocoValido) || !ehPeriodoValido(periodoParam)) {
    return new NextResponse(null, { status: 404 });
  }
  const bloco: BlocoValido = blocoParam as BlocoValido;
  const periodo: Periodo = periodoParam;
  const curso = url.searchParams.get("curso") ?? undefined;
  const csv = await gerarCsv(bloco, periodo, curso);
  if (csv === null) return new NextResponse(null, { status: 404 });
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="metricas-${bloco}-${periodo}.csv"`,
    },
  });
}
