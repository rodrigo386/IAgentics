import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

// Mesmo carregador de scripts/migrar.mjs: só preenche o que ainda não está no
// ambiente, para que lib/plataforma/autorizacao.test.ts enxergue DATABASE_URL
// sem exigir um .env.test à parte.
if (existsSync(".env.local")) {
  for (const l of readFileSync(".env.local", "utf8").split("\n")) {
    const m = l.match(/^([A-Z_]+)=(.*)$/);
    if (m) process.env[m[1]] ??= m[2];
  }
}

export default defineConfig({
  test: {
    // include explícito: sem isso o glob padrão do vitest também pega e2e/*.spec.ts
    // (suítes do Playwright, não do vitest — quebravam ao rodar `vitest run`).
    include: ["lib/**/*.test.ts"],
    exclude: [...configDefaults.exclude, "scripts/**"],
    environment: "node",
    server: {
      // Por padrão o vitest externaliza deps de node_modules (carregadas pelo Node
      // puro, ignorando resolve.alias abaixo). lib/admin/sessao.ts importa "@/auth",
      // que puxa next-auth → next/server; sem inline aqui o alias de next/server
      // nunca entra em ação e o import quebra antes mesmo do primeiro teste rodar.
      deps: { inline: [/next-auth/, /@auth\/core/] },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      // "server-only" lança incondicionalmente fora da condição "react-server" do
      // bundler do Next — necessário para barrar import em Client Component, mas
      // também dispara sob o Node puro do vitest. lib/db (e lib/plataforma/dados.ts)
      // importam "server-only" de propósito; aqui trocamos pelo próprio "empty.js"
      // que o pacote já usa sob "react-server", só para a suíte de integração poder
      // chamar a camada de dados contra o Postgres real.
      "server-only": fileURLToPath(new URL("./node_modules/server-only/empty.js", import.meta.url)),
      // O pacote "next" não declara "exports" no package.json (o webpack do Next
      // resolve os subpaths por um mecanismo próprio — dá o mesmo aviso em
      // next-auth/lib/env.js). Resolução ESM pura (vitest/node) exige a extensão
      // exata do arquivo; lib/admin/sessao.ts importa "next/navigation" (notFound)
      // e "@/auth" puxa next-auth, que importa "next/server" — sem isto o módulo
      // nem carrega em teste, embora funcione normalmente sob `next build`.
      "next/navigation": fileURLToPath(new URL("./node_modules/next/navigation.js", import.meta.url)),
      "next/server": fileURLToPath(new URL("./node_modules/next/server.js", import.meta.url)),
    },
  },
});
