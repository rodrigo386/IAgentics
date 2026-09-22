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
const clientes = [];
const cobrancas = [];

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
    if (req.method === "GET" && req.url === "/__estado") return json(res, 200, { clientes, cobrancas });

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
