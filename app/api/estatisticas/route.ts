import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { pageViews } from "@/lib/db/schema";
import { normalizarRota } from "@/lib/estatisticas";
import { slugsPublicados } from "@/lib/artigos";

/**
 * Coletor de visitas do site (alvo do sendBeacon de components/site/Beacon.tsx).
 *
 * Fire-and-forget dos dois lados: o beacon não espera resposta e este handler
 * responde 204 SEMPRE - inclusive em erro de banco - porque um contador de
 * visitas nunca pode virar ruído de 500 no log nem sinal para quem sonda a
 * API. A validação real é o normalizador (server-side): POST forjado com rota
 * inventada no máximo incrementa o balde "/outras" do dia.
 */
export async function POST(req: Request) {
  try {
    const corpo = (await req.json()) as { rota?: unknown };
    /* Os slugs vêm do disco a cada request, e isso é barato: lib/artigos.ts
       lê seis arquivos .md pequenos. É essa lista que impede um POST forjado
       de inventar rotas novas em page_views. */
    const rota = normalizarRota(corpo.rota, slugsPublicados());
    if (rota) {
      const dia = new Date().toISOString().slice(0, 10);
      await db
        .insert(pageViews)
        .values({ dia, rota, visitas: 1 })
        .onConflictDoUpdate({
          target: [pageViews.dia, pageViews.rota],
          set: { visitas: sql`${pageViews.visitas} + 1` },
        });
    }
  } catch {
    // Beacon é melhor-esforço: corpo malformado ou banco fora não é incidente.
  }
  return new Response(null, { status: 204 });
}
