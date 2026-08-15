import { describe, expect, it } from "vitest";
import { normalizarRota, ROTA_OUTRAS } from "./estatisticas";

describe("normalizarRota", () => {
  it("mantém as seções conhecidas pelo primeiro segmento", () => {
    expect(normalizarRota("/")).toBe("/");
    expect(normalizarRota("/nexo")).toBe("/nexo");
    expect(normalizarRota("/academy")).toBe("/academy");
    expect(normalizarRota("/cursos")).toBe("/cursos");
    expect(normalizarRota("/spend-lab")).toBe("/spend-lab");
    expect(normalizarRota("/certificados/ABC123")).toBe("/certificados");
  });

  it("descarta querystring e hash antes de decidir", () => {
    expect(normalizarRota("/cursos?utm_source=zap#assinar")).toBe("/cursos");
    expect(normalizarRota("/?ref=linkedin")).toBe("/");
  });

  it("agrupa caminho público desconhecido em /outras", () => {
    expect(normalizarRota("/planos")).toBe(ROTA_OUTRAS);
    expect(normalizarRota("/qualquer-coisa/funda")).toBe(ROTA_OUTRAS);
  });

  it("nunca conta área logada, admin ou api", () => {
    expect(normalizarRota("/app")).toBeNull();
    expect(normalizarRota("/app/curso/x")).toBeNull();
    expect(normalizarRota("/admin")).toBeNull();
    expect(normalizarRota("/api/estatisticas")).toBeNull();
  });

  it("rejeita lixo: não-string, vazio, sem barra, gigante", () => {
    expect(normalizarRota(42)).toBeNull();
    expect(normalizarRota(null)).toBeNull();
    expect(normalizarRota("")).toBeNull();
    expect(normalizarRota("nexo")).toBeNull();
    expect(normalizarRota("/" + "a".repeat(300))).toBeNull();
  });
});
