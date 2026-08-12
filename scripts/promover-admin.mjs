import { existsSync, readFileSync } from "node:fs";
import pg from "pg";

if (existsSync(".env.local")) {
  for (const l of readFileSync(".env.local", "utf8").split("\n")) {
    const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2];
  }
}
const email = (process.argv[2] ?? "").trim().toLowerCase();
if (!email.includes("@")) { console.error("uso: node scripts/promover-admin.mjs email@dominio"); process.exit(1); }
console.log("alvo:", new URL(process.env.DATABASE_URL).host, "| e-mail:", email);
const cli = new pg.Client({ connectionString: process.env.DATABASE_URL });
await cli.connect();
const r = await cli.query(
  "update users set role = 'admin' where lower(email) = $1 returning id, nome", [email]);
await cli.end();
if (r.rowCount === 0) { console.error("nenhum usuário com esse e-mail"); process.exit(1); }
console.log(`promovido: ${r.rows[0].nome || "(sem nome)"} (${r.rows[0].id})`);
