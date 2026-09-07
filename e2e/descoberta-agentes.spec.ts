import { test, expect } from "@playwright/test";

/* Descoberta por agentes (RFC 8288). O ponto destes testes não é só que o
   header existe — é que ele não MENTE: todo rel anunciado tem um alvo que
   responde 200. Um Link header para recurso inexistente passa em verificador
   automático e quebra na cara do agente que seguir o link. */

const ROTAS_HTML = ["/", "/nexo", "/academy", "/cursos", "/spend-lab", "/artigos", "/privacidade"];

test("as páginas HTML trazem Link headers com describedby e privacy-policy", async ({ request }) => {
  for (const rota of ROTAS_HTML) {
    const link = (await request.get(rota)).headers()["link"] ?? "";
    expect(link, `${rota} sem Link header`).toContain('rel="describedby"');
    expect(link, `${rota} sem privacy-policy`).toContain('rel="privacy-policy"');
    expect(link).toContain("/llms.txt");
  }
});

test("todo alvo anunciado no Link header responde 200", async ({ request }) => {
  const link = (await request.get("/")).headers()["link"] ?? "";
  const alvos = [...link.matchAll(/<([^>]+)>/g)].map((m) => m[1]);
  expect(alvos.length).toBeGreaterThan(0);
  for (const alvo of alvos) {
    expect((await request.get(alvo)).status(), `${alvo} anunciado mas não responde`).toBe(200);
  }
});

/* A IAgentics não expõe API pública. O verificador aceitaria api-catalog,
   service-desc e service-doc — e é justamente por serem fáceis de passar que
   este teste existe: anunciá-los sem API é o mesmo erro do cursosJsonLd,
   remover em 2026-08-28, de anunciar catálogo que não está à venda. */
test("não anuncia API que não existe", async ({ request }) => {
  const link = (await request.get("/")).headers()["link"] ?? "";
  for (const rel of ["api-catalog", "service-desc", "service-doc"]) {
    expect(link, `anuncia ${rel} sem API pública`).not.toContain(rel);
  }
});

test("assets não carregam Link header", async ({ request }) => {
  const r = await request.get("/iagentics-lockup.png");
  expect(r.headers()["link"]).toBeUndefined();
});

test("o llms.txt descreve o site atual, não o desligado", async ({ request }) => {
  const txt = await (await request.get("/llms.txt")).text();
  // O que o site é hoje.
  expect(txt).toContain("orquestrador de nove módulos");
  expect(txt).toContain("plataformasolution.com.br");
  expect(txt).toContain("/artigos");
  /* O que saiu com a plataforma em 2026-08-28 e não pode voltar a ser
     anunciado: certificados (a rota é 404) e a assinatura própria. */
  expect(txt).not.toContain("/certificados");
  expect(txt).not.toContain("R$ 39,90");
});
