import "server-only"; // a chave de produção nunca pode vazar para bundle de client

const BASE = "https://api.asaas.com/v3";

/** Mascara CPF antes de logar: sequência de 11 dígitos crus E o formato
 *  pontuado usual (000.000.000-00, e parcialmente pontuado). Fix round
 *  (Important 2, endurecido no round 2 — F2): o endpoint /customers valida o
 *  CPF e pode ecoá-lo de volta na mensagem de erro; a primeira versão só
 *  cobria dígitos crus e não pegava o formato do próprio CPF de teste do
 *  brief ("529.982.247-25") — sem a segunda regex, ele vazaria no log mesmo
 *  nunca sendo persistido (constraint da Task 2). */
export function redigirCpfs(texto: string): string {
  return texto.replace(/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g, "[cpf-redigido]").replace(/\d{11}/g, "[cpf-redigido]");
}

async function chamar(caminho: string, init?: RequestInit): Promise<any> {
  const chave = process.env.ASAAS;
  if (!chave) throw new Error("env ASAAS ausente");
  const resposta = await fetch(`${BASE}${caminho}`, {
    ...init,
    headers: { "Content-Type": "application/json", access_token: chave, ...(init?.headers ?? {}) },
    // Fix (Minor — review final): sem timeout, um Asaas pendurado prende a
    // fila do mutex por usuário (comLockDoUsuario em lib/asaas/assinatura.ts)
    // até o processo reiniciar — a próxima chamada do MESMO userId nunca
    // destrava porque a Promise anterior nunca resolve nem rejeita.
    signal: AbortSignal.timeout(15_000),
  });
  if (!resposta.ok) {
    // Corpo de erro do Asaas fica SÓ no log do servidor — a tela recebe sempre
    // a mensagem genérica (plataforma.assinar.erroGenerico), nunca isto. E o
    // corpo é redigido antes do log (ver redigirCpfs acima).
    console.error("asaas", caminho, resposta.status, redigirCpfs(await resposta.text()));
    throw new Error(`asaas ${resposta.status}`);
  }
  return resposta.json();
}

/** Contrato mínimo que a orquestração usa — um fake em teste implementa isto. */
export type ClienteAsaas = {
  criarCliente(d: { name: string; email: string; cpfCnpj: string }): Promise<{ id: string }>;
  criarAssinatura(d: { customer: string; nextDueDate: string }): Promise<{ id: string }>;
  listarCobrancas(subscriptionId: string): Promise<Array<{ id: string; status: string; invoiceUrl: string; dueDate: string }>>;
  /** Fix round (Important 1 + defesa de Critical 2): usada para achar uma
   *  assinatura ACTIVE "órfã" (existe no Asaas, sem linha aqui) antes de criar
   *  outra, e auto-curar o registro local. */
  listarAssinaturasDoCliente(customerId: string): Promise<Array<{ id: string; status: string }>>;
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
  async listarAssinaturasDoCliente(customerId) {
    const r = await chamar(`/subscriptions?customer=${customerId}`);
    return (r.data ?? []).map((s: any) => ({ id: s.id, status: s.status }));
  },
};
