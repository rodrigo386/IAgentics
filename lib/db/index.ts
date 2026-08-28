import "server-only"; // build falha se um componente client importar isto
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/* max voltou de 20 para 5 em 2026-08-28. O 20 existia por causa do painel
 * analítico do /admin, que disparava ~16 consultas em paralelo por render;
 * esse painel saiu com a plataforma. O único consumidor do banco agora é o
 * beacon de visitas — uma escrita curta por página, sem paralelismo. */
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
export const db = drizzle(pool, { schema });
