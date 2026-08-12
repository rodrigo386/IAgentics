import { execSync } from "node:child_process";
import { test, expect, type Page } from "@playwright/test";

const emailAdmin = `e2e-admconteudo-adm-${Date.now()}@teste.invalido`;
const emailAluno = `e2e-admconteudo-aluno-${Date.now()}@teste.invalido`;
const senha = "Senha-e2e-123!";
const sufixo = Date.now();
const moduloTitulo = `E2E Módulo ${sufixo}`;
const aulaTitulo = `E2E Aula ${sufixo}`;

// Curso "casca" da semente: sem módulos/aulas, sempre oculto — nenhum outro
// spec cria conteúdo nele nem depende do estado dele ficar publicado, mas
// e2e/painel.spec.ts roda contra o MESMO catálogo do aluno, então a regra
// aqui é: sair exatamente como entrou (despublicado) ao final do teste.
const CURSO_SLUG = "fundamentos-ia-negocios";
const CURSO_TITULO = "Fundamentos de IA aplicado aos Negócios";

async function criarConta(page: Page, email: string, nome: string) {
  await page.goto("/app/criar-conta");
  await page.getByLabel("Nome").fill(nome);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/app$/);
}

test("admin cria módulo/aula/vídeo num curso oculto da semente, publica, aluno vê no painel — e despublica no fim", async ({
  browser,
}) => {
  const contextoAdmin = await browser.newContext();
  const paginaAdmin = await contextoAdmin.newPage();
  await criarConta(paginaAdmin, emailAdmin, "Admin E2E Conteúdo");
  execSync(`node scripts/promover-admin.mjs ${emailAdmin}`, { stdio: "pipe" });

  const contextoAluno = await browser.newContext();
  const paginaAluno = await contextoAluno.newPage();
  await criarConta(paginaAluno, emailAluno, "Aluno E2E Conteúdo");

  // Linha de base: curso oculto da semente não aparece no painel do aluno.
  await paginaAluno.goto("/app");
  await expect(paginaAluno.getByText(CURSO_TITULO)).not.toBeVisible();

  // Admin abre o curso oculto pelo slug da semente.
  await paginaAdmin.goto(`/admin/conteudo/${CURSO_SLUG}`);
  await expect(paginaAdmin.getByRole("heading", { name: CURSO_TITULO })).toBeVisible();
  await expect(paginaAdmin.getByText("Oculto", { exact: true })).toBeVisible();

  // Cria um módulo.
  await paginaAdmin.getByLabel("Título do módulo").fill(moduloTitulo);
  await paginaAdmin.getByRole("button", { name: "Novo módulo" }).click();
  const moduloBox = paginaAdmin.getByTestId("modulo").filter({ hasText: moduloTitulo });
  await expect(moduloBox).toBeVisible();

  // Cria uma aula dentro do módulo novo.
  await moduloBox.getByLabel("Título da aula").fill(aulaTitulo);
  await moduloBox.getByRole("button", { name: "Nova aula" }).click();
  const aulaBox = paginaAdmin.getByTestId("aula").filter({ hasText: aulaTitulo });
  await expect(aulaBox).toBeVisible();

  // Abre a aula (details) e cola um video_id. Escopo direto até o <summary>
  // do título — aulaBox também contém o <summary> de "Excluir aula" (dentro
  // do EditorAula), então um "summary" solto bateria nos dois.
  await aulaBox.locator(":scope > div > details > summary").click();
  await aulaBox.getByLabel("ID do vídeo").fill("dQw4w9WgXcQ");
  await aulaBox.getByRole("button", { name: "Salvar vídeo" }).click();
  await expect(aulaBox.getByText("Vídeo salvo.")).toBeVisible();

  // Publica. A única aula do curso já tem vídeo cadastrado, então não há
  // aviso de "aulas sem vídeo" — só a confirmação simples.
  // Timeouts generosos daqui pra frente: cada passo já depende de vários
  // anteriores (revalidatePath + refetch do RSC), e sob os 5 workers padrão
  // do Playwright disputando o mesmo pool de 5 conexões do Postgres local
  // (lib/db/index.ts), uma ação isolada pode legitimamente passar de 5s.
  await paginaAdmin.getByRole("button", { name: "Publicar" }).click();
  await expect(paginaAdmin.getByText("Publicado.", { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(paginaAdmin.getByText("Publicado", { exact: true })).toBeVisible(); // selo
  await expect(paginaAdmin.getByRole("button", { name: "Ocultar" })).toBeVisible();

  // Sessão do ALUNO (contexto separado) agora enxerga o curso no painel.
  await paginaAluno.reload();
  await expect(paginaAluno.getByText(CURSO_TITULO)).toBeVisible({ timeout: 15_000 });

  // Reverte: despublica para não afetar os specs que dependem do estado da semente.
  await paginaAdmin.getByRole("button", { name: "Ocultar" }).click();
  await expect(paginaAdmin.getByText("Ocultado.", { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(paginaAdmin.getByRole("button", { name: "Publicar" })).toBeVisible();

  await paginaAluno.reload();
  await expect(paginaAluno.getByText(CURSO_TITULO)).not.toBeVisible({ timeout: 15_000 });

  // Limpeza: exclui o módulo criado neste teste (cascade apaga a aula e a mídia).
  const excluirModuloDetails = moduloBox.locator(":scope > details");
  await excluirModuloDetails.locator("summary").click();
  const formExcluirModulo = excluirModuloDetails.locator("form");
  await formExcluirModulo.getByLabel("Digite EXCLUIR para confirmar").fill("EXCLUIR");
  await formExcluirModulo.getByRole("button", { name: "Excluir módulo" }).click();
  await expect(paginaAdmin.getByTestId("modulo").filter({ hasText: moduloTitulo })).toHaveCount(0, { timeout: 15_000 });

  await contextoAdmin.close();
  await contextoAluno.close();
});

// Fix round final (I3): capaUrl externa (https://...) quebrava o /app do
// aluno — a action agora recusa qualquer valor que não seja vazio ou comece
// com "/", e o valor salvo no banco tem que continuar intacto.
test("capaUrl externa é recusada pela action e o valor salvo no banco não muda", async ({ page }) => {
  const emailAdminCapa = `e2e-admconteudo-capa-${Date.now()}@teste.invalido`;
  await criarConta(page, emailAdminCapa, "Admin E2E Capa");
  execSync(`node scripts/promover-admin.mjs ${emailAdminCapa}`, { stdio: "pipe" });

  await page.goto(`/admin/conteudo/${CURSO_SLUG}`);
  const campoCapa = page.getByLabel("URL da capa");
  const capaOriginal = await campoCapa.inputValue();

  await campoCapa.fill("https://exemplo.com/capa-externa.png");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(
    page.getByText("A capa deve ser um caminho local começando com /", { exact: false }),
  ).toBeVisible({ timeout: 15_000 });

  // A action retornou o erro ANTES de chamar salvarCurso/revalidatePath —
  // recarregar a página confirma que o banco nunca foi tocado.
  await page.reload();
  await expect(page.getByLabel("URL da capa")).toHaveValue(capaOriginal);
});
