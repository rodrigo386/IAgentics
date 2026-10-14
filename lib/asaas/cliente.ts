import "server-only"; // a chave de produção nunca pode vazar para bundle de client

/**
 * Cliente HTTP do Asaas: catálogo de cursos (2026-09-22, venda avulsa) e,
 * desde 2026-10-14, a assinatura mensal da Solution vendida na /cursos.
 *
 * A URL base vem de ASAAS_URL_BASE e NÃO tem valor padrão. O .env.local tem a
 * chave de PRODUÇÃO (`ASAAS`), e o `next start` do e2e carrega esse arquivo:
 * com um padrão apontando para api.asaas.com, qualquer teste que esquecesse o
 * Asaas falso criaria cobrança real. Sem a variável, nada sai — falha fechada.
 * Produção define https://api.asaas.com/v3; o e2e, o Asaas falso local.
 */

/** Mascara CPF antes de logar: 11 dígitos crus E o formato pontuado. O Asaas
 *  ecoa o CPF em mensagem de erro, e ele não pode chegar ao log. */
export function redigirCpfs(texto: string): string {
  return texto.replace(/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g, "[cpf-redigido]").replace(/\d{11}/g, "[cpf-redigido]");
}

async function chamar<T>(caminho: string, corpo?: unknown, metodo: "GET" | "POST" | "DELETE" = "POST"): Promise<T> {
  const base = process.env.ASAAS_URL_BASE;
  if (!base) throw new Error("ASAAS_URL_BASE ausente");
  const chave = process.env.ASAAS;
  if (!chave) throw new Error("env ASAAS ausente");

  const resposta = await fetch(`${base.replace(/\/$/, "")}${caminho}`, {
    method: metodo,
    headers: { "Content-Type": "application/json", access_token: chave },
    ...(metodo === "POST" ? { body: JSON.stringify(corpo) } : {}),
    // Um Asaas pendurado não pode prender o checkout de quem está pagando.
    signal: AbortSignal.timeout(15_000),
  });
  if (!resposta.ok) {
    // O corpo do erro fica SÓ no log, redigido; a tela recebe mensagem genérica.
    console.error("[asaas]", metodo, redigirCpfs(caminho), resposta.status, redigirCpfs(await resposta.text()));
    throw new Error(`asaas ${resposta.status}`);
  }
  return resposta.json();
}

export async function criarCliente(d: { nome: string; email: string; cpf: string; telefone: string }): Promise<{ id: string }> {
  const r = await chamar<{ id: string }>("/customers", { name: d.nome, email: d.email, cpfCnpj: d.cpf, mobilePhone: d.telefone });
  return { id: r.id };
}

/** Cobrança avulsa, à vista. `UNDEFINED` deixa o comprador escolher Pix,
 *  boleto ou cartão na fatura. `externalReference` é o id da venda — é por ele
 *  que o webhook acha a linha. */
export async function criarCobranca(d: {
  clienteId: string;
  valorCentavos: number;
  vencimento: string;
  descricao: string;
  referencia: string;
  urlRetorno: string;
}): Promise<{ id: string; urlFatura: string }> {
  const r = await chamar<{ id: string; invoiceUrl: string }>("/payments", {
    customer: d.clienteId,
    billingType: "UNDEFINED",
    value: d.valorCentavos / 100,
    dueDate: d.vencimento,
    description: d.descricao.slice(0, 500),
    externalReference: d.referencia,
    callback: { successUrl: d.urlRetorno, autoRedirect: false },
  });
  return { id: r.id, urlFatura: r.invoiceUrl };
}

/**
 * Cliente pelo CPF, para não duplicar cadastro (2026-10-14): até aqui cada
 * tentativa de compra criava um cliente novo no Asaas, e quem tentava duas
 * vezes virava dois cadastros. Reaproveita o primeiro ativo com aquele CPF.
 */
export async function clientePorCpf(d: { nome: string; email: string; cpf: string; telefone: string }): Promise<{ id: string }> {
  const busca = await chamar<{ data?: { id: string; deleted?: boolean }[] }>(`/customers?cpfCnpj=${encodeURIComponent(d.cpf)}`, undefined, "GET");
  const existente = busca.data?.find((c) => !c.deleted);
  if (existente) return { id: existente.id };
  return criarCliente(d);
}

/**
 * Assinatura mensal da plataforma Solution (2026-10-14). `UNDEFINED`: cada
 * fatura deixa a pessoa escolher cartão, Pix ou boleto (decisão do Rodrigo).
 * O Asaas gera uma cobrança por mês a partir de `proximoVencimento` e manda a
 * fatura por e-mail; `externalReference` é o id da nossa linha.
 */
export async function criarAssinatura(d: {
  clienteId: string;
  valorCentavos: number;
  proximoVencimento: string;
  descricao: string;
  referencia: string;
}): Promise<{ id: string }> {
  const r = await chamar<{ id: string }>("/subscriptions", {
    customer: d.clienteId,
    billingType: "UNDEFINED",
    value: d.valorCentavos / 100,
    nextDueDate: d.proximoVencimento,
    cycle: "MONTHLY",
    description: d.descricao.slice(0, 500),
    externalReference: d.referencia,
  });
  return { id: r.id };
}

/** A primeira fatura da assinatura, para levar a pessoa direto ao pagamento.
 *  Pode não existir ainda (o Asaas gera de forma assíncrona em alguns casos):
 *  aí devolve null e a tela diz que a fatura chega por e-mail. */
export async function primeiraFatura(assinaturaId: string): Promise<{ id: string; urlFatura: string } | null> {
  const r = await chamar<{ data?: { id: string; invoiceUrl: string; dueDate?: string }[] }>(
    `/subscriptions/${encodeURIComponent(assinaturaId)}/payments`,
    undefined,
    "GET",
  );
  const primeira = [...(r.data ?? [])].sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))[0];
  return primeira ? { id: primeira.id, urlFatura: primeira.invoiceUrl } : null;
}

/** Cancela no Asaas: para de gerar cobrança nova. As faturas já pagas ficam. */
export async function cancelarAssinaturaAsaas(assinaturaId: string): Promise<void> {
  await chamar(`/subscriptions/${encodeURIComponent(assinaturaId)}`, undefined, "DELETE");
}
