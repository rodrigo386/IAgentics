import { existsSync, readFileSync } from "fs";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
// Fix round final (I4): no deploy não existe .env.local (as env vars vêm do
// ambiente) — sem o guard o script morria com ENOENT antes de tentar migrar.
if (existsSync(".env.local")) {
  for (const l of readFileSync(".env.local", "utf8").split("\n")) {
    const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2];
  }
}
// Imprime o alvo (sem credenciais) antes de conectar: rodado localmente sem
// exportar a URL de produção, o script migrava o banco de dev achando que
// era produção — este log é a última chance de perceber antes do `await`.
console.log("alvo:", new URL(process.env.DATABASE_URL).host);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
await pool.end();
console.log("migração ok");
