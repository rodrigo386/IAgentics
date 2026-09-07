import "server-only";
import TurndownService from "turndown";
import { artigoPorSlug, corpoMarkdown } from "@/lib/artigos";
import { site } from "@/lib/content";

/**
 * Markdown para agentes: a mesma página, em texto, quando o cliente pede
 * `Accept: text/markdown` (negociação de conteúdo, RFC 9110 §12).
 *
 * DUAS FONTES, e a escolha entre elas é o ponto deste módulo:
 *
 *  - ARTIGO → o `.md` original de content/artigos/. O texto nasceu markdown;
 *    converter o HTML dele de volta seria perder na ida e na volta o que já
 *    temos em mãos.
 *  - RESTO → conversão do HTML renderizado. A alternativa seria escrever um
 *    markdown por página à mão, e isso é exatamente a armadilha que o
 *    /llms.txt caiu: um segundo lugar para descrever o site, que diverge no
 *    primeiro deploy em que alguém esquece dele. Convertendo o HTML, a fonte
 *    continua sendo uma só.
 *
 * O que entra na conversão é o `<main>`, não a página inteira: nav, rodapé e
 * o seletor de tema repetidos em todo documento são ruído puro para quem lê
 * por token.
 */

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "*",
});

/* SVG fora: o grafo do orquestrador e os ícones viram centenas de linhas de
   path que não dizem nada em texto. O `aria-label` deles já descreve o
   conteúdo, e a regra abaixo o preserva como uma linha. */
turndown.addRule("svg", {
  filter: (node) => node.nodeName.toLowerCase() === "svg",
  replacement: (_conteudo, node) => {
    const rotulo = (node as Element).getAttribute?.("aria-label");
    return rotulo ? `\n\n![${rotulo}](#)\n\n` : "";
  },
});

/* Decorativo é decorativo: o que a página esconde do leitor de tela não tem
   por que aparecer para o agente. */
turndown.addRule("ariaHidden", {
  filter: (node) => (node as Element).getAttribute?.("aria-hidden") === "true",
  replacement: () => "",
});

/* Títulos quebrados em <span> por causa da máscara de animação (a manchete da
   hero e as das seções novas) chegam colados em turndown: "para" + "Compras"
   vira "paraCompras". A regra devolve o espaço que o layout tinha em bloco. */
turndown.addRule("spanEmBloco", {
  filter: (node) => {
    const el = node as Element;
    if (el.nodeName.toLowerCase() !== "span") return false;
    return (el.getAttribute?.("class") ?? "").split(/\s+/).includes("block");
  },
  replacement: (conteudo) => (conteudo.trim() ? `${conteudo.trim()} ` : ""),
});

/** O miolo da página. Sem `<main>` (erro, 404), devolve null. */
function extrairMain(html: string): string | null {
  const m = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  return m ? m[1] : null;
}

/** O `<title>`, para o markdown abrir com um H1 mesmo quando o `<main>` não tem. */
function extrairTitulo(html: string): string {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/&amp;/g, "&").replace(/\s+/g, " ").trim() : site.name;
}

/**
 * Estimativa de tokens para o header `x-markdown-tokens`.
 *
 * É ESTIMATIVA, e o nome do header não deixa isso claro — então fica claro
 * aqui: contar de verdade exigiria embarcar o tokenizador do modelo que vai
 * ler, e cada modelo tem o seu. A razão ~4 caracteres por token vale para
 * inglês; português acentuado gasta mais, e 3,7 aproxima melhor o que os
 * tokenizadores BPE fazem com "ç", "ã" e palavras longas. Serve para o agente
 * decidir se busca a página, não para faturar nada.
 */
export function estimarTokens(texto: string): number {
  return Math.max(1, Math.round(texto.length / 3.7));
}

/** Cabeçalho do documento: de onde veio e quando. */
function moldura(titulo: string, url: string, corpo: string): string {
  return `# ${titulo}\n\n> ${url}\n\n${corpo.trim()}\n`;
}

/**
 * O markdown de uma rota. `buscarHtml` é injetado pelo chamador (a rota da
 * API faz fetch da própria origem) para este módulo continuar puro e testável
 * sem rede.
 */
export async function markdownDaRota(
  rota: string,
  buscarHtml: (rota: string) => Promise<string | null>,
): Promise<string | null> {
  const url = `${site.url}${rota === "/" ? "" : rota}`;

  // Artigo: o arquivo original, que já é markdown.
  const slug = rota.match(/^\/artigos\/([^/]+)\/?$/)?.[1];
  if (slug) {
    const artigo = artigoPorSlug(slug);
    const corpo = corpoMarkdown(slug);
    if (!artigo || !corpo) return null;
    return moldura(artigo.titulo, url, `*${artigo.descricao}*\n\n${corpo}`);
  }

  const html = await buscarHtml(rota);
  if (!html) return null;
  const main = extrairMain(html);
  if (!main) return null;

  const corpo = turndown
    .turndown(main)
    /* Turndown deixa cadeias de linhas em branco onde havia seções vazias e
       elementos removidos; três ou mais viram duas. */
    .replace(/\n{3,}/g, "\n\n");

  return moldura(extrairTitulo(html), url, corpo);
}
