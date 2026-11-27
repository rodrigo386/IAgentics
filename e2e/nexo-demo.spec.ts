import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

/* Nexo Demo (prévia, 2026-11-27). O e2e sobe com RESEND_API_KEY vazio e
   NEXO_DEMO_LIMITE alto (playwright.config.ts): nenhum e-mail sai. */

const ROTA = "/preview/nexo-demo";

const cred = (() => {
  try {
    const env = readFileSync(".env.local", "utf8");
    const usuario = env.match(/^ADMIN_USUARIO=(.*)$/m)?.[1]?.trim();
    const senha = env.match(/^ADMIN_SENHA=(.*)$/m)?.[1]?.trim();
    return usuario && senha ? { usuario, senha } : null;
  } catch {
    return null;
  }
})();

async function entrar(page: Page, empresa: string) {
  await page.goto(ROTA);
  await page.getByLabel("Nome", { exact: true }).fill("Ana Teste Souza");
  await page.getByLabel("E-mail corporativo").fill(`demo-${Date.now()}@exemplo-teste.com`);
  await page.getByLabel("Empresa").fill(empresa);
  await page.getByLabel("Celular, com DDD").fill("(11) 98888-7777");
  await page.getByLabel("LinkedIn").fill("ana-souza-teste");
  await page.getByRole("checkbox", { name: /Estou ciente/ }).check();
  await page.getByRole("button", { name: "Entrar no Nexo Demo" }).click();
  await expect(page.getByText("Passo 1 de 8")).toBeVisible();
}

const guia = (page: Page) => page.locator("[data-guia]");

test("a entrada mostra o cadastro de cinco campos e fica fora do Google", async ({ page }) => {
  await page.goto(ROTA);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Teste o Nexo com as suas mãos.");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.getByRole("textbox")).toHaveCount(5);
  await expect(page.getByRole("link", { name: "Política de Privacidade" }).first()).toHaveAttribute("href", "/privacidade");
});

const janela = (page: Page) => page.getByRole("dialog");

async function abrirRcPelaMia(page: Page) {
  await guia(page).click();
  await page.getByRole("button", { name: "Preencher com a MIA" }).click();
  await page.getByRole("button", { name: "Abrir chamado" }).click();
  await expect(page.getByRole("heading", { name: "RC-0142" })).toBeVisible();
}

test("o processo vai da requisição às ordens de compra, lembra onde parou e aparece no painel", async ({ page, browser }) => {
  const empresa = `Empresa Demo ${Date.now()}`;
  await entrar(page, empresa);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Olá, Ana. Eu sou a MIA.");

  /* Solicitante: a MIA entende o pedido escrito e preenche; depois o pedido padrão, com dois itens. */
  await page.getByPlaceholder(/Pergunte à MIA/).fill("/abrir 20 cadeiras");
  await page.getByPlaceholder(/Pergunte à MIA/).press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Nova requisição de compras");
  await expect(page.getByLabel("Item ou serviço 1")).toHaveValue("Cadeira ergonômica com apoio lombar");
  await expect(page.getByLabel("Qtd 1")).toHaveValue("20");
  await expect(page.getByRole("button", { name: "Abrir chamado" })).toBeDisabled();
  /* O guia: a trilha marca onde a pessoa está, "Agora" diz o clique e o botão da vez é o destacado. */
  const trilha = page.getByRole("region", { name: "Os passos da demonstração" });
  await expect(trilha.locator('[aria-current="step"]:visible')).toContainText("Requisição (você está aqui)");
  await expect(trilha).toContainText("Faltam 7 passos");
  await expect(trilha).toContainText("Agora: Preencha a requisição e clique em Abrir chamado.");
  await expect(page.locator(".nexo-demo-proximo:visible")).toHaveCount(0);
  await page.getByRole("button", { name: "Preencher com a MIA" }).click();
  await expect(page.getByLabel("Resumo da requisição")).toContainText("R$ 85.470,00");
  await expect(page.getByText("Preenchi a requisição com um pedido comum da operação", { exact: false })).toBeVisible();
  await expect(page.locator(".nexo-demo-proximo:visible")).toHaveText("Abrir chamado");
  await expect(page.getByRole("button", { name: "Abrir chamado" })).toBeFocused();
  await page.getByRole("button", { name: "Abrir chamado" }).click();
  await expect(page.getByRole("heading", { name: "RC-0142" })).toBeVisible();
  await expect(page.getByText("Passo 2 de 8")).toBeVisible();
  await expect(trilha.locator('[aria-current="step"]:visible')).toContainText("Análise da MIA (você está aqui)");
  await expect(trilha.locator("li:visible").first()).toHaveText("Requisição (feito)");

  /* Comprador: a análise da MIA abre em janela sobre a fila. */
  await guia(page).click();
  await expect(page.locator(".nexo-demo-proximo:visible")).toHaveAccessibleName("Ver análise: RC-0142");
  await page.getByRole("button", { name: "Ver análise: RC-0142" }).click();
  await expect(janela(page)).toContainText("Relatório de classificação");
  await expect(janela(page)).toContainText("será aprovada por: Gerente de Compras");
  await janela(page).getByRole("button", { name: "Fechar" }).click();

  /* Gestor: aprova a RC, que vira cotação. */
  await guia(page).click();
  await page.getByRole("button", { name: "Aprovar", exact: true }).click();
  await expect(page.getByText("Passo 4 de 8")).toBeVisible();
  /* A aprovação vista de fora: o gestor recebe o pedido, aprova e a RC vira cotação. */
  const filmeRc = page.getByRole("region", { name: "Gestor da área aprova a requisição" });
  await expect(filmeRc.getByText("RC-0142 aguarda a sua aprovação")).toBeVisible();
  await expect(filmeRc.getByText("por Ana, Gestor da área, hoje às", { exact: false })).toBeVisible();
  await expect(filmeRc.getByText("RC-0142 virou a cotação RFQ-0142.")).toBeVisible({ timeout: 8000 });
  await filmeRc.getByRole("button", { name: "Fechar a animação" }).click();
  await expect(page.getByRole("button", { name: "Rever a aprovação do gestor" })).toBeVisible();

  /* Comprador: o guia abre a cotação em janela. Busca com IA, convites, portal do fornecedor. */
  await guia(page).click();
  const j = janela(page);
  await expect(j.getByRole("heading", { name: "RFQ-0142" })).toBeVisible();
  await j.getByRole("button", { name: "Busca com IA" }).click();
  await j.getByRole("button", { name: "Buscar com a MIA" }).click();
  await expect(j.getByText("A MIA encontrou 2 fornecedores fora da base.")).toBeVisible();
  await j.getByRole("button", { name: "Cadastro", exact: true }).click();
  await expect(j.getByRole("button", { name: /Enviar 0 convites/ })).toBeDisabled();
  /* A janela cobre o guia da página: o "Agora" vai dentro dela, e o botão da vez pulsa. */
  await expect(j.getByText("Agora: Escolha pelo menos dois fornecedores.", { exact: false })).toBeVisible();
  await expect(j.locator(".nexo-demo-proximo")).toHaveText("Adicionar todos");
  await j.getByRole("button", { name: "Adicionar todos" }).click();
  await expect(j.locator(".nexo-demo-proximo")).toHaveText("Enviar 4 convites");
  await j.getByText("Prévia do convite").click();
  await expect(j.getByText("Convite para cotação RFQ-0142")).toBeVisible();
  await j.getByRole("button", { name: "Enviar 4 convites" }).click();
  /* O outro lado: o fornecedor recebe o e-mail com o link único, preenche o portal e envia; só então as propostas chegam. */
  const filme = j.getByRole("region", { name: "Alfa Suprimentos Ltda responde ao convite" });
  await expect(filme).toContainText("Recebe o e-mail");
  await expect(filme.getByText("Convite para cotação RFQ-0142")).toBeVisible();
  await expect(filme.getByText("Abrir o Portal do Fornecedor")).toBeVisible();
  await expect(j.locator("[data-proposta]")).toHaveCount(0);
  await expect(filme.getByText("O link abre o Portal do Fornecedor.", { exact: false })).toBeVisible();
  await filme.getByRole("button", { name: "Pular a animação" }).click();
  await expect(j.locator("[data-proposta]")).toHaveCount(3);
  await j.getByRole("button", { name: "Rever o fornecedor respondendo" }).click();
  await expect(j.getByRole("region", { name: "Alfa Suprimentos Ltda responde ao convite" })).toBeVisible();
  await j.getByRole("button", { name: "Fechar a animação" }).click();
  await j.getByRole("button", { name: "Responder pelo Portal do Fornecedor: Norte Sul Atacado" }).click();
  await expect(j.getByRole("heading", { name: "Portal do Fornecedor" })).toBeVisible();
  await j.getByLabel(/Preço unitário de Notebook/).fill("7000.00");
  await j.getByLabel(/Preço unitário de Monitor/).fill("1.150,00");
  await j.getByLabel("Prazo de entrega (dias)").fill("9");
  await j.getByRole("button", { name: "Enviar proposta" }).click();
  await expect(j.locator("[data-proposta]")).toHaveCount(4);
  await expect(j.locator('[data-proposta="nortesul"]')).toContainText("pelo portal");
  await expect(j.locator('[data-proposta="nortesul"]')).toContainText("R$ 81.500,00");
  await j.getByRole("button", { name: "Ver histórico: Norte Sul Atacado" }).click();
  await expect(j.getByText(/Proposta preenchida pelo Portal do Fornecedor/)).toBeVisible();

  /* Mapa com insights, negociação por e-mail e seleção por linha, com o pedido dividido. */
  await j.getByRole("button", { name: "Gerar mapa comparativo (IA)" }).click();
  await expect(j.getByRole("heading", { name: "Insights da MIA" })).toBeVisible();
  await expect(j.locator('[data-celula="notebook:horizonte"]')).toContainText("R$ 6.782,40");
  await expect(j.locator('[data-celula="notebook:horizonte"]')).toContainText("melhor preço");
  await expect(j.locator('[data-celula="monitor:prisma"]')).toHaveText("não cotou");
  await j.getByRole("button", { name: "Negociar por e-mail com todos (4)" }).click();
  await expect(j.locator('[data-celula="notebook:horizonte"]')).toContainText("R$ 6.646,75");
  await expect(j.locator('[data-celula="monitor:nortesul"]')).toContainText("R$ 1.115,50");
  await expect(j.getByText("Agora: Na aba Seleção, escolha o vencedor de cada item.", { exact: false })).toBeVisible();
  await j.getByRole("button", { name: "Ir para a aba Seleção" }).click();
  await expect(j.getByRole("button", { name: "Concluir (enviar para aprovação)" })).toBeDisabled();
  await j.getByRole("button", { name: "Aplicar a sugestão da MIA" }).click();
  await expect(j.getByText("R$ 7.847,50 (9,2%)")).toBeVisible();
  await expect(j.getByText("Pedido dividido entre 2 fornecedores")).toBeVisible();
  await j.getByLabel(/% desc\. Notebook/).fill("abc");
  await j.locator('[data-linha="notebook"]').getByRole("button", { name: "Solicitar ajuste ao fornecedor" }).click();
  await expect(j.getByText("Informe o desconto em %, maior que zero.")).toBeVisible();
  await j.getByLabel(/% desc\. Notebook/).fill("50");
  await j.locator('[data-linha="notebook"]').getByRole("button", { name: "Solicitar ajuste ao fornecedor" }).click();
  await expect(j.getByText("Distribuidora Horizonte não chega ao que você pediu: o máximo dele é 2,0%, já aplicado.")).toBeVisible();
  await expect(j.getByText("R$ 9.176,80 (10,7%)")).toBeVisible();
  await j.getByRole("button", { name: "Concluir (enviar para aprovação)" }).click();
  await expect(j.getByText("Total: R$ 76.293,20. Aguardando aprovação por alçada: Gerente de Compras.", { exact: false })).toBeVisible();
  /* O passo seguinte é fora da janela: o guia de dentro leva até lá. */
  await j.getByRole("button", { name: "Ir para Minhas aprovações" }).click();
  await expect(j).toHaveCount(0);
  await expect(page.getByText("Passo 7 de 8")).toBeVisible();
  await expect(page.getByText("Falta 1 passo")).toBeVisible();

  /* Alçada: a tela diz por que a aprovação é sua; aprovada, saem duas OCs. */
  await expect(page.getByText("Por que você: o total de R$ 76.293,20 cai na faixa de R$ 10.000,01 a R$ 100.000,00, aprovada por Gerente de Compras.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Aprovar e gerar a OC" }).click();
  /* A alçada vista de fora: recebe a seleção, aprova e as OCs saem; o fim da animação leva ao resumo. */
  const filmeOc = page.getByRole("region", { name: "Gerente de Compras aprova e a ordem de compra sai" });
  await expect(filmeOc.getByText("Seleção da RFQ-0142 aguarda a sua aprovação")).toBeVisible();
  await expect(filmeOc.getByText("OC-0142-1 gerada para Distribuidora Horizonte", { exact: false })).toBeVisible({ timeout: 8000 });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Da requisição à ordem de compra, sem sair do Nexo.", { timeout: 8000 });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Da requisição à ordem de compra, sem sair do Nexo.");
  await expect(page.getByRole("article", { name: "Ordem de compra OC-0142-1" })).toContainText("Distribuidora Horizonte");
  await expect(page.getByRole("article", { name: "Ordem de compra OC-0142-2" })).toContainText("R$ 11.155,00");
  await expect(page.getByRole("link", { name: "Conversar no WhatsApp" })).toHaveAttribute("href", /wa\.me\/5515998714091/);
  await expect(page.getByRole("link", { name: "Enviar uma mensagem" })).toHaveAttribute("href", "/#contato");

  /* Voltou depois: continua dentro, no fim do processo. */
  await page.reload();
  await expect(page.getByText("Passo 8 de 8")).toBeVisible();
  await expect(page.getByRole("article", { name: "Ordem de compra OC-0142-1" })).toBeVisible();

  /* O painel mostra o cadastro com o passo final. */
  test.skip(!cred, "sem ADMIN_USUARIO/ADMIN_SENHA no .env.local");
  const contexto = await browser.newContext({ httpCredentials: { username: cred!.usuario, password: cred!.senha } });
  const painel = await contexto.newPage();
  await expect
    .poll(async () => {
      await painel.goto("/admin/nexo-demo");
      return painel.getByRole("row", { name: new RegExp(empresa) }).innerText();
    })
    .toContain("8/8 · Gerou a OC (concluiu)");
  const csv = await contexto.request.get("/admin/nexo-demo.csv");
  expect(await csv.text()).toContain(empresa);
  await contexto.close();
});

test("serviço também se cota: a MIA reconhece o pedido e o tipo filtra o catálogo", async ({ page }) => {
  await entrar(page, `Empresa Servico ${Date.now()}`);
  await page.getByPlaceholder(/Pergunte à MIA/).fill("/abrir 12 meses de limpeza predial");
  await page.getByPlaceholder(/Pergunte à MIA/).press("Enter");
  await expect(page.getByLabel("Item ou serviço 1")).toHaveValue("Limpeza e conservação predial, contrato mensal");
  await expect(page.getByLabel("Qtd 1")).toHaveValue("12");
  await expect(page.getByText("Reconhecido pela MIA: Facilities e Serviços · Serviço")).toBeVisible();
  await expect(page.getByLabel("Resumo da requisição")).toContainText("R$ 222.000,00");
  await page.getByText("+ Adicionar item").click();
  await page.getByText("Serviço", { exact: true }).click();
  await page.getByLabel("Item ou serviço 2").focus();
  for (const nome of ["Vigilância patrimonial desarmada, posto 24 horas", "Consultoria em segurança da informação (hora)", "Treinamento de trabalho em altura (NR-35), turma de 20"]) await expect(page.getByRole("button", { name: nome })).toBeVisible();
  await expect(page.getByRole("button", { name: "Monitor LED 27 polegadas" })).toHaveCount(0);
});

test("a MIA devolve a requisição vaga, e o rascunho volta para corrigir", async ({ page }) => {
  await entrar(page, "Empresa Devolvida");
  await page.getByRole("button", { name: "Abrir RC" }).click();
  await page.getByLabel("Item ou serviço 1").fill("Material para o setor");
  await expect(page.getByText(/A MIA ainda não reconhece este texto/)).toBeVisible();
  await page.getByText("Média", { exact: true }).click();
  /* Data que já passou não abre chamado (achado do teste de uso). */
  await page.getByLabel("Necessário até").fill("2020-01-01");
  await page.getByLabel("Centro de custo").selectOption("FAC-030 · Facilities");
  await expect(page.getByText("A data necessária já passou")).toBeVisible();
  await expect(page.getByRole("button", { name: "Abrir chamado" })).toBeDisabled();
  await page.getByLabel("Necessário até").fill("2027-03-15");
  await page.getByRole("button", { name: "Abrir chamado" }).click();
  await expect(page.getByRole("heading", { name: "A MIA devolveu a requisição" })).toBeVisible();
  await expect(page.getByText("Inválida — devolvida ao solicitante")).toBeVisible();
  await expect(page.getByText(/"Material para o setor" não identifica qual item/)).toBeVisible();
  await expect(page.getByText("Passo 1 de 8")).toBeVisible();

  await page.getByRole("button", { name: "Corrigir no formulário" }).click();
  await expect(page.getByLabel("Item ou serviço 1")).toHaveValue("Material para o setor");
  await page.getByLabel("Item ou serviço 1").fill("cadeira");
  await page.getByRole("button", { name: "Cadeira ergonômica com apoio lombar" }).click();
  await expect(page.getByText("Reconhecido pela MIA: Administrativo e Escritório · Ativo")).toBeVisible();
  await page.getByRole("button", { name: "+ Adicionar item" }).click();
  await page.getByLabel("Item ou serviço 2").fill("resmas de papel sulfite");
  await page.getByLabel("Qtd 2").fill("12");
  await expect(page.getByLabel("Resumo da requisição")).toContainText("R$ 4.918,00");
  await page.getByRole("button", { name: "Abrir chamado" }).click();
  await expect(page.getByRole("heading", { name: "RC-0142" })).toBeVisible();
  await expect(page.getByText("Passo 2 de 8")).toBeVisible();
});

test("a operação já existe: lista, Kanban, filtros, cotação de exemplo só para ler e os painéis", async ({ page }) => {
  await entrar(page, "Empresa Operação");
  await page.getByRole("button", { name: "Cotações e negociação" }).click();
  await expect(page.getByRole("list", { name: "Cotações (RFQs)" }).getByRole("listitem")).toHaveCount(8);
  await page.getByLabel("Todos os compradores").selectOption("Marina Prado");
  await expect(page.getByRole("list", { name: "Cotações (RFQs)" }).getByRole("listitem")).toHaveCount(3);
  await page.getByRole("button", { name: "Limpar" }).click();
  await page.getByRole("button", { name: "Kanban" }).click();
  await expect(page.getByRole("region", { name: "OC gerada" }).getByRole("listitem")).toHaveCount(2);

  await page.getByRole("button", { name: "Abrir RFQ-0128" }).click();
  const j = janela(page);
  await expect(j).toContainText("somente leitura");
  await expect(j.getByRole("article", { name: "Ordem de compra OC-0128-1" })).toBeVisible();
  await j.getByRole("tab", { name: "Seleção" }).click();
  await expect(j.getByRole("button", { name: "Aplicar a sugestão da MIA" })).toBeDisabled();
  await j.getByRole("button", { name: "Fechar" }).click();

  await page.getByRole("button", { name: "Requisições (RCs)" }).click();
  await page.getByRole("button", { name: "Ver análise: RC-0139" }).click();
  await expect(janela(page)).toContainText("Inválida — devolvida ao solicitante");
  await janela(page).getByRole("button", { name: "Fechar" }).click();

  await page.getByRole("button", { name: "Spend", exact: true }).click();
  await expect(page.getByText("Tail spend")).toBeVisible();
  /* A MIA acompanha as telas: o botão roxo abre a conversa e ela leva para outra tela. */
  await page.getByRole("button", { name: "Abrir a MIA" }).click();
  await page.getByPlaceholder(/Pergunte à MIA/).fill("quem aprova acima de 100 mil?");
  await page.getByPlaceholder(/Pergunte à MIA/).press("Enter");
  await expect(page.getByRole("log")).toContainText("Diretoria Financeira");
  await page.getByPlaceholder(/Pergunte à MIA/).fill("/ir sala de comando");
  await page.getByPlaceholder(/Pergunte à MIA/).press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sala de comando");
  await page.getByRole("button", { name: "Alçada de compra" }).click();
  await expect(page.getByRole("rowheader", { name: "acima de R$ 100.000,00" })).toBeVisible();
  /* O botão voltar do navegador anda dentro da demo, e recarregar fica na mesma tela. */
  await page.goBack();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sala de comando");
  for (let i = 0; i < 4; i++) await page.goBack();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Olá, Ana. Eu sou a MIA.");
  for (let i = 0; i < 4; i++) await page.goForward();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sala de comando");
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sala de comando");
  await page.getByRole("button", { name: "Alçada de compra" }).click();
  await page.getByRole("button", { name: "Base de fornecedores" }).click();
  await expect(page.getByRole("heading", { name: /Alfa Suprimentos Ltda/ })).toBeVisible();
});

test("sair da demo volta ao cadastro, e o celular não ganha rolagem de lado", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await entrar(page, "Empresa Celular");
  const semRolagem = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(await semRolagem()).toBe(true);
  await abrirRcPelaMia(page);
  expect(await semRolagem()).toBe(true);
  await page.getByRole("button", { name: "Cotações e negociação" }).click();
  await page.getByRole("button", { name: "Abrir RFQ-0137" }).click();
  await expect(janela(page).getByRole("heading", { name: "RFQ-0137" })).toBeVisible();
  await janela(page).getByRole("tab", { name: "Mapa" }).click();
  expect(await semRolagem()).toBe(true);
  await janela(page).getByRole("button", { name: "Fechar" }).click();
  await page.getByRole("button", { name: "Spend", exact: true }).click();
  expect(await semRolagem()).toBe(true);
  await page.getByRole("button", { name: "Sair da demo" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Teste o Nexo com as suas mãos.");
});

test("o servidor valida o cadastro, o link de acesso e protege o painel", async ({ request }) => {
  const dados = { nome: "Ana Souza", email: `x-${Date.now()}@exemplo-teste.com`, empresa: "Empresa", celular: "11988887777", linkedin: "ana-souza", ciencia: true };
  const semLinkedin = await request.post("/api/nexo-demo", { data: { ...dados, linkedin: "" } });
  expect(semLinkedin.status()).toBe(422);
  expect((await semLinkedin.json()).error).toBe("linkedin");
  expect((await (await request.post("/api/nexo-demo", { data: { ...dados, nome: "" } })).json()).error).toBe("nome");
  expect((await request.post("/api/nexo-demo", { data: { ...dados, ciencia: false } })).status()).toBe(422);

  const { token } = await (await request.post("/api/nexo-demo", { data: dados })).json();
  expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect((await request.post("/api/nexo-demo/passo", { data: { token, passo: 3 } })).status()).toBe(204);
  expect((await request.post("/api/nexo-demo/passo", { data: { token, passo: 1 } })).status()).toBe(204);
  const volta = await request.post("/api/nexo-demo/entrar", { data: { token } });
  expect(await volta.json()).toEqual({ nome: "Ana Souza", empresa: "Empresa", passo: 3 });
  expect((await request.post("/api/nexo-demo/entrar", { data: { token: "a".repeat(43) } })).status()).toBe(404);

  expect((await request.get("/admin/nexo-demo")).status()).toBe(401);
  expect((await request.get("/admin/nexo-demo.csv")).status()).toBe(401);
  expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /preview/");
  expect(await (await request.get("/sitemap.xml")).text()).not.toContain("nexo-demo");
});

test("o link do e-mail leva de volta para dentro da demo e some do endereço", async ({ page, request }) => {
  const r = await request.post("/api/nexo-demo", { data: { nome: "Bruno Lima", email: `link-${Date.now()}@exemplo-teste.com`, empresa: "Empresa do Link", celular: "11988887777", linkedin: "ana-souza", ciencia: true } });
  const { token } = await r.json();
  await page.goto(`${ROTA}?acesso=${token}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Olá, Bruno. Eu sou a MIA.");
  expect(new URL(page.url()).search).toBe("");
  expect(page.url()).not.toContain("acesso");
  await page.context().clearCookies();
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${ROTA}?acesso=${"b".repeat(43)}`);
  await expect(page.getByText("Este link de acesso não vale mais.")).toBeVisible();
});

test("quem já tem cadastro pede o link pelo e-mail, e a tela não diz quem está na base", async ({ page, request }) => {
  await page.goto(ROTA);
  await page.getByRole("button", { name: "Entrar com o seu e-mail" }).click();
  await expect(page.getByRole("heading", { level: 2 })).toHaveText("Já tenho cadastro");
  await expect(page.getByRole("textbox")).toHaveCount(1);
  const email = `ninguem-${Date.now()}@exemplo-teste.com`;
  await page.getByLabel("E-mail do cadastro").fill(email);
  await page.getByRole("button", { name: "Enviar o link de acesso" }).click();
  await expect(page.getByRole("status")).toContainText(`Se ${email} tem cadastro no Nexo Demo`);
  await page.getByRole("button", { name: "Usar outro e-mail" }).click();
  await page.getByRole("button", { name: "Cadastre-se para entrar" }).click();
  await expect(page.getByRole("textbox")).toHaveCount(5);

  /* Mesma resposta para e-mail com e sem cadastro; e-mail inválido é recusado. */
  const cadastrado = `tem-${Date.now()}@exemplo-teste.com`;
  await request.post("/api/nexo-demo", { data: { nome: "Ana Souza", email: cadastrado, empresa: "Empresa", celular: "11988887777", linkedin: "ana-souza", ciencia: true } });
  const com = await request.post("/api/nexo-demo/login", { data: { email: cadastrado } });
  const sem = await request.post("/api/nexo-demo/login", { data: { email } });
  expect(await com.json()).toEqual(await sem.json());
  expect(com.status()).toBe(200);
  expect((await request.post("/api/nexo-demo/login", { data: { email: "ana@" } })).status()).toBe(422);
});
