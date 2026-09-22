import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  // Specs compartilham o MESMO banco local; em paralelo eles se atropelam
  // (ex.: admin-conteudo publica/despublica um curso enquanto painel conta
  // cards). Um worker = determinístico.
  workers: 1,
  use: { baseURL: "http://localhost:3000", channel: "chrome" },
  /* Dois servidores: o Asaas falso e o site. ASAAS_URL_BASE vai só no env do
     `next start` que o Playwright sobe — o .env.local não a define, e o
     cliente do Asaas não tem valor padrão, então um servidor subido à mão sem
     ela faz o checkout FALHAR em vez de cobrar de verdade. Ao reaproveitar um
     servidor já de pé (reuseExistingServer), suba-o com
     `ASAAS_URL_BASE=http://127.0.0.1:4010 npm run start`. */
  webServer: [
    { command: "node e2e/asaas-falso.mjs", url: "http://127.0.0.1:4010/__estado", reuseExistingServer: true, timeout: 10_000 },
    {
      command: "npm run start",
      url: "http://localhost:3000",
      reuseExistingServer: true,
      timeout: 120_000,
      env: { ASAAS_URL_BASE: "http://127.0.0.1:4010" },
    },
  ],
});
