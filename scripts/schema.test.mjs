import { readFileSync } from "fs";
import pg from "pg";
for (const l of readFileSync(".env.local", "utf8").split("\n")) {
  const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2];
}
const cli = new pg.Client({ connectionString: process.env.DATABASE_URL });
await cli.connect();
const { rows } = await cli.query(
  `select table_name from information_schema.tables where table_schema='public' order by 1`);
const nomes = rows.map(r => r.table_name);
const esperadas = ["courses","lesson_media","lesson_progress","lessons","modules","subscriptions","users"];
const faltam = esperadas.filter(t => !nomes.includes(t));
// constraint de status também é contrato:
const { rows: chk } = await cli.query(
  `select 1 from information_schema.check_constraints where constraint_schema='public' and check_clause like '%manual%'`);
await cli.end();
if (faltam.length || chk.length === 0) {
  console.error("faltam tabelas:", faltam, "| check de status:", chk.length);
  process.exit(1);
}
console.log("schema ok:", nomes.join(", "));
