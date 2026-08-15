import "server-only"; // build falha se um componente client importar isto
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/* max subiu de 5 para 20 em 2026-08-15: o painel analítico dispara ~16
 * consultas em paralelo por render e, com 5 conexões, uma server action que
 * chegasse na fila atrás delas estourava timeout de forma intermitente
 * (actions do /admin/alunos penduradas no e2e foram o sintoma). O Postgres do
 * Railway aguenta isso com folga (max_connections ~100, um container só). */
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 20 });
export const db = drizzle(pool, { schema });
