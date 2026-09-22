import { afterEach, describe, expect, it, vi } from "vitest";
import { criarCliente, criarCobranca, redigirCpfs } from "./cliente";

describe("redigirCpfs", () => {
  it("mascara CPF cru e pontuado", () => {
    expect(redigirCpfs('{"cpfCnpj":"52998224725"}')).toBe('{"cpfCnpj":"[cpf-redigido]"}');
    expect(redigirCpfs("CPF 529.982.247-25 inválido")).toBe("CPF [cpf-redigido] inválido");
  });
});

describe("falha fechada", () => {
  const original = process.env.ASAAS_URL_BASE;
  afterEach(() => {
    if (original === undefined) delete process.env.ASAAS_URL_BASE;
    else process.env.ASAAS_URL_BASE = original;
  });

  /* A garantia que protege a chave de produção do .env.local: sem a URL base
     explícita, NENHUMA chamada sai — nem para o Asaas real. */
  it("sem ASAAS_URL_BASE, recusa antes de qualquer requisição", async () => {
    delete process.env.ASAAS_URL_BASE;
    await expect(criarCliente({ nome: "X", email: "x@x.com", cpf: "52998224725", telefone: "11988887777" })).rejects.toThrow(
      "ASAAS_URL_BASE ausente",
    );
  });
});

describe("caminho feliz", () => {
  const baseOriginal = process.env.ASAAS_URL_BASE;
  const chaveOriginal = process.env.ASAAS;

  afterEach(() => {
    if (baseOriginal === undefined) delete process.env.ASAAS_URL_BASE;
    else process.env.ASAAS_URL_BASE = baseOriginal;
    if (chaveOriginal === undefined) delete process.env.ASAAS;
    else process.env.ASAAS = chaveOriginal;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("criarCliente chama POST /customers com o corpo certo e mapeia o id", async () => {
    process.env.ASAAS_URL_BASE = "http://asaas.teste/v3";
    process.env.ASAAS = "chave-teste";
    const fetchFalso = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "cus_1" }) });
    vi.stubGlobal("fetch", fetchFalso);

    const r = await criarCliente({ nome: "Maria", email: "maria@x.com", cpf: "52998224725", telefone: "11988887777" });

    expect(r).toEqual({ id: "cus_1" });
    expect(fetchFalso).toHaveBeenCalledTimes(1);
    const [url, init] = fetchFalso.mock.calls[0];
    expect(url).toBe("http://asaas.teste/v3/customers");
    expect(init.method).toBe("POST");
    expect(init.headers.access_token).toBe("chave-teste");
    expect(JSON.parse(init.body)).toEqual({
      name: "Maria",
      email: "maria@x.com",
      cpfCnpj: "52998224725",
      mobilePhone: "11988887777",
    });
  });

  it("tolera barra final na base", async () => {
    process.env.ASAAS_URL_BASE = "http://asaas.teste/v3/";
    process.env.ASAAS = "chave-teste";
    const fetchFalso = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "cus_1" }) });
    vi.stubGlobal("fetch", fetchFalso);

    await criarCliente({ nome: "Maria", email: "maria@x.com", cpf: "52998224725", telefone: "11988887777" });

    expect(fetchFalso.mock.calls[0][0]).toBe("http://asaas.teste/v3/customers");
  });

  it("criarCobranca chama POST /payments com valor em reais, descrição truncada e mapeia urlFatura", async () => {
    process.env.ASAAS_URL_BASE = "http://asaas.teste/v3";
    process.env.ASAAS = "chave-teste";
    const fetchFalso = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "pay_1", invoiceUrl: "http://asaas.teste/fatura/pay_1" }),
    });
    vi.stubGlobal("fetch", fetchFalso);

    const descricaoLonga = "d".repeat(600);
    const r = await criarCobranca({
      clienteId: "cus_1",
      valorCentavos: 975,
      vencimento: "2026-10-01",
      descricao: descricaoLonga,
      referencia: "venda_1",
      urlRetorno: "https://iagentics.com.br/obrigado",
    });

    expect(r).toEqual({ id: "pay_1", urlFatura: "http://asaas.teste/fatura/pay_1" });
    const [url, init] = fetchFalso.mock.calls[0];
    expect(url).toBe("http://asaas.teste/v3/payments");
    expect(init.method).toBe("POST");
    expect(init.headers.access_token).toBe("chave-teste");
    const corpo = JSON.parse(init.body);
    expect(corpo).toEqual({
      customer: "cus_1",
      billingType: "UNDEFINED",
      value: 9.75,
      dueDate: "2026-10-01",
      description: "d".repeat(500),
      externalReference: "venda_1",
      callback: { successUrl: "https://iagentics.com.br/obrigado", autoRedirect: false },
    });
  });

  it("resposta não-ok rejeita com 'asaas <status>' e loga o CPF redigido", async () => {
    process.env.ASAAS_URL_BASE = "http://asaas.teste/v3";
    process.env.ASAAS = "chave-teste";
    const fetchFalso = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => '{"errors":[{"description":"cpfCnpj 529.982.247-25 inválido"}]}',
    });
    vi.stubGlobal("fetch", fetchFalso);
    const erroConsole = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      criarCliente({ nome: "X", email: "x@x.com", cpf: "52998224725", telefone: "11988887777" }),
    ).rejects.toThrow("asaas 400");

    expect(erroConsole).toHaveBeenCalledTimes(1);
    const mensagemLogada = erroConsole.mock.calls[0].join(" ");
    expect(mensagemLogada).not.toContain("529.982.247-25");
    expect(mensagemLogada).toContain("[cpf-redigido]");
  });
});
