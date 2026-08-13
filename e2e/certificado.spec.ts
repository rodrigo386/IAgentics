import { test, expect } from "@playwright/test";

test("código forjado dá 404", async ({ page }) => {
  const resposta = await page.goto("/certificados/XXXX-XXXX-99");
  expect(resposta?.status()).toBe(404);
});
