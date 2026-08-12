import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin/sessao";
import { gerarCsv, type Periodo } from "@/lib/admin/metricas";

export async function GET(request: Request) {
  // Portão ANTES de qualquer trabalho: aluno comum recebe o mesmo 404 que
  // exigirAdmin() dá em qualquer outra rota de /admin — não confirma nem nega
  // se o bloco/curso pedido existiria para um admin de verdade.
  await exigirAdmin();
  const url = new URL(request.url);
  const bloco = url.searchParams.get("bloco") as Parameters<typeof gerarCsv>[0];
  const periodo = (url.searchParams.get("periodo") ?? "30") as Periodo;
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
