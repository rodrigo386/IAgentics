import { date, integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";

/**
 * Schema do site público.
 *
 * Sobrou UMA tabela. Em 2026-08-28 a plataforma de ensino própria foi
 * desligada (parceria com o Pecege — ver docs/ROADMAP-ACADEMY.md) e com ela
 * saíram as 14 tabelas de aluno, curso, assinatura, certificado e contrato
 * B2B. O histórico delas está no git e nas migrações anteriores.
 *
 * `page_views` ficou porque nunca foi da plataforma: ela é do site
 * institucional, escrita pelo beacon a cada visita. Dropá-la junto teria
 * quebrado o site que continua no ar.
 */

/** Visitas do site público, agregadas por dia+rota - alimentadas pelo beacon
 *  (components/site/Beacon.tsx → app/api/estatisticas/route.ts). Agregado de
 *  propósito: nenhum dado pessoal, nenhum cookie, nenhum user-agent; a
 *  cardinalidade de `rota` é limitada pelo normalizador em lib/estatisticas.ts
 *  (seções conhecidas + "/outras"), então a tabela cresce no máximo
 *  |rotas| linhas por dia. */
export const pageViews = pgTable("page_views", {
  dia: date("dia").notNull(),
  rota: text("rota").notNull(),
  visitas: integer("visitas").notNull().default(0),
}, (t) => [primaryKey({ columns: [t.dia, t.rota] })]);
