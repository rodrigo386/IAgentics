import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { entradas, pageViews } from "@/lib/db/schema";
import { normalizarOrigem, normalizarRota } from "@/lib/estatisticas";
import { slugsPublicados } from "@/lib/artigos";

/**
 * Coletor de visitas do site (alvo do sendBeacon de components/site/Beacon.tsx).
 *
 * Fire-and-forget dos dois lados: o beacon não espera resposta e este handler
 * responde 204 SEMPRE - inclusive em erro de banco - porque um contador de
 * visitas nunca pode virar ruído de 500 no log nem sinal para quem sonda a
 * API. A validação real é o normalizador (server-side): POST forjado com rota
 * inventada no máximo incrementa o balde "/outras" do dia.
 *
 * DUAS TABELAS, e a diferença é o ponto. `page_views` recebe TODA
 * visualização. `entradas` recebe só as que trazem o campo `origem`, que o
 * beacon manda uma vez por documento - a chegada. Nenhuma é derivável da
 * outra, e a subtração entre elas é a navegação dentro do site.
 *
 * O campo `origem` chega como HOSTNAME e nunca é gravado assim: vira um dos
 * seis baldes de `normalizarOrigem`. Um POST forjado com hostname inventado no
 * máximo incrementa "indicacao" - não cria linha nova, pela mesma razão de
 * cardinalidade que governa as rotas.
 */
export async function POST(req: Request) {
  try {
    const corpo = (await req.json()) as { rota?: unknown; origem?: unknown };
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

      /* O campo presente é o que marca a chegada — inclusive vazio, que é o
         referrer ausente e vira "direto". Ausente significa "troca de rota
         dentro do mesmo documento", e essa não é uma entrada. */
      if (typeof corpo.origem === "string") {
        const origem = normalizarOrigem(corpo.origem);
        await db
          .insert(entradas)
          .values({ dia, rota, origem, visitas: 1 })
          .onConflictDoUpdate({
            target: [entradas.dia, entradas.rota, entradas.origem],
            set: { visitas: sql`${entradas.visitas} + 1` },
          });
      }
    }
  } catch {
    // Beacon é melhor-esforço: corpo malformado ou banco fora não é incidente.
  }
  return new Response(null, { status: 204 });
}
