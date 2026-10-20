import { describe, expect, it } from "vitest";
import { filtrarAssinaturas, lerFiltros } from "./filtros";

const HOJE = "2026-10-20";

describe("lerFiltros", () => {
  it("sem nada: 30 dias até hoje", () => {
    expect(lerFiltros({}, HOJE)).toMatchObject({ de: "2026-09-21", ate: HOJE, dias: 30, pronto: 30, etapa: null, status: null, busca: "", soPeriodo: false });
  });
  it("período pronto de 7 dias", () => {
    expect(lerFiltros({ dias: "7" }, HOJE)).toMatchObject({ de: "2026-10-14", ate: HOJE, dias: 7, pronto: 7 });
  });
  it("datas de/até válidas vencem o período pronto", () => {
    expect(lerFiltros({ dias: "7", de: "2026-10-01", ate: "2026-10-15" }, HOJE)).toMatchObject({ de: "2026-10-01", ate: "2026-10-15", dias: 15, pronto: null });
  });
  it("datas inválidas, invertidas, no futuro ou longas demais caem em 30 dias", () => {
    for (const p of [
      { de: "2026-13-01", ate: "2026-10-15" },
      { de: "2026-10-15", ate: "2026-10-01" },
      { de: "2026-10-01", ate: "2026-10-30" },
      { de: "2024-01-01", ate: "2026-10-15" },
    ]) {
      expect(lerFiltros(p, HOJE).pronto).toBe(30);
    }
  });
  it("etapa e status desconhecidos são ignorados; a busca é aparada", () => {
    expect(lerFiltros({ etapa: "xyz", status: "pago", q: "  ana  " }, HOJE)).toMatchObject({ etapa: null, status: null, busca: "ana" });
    expect(lerFiltros({ etapa: "liberar", status: "ativa", periodo: "1" }, HOJE)).toMatchObject({ etapa: "liberar", status: "ativa", soPeriodo: true });
  });
});

describe("filtrarAssinaturas", () => {
  const item = (nome: string, email: string, telefone: string, status: "ativa" | "pendente", criada: string, etapa: "liberar" | "pagamento") => ({
    a: { nome, email, telefone, status, criadaEm: new Date(`${criada}T15:00:00Z`) },
    etapa,
  });
  const lista = [
    item("Denise Garcia", "denise@x.com", "16991486106", "ativa", "2026-10-16", "liberar"),
    item("Ana Souza", "ana@y.com", "11988887777", "pendente", "2026-09-01", "pagamento"),
  ];
  const dia = (d: Date) => d.toISOString().slice(0, 10);
  const f = (p: Record<string, string>) => lerFiltros(p, HOJE);

  it("busca por nome, e-mail ou parte do telefone", () => {
    expect(filtrarAssinaturas(lista, f({ q: "denise" }), dia)).toHaveLength(1);
    expect(filtrarAssinaturas(lista, f({ q: "@y.com" }), dia)).toHaveLength(1);
    expect(filtrarAssinaturas(lista, f({ q: "9148" }), dia)).toHaveLength(1);
  });
  it("etapa, status e só do período", () => {
    expect(filtrarAssinaturas(lista, f({ etapa: "pagamento" }), dia).map((x) => x.a.nome)).toEqual(["Ana Souza"]);
    expect(filtrarAssinaturas(lista, f({ status: "ativa" }), dia).map((x) => x.a.nome)).toEqual(["Denise Garcia"]);
    expect(filtrarAssinaturas(lista, f({ periodo: "1" }), dia).map((x) => x.a.nome)).toEqual(["Denise Garcia"]);
  });
});
