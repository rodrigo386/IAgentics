import { nexoDemo, type ItemCatalogo } from "./textos";

/**
 * Regras do Nexo Demo (2026-11-27). Puras: o navegador roda a demonstração
 * inteira com este código (nada do que a pessoa clica vai ao servidor, só o
 * passo alcançado) e os testes cobrem sem banco.
 *
 * A demonstração acompanha UMA requisição, do pedido à ordem de compra. A
 * pessoa troca de papel (solicitante, gestor, comprador, alçada) e o guia da
 * tela diz qual é o da vez.
 */

export const CHAVE_LOCAL = "nexo-demo-v1";
export const CODIGO_RC = "RC-DEMO-0001";
export const CODIGO_RFQ = "RFQ-DEMO-0001";
export const CODIGO_OC = "OC-DEMO-0001";
export const QTD_MAX = 9999;
/** A 2ª rodada baixa o preço de cada fornecedor por este percentual (fictício, fixo por fornecedor). */
const DESCONTO_RODADA_2: Record<string, number> = { alfa: 0.035, horizonte: 0.02, prisma: 0.055, nortesul: 0.03 };
/** Acima deste total a análise da MIA avisa que a seleção passa pela alçada (na demo, sempre passa). */
const ALCADA_GESTOR_CENTAVOS = 1_000_000;

export type Requisicao = { item: string; qtd: number; urgencia: string; necessarioAte: string; centro: string };

export type Estado = {
  rc: Requisicao | null;
  analiseVista: boolean;
  rcAprovada: boolean;
  /** Caixa de convites (antes do envio) e, depois, quem foi convidado. */
  convidados: string[];
  convitesEnviados: boolean;
  mapaGerado: boolean;
  rodada: 1 | 2;
  vencedor: string | null;
  selecaoEnviada: boolean;
  ocGerada: boolean;
};

export const ESTADO_INICIAL: Estado = {
  rc: null,
  analiseVista: false,
  rcAprovada: false,
  convidados: [],
  convitesEnviados: false,
  mapaGerado: false,
  rodada: 1,
  vencedor: null,
  selecaoEnviada: false,
  ocGerada: false,
};

export type Acao =
  | { tipo: "abrirRc"; rc: Requisicao }
  | { tipo: "verAnalise" }
  | { tipo: "aprovarRc" }
  | { tipo: "alternarConvite"; fornecedor: string }
  | { tipo: "convidarTodos" }
  | { tipo: "enviarConvites" }
  | { tipo: "gerarMapa" }
  | { tipo: "novaRodada" }
  | { tipo: "escolherVencedor"; fornecedor: string }
  | { tipo: "concluirSelecao" }
  | { tipo: "aprovarSelecao" }
  | { tipo: "reiniciar" };

export function itemDoCatalogo(id: string): ItemCatalogo | undefined {
  return nexoDemo.catalogo.find((i) => i.id === id);
}

/** A requisição que o formulário manda vale? Devolve as faltas, na ordem do resumo. */
export function faltasDaRc(r: Partial<Requisicao>): (keyof typeof nexoDemo.rc.faltas)[] {
  const faltas: (keyof typeof nexoDemo.rc.faltas)[] = [];
  if (!r.item || !itemDoCatalogo(r.item)) faltas.push("item");
  if (!Number.isInteger(r.qtd) || (r.qtd as number) < 1 || (r.qtd as number) > QTD_MAX) faltas.push("qtd");
  if (!r.urgencia || !(nexoDemo.rc.urgencias as readonly string[]).includes(r.urgencia)) faltas.push("urgencia");
  if (!r.necessarioAte || !/^\d{4}-\d{2}-\d{2}$/.test(r.necessarioAte)) faltas.push("data");
  if (!r.centro || !(nexoDemo.rc.centros as readonly string[]).includes(r.centro)) faltas.push("centro");
  return faltas;
}

/**
 * Cada ação só vale no ponto certo do processo; fora dele o estado volta
 * igual. É o que impede, por exemplo, gerar a OC sem a seleção aprovada.
 */
export function reduzir(e: Estado, a: Acao): Estado {
  switch (a.tipo) {
    case "abrirRc":
      return e.rc || faltasDaRc(a.rc).length > 0 ? e : { ...ESTADO_INICIAL, rc: a.rc };
    case "verAnalise":
      return e.rc ? { ...e, analiseVista: true } : e;
    case "aprovarRc":
      return e.rc && !e.rcAprovada ? { ...e, analiseVista: true, rcAprovada: true } : e;
    case "alternarConvite": {
      if (!e.rc || !e.rcAprovada || e.convitesEnviados) return e;
      if (!itemDoCatalogo(e.rc.item)?.fornecedores.some((f) => f.id === a.fornecedor)) return e;
      const dentro = e.convidados.includes(a.fornecedor);
      return { ...e, convidados: dentro ? e.convidados.filter((f) => f !== a.fornecedor) : [...e.convidados, a.fornecedor] };
    }
    case "convidarTodos":
      return e.rc && e.rcAprovada && !e.convitesEnviados ? { ...e, convidados: itemDoCatalogo(e.rc.item)!.fornecedores.map((f) => f.id) } : e;
    case "enviarConvites":
      return e.rcAprovada && !e.convitesEnviados && e.convidados.length >= 2 ? { ...e, convitesEnviados: true } : e;
    case "gerarMapa":
      return e.convitesEnviados && !e.mapaGerado ? { ...e, mapaGerado: true } : e;
    case "novaRodada":
      return e.mapaGerado && e.rodada === 1 && !e.selecaoEnviada ? { ...e, rodada: 2 } : e;
    case "escolherVencedor":
      return e.mapaGerado && !e.selecaoEnviada && propostas(e).some((p) => p.fornecedor === a.fornecedor) ? { ...e, vencedor: a.fornecedor } : e;
    case "concluirSelecao":
      return e.mapaGerado && e.vencedor && !e.selecaoEnviada ? { ...e, selecaoEnviada: true } : e;
    case "aprovarSelecao":
      return e.selecaoEnviada && !e.ocGerada ? { ...e, ocGerada: true } : e;
    case "reiniciar":
      return ESTADO_INICIAL;
  }
}

/** Valor estimado da RC: referência do catálogo × quantidade. */
export function estimadoCentavos(rc: Requisicao): number {
  return (itemDoCatalogo(rc.item)?.referenciaCentavos ?? 0) * rc.qtd;
}

export type Proposta = { fornecedor: string; nome: string; unitarioCentavos: number; totalCentavos: number; prazoDias: number; pagamento: string };

/** Quem foi convidado e não responde (a base tem um por categoria: é o que acontece na vida real). */
export function semResposta(e: Estado): string[] {
  if (!e.rc || !e.convitesEnviados) return [];
  const item = itemDoCatalogo(e.rc.item)!;
  return e.convidados.filter((id) => !item.fornecedores.find((f) => f.id === id)?.responde);
}

/**
 * As propostas da rodada em vigor, na ordem da base. Se NENHUM convidado
 * responderia (a pessoa convidou só dois e um deles é o que não responde,
 * sobra um), a comparação continua valendo com quem respondeu; se ninguém
 * responderia, o que não responde passa a responder, para a demo não travar.
 */
export function propostas(e: Estado): Proposta[] {
  if (!e.rc || !e.convitesEnviados) return [];
  const item = itemDoCatalogo(e.rc.item)!;
  const convidados = item.fornecedores.filter((f) => e.convidados.includes(f.id));
  const respondem = convidados.some((f) => f.responde) ? convidados.filter((f) => f.responde) : convidados;
  return respondem.map((f) => {
    const dados = nexoDemo.fornecedores.find((x) => x.id === f.id)!;
    const desconto = e.rodada === 2 ? (DESCONTO_RODADA_2[f.id] ?? 0) : 0;
    const unitarioCentavos = Math.round(item.referenciaCentavos * f.fator * (1 - desconto));
    return { fornecedor: f.id, nome: dados.nome, unitarioCentavos, totalCentavos: unitarioCentavos * e.rc!.qtd, prazoDias: f.prazoDias, pagamento: dados.pagamento };
  });
}

/** Menor preço e menor prazo (no empate, o primeiro da lista). */
export function melhores(ps: Proposta[]): { preco: Proposta; prazo: Proposta } | null {
  if (ps.length === 0) return null;
  return {
    preco: ps.reduce((m, p) => (p.unitarioCentavos < m.unitarioCentavos ? p : m)),
    prazo: ps.reduce((m, p) => (p.prazoDias < m.prazoDias ? p : m)),
  };
}

/** Economia do vencedor sobre o estimado, em centavos (negativa se ficou acima). */
export function economiaCentavos(e: Estado): number {
  const p = propostas(e).find((x) => x.fornecedor === e.vencedor);
  return e.rc && p ? estimadoCentavos(e.rc) - p.totalCentavos : 0;
}

export const reais = (centavos: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(centavos / 100);
export const porcento = (fracao: number) => new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(fracao);

/** Os riscos que a análise da MIA aponta para a RC. */
export function riscosDaRc(rc: Requisicao, hoje: Date): string[] {
  const t = nexoDemo.requisicoes.risco;
  const item = itemDoCatalogo(rc.item)!;
  const riscos: string[] = [t.concentracao];
  const dias = Math.round((new Date(`${rc.necessarioAte}T12:00:00`).getTime() - hoje.getTime()) / 86_400_000);
  const prazoMedio = item.fornecedores.reduce((s, f) => s + f.prazoDias, 0) / item.fornecedores.length;
  if (dias < prazoMedio) riscos.push(t.prazoCurto);
  if (estimadoCentavos(rc) > ALCADA_GESTOR_CENTAVOS) riscos.push(t.valorAlto);
  return riscos;
}

/** Os insights da MIA sobre o mapa, montados com os números das propostas. */
export function insights(e: Estado): { melhor: string[]; outliers: string[]; riscos: string[] } {
  const t = nexoDemo.insightsTextos;
  const ps = propostas(e);
  const m = melhores(ps);
  if (!e.rc || !m) return { melhor: [], outliers: [], riscos: [] };
  const item = itemDoCatalogo(e.rc.item)!;
  const melhor = [t.melhor(item.nome, m.preco.nome, reais(m.preco.unitarioCentavos))];
  melhor.push(m.prazo.fornecedor === m.preco.fornecedor ? t.prazoIgual(m.preco.nome, m.preco.prazoDias) : t.prazo(m.prazo.nome, m.prazo.prazoDias, reais(m.prazo.totalCentavos - m.preco.totalCentavos)));
  const fora = ps.filter((p) => p.unitarioCentavos > m.preco.unitarioCentavos * 1.08);
  const outliers = fora.length > 0 ? fora.map((p) => t.outlier(p.nome, porcento(p.unitarioCentavos / m.preco.unitarioCentavos - 1))) : [t.semOutlier];
  const riscos = semResposta(e)
    .filter((id) => !ps.some((p) => p.fornecedor === id))
    .map((id) => t.semResposta(nexoDemo.fornecedores.find((f) => f.id === id)!.nome));
  if (ps.length < 2) riscos.push(t.poucas);
  if (e.rodada === 1) riscos.push(t.rodada);
  else {
    const antes = melhores(propostas({ ...e, rodada: 1 }))!.preco.unitarioCentavos;
    riscos.push(t.rodada2(porcento(1 - m.preco.unitarioCentavos / antes)));
  }
  return { melhor, outliers, riscos };
}

/**
 * Fases do guia, em ordem. O índice da fase é o que vai ao servidor como
 * "passo alcançado" do lead (lib/nexo-demo/leads.ts): mexeu na ordem ou no
 * tamanho, mexa em `PASSOS` junto (o teste confere).
 */
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

/** Estado guardado no navegador: só aceita o que tem o formato certo (versão antiga ou adulterada volta ao início). */
export function estadoGuardado(v: unknown): Estado {
  if (!v || typeof v !== "object") return ESTADO_INICIAL;
  const e = v as Estado;
  const rc = e.rc && faltasDaRc(e.rc).length === 0 ? e.rc : null;
  if (!rc) return ESTADO_INICIAL;
  const ids = itemDoCatalogo(rc.item)!.fornecedores.map((f) => f.id);
  const convidados = Array.isArray(e.convidados) ? e.convidados.filter((f) => ids.includes(f)) : [];
  const rcAprovada = e.rcAprovada === true;
  const convitesEnviados = rcAprovada && e.convitesEnviados === true && convidados.length >= 2;
  const mapaGerado = convitesEnviados && e.mapaGerado === true;
  const base: Estado = { ...ESTADO_INICIAL, rc, analiseVista: e.analiseVista === true || rcAprovada, rcAprovada, convidados, convitesEnviados, mapaGerado, rodada: mapaGerado && e.rodada === 2 ? 2 : 1 };
  const vencedor = mapaGerado && propostas(base).some((p) => p.fornecedor === e.vencedor) ? e.vencedor : null;
  const selecaoEnviada = Boolean(vencedor) && e.selecaoEnviada === true;
  return { ...base, vencedor, selecaoEnviada, ocGerada: selecaoEnviada && e.ocGerada === true };
}
