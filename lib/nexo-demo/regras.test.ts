import { describe, expect, it } from "vitest";
import { ALCADAS, CATALOGO, CENTROS, FORNECEDORES, FORNECEDORES_IA, RCS_NA_FILA, SEMENTES, URGENCIAS } from "./dados";
import { nexoDemo } from "./textos";
import { responder } from "./mia";
import {
  proximaAcao,
  ESTADO_INICIAL,
  FASES,
  PASSOS,
  alcadaDe,
  centavosDe,
  classificar,
  cotacoes,
  economiaCentavos,
  estadoDaSemente,
  estadoGuardado,
  estimadoCentavos,
  faltasDoForm,
  faseDe,
  insights,
  melhores,
  ordensDeCompra,
  reduzir,
  rodadaDe,
  selecaoCompleta,
  semProposta,
  statusDaRfq,
  sugestaoPortal,
  totalSelecionado,
  type Acao,
  type Estado,
  type Formulario,
} from "./regras";
import { passoValido, tokenValido, validarCadastro } from "./cadastro";

const HOJE = new Date("2026-11-27T12:00:00-03:00");
const form: Formulario = { linhas: [{ texto: "Notebook 14 polegadas, i7, 32 GB", qtd: 10 }, { texto: "preciso de monitor", qtd: 10 }], urgencia: "Alta", necessarioAte: "2026-12-20", centro: "TI-001 · Tecnologia", justificativa: "" };
const rodar = (acoes: Acao[], inicio: Estado = ESTADO_INICIAL) => acoes.reduce(reduzir, inicio);
const ateOMapa: Acao[] = [{ tipo: "abrirRc", form }, { tipo: "verAnalise" }, { tipo: "aprovarRc" }, { tipo: "convidarTodos" }, { tipo: "enviarConvites" }, { tipo: "chegarPropostas" }, { tipo: "gerarMapa" }];
const preco = (e: Estado, fornecedor: string, item: string) => cotacoes(e).find((c) => c.fornecedor === fornecedor)?.linhas[item]?.unitarioCentavos;

describe("Nexo Demo: o processo do começo ao fim", () => {
  it("cada fase do guia tem texto, tela e um passo no painel", () => {
    expect(PASSOS).toHaveLength(FASES.length);
    for (const f of FASES) expect(nexoDemo.guia.fases[f].texto.length).toBeGreaterThan(10);
  });

  it("o guia sabe o próximo clique em cada ponto do processo, e todo clique tem texto", () => {
    const ordem: string[] = [proximaAcao(ESTADO_INICIAL).acao];
    let e = ESTADO_INICIAL;
    const passos: Acao[] = [{ tipo: "abrirRc", form }, { tipo: "verAnalise" }, { tipo: "aprovarRc" }, { tipo: "convidarTodos" }, { tipo: "enviarConvites" }, { tipo: "chegarPropostas" }, { tipo: "gerarMapa" }, { tipo: "sugerirSelecao" }, { tipo: "concluirSelecao" }, { tipo: "aprovarSelecao" }];
    for (const a of passos) {
      e = reduzir(e, a);
      ordem.push(proximaAcao(e).acao);
    }
    expect(ordem).toEqual(["abrirRc", "verAnalise", "aprovarRc", "escolherFornecedores", "enviarConvites", "aguardarPropostas", "gerarMapa", "escolherVencedores", "concluirSelecao", "aprovarSelecao", "fim"]);
    /* O botão da vez mora numa aba da janela da cotação só enquanto se cota. */
    expect(proximaAcao(rodar(ateOMapa.slice(0, 3))).aba).toBe("fornecedores");
    expect(proximaAcao(rodar(ateOMapa.slice(0, 6))).aba).toBe("propostas");
    expect(proximaAcao(rodar(ateOMapa)).aba).toBe("selecao");
    expect(proximaAcao(ESTADO_INICIAL).aba).toBeUndefined();
    for (const f of FASES) expect(nexoDemo.guia.fases[f].nome.length).toBeGreaterThan(3);
    for (const texto of Object.values(nexoDemo.guia.acoes)) expect(texto).not.toMatch(/—|–/);
    /* Os botões citados em "Agora" existem com esse nome nas telas. */
    expect(nexoDemo.guia.acoes.abrirRc).toContain(nexoDemo.rc.abrir);
    expect(nexoDemo.guia.acoes.abrirRc).toContain(nexoDemo.rc.preencherMia);
    expect(nexoDemo.guia.acoes.verAnalise).toContain(nexoDemo.requisicoes.verAnalise);
    expect(nexoDemo.guia.acoes.gerarMapa).toContain(nexoDemo.cotacoes.gerarMapa);
    expect(nexoDemo.guia.acoes.escolherVencedores).toContain(nexoDemo.cotacoes.sugerir);
    expect(nexoDemo.guia.acoes.concluirSelecao).toContain(nexoDemo.cotacoes.concluir);
    expect(nexoDemo.guia.acoes.aprovarSelecao).toContain(nexoDemo.aprovacoes.aprovarSelecao);
  });

  it("percorre as fases na ordem, da requisição às ordens de compra", () => {
    const fases: string[] = [faseDe(ESTADO_INICIAL)];
    let e = ESTADO_INICIAL;
    for (const a of [...ateOMapa, { tipo: "sugerirSelecao" }, { tipo: "concluirSelecao" }, { tipo: "aprovarSelecao" }] as Acao[]) {
      e = reduzir(e, a);
      if (fases.at(-1) !== faseDe(e)) fases.push(faseDe(e));
    }
    expect(fases).toEqual([...FASES]);
    expect(ordensDeCompra(e).map((o) => o.codigo)).toEqual(["OC-0142-1", "OC-0142-2"]);
  });

  it("não deixa pular etapa", () => {
    const aberta = rodar([{ tipo: "abrirRc", form }]);
    for (const tipo of ["enviarConvites", "gerarMapa", "aprovarSelecao", "concluirSelecao", "buscarIa", "convidarTodos"] as const) expect(reduzir(aberta, { tipo })).toBe(aberta);
    const umSo = rodar([{ tipo: "aprovarRc" }, { tipo: "alternarConvite", fornecedor: "alfa" }], aberta);
    expect(reduzir(umSo, { tipo: "enviarConvites" })).toBe(umSo);
    const semChegar = rodar(ateOMapa.slice(0, 5));
    expect(reduzir(semChegar, { tipo: "gerarMapa" })).toBe(semChegar);
    const noMapa = rodar(ateOMapa);
    expect(reduzir(noMapa, { tipo: "concluirSelecao" })).toBe(noMapa);
    expect(reduzir(noMapa, { tipo: "selecionar", item: "monitor", fornecedor: "prisma" })).toBe(noMapa);
    expect(reduzir(noMapa, { tipo: "selecionar", item: "notebook", fornecedor: "nortesul" })).toBe(noMapa);
  });
});

describe("Nexo Demo: a requisição e a classificação da MIA", () => {
  it("reconhece o item pelo nome exato ou por palavra do texto livre", () => {
    expect(classificar("Notebook 14 polegadas, i7, 32 GB")).toEqual({ item: "notebook" });
    expect(classificar("20 cadeiras para a sala nova")).toEqual({ item: "cadeira" });
    expect(classificar("LICENÇAS de software")).toEqual({ item: "licenca" });
  });

  it("devolve descrição vaga e avisa quando o item não está no catálogo", () => {
    expect(classificar("Material para o setor")).toEqual({ motivo: "vaga" });
    expect(classificar("coisas")).toEqual({ motivo: "vaga" });
    expect(classificar("Empilhadeira elétrica de 2 toneladas com bateria de lítio")).toEqual({ item: "manutencao" });
    expect(classificar("Bebedouro industrial de aço inox com filtro")).toEqual({ motivo: "fora" });
  });

  it("a requisição com um item que a MIA não classifica é devolvida, guarda o rascunho e não vira RC", () => {
    const ruim = { ...form, linhas: [{ texto: "Material para o setor", qtd: 3 }] };
    const e = reduzir(ESTADO_INICIAL, { tipo: "abrirRc", form: ruim });
    expect(e.rc).toBeNull();
    expect(e.devolvida).toEqual({ descricao: "Material para o setor", motivo: "vaga" });
    expect(e.rascunho).toEqual(ruim);
    expect(faseDe(e)).toBe("inicio");
    const corrigida = reduzir(e, { tipo: "abrirRc", form });
    expect(corrigida.devolvida).toBeNull();
    expect(corrigida.rc?.itens).toEqual([{ item: "notebook", qtd: 10 }, { item: "monitor", qtd: 10 }]);
  });

  it("recusa formulário incompleto, soma linhas do mesmo item e não abre segunda requisição", () => {
    expect(faltasDoForm({})).toEqual(["item", "urgencia", "data", "centro"]);
    expect(faltasDoForm({ ...form, linhas: [{ texto: "luva", qtd: 0 }] })).toEqual(["qtd"]);
    expect(faltasDoForm(form, "2026-12-20")).toEqual([]);
    expect(faltasDoForm(form, "2026-12-21")).toEqual(["dataPassada"]);
    expect(faltasDoForm({ ...form, linhas: Array(4).fill({ texto: "luva", qtd: 1 }) })).toEqual(["item"]);
    expect(reduzir(ESTADO_INICIAL, { tipo: "abrirRc", form: { ...form, urgencia: "" } })).toBe(ESTADO_INICIAL);
    const dupla = reduzir(ESTADO_INICIAL, { tipo: "abrirRc", form: { ...form, linhas: [{ texto: "luva", qtd: 5 }, { texto: "luvas de segurança", qtd: 7 }] } });
    expect(dupla.rc?.itens).toEqual([{ item: "luva", qtd: 12 }]);
    expect(reduzir(dupla, { tipo: "abrirRc", form })).toBe(dupla);
  });

  it("o rascunho é salvo e descartado sem abrir a requisição", () => {
    const e = reduzir(ESTADO_INICIAL, { tipo: "salvarRascunho", form });
    expect(e.rascunho).toEqual(form);
    expect(e.rc).toBeNull();
    expect(reduzir(e, { tipo: "descartarRascunho" }).rascunho).toBeNull();
  });
});

describe("Nexo Demo: cotação, portal e negociação", () => {
  it("as propostas saem do catálogo: quem não responde, quem não cota a linha e os preços ao centavo", () => {
    const e = rodar(ateOMapa);
    expect(estimadoCentavos(e.rc!)).toBe(8_547_000);
    expect(semProposta(e)).toEqual(["nortesul"]);
    const cs = cotacoes(e);
    expect(cs.map((c) => c.fornecedor)).toEqual(["alfa", "horizonte", "prisma"]);
    expect(preco(e, "horizonte", "notebook")).toBe(678_240);
    expect(preco(e, "alfa", "monitor")).toBe(124_598);
    expect(cs.find((c) => c.fornecedor === "prisma")!.linhas.monitor).toBeNull();
    for (const c of cs) expect(c.totalCentavos).toBe(Object.values(c.linhas).reduce((s, l) => s + (l?.totalCentavos ?? 0), 0));
    expect(melhores(cs, e.rc!)).toEqual({ porLinha: { notebook: "horizonte", monitor: "alfa" }, prazo: "prisma" });
  });

  it("antes de as propostas chegarem não há proposta, a não ser a que veio pelo portal", () => {
    const esperando = rodar(ateOMapa.slice(0, 5));
    expect(cotacoes(esperando)).toEqual([]);
    expect(statusDaRfq(esperando)).toBe("convites");
    const s = sugestaoPortal(esperando, "nortesul");
    expect(s.precos).toEqual({ notebook: 712_800, monitor: 129_312 });
    const comPortal = reduzir(esperando, { tipo: "responderPortal", fornecedor: "nortesul", resposta: { precos: { notebook: 650_000, monitor: 120_000 }, prazoDias: 9 } });
    expect(cotacoes(comPortal).map((c) => [c.fornecedor, c.totalCentavos, c.prazoDias, c.peloPortal])).toEqual([["nortesul", 7_700_000, 9, true]]);
    expect(statusDaRfq(comPortal)).toBe("aguardando");
  });

  it("o portal recusa resposta de quem não foi convidado, sem preço de alguma linha ou com prazo inválido", () => {
    const e = rodar(ateOMapa);
    const ok = { precos: { notebook: 700_000, monitor: 120_000 }, prazoDias: 5 };
    expect(reduzir(e, { tipo: "responderPortal", fornecedor: "vertice", resposta: ok })).toBe(e);
    expect(reduzir(e, { tipo: "responderPortal", fornecedor: "nortesul", resposta: { precos: { notebook: 700_000 }, prazoDias: 5 } })).toBe(e);
    expect(reduzir(e, { tipo: "responderPortal", fornecedor: "nortesul", resposta: { ...ok, prazoDias: 0 } })).toBe(e);
    expect(cotacoes(reduzir(e, { tipo: "responderPortal", fornecedor: "nortesul", resposta: ok }))).toHaveLength(4);
  });

  it("a busca com IA e o fornecedor novo entram na cotação como não homologados", () => {
    const base = rodar(ateOMapa.slice(0, 3));
    const e = rodar([{ tipo: "buscarIa" }, { tipo: "novoFornecedor", nome: "  Casa  Verde ", email: "Vendas@casaverde.example" }, { tipo: "alternarConvite", fornecedor: "vertice" }, { tipo: "enviarConvites" }, { tipo: "chegarPropostas" }], base);
    expect(e.extras).toEqual([{ id: "novo1", nome: "Casa Verde", email: "vendas@casaverde.example" }]);
    expect(cotacoes(e).map((c) => [c.fornecedor, c.homologado, c.cotadas])).toEqual([["vertice", false, 2], ["novo1", false, 2]]);
    expect(preco(e, "vertice", "notebook")).toBe(687_600);
    expect(reduzir(base, { tipo: "novoFornecedor", nome: "X", email: "a@b.com" })).toBe(base);
    expect(reduzir(base, { tipo: "novoFornecedor", nome: "Casa Verde", email: "sem-arroba" })).toBe(base);
  });

  it("a negociação por e-mail baixa o preço de cada fornecedor uma vez só", () => {
    const r1 = rodar(ateOMapa);
    const so = reduzir(r1, { tipo: "negociar", fornecedores: ["horizonte"] });
    expect(rodadaDe(so)).toBe(2);
    expect(preco(so, "horizonte", "notebook")).toBe(664_675);
    expect(preco(so, "alfa", "notebook")).toBe(preco(r1, "alfa", "notebook"));
    expect(reduzir(so, { tipo: "negociar", fornecedores: ["horizonte", "nortesul"] })).toBe(so);
    const todos = reduzir(so, { tipo: "negociar", fornecedores: ["alfa", "horizonte", "prisma"] });
    expect(preco(todos, "alfa", "monitor")).toBe(120_237);
    expect(insights(todos).riscos.join(" ")).toContain("3 fornecedores já revisaram");
  });

  it("os insights contam a divisão do pedido, quem não respondeu e quem não cotou tudo", () => {
    const i = insights(rodar(ateOMapa));
    expect(i.melhor.join(" ")).toContain("dividindo o pedido entre 2 fornecedores");
    expect(i.riscos.join(" ")).toContain("Norte Sul Atacado foi convidado e não tem proposta");
    expect(i.riscos.join(" ")).toContain("Prisma Comércio e Serviços cotou 1 de 2 itens");
    expect(i.outliers.join(" ")).toContain("Prisma Comércio e Serviços cotou Notebook");
  });
});

describe("Nexo Demo: seleção, alçada e ordem de compra", () => {
  it("a sugestão da MIA divide o pedido e a economia é o estimado menos o total", () => {
    const e = rodar([...ateOMapa, { tipo: "sugerirSelecao" }]);
    expect(e.selecao).toEqual({ notebook: "horizonte", monitor: "alfa" });
    expect(totalSelecionado(e)).toBe(8_028_380);
    expect(economiaCentavos(e)).toBe(518_620);
    expect(alcadaDe(totalSelecionado(e)).aprovador).toBe("Gerente de Compras");
  });

  it("só conclui com vencedor em todas as linhas", () => {
    const meia = rodar([...ateOMapa, { tipo: "selecionar", item: "notebook", fornecedor: "prisma" }]);
    expect(selecaoCompleta(meia)).toBe(false);
    expect(reduzir(meia, { tipo: "concluirSelecao" })).toBe(meia);
    expect(economiaCentavos(meia)).toBe(0);
    expect(ordensDeCompra(meia)).toEqual([]);
  });

  it("o ajuste pedido ao fornecedor para no teto dele e some quando o vencedor da linha muda", () => {
    const e = rodar([...ateOMapa, { tipo: "sugerirSelecao" }, { tipo: "ajustar", item: "notebook", pct: 5 }]);
    expect(e.ajustes).toEqual({ notebook: 2 });
    expect(preco(e, "horizonte", "notebook")).toBe(664_675);
    expect(cotacoes(e, false).find((c) => c.fornecedor === "horizonte")!.linhas.notebook!.unitarioCentavos).toBe(678_240);
    expect(reduzir(e, { tipo: "ajustar", item: "notebook", pct: 0 })).toBe(e);
    expect(reduzir(e, { tipo: "ajustar", item: "notebook", pct: 101 })).toBe(e);
    expect(reduzir(e, { tipo: "ajustar", item: "notebook", pct: 50 }).ajustes).toEqual({ notebook: 2 });
    expect(reduzir(e, { tipo: "selecionar", item: "notebook", fornecedor: "alfa" }).ajustes).toEqual({});
  });

  it("cada fornecedor vencedor recebe a sua ordem de compra, e os totais fecham", () => {
    const e = rodar([...ateOMapa, { tipo: "negociar", fornecedores: ["alfa", "horizonte", "prisma"] }, { tipo: "sugerirSelecao" }, { tipo: "concluirSelecao" }, { tipo: "aprovarSelecao" }]);
    const ocs = ordensDeCompra(e);
    expect(ocs.map((o) => [o.codigo, o.fornecedor.id, o.totalCentavos])).toEqual([
      ["OC-0142-1", "alfa", 1_202_370],
      ["OC-0142-2", "horizonte", 6_646_750],
    ]);
    expect(ocs.reduce((s, o) => s + o.totalCentavos, 0)).toBe(totalSelecionado(e));
    expect(economiaCentavos(e)).toBe(697_880);
    expect(reduzir(e, { tipo: "negociar", fornecedores: ["prisma"] })).toBe(e);
    expect(reduzir(e, { tipo: "selecionar", item: "monitor", fornecedor: "horizonte" })).toBe(e);
  });

  it("a alçada cobre qualquer valor, sem buraco entre as faixas", () => {
    expect(alcadaDe(0).aprovador).toBe(ALCADAS[0].aprovador);
    expect(alcadaDe(1_000_000).aprovador).toBe(ALCADAS[0].aprovador);
    expect(alcadaDe(1_000_001).aprovador).toBe(ALCADAS[1].aprovador);
    expect(alcadaDe(10_000_001).aprovador).toBe(ALCADAS[2].aprovador);
  });
});

describe("Nexo Demo: os dados fictícios e a operação de exemplo", () => {
  it("o catálogo é coerente com a base de fornecedores", () => {
    const ids = FORNECEDORES.map((f) => f.id);
    for (const item of CATALOGO) {
      expect(Object.keys(item.fornecedores).sort()).toEqual([...ids].sort());
      expect(ids).toContain(item.naoResponde);
      expect(Object.entries(item.fornecedores).filter(([id, c]) => c && id !== item.naoResponde).length).toBeGreaterThanOrEqual(2);
      expect(classificar(item.nome)).toEqual({ item: item.id });
    }
    for (const f of [...FORNECEDORES, ...FORNECEDORES_IA]) expect(f.email).toMatch(/\.example$/);
    for (const f of FORNECEDORES_IA) expect(f.padrao).toBeTruthy();
  });

  it("o que a MIA preenche é uma requisição válida", () => {
    const p = nexoDemo.preenchimentoMia;
    const e = reduzir(ESTADO_INICIAL, { tipo: "abrirRc", form: { linhas: [...p.linhas], urgencia: p.urgencia, centro: p.centro, necessarioAte: "2026-12-17", justificativa: p.justificativa } });
    expect(e.rc?.itens).toHaveLength(2);
    expect(URGENCIAS).toContain(p.urgencia);
    expect(CENTROS).toContain(p.centro);
  });

  it("cada cotação da operação chega ao estágio que diz, pelas mesmas regras", () => {
    const esperado = { setup: "setup", convites: "convites", propostas: "propostas", aprovacao: "aprovacao", oc: "concluida" } as const;
    for (const s of SEMENTES) {
      const e = estadoDaSemente(s, HOJE);
      expect([s.numero, statusDaRfq(e)]).toEqual([s.numero, esperado[s.ate]]);
      expect(rodadaDe(e)).toBe(s.negociada ? 2 : 1);
      if (s.ate === "oc") expect(ordensDeCompra(e, s.numero).length).toBeGreaterThan(0);
      expect(estadoGuardado(JSON.parse(JSON.stringify(e)))).toEqual(e);
    }
    expect(new Set([...SEMENTES.map((s) => s.numero), ...RCS_NA_FILA.map((r) => r.numero), "0142"]).size).toBe(SEMENTES.length + RCS_NA_FILA.length + 1);
    expect(classificar(RCS_NA_FILA.find((r) => r.situacao === "devolvida")!.descricao!)).toEqual({ motivo: "vaga" });
  });

  it("o estado guardado no navegador volta inteiro, e o adulterado volta ao início", () => {
    const fim = rodar([...ateOMapa, { tipo: "negociar", fornecedores: ["alfa"] }, { tipo: "sugerirSelecao" }, { tipo: "ajustar", item: "monitor", pct: 1 }, { tipo: "concluirSelecao" }, { tipo: "aprovarSelecao" }]);
    expect(estadoGuardado(JSON.parse(JSON.stringify(fim)))).toEqual(fim);
    expect(estadoGuardado(null)).toBe(ESTADO_INICIAL);
    expect(estadoGuardado({ rc: { itens: [{ item: "foguete", qtd: 1 }] }, ocGerada: true })).toBe(ESTADO_INICIAL);
    expect(estadoGuardado({ ...rodar(ateOMapa.slice(0, 3)), ocGerada: true })).toBe(ESTADO_INICIAL);
    expect(estadoGuardado({ ...rodar(ateOMapa), selecaoEnviada: true })).toBe(ESTADO_INICIAL);
    expect(estadoGuardado({ rc: { item: "notebook", qtd: 10 } })).toBe(ESTADO_INICIAL);
    const comRascunho = estadoGuardado({ rascunho: form, devolvida: { descricao: "x", motivo: "vaga" } });
    expect([comRascunho.rascunho, comRascunho.devolvida?.motivo]).toEqual([form, "vaga"]);
  });

  it("lê preço digitado no portal", () => {
    expect(centavosDe("6.782,40")).toBe(678_240);
    expect(centavosDe("R$ 120")).toBe(12_000);
    expect(centavosDe("12,5")).toBe(1_250);
    expect(centavosDe("abc")).toBeNaN();
    expect(centavosDe("1,234")).toBeNaN();
    expect(centavosDe("1300.50")).toBe(130_050);
    expect(centavosDe("1300.5")).toBe(130_050);
    expect(centavosDe("1.300")).toBe(130_000);
    expect(centavosDe("1.300,50")).toBe(130_050);
  });
});

describe("Nexo Demo: a MIA por regras", () => {
  const vazio = ESTADO_INICIAL;
  const aberta = rodar([{ tipo: "abrirRc", form }]);

  it("abre e preenche a requisição a partir do que a pessoa escreve", () => {
    expect(responder("/abrir 20 cadeiras", vazio)).toMatchObject({ ir: "abrir", preencher: [{ texto: "Cadeira ergonômica com apoio lombar", qtd: 20 }] });
    expect(responder("Preciso comprar 300 luvas", vazio)).toMatchObject({ ir: "abrir", preencher: [{ qtd: 300 }] });
    expect(responder("15 toners", vazio)).toMatchObject({ ir: "abrir", preencher: [{ texto: "Toner para impressora laser, ciano", qtd: 15 }] });
    expect(responder("Quero abrir uma requisição de compra", vazio)).toMatchObject({ ir: "abrir", preencher: "padrao" });
    expect(responder("/abrir 4 bebedouros de inox", vazio)).toMatchObject({ ir: "abrir", preencher: [{ texto: "", qtd: 4 }] });
    expect(responder("/abrir 20 cadeiras", aberta).ir).toBeUndefined();
  });

  it("responde status, listas, gráfico, alçada e leva às telas", () => {
    expect(responder("/status", vazio).texto).toBe(nexoDemo.mia.r.statusSem);
    expect(responder("como está a minha requisição?", aberta)).toMatchObject({ bloco: "rcs" });
    expect(responder("Liste minhas RCs em aprovação", vazio).texto).toBe(nexoDemo.mia.r.rcsVazio);
    expect(responder("Liste minhas RCs em aprovação", aberta).bloco).toBe("rcs");
    expect(responder("/cotacoes", vazio).texto).toContain(`São ${SEMENTES.length} cotações`);
    expect(responder("Gráfico do gasto por categoria", vazio).bloco).toBe("grafico");
    expect(responder("quem aprova acima de 100 mil?", vazio).bloco).toBe("alcada");
    expect(responder("/fornecedores", vazio).bloco).toBe("fornecedores");
    expect(responder("/ir cotações", vazio).ir).toBe("cotacoes");
    expect(responder("me leva para a sala de comando", vazio).ir).toBe("sala");
    expect(responder("/saving", vazio).texto).toContain("economia no ano");
    expect(responder("tem alguma cotação atrasada?", vazio)).toMatchObject({ bloco: "atrasadas", texto: `${SEMENTES.filter((s) => s.ate !== "oc" && s.diasAberto > 10).length} cotações passaram de 10 dias em aberto:` });
  });

  it("diz o que sabe quando não entende, e cada atalho da tela tem resposta", () => {
    expect(responder("qual a previsão do tempo?", vazio)).toMatchObject({ texto: nexoDemo.mia.r.naoEntendi, bloco: "ajuda" });
    expect(responder("/", vazio).bloco).toBe("ajuda");
    expect(responder("oi", vazio).texto).toBe(nexoDemo.mia.r.saudacao);
    for (const a of nexoDemo.mia.atalhos) expect(responder(a, vazio).texto).not.toBe(nexoDemo.mia.r.naoEntendi);
    for (const c of nexoDemo.mia.comandos) expect(responder(c.cmd, vazio).texto).not.toBe(nexoDemo.mia.r.naoEntendi);
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
