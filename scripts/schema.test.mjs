import { existsSync, readFileSync } from "fs";
import pg from "pg";
// Fix round final (I4): no deploy não existe .env.local (as env vars vêm do
// ambiente) — sem o guard o script morria com ENOENT antes de checar o schema.
if (existsSync(".env.local")) {
  for (const l of readFileSync(".env.local", "utf8").split("\n")) {
    const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2];
  }
}
// Imprime o alvo (sem credenciais) antes de conectar: rodado localmente sem
// exportar a URL de produção, o script checava o schema do banco de dev
// achando que era produção — este log é a última chance de perceber antes do `await`.
console.log("alvo:", new URL(process.env.DATABASE_URL).host);
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
