import { describe, expect, it } from "vitest";
import { transicaoDoEvento } from "./eventos";

describe("transicaoDoEvento", () => {
  it("pagamento confirmado ou recebido vira pago, inclusive boleto pago depois de vencido", () => {
    for (const e of ["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"]) {
      expect(transicaoDoEvento(e)).toEqual({ para: "pago", de: ["pendente", "cancelado", "falhou"] });
    }
  });
  it("estorno só vale para o que foi pago", () => {
    expect(transicaoDoEvento("PAYMENT_REFUNDED")).toEqual({ para: "estornado", de: ["pago"] });
  });
  it("vencida ou apagada cancela só o que ainda estava pendente", () => {
    for (const e of ["PAYMENT_OVERDUE", "PAYMENT_DELETED"]) {
      expect(transicaoDoEvento(e)).toEqual({ para: "cancelado", de: ["pendente"] });
    }
  });
  it("qualquer outro evento não mexe em nada", () => {
    expect(transicaoDoEvento("PAYMENT_CREATED")).toBeNull();
    expect(transicaoDoEvento("")).toBeNull();
  });
});
