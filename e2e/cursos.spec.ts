import { test, expect } from "@playwright/test";

/* /cursos deixou de ser a landing da plataforma própria em 2026-08-28: virou o
   aviso de "em breve" da parceria com o Pecege. A URL foi preservada porque
   tinha acabado de ser indexada — este spec existe para garantir que ela
   continua respondendo e que nada do funil antigo sobreviveu por engano. */

test("/planos continua redirecionando permanente para /cursos", async ({ page }) => {
  await page.goto("/planos");
  await expect(page).toHaveURL("/cursos");
});

test("/cursos anuncia a parceria: dois logos, sem preço e sem nenhum CTA de assinatura", async ({ page }) => {
  await page.goto("/cursos");

  await expect(page.getByRole("heading", { level: 1, name: "Em breve." })).toBeVisible();
  /* Ancorado no <main>: o lockup da IAgentics aparece também no Nav e no
     rodapé, então contar ocorrências na página inteira seria frágil — quebraria
     a cada mudança de layout sem que a hero tivesse problema nenhum. O que
     importa aqui é que as DUAS marcas dividem o hero.

     A IAgentics vem do componente <Logo> (máscara CSS: role=img + aria-label),
     não de um <img alt>; o Pecege é <Image> de verdade. */
  const hero = page.locator("main");
  /* `exact` é obrigatório: sem ele o match é por substring e a própria
     estante casaria — o aria-label dela termina em "...da IAgentics". */
  await expect(hero.getByRole("img", { name: "IAgentics", exact: true })).toHaveCount(1);
  await expect(hero.getByAltText("Pecege")).toBeVisible();

  /* As asserções que dão sentido ao spec: o funil antigo morreu inteiro. Se
     alguma dessas voltar a aparecer, é resto de plataforma vazando numa
     página que promete que ainda não há o que acessar. */
  await expect(page.getByText("R$ 39,90")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Assinar agora" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Já sou aluno" })).toHaveCount(0);
  await expect(page.locator('a[href^="/app"]')).toHaveCount(0);
});

test("as rotas da plataforma desligada não respondem mais", async ({ page }) => {
  for (const rota of ["/app", "/app/entrar", "/admin", "/certificados/QUALQUER"]) {
    const resposta = await page.goto(rota);
    expect(resposta?.status(), `${rota} deveria ser 404`).toBe(404);
  }
});
