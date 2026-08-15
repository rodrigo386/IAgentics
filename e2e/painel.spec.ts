import { execSync } from "node:child_process";
import { test, expect, type Page } from "@playwright/test";

const email = `e2e-painel-${Date.now()}@teste.invalido`;
const senha = "Senha-e2e-123!";

async function criarConta(page: Page, contaEmail: string, nome: string) {
  await page.goto("/app/criar-conta");
  await page.getByLabel("Nome").fill(nome);
  await page.getByLabel("E-mail").fill(contaEmail);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/app$/);
}

/**
 * Painel editorial: banner de assinatura + banner de boas-vindas + trilhos
 * por estado do aluno.
 * Aluno novo, sem assinatura: banner "Assine para acessar" no topo, acima do
 * banner de boas-vindas (motion, sem referência a curso); trilhos Formações
 * (1 curso com aulas na semente) e Em gravação (8 cascas) => exatamente 9 cards.
 * Após concluir uma aula: o hero de curso ("Continuar:") aparece e o trilho
 * Em andamento surge (o curso repete em Formações — repetição intencional do
 * spec).
 */
test("painel editorial: banner de assinatura, boas-vindas, trilhos e hero de continuar", async ({ page }) => {
  await page.goto("/app/criar-conta");
  await page.getByLabel("Nome").fill("Aluno Painel");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/app$/);

  // Aluno novo, sem assinatura: banner de assinatura no topo da página, acima
  // do banner de boas-vindas — que não referencia nenhum curso. O texto
  // "Assine para acessar" também aparece no selo de cada card bloqueado do
  // trilho (um <span> por card), então o locator do banner é restrito ao
  // parágrafo (o único elemento <p> com esse texto na página).
  const bannerAssinatura = page.locator("p", { hasText: "Assine para acessar" });
  const bannerBoasVindas = page.getByText("Bem-vindo à Academy");
  await expect(bannerAssinatura).toBeVisible();
  await expect(bannerBoasVindas).toBeVisible();
  await expect(page.getByText("Todo o acervo, no seu ritmo.")).toBeVisible();

  const posAssinatura = await bannerAssinatura.boundingBox();
  const posBoasVindas = await bannerBoasVindas.boundingBox();
  expect(posAssinatura).not.toBeNull();
  expect(posBoasVindas).not.toBeNull();
  expect(posAssinatura!.y).toBeLessThan(posBoasVindas!.y);

  // Trilhos: rótulos e contagem exata (1 formação com aulas + 8 em gravação).
  await expect(page.getByText("Formações", { exact: true })).toBeVisible();
  await expect(page.getByText("Em gravação", { exact: true })).toBeVisible();
  await expect(page.getByTestId("card-curso")).toHaveCount(9);

  // Capas carregam de verdade (rola até cada card antes de medir — lazy).
  const cards = page.getByTestId("card-curso");
  for (let i = 0; i < 9; i++) {
    await cards.nth(i).scrollIntoViewIfNeeded();
    await expect
      .poll(async () =>
        cards.nth(i).locator("img").evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0),
      )
      .toBe(true);
  }

  // Conclui a aula gratuita e volta ao painel.
  await page.goto("/app/curso/fundamentos-ia-copilot/boas-vindas");
  await page.getByRole("button", { name: "Marcar como concluída" }).click();
  await expect(page.getByRole("link", { name: "Próxima aula" })).toBeVisible();

  await page.goto("/app");
  await expect(page.getByRole("link", { name: /^Continuar:/ })).toBeVisible();
  await expect(page.getByText("Em andamento", { exact: true })).toBeVisible();
  // Curso em andamento repete em Formações: 10 cards agora.
  await expect(page.getByTestId("card-curso")).toHaveCount(10);
});

/**
 * Estado "tudo concluído": terminar as 8 aulas do curso da semente deve trocar
 * o hero de "continuar" pelo banner de boas-vindas (motion, sem referência a
 * curso) — o hero de curso não existe mais para o estado concluído, então não
 * há como ele apontar de volta pro curso que o aluno já terminou (a UX
 * enganosa que o fix original corrigiu continua corrigida, agora sem hero
 * nenhum nesse estado). O trilho Concluídos com o selo "Concluída" segue
 * carregando a informação de conclusão.
 *
 * A semente só libera a primeira aula de graça; as outras 7 exigem assinatura.
 * Sem acesso ao banco pelo e2e, o caminho de arranjo é o mesmo que
 * admin-alunos.spec.ts usa para provar liberação de acesso ponta a ponta:
 * uma conta promovida a admin via scripts/promover-admin.mjs libera o acesso
 * do aluno pela UI de /admin/alunos, em contexto de navegador separado.
 */
test("painel editorial: banner de boas-vindas (sem hero de curso) após terminar todas as aulas", async ({ browser }) => {
  const emailAdmin = `e2e-painel-adm-${Date.now()}@teste.invalido`;
  const emailAluno = `e2e-painel-aluno-${Date.now()}@teste.invalido`;

  const contextoAdmin = await browser.newContext();
  const paginaAdmin = await contextoAdmin.newPage();
  await criarConta(paginaAdmin, emailAdmin, "Admin Painel E2E");
  execSync(`node scripts/promover-admin.mjs ${emailAdmin}`, { stdio: "pipe" });

  const contextoAluno = await browser.newContext();
  const paginaAluno = await contextoAluno.newPage();
  await criarConta(paginaAluno, emailAluno, "Aluno Painel Concluído");

  // Libera acesso pela UI do admin — sem isso as 7 aulas pagas mostram a
  // trava de assinatura e não têm botão de concluir.
  await paginaAdmin.goto("/admin/alunos");
  await paginaAdmin.getByLabel("Buscar por nome ou e-mail").fill(emailAluno);
  await paginaAdmin.getByRole("button", { name: "Buscar" }).click();
  await paginaAdmin.getByRole("row").filter({ hasText: emailAluno }).getByRole("link").click();
  await paginaAdmin.getByRole("button", { name: "Liberar acesso" }).click();
  await expect(paginaAdmin.getByText("Acesso liberado.")).toBeVisible({ timeout: 15000 });

  // Marca concluída e segue por "Próxima aula" até ela sumir (a última aula
  // da semente não tem próxima). Máximo 10 iterações para 8 aulas.
  await paginaAluno.goto("/app/curso/fundamentos-ia-copilot/boas-vindas");
  for (let i = 0; i < 10; i++) {
    await paginaAluno.getByRole("button", { name: "Marcar como concluída" }).click();
    const proxima = paginaAluno.getByRole("link", { name: "Próxima aula" });
    const semProxima = paginaAluno.getByText("Aula concluída", { exact: true });
    await expect(proxima.or(semProxima)).toBeVisible();
    if (await proxima.isVisible()) {
      await proxima.click();
    } else {
      // Última aula: concluirAula é fire-and-forget no cliente — recarrega
      // para confirmar que a gravação chegou no servidor antes de ir pro
      // painel (mesmo padrão de aula.spec.ts).
      await paginaAluno.reload();
      await expect(semProxima).toBeVisible();
      break;
    }
  }

  // Painel: sem nada em andamento => banner de boas-vindas (não aponta pro
  // curso que o aluno já terminou, porque não referencia curso nenhum);
  // trilho Concluídos e o selo "Concluída" no card do trilho Concluídos.
  // Aluno já tem acesso liberado (via admin acima): banner de assinatura não
  // aparece.
  await paginaAluno.goto("/app");
  await expect(paginaAluno.getByText("Bem-vindo à Academy")).toBeVisible();
  await expect(paginaAluno.getByText("Assine para acessar")).toHaveCount(0);
  await expect(paginaAluno.getByText("Concluídos", { exact: true })).toBeVisible();
  const trilhoConcluidos = paginaAluno.locator("section").filter({ hasText: "Concluídos" });
  await expect(trilhoConcluidos.getByText("Concluída", { exact: true })).toBeVisible();

  await contextoAdmin.close();
  await contextoAluno.close();
});
