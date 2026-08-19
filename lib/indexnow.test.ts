import { describe, it, expect, vi, afterEach } from "vitest";
import { CHAVE_INDEXNOW, URL_CATALOGO, corpoIndexNow, avisarIndexNow } from "@/lib/indexnow";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("corpo do IndexNow", () => {
  it("monta host, chave e localização da chave conforme o protocolo", () => {
    const corpo = corpoIndexNow([URL_CATALOGO]);
    expect(corpo.host).toBe("iagentics.com.br");
    expect(corpo.key).toBe(CHAVE_INDEXNOW);
    expect(corpo.keyLocation).toBe(`https://iagentics.com.br/${CHAVE_INDEXNOW}.txt`);
    expect(corpo.urlList).toEqual(["https://iagentics.com.br/cursos"]);
  });

  it("a chave é hexadecimal no tamanho aceito pelo protocolo (8 a 128)", () => {
    expect(CHAVE_INDEXNOW).toMatch(/^[a-f0-9]{8,128}$/);
  });

  it("as URLs avisadas pertencem ao host declarado — o protocolo recusa o resto", () => {
    const corpo = corpoIndexNow([URL_CATALOGO]);
    for (const url of corpo.urlList) expect(new URL(url).host).toBe(corpo.host);
  });
});

describe("aviso ao IndexNow", () => {
  it("não chama a rede fora de produção", async () => {
    const fetchFalso = vi.fn();
    vi.stubGlobal("fetch", fetchFalso);
    vi.stubEnv("NODE_ENV", "test");

    await avisarIndexNow([URL_CATALOGO]);
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  it("não chama a rede com lista vazia", async () => {
    const fetchFalso = vi.fn();
    vi.stubGlobal("fetch", fetchFalso);
    vi.stubEnv("NODE_ENV", "production");

    await avisarIndexNow([]);
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  it("em produção, posta o corpo do protocolo", async () => {
    const fetchFalso = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchFalso);
    vi.stubEnv("NODE_ENV", "production");

    await avisarIndexNow([URL_CATALOGO]);

    expect(fetchFalso).toHaveBeenCalledOnce();
    const [endpoint, init] = fetchFalso.mock.calls[0];
    expect(endpoint).toBe("https://api.indexnow.org/IndexNow");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body).urlList).toEqual([URL_CATALOGO]);
  });

  it("engole erro de rede — publicar um curso não pode falhar porque o Bing caiu", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("sem rede")));
    vi.stubEnv("NODE_ENV", "production");
    vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(avisarIndexNow([URL_CATALOGO])).resolves.toBeUndefined();
  });

  it("resposta de erro do buscador também não vira exceção", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 429 }));
    vi.stubEnv("NODE_ENV", "production");
    const aviso = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(avisarIndexNow([URL_CATALOGO])).resolves.toBeUndefined();
    expect(aviso).toHaveBeenCalled();
  });
});
