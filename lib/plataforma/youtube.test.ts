import { describe, expect, it } from "vitest";
import { extrairYoutubeId } from "./youtube";

/** O admin cola o que tiver na mão: o ID puro, o link do navegador, o link
 *  curto do botão Compartilhar, o embed. Tudo isso tem que virar o ID de 11
 *  caracteres — e o que não for YouTube nenhum tem que virar null, nunca um
 *  palpite. */
describe("extrairYoutubeId", () => {
  it("aceita o ID puro de 11 caracteres", () => {
    expect(extrairYoutubeId("jNQXAC9IVRw")).toBe("jNQXAC9IVRw");
  });

  it("aceita ID com espaços em volta", () => {
    expect(extrairYoutubeId("  jNQXAC9IVRw  ")).toBe("jNQXAC9IVRw");
  });

  it("extrai de watch?v=", () => {
    expect(extrairYoutubeId("https://www.youtube.com/watch?v=jNQXAC9IVRw")).toBe("jNQXAC9IVRw");
  });

  it("extrai de watch?v= com parâmetros extras", () => {
    expect(extrairYoutubeId("https://www.youtube.com/watch?v=jNQXAC9IVRw&t=42s&ab_channel=x")).toBe("jNQXAC9IVRw");
  });

  it("extrai do link curto youtu.be", () => {
    expect(extrairYoutubeId("https://youtu.be/jNQXAC9IVRw?si=abc123")).toBe("jNQXAC9IVRw");
  });

  it("extrai de embed/", () => {
    expect(extrairYoutubeId("https://www.youtube.com/embed/jNQXAC9IVRw")).toBe("jNQXAC9IVRw");
  });

  it("extrai de shorts/ e live/", () => {
    expect(extrairYoutubeId("https://www.youtube.com/shorts/jNQXAC9IVRw")).toBe("jNQXAC9IVRw");
    expect(extrairYoutubeId("https://www.youtube.com/live/jNQXAC9IVRw")).toBe("jNQXAC9IVRw");
  });

  it("extrai do host youtube-nocookie e de URL sem protocolo", () => {
    expect(extrairYoutubeId("https://www.youtube-nocookie.com/embed/jNQXAC9IVRw")).toBe("jNQXAC9IVRw");
    expect(extrairYoutubeId("youtube.com/watch?v=jNQXAC9IVRw")).toBe("jNQXAC9IVRw");
    expect(extrairYoutubeId("www.youtu.be/jNQXAC9IVRw")).toBe("jNQXAC9IVRw");
  });

  it("rejeita o que não é YouTube nem ID", () => {
    expect(extrairYoutubeId("")).toBeNull();
    expect(extrairYoutubeId("   ")).toBeNull();
    expect(extrairYoutubeId("https://vimeo.com/12345678901")).toBeNull();
    expect(extrairYoutubeId("https://www.youtube.com/watch")).toBeNull();
    expect(extrairYoutubeId("um id qualquer")).toBeNull();
    expect(extrairYoutubeId("curto")).toBeNull();
  });
});
