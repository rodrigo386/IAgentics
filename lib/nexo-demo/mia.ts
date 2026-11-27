import { ALCADAS, FORNECEDORES, SALA, SEMENTES, SPEND } from "./dados";
import { nexoDemo } from "./textos";
import { codigoRc, classificar, economiaCentavos, faseDe, itemDoCatalogo, milhoes, reais, semAcento, type Estado, type LinhaForm, type Tela } from "./regras";

/**
 * A MIA do Nexo Demo (2026-11-27): responde POR REGRAS, no navegador, sobre
 * os dados fictícios da demonstração. Não há modelo de IA por trás e nada do
 * que a pessoa digita sai da máquina dela (decisão para a prévia: previsível
 * e sem custo por uso). Reconhece os comandos com "/" e as mesmas intenções
 * escritas com palavras comuns.
 */
export type Bloco = "ajuda" | "grafico" | "rcs" | "cotacoes" | "fornecedores" | "alcada";
export type RespostaMia = { texto: string; bloco?: Bloco; ir?: Tela; preencher?: LinhaForm[] | "padrao" };

const t = nexoDemo.mia;

const TELAS: [string[], Tela][] = [
  [["cotac", "rfq", "negociac"], "cotacoes"],
  [["minhas aprov", "aprovac", "aprovar"], "aprovacoes"],
  [["minhas req", "minhas rc"], "minhas"],
  [["abrir rc", "nova req", "abrir"], "abrir"],
  [["requisic", "rcs"], "requisicoes"],
  [["spend", "gasto"], "spend"],
  [["sala", "dashboard", "visao geral", "comando"], "sala"],
  [["fornecedor", "base"], "fornecedores"],
  [["alcada"], "alcada"],
  [["inicio", "mia"], "mia"],
];

function abrir(texto: string, e: Estado): RespostaMia {
  if (e.rc) return { texto: t.r.jaAberta(codigoRc()) };
  const pedido = semAcento(texto)
    .replace(/^abrir\b/, "")
    .replace(/\b(quero|preciso|comprar|solicitar|uma|um|de|requisicao|compra|rc|para|abrir)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const qtd = Number(pedido.match(/\b\d{1,4}\b/)?.[0] ?? 1) || 1;
  const descricao = pedido.replace(/\b\d{1,4}\b/, "").trim();
  if (descricao.length < 3) return { texto: t.r.abrirPadrao, ir: "abrir", preencher: "padrao" };
  const c = classificar(descricao);
  if ("motivo" in c) return { texto: t.r.abrirFora(descricao), ir: "abrir", preencher: [{ texto: "", qtd }] };
  const item = itemDoCatalogo(c.item)!;
  return { texto: t.r.abrirCom(qtd, item.nome), ir: "abrir", preencher: [{ texto: item.nome, qtd }] };
}

function status(e: Estado): RespostaMia {
  if (!e.rc) return { texto: t.r.statusSem };
  const g = nexoDemo.guia.fases[faseDe(e)];
  return { texto: t.r.status(codigoRc(), g.papel, g.texto), bloco: "rcs" };
}

function saving(e: Estado): RespostaMia {
  const seu = economiaCentavos(e);
  return { texto: t.r.saving(milhoes(SALA.savingAnoCentavos)) + (e.selecaoEnviada && seu > 0 ? t.r.savingSeu(reais(seu)) : "") };
}

function irPara(n: string): RespostaMia | null {
  const tela = TELAS.find(([chaves]) => chaves.some((k) => n.includes(k)))?.[1];
  return tela ? { texto: t.r.ir(t.telas[tela]), ir: tela } : null;
}

export function responder(entrada: string, e: Estado): RespostaMia {
  const n = semAcento(entrada);
  if (n === "") return { texto: t.r.ajuda, bloco: "ajuda" };
  const tem = (...ks: string[]) => ks.some((k) => n.includes(k));
  const comando = entrada.trim().startsWith("/") ? n.split(" ")[0] : null;
  const resto = comando ? n.slice(comando.length).trim() : n;

  if (comando === "ajuda" || (!comando && tem("ajuda", "o que voce faz", "o que voce sabe", "comandos"))) return { texto: t.r.ajuda, bloco: "ajuda" };
  if (comando === "ir" || (!comando && tem("leve", "ir para", "me leva", "abrir a tela", "abra a tela", "mostre a tela"))) return irPara(resto) ?? { texto: t.r.naoEntendi, bloco: "ajuda" };
  if (comando === "abrir" || (!comando && tem("abrir uma req", "abrir req", "nova req", "quero abrir", "preciso de", "preciso comprar", "quero comprar", "comprar ", "solicitar "))) return abrir(resto, e);
  if (comando === "status" || (!comando && tem("status", "andamento", "onde esta", "como esta"))) return status(e);
  if (comando === "rcs" || (!comando && tem("minhas rc", "rcs", "requisic"))) return e.rc ? { texto: t.r.rcs, bloco: "rcs" } : { texto: t.r.rcsVazio };
  if (comando === "cotacoes" || (!comando && tem("cotac", "rfq"))) {
    const criticas = SEMENTES.filter((s) => s.urgencia === "Crítica" && s.ate !== "oc").length;
    const abertas = SEMENTES.filter((s) => s.ate !== "oc").length + (e.rcAprovada && !e.ocGerada ? 1 : 0);
    return { texto: t.r.cotacoes(SEMENTES.length + (e.rcAprovada ? 1 : 0), abertas, criticas), bloco: "cotacoes" };
  }
  if (comando === "saving" || (!comando && tem("saving", "economia", "economiz"))) return saving(e);
  if (comando === "spend" || (!comando && tem("grafico", "gasto", "spend", "categoria"))) return { texto: t.r.grafico, bloco: "grafico" };
  if (comando === "fornecedores" || (!comando && tem("fornecedor"))) return { texto: t.r.fornecedores(FORNECEDORES.length, SPEND.fornecedoresAtivos), bloco: "fornecedores" };
  if (comando === "alcada" || (!comando && tem("alcada", "quem aprova"))) return { texto: t.r.alcada, bloco: "alcada" };
  if (!comando && /^(oi|ola|bom dia|boa tarde|boa noite|e ai)\b/.test(n)) return { texto: t.r.saudacao };
  /* Um item do catálogo escrito solto ("20 cadeiras") é um pedido de compra. */
  if (!comando && "item" in classificar(n.replace(/\b\d{1,4}\b/, "").trim())) return abrir(n, e);
  return { texto: t.r.naoEntendi, bloco: "ajuda" };
}

export const ALCADAS_DA_MIA = ALCADAS;
