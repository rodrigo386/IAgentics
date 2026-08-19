import { execSync } from "node:child_process";
import { test, expect, type Page } from "@playwright/test";

const senha = "Senha-e2e-123!";

async function criarConta(page: Page, contaEmail: string, nome: string) {
  await page.goto("/app/criar-conta");
  await page.getByLabel("Nome").fill(nome);
  await page.getByLabel("E-mail").fill(contaEmail);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/app$/);
}

test("código forjado dá 404", async ({ page }) => {
  const resposta = await page.goto("/certificados/XXXX-XXXX-99");
  expect(resposta?.status()).toBe(404);
});

test("fluxo completo: concluir formação → certificado público, LinkedIn e conta", async ({ browser }) => {
  const emailAdmin = `e2e-cert-adm-${Date.now()}@teste.invalido`;
  const emailAluno = `e2e-cert-aluno-${Date.now()}@teste.invalido`;

  const contextoAdmin = await browser.newContext();
  const paginaAdmin = await contextoAdmin.newPage();
  await criarConta(paginaAdmin, emailAdmin, "Admin Cert E2E");
  execSync(`node scripts/promover-admin.mjs ${emailAdmin}`, { stdio: "pipe" });

  const contextoAluno = await browser.newContext();
  const paginaAluno = await contextoAluno.newPage();
  await criarConta(paginaAluno, emailAluno, "Aluno Cert E2E");

  await paginaAdmin.goto("/admin/alunos");
  await paginaAdmin.getByLabel("Buscar por nome ou e-mail").fill(emailAluno);
  await paginaAdmin.getByRole("button", { name: "Buscar" }).click();
  await paginaAdmin.getByRole("row").filter({ hasText: emailAluno }).getByRole("link").click();
  await paginaAdmin.getByRole("button", { name: "Liberar acesso" }).click();
  await expect(paginaAdmin.getByText("Acesso liberado.")).toBeVisible({ timeout: 15000 });

  await paginaAluno.goto("/app/curso/fundamentos-ia-copilot/boas-vindas");
  for (let i = 0; i < 10; i++) {
    await paginaAluno.getByRole("button", { name: "Marcar como concluída" }).click();
    const proxima = paginaAluno.getByRole("link", { name: "Próxima aula" });
    // Ao fechar a ÚLTIMA aula, o player anuncia a formação concluída e leva
    // direto ao certificado — antes dava um "Aula concluída" seco e o aluno
    // tinha que voltar sozinho à página do curso para descobrir que existia.
    const conquista = paginaAluno.getByRole("link", { name: "Ver certificado" });
    await expect(proxima.or(conquista)).toBeVisible();
    if (await proxima.isVisible()) {
      await proxima.click();
    } else {
      await expect(paginaAluno.getByText("Curso concluído")).toBeVisible();
      // Sobrevive ao recarregamento: o estado vem do servidor, não só do cliente.
      await paginaAluno.reload();
      await expect(paginaAluno.getByRole("link", { name: "Ver certificado" })).toBeVisible();
      break;
    }
  }

  // Curso concluído → botão Ver certificado (a emissão aconteceu no gancho
  // da última conclusão; o botão da página do curso a confirma).
  await paginaAluno.goto("/app/curso/fundamentos-ia-copilot");
  await paginaAluno.getByRole("link", { name: "Ver certificado" }).click();
  await expect(paginaAluno).toHaveURL(/\/certificados\//);
  await expect(paginaAluno.getByRole("heading", { name: "Aluno Cert E2E" })).toBeVisible();
  // Escopo em "article": o RouteAnnouncer do Next.js (aria-live, injetado após
  // navegação client-side) carrega o document.title, que contém o mesmo texto
  // do curso ("Certificado — Fundamentos de IA com Copilot · ...") e sem
  // escopo colide em modo estrito com o <span> real do certificado.
  await expect(paginaAluno.getByRole("article").getByText("Fundamentos de IA com Copilot")).toBeVisible();
  await expect(paginaAluno.getByText("✓ Certificado válido")).toBeVisible();

  // IMPRESSÃO NUNCA SAI EM BRANCO. A chegada do certificado é animada com
  // fill `backwards`, o que deixa o estado ANTERIOR ao início invisível — se a
  // impressão pegasse esse instante, o aluno imprimiria um cartão vazio. O
  // @media print em globals.css zera essas animações; esta asserção é o que
  // impede alguém de removê-lo sem perceber.
  await paginaAluno.emulateMedia({ media: "print" });
  const riscoNaImpressao = await paginaAluno.evaluate(() =>
    [".cert-cartao", ".cert-nome", ".cert-dados", ".cert-selo"].filter((seletor) => {
      const el = document.querySelector(seletor);
      if (!el) return true;
      const estilo = getComputedStyle(el);
      return Number(estilo.opacity) < 0.99 || estilo.animationName !== "none";
    }),
  );
  expect(riscoNaImpressao).toEqual([]);
  await paginaAluno.emulateMedia({ media: "screen" });

  // Dono vê os botões; o href do LinkedIn carrega certUrl e certId.
  const urlCertificado = paginaAluno.url();
  const addLi = paginaAluno.getByRole("link", { name: "Adicionar ao LinkedIn" });
  await expect(addLi).toBeVisible();
  const href = (await addLi.getAttribute("href")) ?? "";
  expect(href).toContain("certUrl=");
  expect(href).toContain("certId=");
  expect(href).toContain(encodeURIComponent(urlCertificado));

  // Visitante deslogado: mesma URL continua válida (para sempre), sem botões.
  const contextoVisitante = await browser.newContext();
  const paginaVisitante = await contextoVisitante.newPage();
  await paginaVisitante.goto(urlCertificado);
  await expect(paginaVisitante.getByText("✓ Certificado válido")).toBeVisible();
  await expect(paginaVisitante.getByRole("link", { name: "Adicionar ao LinkedIn" })).toHaveCount(0);

  // Conta lista o certificado.
  await paginaAluno.goto("/app/conta");
  await expect(paginaAluno.getByText("Certificados", { exact: true })).toBeVisible();
  await expect(paginaAluno.getByRole("link", { name: "Ver certificado" })).toBeVisible();

  await contextoVisitante.close();
  await contextoAluno.close();
  await contextoAdmin.close();
});
