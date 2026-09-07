import { test, expect } from "@playwright/test";

/* Negociação de conteúdo: a mesma URL devolve HTML para navegador e markdown
   para quem pede `Accept: text/markdown`. */

const ROTAS = ["/", "/nexo", "/academy", "/cursos", "/spend-lab", "/privacidade", "/artigos"];
const ARTIGO = "/artigos/prompts-para-compras";

test("as páginas públicas respondem markdown quando pedido", async ({ request }) => {
  for (const rota of [...ROTAS, ARTIGO]) {
    const r = await request.get(rota, { headers: { Accept: "text/markdown" } });
    expect(r.status(), rota).toBe(200);
    expect(r.headers()["content-type"], rota).toContain("text/markdown");
    expect(Number(r.headers()["x-markdown-tokens"]), `${rota} sem contagem`).toBeGreaterThan(0);
    expect(await r.text(), rota).toMatch(/^# .+/);
  }
});

/* A asserção que dá sentido ao spec. Um rewrite faz o Route Handler enxergar a
   URL ORIGINAL, então a rota pedida não chegava até ele e TODAS as páginas
   devolviam a home — com content-type certo, tokens certos e conteúdo errado.
   O verificador de agent readiness teria passado. */
test("cada rota devolve o SEU conteúdo, não a home", async ({ request }) => {
  const corpo = async (rota: string) =>
    (await request.get(rota, { headers: { Accept: "text/markdown" } })).text();

  const [home, nexo, cursos, artigo] = await Promise.all([
    corpo("/"),
    corpo("/nexo"),
    corpo("/cursos"),
    corpo(ARTIGO),
  ]);

  expect(new Set([home, nexo, cursos, artigo]).size).toBe(4);
  expect(nexo).toContain("https://iagentics.com.br/nexo");
  expect(nexo).toContain("Nexo orquestra");
  expect(cursos).toContain("Solution");
  expect(artigo).toContain("Prompts para quem trabalha com Compras");
});

test("navegador continua recebendo HTML", async ({ request }) => {
  for (const accept of ["text/html,application/xhtml+xml,application/xml;q=0.9", "*/*"]) {
    const r = await request.get("/nexo", { headers: { Accept: accept } });
    expect(r.headers()["content-type"], accept).toContain("text/html");
  }
});

/* Sem `Vary: Accept` um cache intermediário guardaria uma das duas
   representações e a serviria para o outro tipo de cliente — markdown para
   navegador, HTML para agente. */
test("as duas representações declaram Vary: Accept", async ({ request }) => {
  const html = await request.get("/nexo");
  const md = await request.get("/nexo", { headers: { Accept: "text/markdown" } });
  expect(html.headers()["vary"] ?? "").toContain("Accept");
  expect(md.headers()["vary"] ?? "").toContain("Accept");
});

test("o artigo vem do markdown original, não convertido do HTML", async ({ request }) => {
  const md = await (await request.get(ARTIGO, { headers: { Accept: "text/markdown" } })).text();
  /* O corpo do arquivo tem quebras de linha do autor e nenhum resíduo de
     conversão; se um dia passar pelo turndown, aparecem escapes como "\\-". */
  expect(md).not.toContain("\\-");
  expect(md).not.toContain("<p>");
});

/* O middleware ganhou a negociação sem perder o Basic Auth: /admin não pode
   virar markdown nem abrir sem credencial. */
test("o /admin não é negociável e segue protegido", async ({ request }) => {
  const r = await request.get("/admin", { headers: { Accept: "text/markdown" } });
  expect(r.status()).toBe(401);
  expect(r.headers()["content-type"] ?? "").not.toContain("markdown");
});

test("a rota interna recusa caminho fora da lista branca", async ({ request }) => {
  for (const rota of ["/admin", "/api/estatisticas", "/artigos/inventado"]) {
    const r = await request.get(`/api/markdown?rota=${encodeURIComponent(rota)}`);
    expect(r.status(), rota).toBe(404);
  }
});
