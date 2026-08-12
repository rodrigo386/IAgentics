// Registra (ou atualiza) o webhook de cobranças no Asaas — rodar UMA vez por
// ambiente, manualmente: node scripts/configurar-webhook.mjs <url-base>
// Ex.: node scripts/configurar-webhook.mjs https://iagentics-production.up.railway.app
// CHAMA A API REAL (chave de produção). Idempotente: procura webhook com a
// mesma URL e atualiza em vez de duplicar.
import { existsSync, readFileSync } from "fs";

// Mesmo carregador de scripts/migrar.mjs: .env.local só preenche o que faltar.
if (existsSync(".env.local")) {
  for (const l of readFileSync(".env.local", "utf8").split("\n")) {
    const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2];
  }
}

const base = process.argv[2];
if (!base) { console.error("uso: node scripts/configurar-webhook.mjs <url-base-do-site>"); process.exit(1); }
try { new URL(base); } catch { console.error("uso: node scripts/configurar-webhook.mjs <url-base-com-https://>"); process.exit(1); }
const chave = process.env.ASAAS;
const token = process.env.ASAAS_WEBHOOK_TOKEN;
if (!chave || !token) { console.error("faltam ASAAS e/ou ASAAS_WEBHOOK_TOKEN no ambiente"); process.exit(1); }

const url = `${base.replace(/\/$/, "")}/api/asaas/webhook`;
const cabecalhos = { "Content-Type": "application/json", access_token: chave };
const corpo = {
  name: "Plataforma IAgentics Academy",
  url,
  email: process.env.ASAAS_WEBHOOK_EMAIL ?? "rgoalves@gmail.com", // avisado se o Asaas pausar a fila
  enabled: true,
  interrupted: false,
  apiVersion: 3,
  sendType: "SEQUENTIALLY", // ordem de entrega garantida — as transições de status dependem disso
  events: ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED", "PAYMENT_OVERDUE", "PAYMENT_REFUNDED", "PAYMENT_DELETED"],
  authToken: token,
};

let dados = [];
let offset = 0;
let hasMore = true;
while (hasMore) {
  const lista = await (await fetch(`https://api.asaas.com/v3/webhooks?limit=100&offset=${offset}`, { headers: cabecalhos })).json();
  dados = dados.concat(lista.data ?? []);
  hasMore = lista.hasMore ?? false;
  offset += (lista.data ?? []).length;
}
const existente = dados.find((w) => w.url === url);
const resposta = await fetch(`https://api.asaas.com/v3/webhooks${existente ? `/${existente.id}` : ""}`, {
  method: existente ? "PUT" : "POST",
  headers: cabecalhos,
  body: JSON.stringify(corpo),
});
if (!resposta.ok) { const corpo = (await resposta.text()).replaceAll(token, "[token]").replaceAll(chave, "[chave]"); console.error("falhou:", resposta.status, corpo); process.exit(1); }
console.log(`webhook ${existente ? "atualizado" : "criado"}: ${url}`);
