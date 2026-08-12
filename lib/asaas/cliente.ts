import "server-only"; // a chave de produção nunca pode vazar para bundle de client

const BASE = "https://api.asaas.com/v3";

async function chamar(caminho: string, init?: RequestInit): Promise<any> {
  const chave = process.env.ASAAS;
  if (!chave) throw new Error("env ASAAS ausente");
  const resposta = await fetch(`${BASE}${caminho}`, {
    ...init,
    headers: { "Content-Type": "application/json", access_token: chave, ...(init?.headers ?? {}) },
  });
  if (!resposta.ok) {
    // Corpo de erro do Asaas fica SÓ no log do servidor — a tela recebe sempre
    // a mensagem genérica (plataforma.assinar.erroGenerico), nunca isto.
    console.error("asaas", caminho, resposta.status, await resposta.text());
    throw new Error(`asaas ${resposta.status}`);
  }
  return resposta.json();
}

/** Contrato mínimo que a orquestração usa — um fake em teste implementa isto. */
export type ClienteAsaas = {
  criarCliente(d: { name: string; email: string; cpfCnpj: string }): Promise<{ id: string }>;
  criarAssinatura(d: { customer: string; nextDueDate: string }): Promise<{ id: string }>;
  listarCobrancas(subscriptionId: string): Promise<Array<{ id: string; status: string; invoiceUrl: string; dueDate: string }>>;
};

export const clienteAsaas: ClienteAsaas = {
  async criarCliente(d) {
    const r = await chamar("/customers", { method: "POST", body: JSON.stringify(d) });
    return { id: r.id };
  },
  async criarAssinatura(d) {
    // Valores travados pelo spec: R$ 39,90/mês, aluno escolhe Pix/cartão/boleto na fatura.
    const r = await chamar("/subscriptions", {
      method: "POST",
      body: JSON.stringify({
        customer: d.customer,
        nextDueDate: d.nextDueDate,
        billingType: "UNDEFINED",
        value: 39.9,
        cycle: "MONTHLY",
        description: "Assinatura IAgentics Academy",
      }),
    });
    return { id: r.id };
  },
  async listarCobrancas(subscriptionId) {
    const r = await chamar(`/subscriptions/${subscriptionId}/payments`);
    return (r.data ?? []).map((p: any) => ({ id: p.id, status: p.status, invoiceUrl: p.invoiceUrl, dueDate: p.dueDate }));
  },
};
