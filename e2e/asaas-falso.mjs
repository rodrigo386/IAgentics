/**
 * Asaas falso para o e2e (2026-09-22). O `next start` do Playwright sobe com
 * ASAAS_URL_BASE apontando para cá — nenhum teste chega perto da API real,
 * cuja chave de produção está no .env.local.
 *
 * Guarda em memória o corpo de cada chamada; o spec lê em GET /__estado para
 * conferir o valor cobrado e a referência da venda.
 */
import http from "node:http";

const PORTA = 4010;
/* Ids únicos entre reinícios: o banco local guarda as assinaturas de execuções
   anteriores, e `asaas_assinatura_id` é único (no Asaas real nunca repete). */
const RODADA = Date.now().toString(36);
const clientes = [];
const cobrancas = [];
const assinaturas = [];
const cancelamentos = [];

function json(res, status, corpo) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(corpo));
}

function lerCorpo(req) {
  return new Promise((resolve) => {
    let dados = "";
    req.on("data", (p) => (dados += p));
    req.on("end", () => resolve(dados ? JSON.parse(dados) : {}));
  });
}

http
  .createServer(async (req, res) => {
    if (req.method === "GET" && req.url === "/__estado") return json(res, 200, { clientes, cobrancas, assinaturas, cancelamentos });

    if (!req.headers["access_token"] && req.url !== "/__estado" && !req.url?.startsWith("/fatura/")) {
      return json(res, 401, { errors: [{ code: "sem_chave" }] });
    }

    // Busca de cliente por CPF (2026-10-14): devolve o primeiro com aquele CPF.
    if (req.method === "GET" && req.url?.startsWith("/customers?")) {
      const cpf = new URL(req.url, "http://x").searchParams.get("cpfCnpj");
      const i = clientes.findIndex((c) => c.cpfCnpj === cpf);
      return json(res, 200, { data: i >= 0 ? [{ id: `cus_falso_${i + 1}`, deleted: false }] : [] });
    }

    // Assinaturas: criação, primeira fatura e cancelamento.
    if (req.method === "POST" && req.url === "/subscriptions") {
      const corpo = await lerCorpo(req);
      const id = `sub_falso_${RODADA}_${assinaturas.length + 1}`;
      assinaturas.push({ id, ...corpo });
      return json(res, 200, { id });
    }
    const pagamentos = req.url?.match(/^\/subscriptions\/([^/]+)\/payments$/);
    if (req.method === "GET" && pagamentos) {
      const a = assinaturas.find((x) => x.id === pagamentos[1]);
      if (!a) return json(res, 404, { errors: [{ code: "nao_encontrado" }] });
      const id = `pay_${a.id}_1`;
      return json(res, 200, { data: [{ id, invoiceUrl: `http://127.0.0.1:${PORTA}/fatura/${id}`, dueDate: a.nextDueDate }] });
    }
    const cancelar = req.url?.match(/^\/subscriptions\/([^/]+)$/);
    if (req.method === "DELETE" && cancelar) {
      cancelamentos.push(cancelar[1]);
      return json(res, 200, { deleted: true, id: cancelar[1] });
    }

    if (req.method === "GET" && req.url?.startsWith("/fatura/")) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end("<!doctype html><title>Fatura falsa</title><h1>Fatura falsa</h1>");
    }

    if (req.method === "POST" && !req.headers["access_token"]) return json(res, 401, { errors: [{ code: "sem_chave" }] });

    if (req.method === "POST" && req.url === "/customers") {
      const corpo = await lerCorpo(req);
      clientes.push(corpo);
      return json(res, 200, { id: `cus_falso_${clientes.length}` });
    }

    if (req.method === "POST" && req.url === "/payments") {
      const corpo = await lerCorpo(req);
      const id = `pay_falso_${cobrancas.length + 1}`;
      cobrancas.push({ id, ...corpo });
      return json(res, 200, { id, invoiceUrl: `http://127.0.0.1:${PORTA}/fatura/${id}` });
    }

    json(res, 404, { errors: [{ code: "nao_encontrado" }] });
  })
  .listen(PORTA, "127.0.0.1");
