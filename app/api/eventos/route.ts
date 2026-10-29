import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { eventosCursos } from "@/lib/db/schema";
import { eventoValido } from "@/lib/eventos";
import { hojeSP } from "@/lib/assinatura/regras";

/**
 * Recebe os eventos da /cursos (2026-10-29) e soma 1 no total do dia. Só o
 * nome do evento chega aqui, de uma lista fechada; o resto é ignorado em
 * silêncio, e a resposta é sempre 204 para o navegador não tentar de novo.
 */
export async function POST(request: Request) {
  try {
    const corpo: unknown = await request.json();
    const evento = (corpo as { evento?: unknown } | null)?.evento;
    if (eventoValido(evento)) {
      await db
        .insert(eventosCursos)
        .values({ dia: hojeSP(), evento, total: 1 })
        .onConflictDoUpdate({ target: [eventosCursos.dia, eventosCursos.evento], set: { total: sql`${eventosCursos.total} + 1` } });
    }
  } catch {
    /* Corpo inválido ou banco fora: medição não é motivo de erro. */
  }
  return new NextResponse(null, { status: 204 });
}
