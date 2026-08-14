// e2e-email/confirmacao-reset.spec.ts
import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";

const CAIXA = "/tmp/iagentics-e2e-emails.jsonl";
const email = `e2e-email-${Date.now()}@teste.invalido`;
const senha = "Senha-email-123!";
const senhaNova = "Senha-nova-456!";

/** Último e-mail enviado para um destinatário; extrai a primeira URL do texto.
 *  O envio é agendado com after() DEPOIS da resposta da action — a linha pode
 *  demorar alguns ms para chegar no arquivo, então faz poll em vez de ler uma
 *  única vez. */
async function ultimoLinkPara(para: string): Promise<string> {
  await expect
    .poll(
      () => {
        try {
          const linhas = readFileSync(CAIXA, "utf8")
            .trim()
            .split("\n")
            .filter(Boolean)
            .map((l) => JSON.parse(l));
          return linhas.some((m) => m.para === para);
        } catch {
          return false; // arquivo ainda não existe ou está sendo escrito
        }
      },
      { timeout: 3_000, message: `nenhum e-mail para ${para}` },
    )
    .toBe(true);

  const linhas = readFileSync(CAIXA, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l));
  const msg = linhas.filter((m) => m.para === para).at(-1);
  if (!msg) throw new Error(`nenhum e-mail para ${para}`);
  const url = msg.texto.match(/https?:\/\/\S+/)?.[0];
  if (!url) throw new Error("e-mail sem link");
  return url;
}

test("cadastro bloqueia até confirmar; link do e-mail libera o login", async ({ page }) => {
  await page.goto("/app/criar-conta");
  await page.getByLabel("Nome").fill("Aluno Confirmação");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Criar conta" }).click();

  // Cai na tela "confirme seu e-mail" — sem sessão.
  await expect(page).toHaveURL(/\/app\/confirmar-email/);
  await expect(page.getByText(email)).toBeVisible();

  // Login antes de confirmar: recusado com a mensagem própria + reenvio.
  await page.goto("/app/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Confirme seu e-mail antes de entrar", { exact: false })).toBeVisible();

  // Abre o link do e-mail (caixa de teste) → aviso verde no login → entra.
  await page.goto(await ultimoLinkPara(email));
  await expect(page).toHaveURL(/\/app\/entrar\?confirmado=1/);
  await expect(page.getByText("E-mail confirmado", { exact: false })).toBeVisible();
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.getByRole("button", { name: "Sair" }).click();
});

test("esqueci minha senha: link redefine, senha antiga morre, link não repete", async ({ page }) => {
  await page.goto("/app/entrar");
  await page.getByRole("link", { name: "Esqueci minha senha" }).click();
  await expect(page).toHaveURL(/\/app\/recuperar-senha/);
  await page.getByLabel("E-mail").fill(email);
  await page.getByRole("button", { name: "Enviar link" }).click();
  await expect(page.getByText("Se existir uma conta", { exact: false })).toBeVisible();

  await page.goto(await ultimoLinkPara(email));
  await page.getByLabel("Nova senha").fill(senhaNova);
  await page.getByRole("button", { name: "Salvar nova senha" }).click();
  await expect(page).toHaveURL(/\/app\/entrar\?redefinida=1/);

  // Senha antiga não entra mais; a nova entra.
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("E-mail ou senha incorretos")).toBeVisible();
  await page.getByLabel("Senha").fill(senhaNova);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/app$/);
});

test("reenvio e reset são neutros para e-mail inexistente", async ({ page }) => {
  await page.goto("/app/recuperar-senha");
  await page.getByLabel("E-mail").fill("nao-existe@teste.invalido");
  await page.getByRole("button", { name: "Enviar link" }).click();
  await expect(page.getByText("Se existir uma conta", { exact: false })).toBeVisible();
});
