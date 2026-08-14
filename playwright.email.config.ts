// playwright.email.config.ts
// Suíte separada da principal DE PROPÓSITO: ligar RESEND_API_KEY no webServer
// compartilhado ativaria o bloqueio de cadastro para TODOS os specs atuais.
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e-email",
  timeout: 60_000,
  workers: 1,
  use: { baseURL: "http://localhost:3100", channel: "chrome" },
  webServer: {
    command: "npm run start -- --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      RESEND_API_KEY: "fake-e2e",
      EMAIL_CAIXA_TESTE: "/tmp/iagentics-e2e-emails.jsonl",
      AUTH_URL: "http://localhost:3100",
    },
  },
});
