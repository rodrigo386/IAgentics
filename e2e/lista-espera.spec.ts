import { test, expect } from "@playwright/test";

/* Lista de espera do lançamento na Solution. O consentimento é o centro deste
   spec: a lista vai ser compartilhada com o Pecege, e é o checkbox que dá base
   legal a isso. */

const nome = "Rodrigo Teste";
const email = () => `e2e-espera-${Date.now()}@teste.invalido`;

test("inscrição completa: preenche, envia e vê a confirmação", async ({ page }) => {
  await page.goto("/cursos");

  await page.getByLabel("Nome").fill(nome);
  await page.getByLabel("E-mail").fill(email());
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /desconto/i }).click();

  await expect(page.getByText("Pronto, você está na lista.")).toBeVisible();
});

/* O checkbox é `required`, então o navegador barra antes do POST — mas o
   SERVIDOR é quem precisa garantir isso, porque qualquer um posta direto na
   rota sem passar pelo formulário. */
test("a rota recusa inscrição sem consentimento, mesmo com nome e e-mail válidos", async ({ request }) => {
  const resposta = await request.post("/api/lista-espera", {
    data: { nome, email: email(), consentimento: false },
  });
  expect(resposta.status()).toBe(422);
  expect((await resposta.json()).error).toBe("consentimento");
});

test("reenviar o mesmo e-mail não falha nem revela que ele já estava na lista", async ({ request }) => {
  const repetido = email();
  const dados = { nome, email: repetido, consentimento: true };

  const primeira = await request.post("/api/lista-espera", { data: dados });
  const segunda = await request.post("/api/lista-espera", { data: dados });

  expect(primeira.status()).toBe(200);
  // Mesma resposta nas duas: "já cadastrado" confirmaria a presença de um
  // endereço na base para quem apenas o digitasse.
  expect(segunda.status()).toBe(200);
  expect(await segunda.json()).toEqual(await primeira.json());
});

test("o formulário aponta para a política de privacidade", async ({ page }) => {
  await page.goto("/cursos");
  const link = page.getByRole("link", { name: "Ver política de privacidade" });
  await expect(link).toHaveAttribute("href", "/privacidade");
});
