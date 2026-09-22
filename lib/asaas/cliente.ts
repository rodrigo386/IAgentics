import "server-only"; // a chave de produção nunca pode vazar para bundle de client

/**
 * Cliente HTTP do Asaas, para o catálogo de cursos (2026-09-22).
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

async function chamar(caminho: string, corpo: unknown): Promise<any> {
  const base = process.env.ASAAS_URL_BASE;
  if (!base) throw new Error("ASAAS_URL_BASE ausente");
  const chave = process.env.ASAAS;
  if (!chave) throw new Error("env ASAAS ausente");

  const resposta = await fetch(`${base.replace(/\/$/, "")}${caminho}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", access_token: chave },
    body: JSON.stringify(corpo),
    // Um Asaas pendurado não pode prender o checkout de quem está pagando.
    signal: AbortSignal.timeout(15_000),
  });
  if (!resposta.ok) {
    // O corpo do erro fica SÓ no log, redigido; a tela recebe mensagem genérica.
    console.error("[asaas]", caminho, resposta.status, redigirCpfs(await resposta.text()));
    throw new Error(`asaas ${resposta.status}`);
  }
  return resposta.json();
}

export async function criarCliente(d: { nome: string; email: string; cpf: string; telefone: string }): Promise<{ id: string }> {
  const r = await chamar("/customers", { name: d.nome, email: d.email, cpfCnpj: d.cpf, mobilePhone: d.telefone });
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
  const r = await chamar("/payments", {
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
