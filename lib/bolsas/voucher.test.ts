import { describe, expect, it } from "vitest";
import { VALOR_FUNDADOR_CENTAVOS } from "./regras";
import {
  CODIGO_VOUCHER,
  estadoDoVoucher,
  fimDoPrecoFundador,
  grupoDoVoucher,
  janelaDoVoucher,
  novoCodigoVoucher,
  precisaReajuste,
  somarDias,
  somarMeses,
  validadeDoVoucher,
} from "./voucher";

describe("voucher do preço de fundador", () => {
  it("o preço de fundador é R$ 29,90", () => {
    expect(VALOR_FUNDADOR_CENTAVOS).toBe(2990);
  });

  it("o grupo vem do status: bolsistas e não selecionados, mais ninguém", () => {
    expect(grupoDoVoucher("selecionado")).toBe("bolsista");
    expect(grupoDoVoucher("aceitou")).toBe("bolsista");
    expect(grupoDoVoucher("nao_selecionado")).toBe("nao_selecionado");
    expect(grupoDoVoucher("inscrito")).toBeNull();
    expect(grupoDoVoucher("espera")).toBeNull();
    expect(grupoDoVoucher("perdeu")).toBeNull();
  });

  it("o voucher dos não selecionados só sai depois do resultado e avisa do atraso depois de 10/01/2027", () => {
    expect(janelaDoVoucher("nao_selecionado", "2026-12-23")).toBe("cedo");
    expect(janelaDoVoucher("nao_selecionado", "2026-12-24")).toBe("aberta");
    expect(janelaDoVoucher("nao_selecionado", "2027-01-10")).toBe("aberta");
    expect(janelaDoVoucher("nao_selecionado", "2027-01-11")).toBe("atrasada");
  });

  it("o voucher dos bolsistas só sai quando a bolsa acaba, em 02/02/2027", () => {
    expect(janelaDoVoucher("bolsista", "2027-02-01")).toBe("cedo");
    expect(janelaDoVoucher("bolsista", "2027-02-02")).toBe("aberta");
    expect(janelaDoVoucher("bolsista", "2027-03-01")).toBe("aberta");
  });

  it("vale por 15 dias, contando de hoje", () => {
    expect(validadeDoVoucher("2027-01-10")).toBe("2027-01-25");
    expect(somarDias("2026-12-20", 15)).toBe("2027-01-04");
  });

  it("estado: usado vence expirado, e o último dia ainda vale", () => {
    expect(estadoDoVoucher({ usadoEm: null, validoAte: "2027-01-25" }, "2027-01-25")).toBe("valido");
    expect(estadoDoVoucher({ usadoEm: null, validoAte: "2027-01-25" }, "2027-01-26")).toBe("expirado");
    expect(estadoDoVoucher({ usadoEm: new Date(), validoAte: "2020-01-01" }, "2027-01-01")).toBe("usado");
    expect(estadoDoVoucher({ usadoEm: null, validoAte: null }, "2027-01-01")).toBe("expirado");
  });

  it("o preço de fundador acaba 12 meses depois da primeira fatura, sem pular mês curto", () => {
    expect(fimDoPrecoFundador("2027-01-20")).toBe("2028-01-20");
    expect(somarMeses("2027-01-31", 1)).toBe("2027-02-28");
    expect(somarMeses("2028-01-31", 1)).toBe("2028-02-29");
    expect(somarMeses("2027-12-15", 2)).toBe("2028-02-15");
  });

  it("o reajuste aparece 60 dias antes do fim do preço de fundador", () => {
    expect(precisaReajuste(null, "2027-01-01")).toBe(false);
    expect(precisaReajuste("2028-01-20", "2027-11-01")).toBe(false);
    expect(precisaReajuste("2028-01-20", "2027-11-21")).toBe(true);
    expect(precisaReajuste("2028-01-20", "2028-02-01")).toBe(true);
  });

  it("o código é longo e único o bastante para não ser adivinhado", () => {
    const a = novoCodigoVoucher();
    expect(a).toMatch(CODIGO_VOUCHER);
    expect(novoCodigoVoucher()).not.toBe(a);
  });
});
