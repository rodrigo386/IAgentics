import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  // Specs compartilham o MESMO banco local; em paralelo eles se atropelam
  // (ex.: admin-conteudo publica/despublica um curso enquanto painel conta
  // cards). Um worker = determinístico.
  workers: 1,
  use: { baseURL: "http://localhost:3000", channel: "chrome" },
  webServer: { command: "npm run start", url: "http://localhost:3000", reuseExistingServer: true, timeout: 120_000 },
});
