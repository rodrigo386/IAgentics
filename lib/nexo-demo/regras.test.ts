import { describe, expect, it } from "vitest";
import { nexoDemo } from "./textos";
import { ESTADO_INICIAL, FASES, PASSOS, economiaCentavos, estadoGuardado, estimadoCentavos, faltasDaRc, faseDe, insights, melhores, propostas, reduzir, semResposta, type Acao, type Estado, type Requisicao } from "./regras";
import { passoValido, tokenValido, validarCadastro } from "./cadastro";

const rc: Requisicao = { item: "notebook", qtd: 10, urgencia: "Alta", necessarioAte: "2026-12-20", centro: "TI-001 · Tecnologia" };
const rodar = (acoes: Acao[], inicio: Estado = ESTADO_INICIAL) => acoes.reduce(reduzir, inicio);
const ateOMapa: Acao[] = [{ tipo: "abrirRc", rc }, { tipo: "verAnalise" }, { tipo: "aprovarRc" }, { tipo: "convidarTodos" }, { tipo: "enviarConvites" }, { tipo: "gerarMapa" }];

describe("Nexo Demo: o processo do começo ao fim", () => {
  it("cada fase do guia tem texto, tela e um passo no painel", () => {
    expect(PASSOS).toHaveLength(FASES.length);
    for (const f of FASES) expect(nexoDemo.guia.fases[f].texto.length).toBeGreaterThan(10);
  });

  it("percorre as fases na ordem, da requisição à ordem de compra", () => {
    const fases: string[] = [];
    let e = ESTADO_INICIAL;
    fases.push(faseDe(e));
    for (const a of [...ateOMapa, { tipo: "escolherVencedor", fornecedor: "horizonte" }, { tipo: "concluirSelecao" }, { tipo: "aprovarSelecao" }] as Acao[]) {
      e = reduzir(e, a);
      if (fases.at(-1) !== faseDe(e)) fases.push(faseDe(e));
    }
    expect(fases).toEqual([...FASES]);
    expect(e.ocGerada).toBe(true);
  });

  it("não deixa pular etapa", () => {
    const aberta = rodar([{ tipo: "abrirRc", rc }]);
    expect(reduzir(aberta, { tipo: "enviarConvites" })).toBe(aberta);
    expect(reduzir(aberta, { tipo: "gerarMapa" })).toBe(aberta);
    expect(reduzir(aberta, { tipo: "aprovarSelecao" })).toBe(aberta);
    const aprovada = rodar([{ tipo: "aprovarRc" }, { tipo: "alternarConvite", fornecedor: "alfa" }], aberta);
    expect(reduzir(aprovada, { tipo: "enviarConvites" }).convitesEnviados).toBe(false);
    const noMapa = rodar(ateOMapa);
    expect(reduzir(noMapa, { tipo: "concluirSelecao" })).toBe(noMapa);
    expect(reduzir(noMapa, { tipo: "escolherVencedor", fornecedor: "nortesul" })).toBe(noMapa);
  });

  it("recusa requisição incompleta ou fora do catálogo e segunda requisição", () => {
    expect(faltasDaRc({})).toEqual(["item", "qtd", "urgencia", "data", "centro"]);
    expect(faltasDaRc({ ...rc, item: "foguete" })).toEqual(["item"]);
    expect(faltasDaRc({ ...rc, qtd: 0 })).toEqual(["qtd"]);
    expect(reduzir(ESTADO_INICIAL, { tipo: "abrirRc", rc: { ...rc, qtd: 1.5 } })).toBe(ESTADO_INICIAL);
    const aberta = rodar([{ tipo: "abrirRc", rc }]);
    expect(reduzir(aberta, { tipo: "abrirRc", rc: { ...rc, item: "luva" } })).toBe(aberta);
  });

  it("as propostas saem do catálogo: um convidado não responde e os preços fecham ao centavo", () => {
    const e = rodar(ateOMapa);
    expect(estimadoCentavos(rc)).toBe(7_200_000);
    expect(semResposta(e)).toEqual(["nortesul"]);
    const ps = propostas(e);
    expect(ps.map((p) => p.fornecedor)).toEqual(["alfa", "horizonte", "prisma"]);
    for (const p of ps) expect(p.totalCentavos).toBe(p.unitarioCentavos * 10);
    const m = melhores(ps)!;
    expect(m.preco.fornecedor).toBe("horizonte");
    expect(m.preco.unitarioCentavos).toBe(678_240);
    expect(m.prazo.fornecedor).toBe("prisma");
  });

  it("a segunda rodada baixa todos os preços, uma vez só", () => {
    const r1 = rodar(ateOMapa);
    const r2 = reduzir(r1, { tipo: "novaRodada" });
    expect(r2.rodada).toBe(2);
    propostas(r2).forEach((p, i) => expect(p.unitarioCentavos).toBeLessThan(propostas(r1)[i].unitarioCentavos));
    expect(reduzir(r2, { tipo: "novaRodada" })).toBe(r2);
    expect(insights(r2).riscos.join(" ")).toContain("rodada 2");
  });

  it("a economia é o estimado menos o total do vencedor, e pode ser negativa", () => {
    const e = rodar([...ateOMapa, { tipo: "escolherVencedor", fornecedor: "horizonte" }]);
    expect(economiaCentavos(e)).toBe(7_200_000 - 6_782_400);
    expect(economiaCentavos(reduzir(e, { tipo: "escolherVencedor", fornecedor: "prisma" }))).toBeLessThan(0);
  });

  it("quem convida só o fornecedor que não responde e mais um ainda recebe proposta", () => {
    const e = rodar([{ tipo: "abrirRc", rc }, { tipo: "aprovarRc" }, { tipo: "alternarConvite", fornecedor: "nortesul" }, { tipo: "alternarConvite", fornecedor: "alfa" }, { tipo: "enviarConvites" }, { tipo: "gerarMapa" }]);
    expect(propostas(e).map((p) => p.fornecedor)).toEqual(["alfa"]);
    expect(insights(e).riscos.join(" ")).toContain("Só uma proposta");
  });

  it("todo item do catálogo tem fornecedores conhecidos, um sem resposta e ao menos dois que respondem", () => {
    const ids: string[] = nexoDemo.fornecedores.map((f) => f.id);
    for (const item of nexoDemo.catalogo) {
      expect(item.fornecedores.every((f) => ids.includes(f.id))).toBe(true);
      expect(item.fornecedores.filter((f) => !f.responde)).toHaveLength(1);
      expect(item.fornecedores.filter((f) => f.responde).length).toBeGreaterThanOrEqual(2);
    }
    expect(nexoDemo.catalogo.some((i) => i.id === nexoDemo.preenchimentoMia.item)).toBe(true);
    expect(nexoDemo.rc.centros).toContain(nexoDemo.preenchimentoMia.centro);
    expect(nexoDemo.rc.urgencias).toContain(nexoDemo.preenchimentoMia.urgencia);
  });

  it("o estado guardado no navegador volta inteiro, e o adulterado volta ao que é possível", () => {
    const fim = rodar([...ateOMapa, { tipo: "novaRodada" }, { tipo: "escolherVencedor", fornecedor: "alfa" }, { tipo: "concluirSelecao" }, { tipo: "aprovarSelecao" }]);
    expect(estadoGuardado(JSON.parse(JSON.stringify(fim)))).toEqual(fim);
    expect(estadoGuardado(null)).toBe(ESTADO_INICIAL);
    expect(estadoGuardado({ rc: { ...rc, item: "x" }, ocGerada: true })).toBe(ESTADO_INICIAL);
    const forjado = estadoGuardado({ rc, ocGerada: true, selecaoEnviada: true, vencedor: "alfa", mapaGerado: true });
    expect(forjado.ocGerada).toBe(false);
    expect(faseDe(forjado)).toBe("analise");
  });

  it("os fornecedores fictícios usam domínio que não existe", () => {
    for (const f of nexoDemo.fornecedores) expect(f.email).toMatch(/\.example$/);
  });
});

describe("Nexo Demo: cadastro", () => {
  const ok = { nome: " Ana  Souza ", email: " Ana@Empresa.com.br ", empresa: "Empresa Teste", celular: "(11) 98888-7777", linkedin: "ana-souza", ciencia: true };

  it("aceita os cinco campos e normaliza", () => {
    expect(validarCadastro(ok)).toEqual({ ok: true, dados: { nome: "Ana Souza", email: "ana@empresa.com.br", empresa: "Empresa Teste", celular: "11988887777", linkedin: "https://www.linkedin.com/in/ana-souza" } });
  });

  it("aponta o campo que falhou, na ordem do formulário", () => {
    const motivo = (c: object) => {
      const v = validarCadastro({ ...ok, ...c });
      return v.ok ? null : v.motivo;
    };
    expect(motivo({ nome: "A" })).toBe("nome");
    expect(motivo({ email: "ana@" })).toBe("email");
    expect(motivo({ empresa: " " })).toBe("empresa");
    expect(motivo({ celular: "9999" })).toBe("celular");
    expect(motivo({ linkedin: "" })).toBe("linkedin");
    expect(motivo({ ciencia: "on" })).toBe("ciencia");
    expect(motivo({})).toBeNull();
    expect(validarCadastro(null).ok).toBe(false);
  });

  it("todo motivo de recusa tem mensagem no formulário", () => {
    for (const m of ["nome", "email", "empresa", "celular", "linkedin", "ciencia", "limite", "falha"]) expect(nexoDemo.formulario.erros[m]).toBeTruthy();
  });

  it("token e passo só valem no formato certo", () => {
    expect(tokenValido("a".repeat(43))).toBe(true);
    expect(tokenValido("a".repeat(42))).toBe(false);
    expect(tokenValido("a".repeat(42) + "!")).toBe(false);
    expect(passoValido(PASSOS.length - 1)).toBe(true);
    expect(passoValido(PASSOS.length)).toBe(false);
    expect(passoValido(1.5)).toBe(false);
    expect(passoValido("3")).toBe(false);
  });
});
