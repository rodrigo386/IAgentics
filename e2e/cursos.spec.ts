import { test, expect } from "@playwright/test";

/* /cursos deixou de ser a landing da plataforma própria em 2026-08-28: virou o
   aviso de "em breve" da parceria com o Pecege. A URL foi preservada porque
   tinha acabado de ser indexada — este spec existe para garantir que ela
   continua respondendo e que nada do funil antigo sobreviveu por engano. */

test("/planos continua redirecionando permanente para /cursos", async ({ page }) => {
  await page.goto("/planos");
  await expect(page).toHaveURL("/cursos");
});

test("/cursos abre com as três marcas e a assinatura, sem resto da plataforma antiga", async ({ page }) => {
  await page.goto("/cursos");

  /* Desde 2026-10-14 a página vende a assinatura da Solution (o "em breve"
     saiu); o preço e o formulário são cobertos por e2e/assinatura.spec.ts. */
  await expect(page.getByRole("heading", { level: 1, name: /IA aplicada aos negócios/ })).toBeVisible();
  /* Ancorado no <main>: o lockup da IAgentics aparece também no Nav e no
     rodapé, então contar ocorrências na página inteira seria frágil — quebraria
     a cada mudança de layout sem que a hero tivesse problema nenhum. O que
     importa aqui é que as TRÊS marcas dividem o hero.

     IAgentics e Solution são inline (role=img + aria-label), não <img alt>:
     seus arquivos têm o texto em branco e sumiriam no tema claro. O do Pecege
     é colorido, continua <Image>, e por isso é buscado por alt. */
  const hero = page.locator("main");
  /* `exact` é obrigatório: sem ele o match é por substring, e qualquer
     imagem cujo nome contenha "IAgentics" casaria (a estante de capas que
     ficava aqui até 2026-10-14 casava). */
  await expect(hero.getByRole("img", { name: "IAgentics", exact: true })).toHaveCount(1);
  await expect(hero.getByAltText("Pecege")).toBeVisible();
  await expect(hero.getByRole("img", { name: "Solution", exact: true })).toBeVisible();

  /* O funil da plataforma própria (desligada em 2026-08-28) não volta: preço
     antigo, login de aluno e links para /app. */
  await expect(page.getByText("R$ 39,90")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Assinar agora" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Já sou aluno" })).toHaveCount(0);
  await expect(page.locator('a[href^="/app"]')).toHaveCount(0);
});

test("as rotas da plataforma desligada não respondem mais", async ({ page }) => {
  /* /admin saiu desta lista em 2026-08-31: voltou como painel de visitas e
     lista de espera, e responde 401 atrás do Basic Auth — quem cobre isso é
     e2e/admin.spec.ts. As demais continuam mortas. */
  for (const rota of ["/app", "/app/entrar", "/certificados/QUALQUER"]) {
    const resposta = await page.goto(rota);
    expect(resposta?.status(), `${rota} deveria ser 404`).toBe(404);
  }
});

/* /cursos lista as formações (Prompt 4 de SEO, 2026-10-09): só o que está
   preenchido aparece, e Course no JSON-LD só para formação com descrição.
   Desde 2026-10-14 nenhuma tem descrição na página (pedido do Rodrigo), então
   não há Course nenhum. */
test("a /cursos lista as formações e só anuncia curso que descreve", async ({ page }) => {
  await page.goto("/cursos");
  const sec = page.getByRole("region", { name: "As formações IAgentics" });
  await expect(sec.getByRole("heading", { level: 3 })).toHaveText(["Fundamentos de IA para Negócios", "Marketing com IA"]);
  await expect(sec).not.toContainText("Carga horária");
  await expect(sec).not.toContainText("Base sólida");
  const blocos = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((j) => JSON.parse(j));
  expect(blocos.some((b) => b["@type"] === "ItemList")).toBe(false);
});

/* O filme da hero (2026-10-14, conceito 4 aprovado pelo Rodrigo) no lugar da
   estante de capas; a prévia dos quatro conceitos saiu com a aprovação. */
test("a hero da /cursos traz o filme aprovado, com pausa, e a prévia saiu", async ({ page }) => {
  await page.goto("/cursos");
  const video = page.locator("video");
  await expect(video).toHaveAttribute("src", "/cursos-hero/misto-v7.mp4");
  await expect(video).toHaveAttribute("poster", "/cursos-hero/misto-v7.jpg");
  await expect(video).toHaveAttribute("aria-hidden", "true");
  await expect(page.getByRole("button", { name: /o filme$/ })).toBeVisible();
  expect((await page.request.get("/cursos-hero/misto-v7.mp4")).status()).toBe(200);
  expect((await page.request.get("/preview/cursos")).status()).toBe(404);
});
