import { ALCADAS, CATALOGO, CENTROS, FORNECEDORES, FORNECEDORES_IA, NOVO, PADRAO_NOVO, URGENCIAS, type Cotado, type Fornecedor, type ItemCatalogo, type Semente } from "./dados";
import { nexoDemo } from "./textos";

/**
 * Regras do Nexo Demo (2026-11-27; segunda versão no mesmo dia, com os doze
 * itens de realismo aprovados pelo Rodrigo). Puras: o navegador roda a
 * demonstração inteira com este código (nada do que a pessoa clica vai ao
 * servidor, só o passo alcançado) e os testes cobrem sem banco.
 *
 * A demonstração acompanha UMA requisição da pessoa, do pedido à ordem de
 * compra, dentro de uma operação que já existe (as cotações de `SEMENTES`,
 * montadas por estas mesmas regras). A pessoa troca de papel (solicitante,
 * gestor, comprador, fornecedor, alçada) e o guia da tela diz qual é o da vez.
 */

/** Mesma chave da primeira versão, para quem já entrou continuar dentro: o estado antigo, de outro formato, volta ao início (`estadoGuardado`). */
export const CHAVE_LOCAL = "nexo-demo-v1";
/** O número da requisição da pessoa, na sequência das que já estão na operação. */
export const NUMERO = "0142";
export const codigoRc = (n: string = NUMERO) => `RC-${n}`;
export const codigoRfq = (n: string = NUMERO) => `RFQ-${n}`;
export const codigoOc = (n: string, i: number) => `OC-${n}-${i + 1}`;
export const QTD_MAX = 9999;
export const LINHAS_MAX = 3;
/** Pedido de ajuste aceita qualquer percentual até este; o fornecedor responde com o teto dele. */
export const AJUSTE_MAX = 100;

export type Tela = "mia" | "abrir" | "minhas" | "aprovacoes" | "requisicoes" | "cotacoes" | "spend" | "sala" | "fornecedores" | "alcada" | "fecho";

export type Linha = { item: string; qtd: number };
/** O que a pessoa digita: texto livre (a MIA reconhece o item) e quantidade. */
export type LinhaForm = { texto: string; qtd: number };
export type Formulario = { linhas: LinhaForm[]; urgencia: string; necessarioAte: string; centro: string; justificativa: string };
export type Requisicao = { itens: Linha[]; urgencia: string; necessarioAte: string; centro: string; justificativa: string };
export type Extra = { id: string; nome: string; email: string };
export type RespostaPortal = { precos: Record<string, number>; prazoDias: number };

export type Estado = {
  rascunho: Formulario | null;
  /** A MIA recusou a requisição: o texto que não deu para classificar e o motivo. */
  devolvida: { descricao: string; motivo: "vaga" | "fora" } | null;
  rc: Requisicao | null;
  analiseVista: boolean;
  rcAprovada: boolean;
  /** Fornecedores que a pessoa cadastrou na hora. */
  extras: Extra[];
  iaBuscada: boolean;
  /** Caixa de convites (antes do envio) e, depois, quem foi convidado. */
  convidados: string[];
  convitesEnviados: boolean;
  propostasChegaram: boolean;
  /** Propostas que a pessoa preencheu no Portal do Fornecedor, no lugar dele. */
  portal: Record<string, RespostaPortal>;
  mapaGerado: boolean;
  /** Quem já baixou o preço numa negociação por e-mail. */
  negociados: string[];
  /** Vencedor de cada linha (item → fornecedor). */
  selecao: Record<string, string>;
  /** Ajuste aceito pelo vencedor da linha, em %. */
  ajustes: Record<string, number>;
  selecaoEnviada: boolean;
  ocGerada: boolean;
};

export const ESTADO_INICIAL: Estado = {
  rascunho: null,
  devolvida: null,
  rc: null,
  analiseVista: false,
  rcAprovada: false,
  extras: [],
  iaBuscada: false,
  convidados: [],
  convitesEnviados: false,
  propostasChegaram: false,
  portal: {},
  mapaGerado: false,
  negociados: [],
  selecao: {},
  ajustes: {},
  selecaoEnviada: false,
  ocGerada: false,
};

export type Acao =
  | { tipo: "salvarRascunho"; form: Formulario }
  | { tipo: "descartarRascunho" }
  | { tipo: "abrirRc"; form: Formulario }
  | { tipo: "verAnalise" }
  | { tipo: "aprovarRc" }
  | { tipo: "buscarIa" }
  | { tipo: "novoFornecedor"; nome: string; email: string }
  | { tipo: "alternarConvite"; fornecedor: string }
  | { tipo: "convidarTodos" }
  | { tipo: "enviarConvites" }
  | { tipo: "chegarPropostas" }
  | { tipo: "responderPortal"; fornecedor: string; resposta: RespostaPortal }
  | { tipo: "gerarMapa" }
  | { tipo: "negociar"; fornecedores: string[] }
  | { tipo: "selecionar"; item: string; fornecedor: string }
  | { tipo: "sugerirSelecao" }
  | { tipo: "ajustar"; item: string; pct: number }
  | { tipo: "concluirSelecao" }
  | { tipo: "aprovarSelecao" }
  | { tipo: "reiniciar" };

/* ---------- catálogo e classificação da MIA ---------- */

export const semAcento = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function itemDoCatalogo(id: string): ItemCatalogo | undefined {
  return CATALOGO.find((i) => i.id === id);
}

export const TIPOS = [...new Set(CATALOGO.map((i) => i.tipo))];

/** Sugestões do catálogo enquanto a pessoa digita (e por tipo, se ela escolheu um). */
export function buscarCatalogo(texto: string, tipo?: string | null): ItemCatalogo[] {
  const n = semAcento(texto);
  return CATALOGO.filter((i) => (!tipo || i.tipo === tipo) && (n === "" || semAcento(`${i.nome} ${i.categoria}`).includes(n) || i.chaves.some((k) => n.includes(k))));
}

const GENERICAS = ["material", "materiais", "item", "itens", "coisa", "produto", "produtos", "diversos", "geral", "teste", "urgente", "compra"];

/**
 * A classificação que a MIA faz de um texto livre: reconhece um item do
 * catálogo, ou devolve. "vaga" = descrição genérica demais para cotar (é o
 * caso que o Nexo real devolve ao solicitante); "fora" = descrição clara, mas
 * de um item que o catálogo desta demonstração não tem.
 */
export function classificar(texto: string): { item: string } | { motivo: "vaga" | "fora" } {
  const n = semAcento(texto);
  const achado = CATALOGO.find((i) => semAcento(i.nome) === n) ?? CATALOGO.find((i) => i.chaves.some((k) => n.split(" ").some((p) => p.startsWith(k))));
  if (achado) return { item: achado.id };
  const palavras = n.split(" ").filter((p) => p.length > 2);
  return palavras.length < 3 || palavras.some((p) => GENERICAS.includes(p)) ? { motivo: "vaga" } : { motivo: "fora" };
}

export type Falta = "item" | "qtd" | "urgencia" | "data" | "dataPassada" | "centro";

/**
 * O que falta no formulário, na ordem do resumo. Com `hojeIso` (a tela passa),
 * data anterior a hoje também conta: achado do teste de uso de 2026-11-27,
 * o campo aceitava "2020-01-01" digitado.
 */
export function faltasDoForm(f: Partial<Formulario>, hojeIso?: string): Falta[] {
  const faltas: Falta[] = [];
  const linhas = f.linhas ?? [];
  if (linhas.length === 0 || linhas.length > LINHAS_MAX || linhas.some((l) => l.texto.trim().length < 2)) faltas.push("item");
  if (linhas.some((l) => !Number.isInteger(l.qtd) || l.qtd < 1 || l.qtd > QTD_MAX)) faltas.push("qtd");
  if (!f.urgencia || !(URGENCIAS as readonly string[]).includes(f.urgencia)) faltas.push("urgencia");
  if (!f.necessarioAte || !/^\d{4}-\d{2}-\d{2}$/.test(f.necessarioAte)) faltas.push("data");
  else if (hojeIso && f.necessarioAte < hojeIso) faltas.push("dataPassada");
  if (!f.centro || !(CENTROS as readonly string[]).includes(f.centro)) faltas.push("centro");
  return faltas;
}

/** Valor estimado: referência do catálogo × quantidade, somando as linhas. */
export function estimadoCentavos(rc: Requisicao): number {
  return rc.itens.reduce((s, l) => s + (itemDoCatalogo(l.item)?.referenciaCentavos ?? 0) * l.qtd, 0);
}

/** Estimado de um formulário em preenchimento: só as linhas que a MIA reconhece. */
export function estimadoDoForm(linhas: LinhaForm[]): number {
  return linhas.reduce((s, l) => {
    const c = classificar(l.texto);
    return s + ("item" in c && Number.isInteger(l.qtd) && l.qtd > 0 ? itemDoCatalogo(c.item)!.referenciaCentavos * l.qtd : 0);
  }, 0);
}

/* ---------- fornecedores ---------- */

export function fornecedorDe(e: Estado, id: string): Fornecedor | undefined {
  const fixo = FORNECEDORES.find((f) => f.id === id) ?? FORNECEDORES_IA.find((f) => f.id === id);
  if (fixo) return fixo;
  const x = e.extras.find((f) => f.id === id);
  return x ? { ...x, homologado: false, pagamento: NOVO.pagamento, descontoRodada: NOVO.descontoRodada, tetoAjuste: NOVO.tetoAjuste, padrao: PADRAO_NOVO } : undefined;
}

/** Quem pode ser convidado: a base, o que a busca com IA achou e os cadastrados na hora. */
export function disponiveis(e: Estado): Fornecedor[] {
  return [...FORNECEDORES, ...(e.iaBuscada ? FORNECEDORES_IA : []), ...e.extras.map((x) => fornecedorDe(e, x.id)!)];
}

function cotado(item: ItemCatalogo, f: Fornecedor): Cotado | null {
  return f.id in item.fornecedores ? item.fornecedores[f.id] : (f.padrao ?? null);
}

/** O fornecedor da base que não responde ao convite desta RC (um por categoria: é o que acontece na vida real). */
export function quemNaoResponde(e: Estado): string | null {
  return e.rc ? (itemDoCatalogo(e.rc.itens[0].item)?.naoResponde ?? null) : null;
}

/* ---------- propostas ---------- */

export type Cotacao = {
  fornecedor: string;
  nome: string;
  pagamento: string;
  homologado: boolean;
  prazoDias: number;
  /** Por item: preço e total, ou `null` quando o fornecedor não cotou a linha. */
  linhas: Record<string, { unitarioCentavos: number; totalCentavos: number } | null>;
  totalCentavos: number;
  cotadas: number;
  peloPortal: boolean;
};

function precoBase(e: Estado, item: ItemCatalogo, f: Fornecedor): number | null {
  const resposta = e.portal[f.id];
  if (resposta) return resposta.precos[item.id] ?? null;
  const ct = cotado(item, f);
  return ct ? Math.round(item.referenciaCentavos * ct.fator) : null;
}

/**
 * As propostas em vigor, na ordem em que os fornecedores aparecem na tela.
 * Só existe proposta depois que os convites saíram e as respostas chegaram
 * (ou que a pessoa respondeu pelo Portal do Fornecedor). Negociação por
 * e-mail e ajuste da seleção já entram no preço.
 */
export function cotacoes(e: Estado, comAjuste = true): Cotacao[] {
  if (!e.rc || !e.convitesEnviados) return [];
  const calado = quemNaoResponde(e);
  return disponiveis(e)
    .filter((f) => e.convidados.includes(f.id) && (e.portal[f.id] || (e.propostasChegaram && f.id !== calado)))
    .map((f) => {
      const linhas: Cotacao["linhas"] = {};
      let prazo = 0;
      for (const l of e.rc!.itens) {
        const item = itemDoCatalogo(l.item)!;
        let unitario = precoBase(e, item, f);
        if (unitario === null) {
          linhas[l.item] = null;
          continue;
        }
        if (e.negociados.includes(f.id)) unitario = Math.round(unitario * (1 - f.descontoRodada));
        if (comAjuste && e.selecao[l.item] === f.id && e.ajustes[l.item]) unitario = Math.round(unitario * (1 - e.ajustes[l.item] / 100));
        linhas[l.item] = { unitarioCentavos: unitario, totalCentavos: unitario * l.qtd };
        prazo = Math.max(prazo, cotado(item, f)?.prazoDias ?? 0);
      }
      const validas = Object.values(linhas).filter((x) => x !== null);
      return {
        fornecedor: f.id,
        nome: f.nome,
        pagamento: f.pagamento,
        homologado: f.homologado,
        prazoDias: e.portal[f.id]?.prazoDias ?? prazo,
        linhas,
        totalCentavos: validas.reduce((s, x) => s + x.totalCentavos, 0),
        cotadas: validas.length,
        peloPortal: Boolean(e.portal[f.id]),
      };
    })
    .filter((c) => c.cotadas > 0);
}

/** Convidados que não têm proposta (ainda não chegou, não respondem ou não cotam nenhuma linha). */
export function semProposta(e: Estado): string[] {
  if (!e.convitesEnviados) return [];
  const com = cotacoes(e).map((c) => c.fornecedor);
  return e.convidados.filter((id) => !com.includes(id));
}

/** Menor preço de cada linha (no empate, o primeiro da tela) e o fornecedor de menor prazo. */
export function melhores(cs: Cotacao[], rc: Requisicao): { porLinha: Record<string, string | null>; prazo: string | null } {
  const porLinha: Record<string, string | null> = {};
  for (const l of rc.itens) {
    const quem = cs.filter((c) => c.linhas[l.item]).reduce<Cotacao | null>((m, c) => (!m || c.linhas[l.item]!.unitarioCentavos < m.linhas[l.item]!.unitarioCentavos ? c : m), null);
    porLinha[l.item] = quem?.fornecedor ?? null;
  }
  const prazo = cs.reduce<Cotacao | null>((m, c) => (!m || c.prazoDias < m.prazoDias ? c : m), null);
  return { porLinha, prazo: prazo?.fornecedor ?? null };
}

export const rodadaDe = (e: Estado): 1 | 2 => (e.negociados.length > 0 ? 2 : 1);

/** Total das linhas com vencedor escolhido. */
export function totalSelecionado(e: Estado): number {
  if (!e.rc) return 0;
  const cs = cotacoes(e);
  return e.rc.itens.reduce((s, l) => s + (cs.find((c) => c.fornecedor === e.selecao[l.item])?.linhas[l.item]?.totalCentavos ?? 0), 0);
}

export const selecaoCompleta = (e: Estado) => Boolean(e.rc) && e.rc!.itens.every((l) => cotacoes(e).some((c) => c.fornecedor === e.selecao[l.item] && c.linhas[l.item]));

/** Economia da seleção sobre o estimado, em centavos (negativa se ficou acima). */
export function economiaCentavos(e: Estado): number {
  return e.rc && selecaoCompleta(e) ? estimadoCentavos(e.rc) - totalSelecionado(e) : 0;
}

export type OrdemDeCompra = {
  codigo: string;
  fornecedor: Fornecedor;
  linhas: { item: ItemCatalogo; qtd: number; unitarioCentavos: number; totalCentavos: number }[];
  totalCentavos: number;
  prazoDias: number;
};

/** Uma ordem de compra por fornecedor vencedor (pedido dividido = mais de uma OC). */
export function ordensDeCompra(e: Estado, numero: string = NUMERO): OrdemDeCompra[] {
  if (!e.rc || !selecaoCompleta(e)) return [];
  const cs = cotacoes(e);
  return cs
    .filter((c) => e.rc!.itens.some((l) => e.selecao[l.item] === c.fornecedor))
    .map((c, i) => {
      const linhas = e
        .rc!.itens.filter((l) => e.selecao[l.item] === c.fornecedor)
        .map((l) => ({ item: itemDoCatalogo(l.item)!, qtd: l.qtd, ...c.linhas[l.item]! }));
      return { codigo: codigoOc(numero, i), fornecedor: fornecedorDe(e, c.fornecedor)!, linhas, totalCentavos: linhas.reduce((s, l) => s + l.totalCentavos, 0), prazoDias: c.prazoDias };
    });
}

/** Quem aprova a seleção, pelo total (a regra de alçada de valor). */
export function alcadaDe(centavos: number): (typeof ALCADAS)[number] {
  return ALCADAS.find((a) => centavos <= a.ateCentavos)!;
}

/* ---------- o redutor ---------- */

/**
 * Cada ação só vale no ponto certo do processo; fora dele o estado volta
 * igual. É o que impede, por exemplo, gerar a OC sem a seleção aprovada.
 */
export function reduzir(e: Estado, a: Acao): Estado {
  const cotando = Boolean(e.rc) && e.rcAprovada && !e.convitesEnviados;
  const negociando = e.convitesEnviados && !e.selecaoEnviada;
  switch (a.tipo) {
    case "salvarRascunho":
      return e.rc ? e : { ...e, rascunho: a.form };
    case "descartarRascunho":
      return { ...e, rascunho: null };
    case "abrirRc": {
      if (e.rc || faltasDoForm(a.form).length > 0) return e;
      const itens: Linha[] = [];
      for (const l of a.form.linhas) {
        const c = classificar(l.texto);
        if ("motivo" in c) return { ...e, rascunho: a.form, devolvida: { descricao: l.texto.trim(), motivo: c.motivo } };
        const igual = itens.find((x) => x.item === c.item);
        if (igual) igual.qtd = Math.min(QTD_MAX, igual.qtd + l.qtd);
        else itens.push({ item: c.item, qtd: l.qtd });
      }
      return { ...ESTADO_INICIAL, rc: { itens, urgencia: a.form.urgencia, necessarioAte: a.form.necessarioAte, centro: a.form.centro, justificativa: a.form.justificativa.trim().slice(0, 400) } };
    }
    case "verAnalise":
      return e.rc ? { ...e, analiseVista: true } : e;
    case "aprovarRc":
      return e.rc && !e.rcAprovada ? { ...e, analiseVista: true, rcAprovada: true } : e;
    case "buscarIa":
      return cotando ? { ...e, iaBuscada: true } : e;
    case "novoFornecedor": {
      const nome = a.nome.trim().replace(/\s+/g, " ").slice(0, 80);
      const email = a.email.trim().toLowerCase().slice(0, 120);
      if (!cotando || e.extras.length >= NOVO.maximo || nome.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return e;
      const id = `novo${e.extras.length + 1}`;
      return { ...e, extras: [...e.extras, { id, nome, email }], convidados: [...e.convidados, id] };
    }
    case "alternarConvite": {
      if (!cotando || !disponiveis(e).some((f) => f.id === a.fornecedor)) return e;
      const dentro = e.convidados.includes(a.fornecedor);
      return { ...e, convidados: dentro ? e.convidados.filter((f) => f !== a.fornecedor) : [...e.convidados, a.fornecedor] };
    }
    case "convidarTodos":
      /* "Adicionar todos" é da aba Cadastro: junta a base homologada inteira ao que já estiver na caixa. */
      return cotando ? { ...e, convidados: [...new Set([...e.convidados, ...FORNECEDORES.map((f) => f.id)])] } : e;
    case "enviarConvites":
      return cotando && e.convidados.length >= 2 ? { ...e, convitesEnviados: true } : e;
    case "chegarPropostas":
      return e.convitesEnviados && !e.propostasChegaram ? { ...e, propostasChegaram: true } : e;
    case "responderPortal": {
      if (!negociando || !e.rc || !e.convidados.includes(a.fornecedor)) return e;
      const precos: Record<string, number> = {};
      for (const l of e.rc.itens) {
        const v = a.resposta.precos[l.item];
        if (!Number.isInteger(v) || v < 1 || v > 100_000_000) return e;
        precos[l.item] = v;
      }
      const prazoDias = a.resposta.prazoDias;
      if (!Number.isInteger(prazoDias) || prazoDias < 1 || prazoDias > 365) return e;
      return { ...e, portal: { ...e.portal, [a.fornecedor]: { precos, prazoDias } } };
    }
    case "gerarMapa":
      return e.convitesEnviados && !e.mapaGerado && cotacoes(e).length > 0 ? { ...e, mapaGerado: true } : e;
    case "negociar": {
      if (!negociando) return e;
      const novos = cotacoes(e)
        .map((c) => c.fornecedor)
        .filter((id) => a.fornecedores.includes(id) && !e.negociados.includes(id));
      return novos.length > 0 ? { ...e, negociados: [...e.negociados, ...novos] } : e;
    }
    case "selecionar": {
      if (!e.mapaGerado || e.selecaoEnviada || !cotacoes(e).some((c) => c.fornecedor === a.fornecedor && c.linhas[a.item])) return e;
      if (e.selecao[a.item] === a.fornecedor) return e;
      const ajustes = { ...e.ajustes };
      delete ajustes[a.item];
      return { ...e, selecao: { ...e.selecao, [a.item]: a.fornecedor }, ajustes };
    }
    case "sugerirSelecao": {
      if (!e.mapaGerado || e.selecaoEnviada || !e.rc) return e;
      const { porLinha } = melhores(cotacoes(e, false), e.rc);
      const selecao: Record<string, string> = {};
      for (const [item, f] of Object.entries(porLinha)) if (f) selecao[item] = f;
      return { ...e, selecao, ajustes: {} };
    }
    case "ajustar": {
      const f = fornecedorDe(e, e.selecao[a.item] ?? "");
      if (!e.mapaGerado || e.selecaoEnviada || !f || !(a.pct > 0) || a.pct > AJUSTE_MAX) return e;
      return { ...e, ajustes: { ...e.ajustes, [a.item]: Math.min(Math.round(a.pct * 10) / 10, f.tetoAjuste) } };
    }
    case "concluirSelecao":
      return e.mapaGerado && !e.selecaoEnviada && selecaoCompleta(e) ? { ...e, selecaoEnviada: true } : e;
    case "aprovarSelecao":
      return e.selecaoEnviada && !e.ocGerada ? { ...e, ocGerada: true } : e;
    case "reiniciar":
      return ESTADO_INICIAL;
  }
}

/* ---------- textos montados com os números ---------- */

export const reais = (centavos: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(centavos / 100);
export const porcento = (fracao: number) => new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(fracao);
export const milhoes = (centavos: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 }).format(centavos / 100);

/** Os riscos que a análise da MIA aponta para a RC. */
export function riscosDaRc(rc: Requisicao, hoje: Date): string[] {
  const t = nexoDemo.requisicoes.risco;
  const riscos: string[] = [t.concentracao];
  const dias = Math.round((new Date(`${rc.necessarioAte}T12:00:00`).getTime() - hoje.getTime()) / 86_400_000);
  const prazos = rc.itens.flatMap((l) => Object.values(itemDoCatalogo(l.item)!.fornecedores).flatMap((f) => (f ? [f.prazoDias] : [])));
  if (dias < prazos.reduce((s, p) => s + p, 0) / prazos.length) riscos.push(t.prazoCurto);
  if (rc.itens.some((l) => Object.values(itemDoCatalogo(l.item)!.fornecedores).includes(null))) riscos.push(t.semCobertura);
  riscos.push(t.alcada(alcadaDe(estimadoCentavos(rc)).aprovador));
  return riscos;
}

/** Os insights da MIA sobre o mapa, montados com os números das propostas. */
export function insights(e: Estado): { melhor: string[]; outliers: string[]; riscos: string[] } {
  const t = nexoDemo.insightsTextos;
  const cs = cotacoes(e, false);
  if (!e.rc || cs.length === 0) return { melhor: [], outliers: [], riscos: [] };
  const m = melhores(cs, e.rc);
  const nome = (id: string) => fornecedorDe(e, id)?.nome ?? id;
  const melhor: string[] = [];
  const outliers: string[] = [];
  for (const l of e.rc.itens) {
    const item = itemDoCatalogo(l.item)!;
    const vencedor = cs.find((c) => c.fornecedor === m.porLinha[l.item]);
    if (!vencedor) continue;
    const base = vencedor.linhas[l.item]!.unitarioCentavos;
    melhor.push(t.melhor(item.nome, vencedor.nome, reais(base)));
    for (const c of cs) {
      const p = c.linhas[l.item];
      if (p && p.unitarioCentavos > base * 1.08) outliers.push(t.outlier(c.nome, item.nome, porcento(p.unitarioCentavos / base - 1)));
    }
  }
  const vencedores = [...new Set(Object.values(m.porLinha).filter(Boolean))];
  if (vencedores.length > 1) melhor.push(t.dividir(vencedores.length));
  if (m.prazo) melhor.push(t.prazo(nome(m.prazo), cs.find((c) => c.fornecedor === m.prazo)!.prazoDias));
  const riscos: string[] = semProposta(e).map((id) => t.semResposta(nome(id)));
  for (const c of cs) if (c.cotadas < e.rc.itens.length) riscos.push(t.parcial(c.nome, c.cotadas, e.rc.itens.length));
  for (const c of cs) if (!c.homologado) riscos.push(t.naoHomologado(c.nome));
  if (cs.length < 2) riscos.push(t.poucas);
  riscos.push(e.negociados.length === 0 ? t.rodada : t.rodada2(e.negociados.length));
  return { melhor, outliers: outliers.length > 0 ? outliers : [t.semOutlier], riscos };
}

/* ---------- fases, passos e a operação que já existe ---------- */

/**
 * Fases do guia, em ordem. O índice da fase é o que vai ao servidor como
 * "passo alcançado" do lead (lib/nexo-demo/leads.ts): mexeu na ordem ou no
 * tamanho, mexa em `PASSOS` junto (o teste confere).
 */
/** Quanto dura a animação do fornecedor respondendo (FilmeFornecedor); as propostas chegam quando ela termina. */
export const FILME_PROPOSTA_MS = 9000;
/** Quanto dura a animação de cada aprovação (FilmeAprovacao): a do gestor na RC e a da alçada na OC. */
export const FILME_APROVACAO_MS = 7600;
/**
 * Quanto as animações andam mais devagar que o roteiro de cima (2026-11-27,
 * pedido do Rodrigo: "um pouco mais lentas para facilitar a leitura"). Os
 * tempos dos filmes continuam escritos no ritmo original; o relógio de cada
 * um anda por este fator, e quem espera um filme acabar usa `duracaoReal`.
 */
export const RITMO_FILME = 1.5;
export const duracaoReal = (ms: number) => Math.round(ms * RITMO_FILME);

export const FASES = ["inicio", "analise", "aprovarRc", "convidar", "mapa", "selecionar", "aprovarSelecao", "fim"] as const;
export type Fase = (typeof FASES)[number];

export function faseDe(e: Estado): Fase {
  if (!e.rc) return "inicio";
  if (e.ocGerada) return "fim";
  if (e.selecaoEnviada) return "aprovarSelecao";
  if (e.mapaGerado) return "selecionar";
  if (e.convitesEnviados) return "mapa";
  if (e.rcAprovada) return "convidar";
  return e.analiseVista ? "aprovarRc" : "analise";
}

/**
 * O próximo clique da pessoa, mais fino que a fase: é o que o guia escreve em
 * "Agora" e o botão que as telas destacam (2026-11-27, pedido do Rodrigo:
 * "deixando claro onde ele está e o que falta"). `aba` é a aba da janela da
 * cotação em que o botão mora, quando mora lá.
 */
export type AcaoGuia = "abrirRc" | "verAnalise" | "aprovarRc" | "escolherFornecedores" | "enviarConvites" | "aguardarPropostas" | "responderPortal" | "gerarMapa" | "escolherVencedores" | "concluirSelecao" | "aprovarSelecao" | "fim";
export type AbaGuia = "fornecedores" | "propostas" | "selecao";

export function proximaAcao(e: Estado): { acao: AcaoGuia; aba?: AbaGuia } {
  switch (faseDe(e)) {
    case "inicio":
      return { acao: "abrirRc" };
    case "analise":
      return { acao: "verAnalise" };
    case "aprovarRc":
      return { acao: "aprovarRc" };
    case "convidar":
      return { acao: e.convidados.length < 2 ? "escolherFornecedores" : "enviarConvites", aba: "fornecedores" };
    case "mapa":
      if (cotacoes(e).length > 0) return { acao: "gerarMapa", aba: "propostas" };
      return { acao: e.propostasChegaram ? "responderPortal" : "aguardarPropostas", aba: "propostas" };
    case "selecionar":
      return { acao: selecaoCompleta(e) ? "concluirSelecao" : "escolherVencedores", aba: "selecao" };
    case "aprovarSelecao":
      return { acao: "aprovarSelecao" };
    case "fim":
      return { acao: "fim" };
  }
}

/** O que o painel mostra para cada passo alcançado (índice = índice da fase). */
export const PASSOS = [
  "Entrou na demo",
  "Abriu a requisição",
  "Viu a análise da MIA",
  "Aprovou a RC",
  "Enviou os convites",
  "Gerou o mapa",
  "Enviou a seleção",
  "Gerou a OC (concluiu)",
] as const;
export const PASSO_FINAL = PASSOS.length - 1;

export type StatusRfq = "setup" | "convites" | "aguardando" | "propostas" | "aprovacao" | "concluida";

export function statusDaRfq(e: Estado): StatusRfq {
  if (e.ocGerada) return "concluida";
  if (e.selecaoEnviada) return "aprovacao";
  if (cotacoes(e).length > 0) return e.propostasChegaram ? "propostas" : "aguardando";
  return e.convitesEnviados ? "convites" : "setup";
}

const isoEm = (hoje: Date, dias: number) => {
  const d = new Date(hoje.getTime() + dias * 86_400_000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export { isoEm };

/** O estado de uma cotação da operação, montado pelas mesmas ações que a pessoa dispara. */
export function estadoDaSemente(s: Semente, hoje: Date): Estado {
  const rc: Requisicao = { itens: s.itens, urgencia: s.urgencia, necessarioAte: isoEm(hoje, s.necessarioEm), centro: s.centro, justificativa: "" };
  let e: Estado = { ...ESTADO_INICIAL, rc, analiseVista: true, rcAprovada: true };
  const roteiro: Acao[] = s.ate === "setup" ? [] : [{ tipo: "convidarTodos" }, { tipo: "enviarConvites" }];
  if (s.ate !== "setup" && s.ate !== "convites") roteiro.push({ tipo: "chegarPropostas" }, { tipo: "gerarMapa" });
  for (const a of roteiro) e = reduzir(e, a);
  if (s.negociada) e = reduzir(e, { tipo: "negociar", fornecedores: e.convidados });
  if (s.ate === "aprovacao" || s.ate === "oc") e = reduzir(reduzir(e, { tipo: "sugerirSelecao" }), { tipo: "concluirSelecao" });
  if (s.ate === "oc") e = reduzir(e, { tipo: "aprovarSelecao" });
  return e;
}

/**
 * Estado guardado no navegador: só volta o que tem o formato certo E é um
 * ponto possível do processo (versão antiga ou adulterada volta ao início).
 */
export function estadoGuardado(v: unknown): Estado {
  try {
    if (!v || typeof v !== "object") return ESTADO_INICIAL;
    const e = { ...ESTADO_INICIAL, ...(v as Estado) };
    if (!e.rc) {
      const r = e.rascunho;
      const rascunho = r && Array.isArray(r.linhas) && r.linhas.length <= LINHAS_MAX && r.linhas.every((l) => typeof l?.texto === "string" && typeof l?.qtd === "number") ? r : null;
      const d = e.devolvida;
      return { ...ESTADO_INICIAL, rascunho, devolvida: d && typeof d.descricao === "string" && (d.motivo === "vaga" || d.motivo === "fora") ? d : null };
    }
    const rcOk =
      Array.isArray(e.rc.itens) &&
      e.rc.itens.length > 0 &&
      e.rc.itens.length <= LINHAS_MAX &&
      e.rc.itens.every((l) => itemDoCatalogo(l.item) && Number.isInteger(l.qtd) && l.qtd > 0 && l.qtd <= QTD_MAX) &&
      faltasDoForm({ linhas: [{ texto: "ok", qtd: 1 }], urgencia: e.rc.urgencia, necessarioAte: e.rc.necessarioAte, centro: e.rc.centro }).length === 0;
    const listas = [e.extras, e.convidados, e.negociados].every(Array.isArray) && [e.portal, e.selecao, e.ajustes].every((o) => o && typeof o === "object");
    if (!rcOk || !listas) return ESTADO_INICIAL;
    const limpo: Estado = { ...e, rascunho: null, devolvida: null, extras: e.extras.slice(0, NOVO.maximo), convidados: e.convidados.filter((id) => disponiveis(e).some((f) => f.id === id)) };
    const possivel =
      (!limpo.convitesEnviados || (limpo.rcAprovada && limpo.convidados.length >= 2)) &&
      (!limpo.propostasChegaram || limpo.convitesEnviados) &&
      (!limpo.mapaGerado || cotacoes(limpo).length > 0) &&
      (!limpo.selecaoEnviada || (limpo.mapaGerado && selecaoCompleta(limpo))) &&
      (!limpo.ocGerada || limpo.selecaoEnviada);
    if (!possivel) return ESTADO_INICIAL;
    ordensDeCompra(limpo);
    insights(limpo);
    return limpo;
  } catch {
    return ESTADO_INICIAL;
  }
}

/**
 * O que o Portal do Fornecedor já traz preenchido quando a pessoa responde no
 * lugar dele: a proposta em vigor, se houver; senão o preço dele no catálogo
 * (ou a referência, para item que ele não costuma cotar).
 */
export function sugestaoPortal(e: Estado, id: string): RespostaPortal {
  const f = fornecedorDe(e, id);
  const atual = cotacoes(e, false).find((c) => c.fornecedor === id);
  const precos: Record<string, number> = {};
  let prazoDias = atual?.prazoDias ?? 0;
  for (const l of e.rc?.itens ?? []) {
    const item = itemDoCatalogo(l.item)!;
    const ct = f ? cotado(item, f) : null;
    precos[l.item] = atual?.linhas[l.item]?.unitarioCentavos ?? Math.round(item.referenciaCentavos * (ct?.fator ?? 1));
    if (!atual) prazoDias = Math.max(prazoDias, ct?.prazoDias ?? 10);
  }
  return { precos, prazoDias: prazoDias || 10 };
}

/**
 * "6.782,40" → 678240. Devolve NaN para o que não é preço. Ponto seguido de
 * um ou dois dígitos no fim, sem vírgula, é decimal ("1300.50"): no teste de
 * uso de 2026-11-27 ele era lido como milhar e o preço saía cem vezes maior.
 */
export function centavosDe(texto: string): number {
  const cru = texto.trim().replace(/^R\$\s*/i, "");
  const limpo = /^\d+\.\d{1,2}$/.test(cru) ? cru : cru.replace(/\./g, "").replace(",", ".");
  return /^\d+(\.\d{1,2})?$/.test(limpo) ? Math.round(Number(limpo) * 100) : Number.NaN;
}
