import { site } from "@/lib/content";

/**
 * Normalização de rota para o contador de visitas do site.
 *
 * A regra existe por CARDINALIDADE: page_views tem PK (dia, rota), então o que
 * entra aqui define quantas linhas o banco ganha por dia. Só as seções
 * conhecidas do site viram rota própria; qualquer outro caminho público cai no
 * balde "/outras". Admin e API nunca são contados — o beacon já pula, mas o
 * normalizador é a garantia no servidor (defesa em profundidade: o endpoint é
 * público e qualquer um pode fazer POST).
 *
 * ARTIGOS SÃO A EXCEÇÃO, e ela é deliberada (2026-08-31): cada artigo
 * publicado vira rota própria, porque saber QUAL texto traz tráfego é o que
 * decide a próxima pauta — agregado em "/artigos" isso ficaria invisível, e
 * dentro de "/outras" (onde estava) pior ainda.
 *
 * O preço é a cardinalidade, e por isso a lista de slugs é INJETADA pelo
 * chamador em vez de aceita do visitante: sem essa validação, um POST forjado
 * com "/artigos/qualquer-coisa" criaria uma linha nova por chute, e o endpoint
 * é público. Slug desconhecido cai em "/outras" como qualquer caminho estranho.
 */
export const ROTAS_RASTREADAS = ["/", "/nexo", "/academy", "/cursos", "/spend-lab", "/artigos", "/privacidade"] as const;

export const ROTA_OUTRAS = "/outras";

export function normalizarRota(bruta: unknown, slugsDeArtigo: readonly string[] = []): string | null {
  if (typeof bruta !== "string" || bruta.length === 0 || bruta.length > 200) return null;
  if (!bruta.startsWith("/")) return null;

  const semSufixo = bruta.split(/[?#]/, 1)[0];
  const partes = semSufixo.split("/");
  const primeiroSegmento = "/" + (partes[1] ?? "");

  /* /preview não conta: é página em construção, e quem a visita é quem a
     está aprovando — não é tráfego. */
  if (["/app", "/admin", "/api", "/preview"].includes(primeiroSegmento)) return null;

  /* Artigo publicado vira rota própria; qualquer outro slug sob /artigos cai em
     "/outras". A checagem vem ANTES da lista de seções porque "/artigos"
     sozinho (o índice) também é rota válida e precisa continuar sendo. */
  if (primeiroSegmento === "/artigos") {
    const slug = partes[2] ?? "";
    if (!slug) return "/artigos";
    return slugsDeArtigo.includes(slug) ? `/artigos/${slug}` : ROTA_OUTRAS;
  }

  if ((ROTAS_RASTREADAS as readonly string[]).includes(primeiroSegmento)) return primeiroSegmento;
  return ROTA_OUTRAS;
}

/**
 * De ONDE a visita entrou — o balde, nunca a URL.
 *
 * O beacon manda só o HOSTNAME do `document.referrer`: sem caminho e sem
 * querystring, então nada que possa carregar dado pessoal (um termo de busca,
 * um id de campanha, um token colado num link) sai do navegador. O que esta
 * função faz com o hostname é reduzi-lo a um dos baldes abaixo, e é o balde
 * que vai para o banco.
 *
 * A LISTA É FECHADA, pela mesma razão que a de rotas: o endpoint é público, e
 * o que ele aceita define quantas linhas a tabela ganha por dia. Hostname que
 * não reconhecemos vira "indicacao" — nunca uma linha nova.
 *
 * ORDEM IMPORTA. Assistente de IA é checado ANTES de busca porque
 * `gemini.google.com` termina em `google.com` e cairia em "busca", apagando
 * exatamente o número que este site tem motivo para querer ver: se o trabalho
 * de prontidão para agentes (llms.txt, markdown negociado) traz alguém.
 */
export const ORIGENS = ["direto", "busca", "ia", "social", "indicacao", "site"] as const;
export type Origem = (typeof ORIGENS)[number];

/** Histórico: linhas gravadas antes de a origem existir (2026-09-09). Não é um
 *  balde que o normalizador devolve — é o que o painel mostra para o passado. */
export const ORIGEM_DESCONHECIDA = "desconhecida";

const IA = [
  "chatgpt.com", "chat.openai.com", "openai.com", "claude.ai", "perplexity.ai",
  "gemini.google.com", "copilot.microsoft.com", "you.com", "poe.com",
];

const BUSCA = [
  "bing.com", "duckduckgo.com", "search.yahoo.com", "yahoo.com", "ecosia.org",
  "search.brave.com", "yandex.com", "yandex.ru", "baidu.com", "qwant.com", "startpage.com",
];

const SOCIAL = [
  "linkedin.com", "lnkd.in", "instagram.com", "facebook.com", "fb.com", "x.com",
  "twitter.com", "t.co", "youtube.com", "youtu.be", "whatsapp.com", "wl.co",
  "t.me", "telegram.org", "tiktok.com", "reddit.com",
];

/* google.com, google.com.br, google.co.uk, news.google.com — todos busca. */
const GOOGLE = /^(?:.+\.)?google(?:\.[a-z]{2,3}){1,2}$/;

/** O próprio site: navegação com recarga de página cheia. Não é indicação de
 *  terceiro, e misturar as duas estragaria o número que importa. */
const PROPRIO = [new URL(site.url).hostname, "localhost", "127.0.0.1"];

function casa(host: string, dominios: readonly string[]): boolean {
  return dominios.some((d) => host === d || host.endsWith(`.${d}`));
}

export function normalizarOrigem(bruto: unknown): Origem {
  if (typeof bruto !== "string" || bruto.length === 0) return "direto";

  const host = bruto.trim().toLowerCase().replace(/^www\./, "");
  if (host.length === 0) return "direto";
  /* Hostname malformado é POST forjado ou navegador exótico: cai no balde
     genérico, nunca cria linha. */
  if (host.length > 253 || !/^[a-z0-9.-]+$/.test(host)) return "indicacao";

  if (casa(host, PROPRIO)) return "site";
  if (casa(host, IA)) return "ia";
  if (casa(host, SOCIAL)) return "social";
  if (casa(host, BUSCA) || GOOGLE.test(host)) return "busca";
  return "indicacao";
}
