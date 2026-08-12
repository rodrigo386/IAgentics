import EmbeddedPostgres from "embedded-postgres";
const pg = new EmbeddedPostgres({
  databaseDir: ".dev/postgres-data",
  user: "postgres", password: "local-dev", port: 54329, persistent: true,
});
const cmd = process.argv[2];
if (cmd === "start") {
  const fs = await import("fs");
  if (!fs.existsSync(".dev/postgres-data/PG_VERSION")) await pg.initialise();
  await pg.start();
  try { await pg.createDatabase("plataforma"); } catch { /* já existe */ }
  console.log("postgres local em 127.0.0.1:54329/plataforma");
} else if (cmd === "stop") { await pg.stop(); console.log("parado"); }
else { console.error("uso: node scripts/db-local.mjs start|stop"); process.exit(1); }
