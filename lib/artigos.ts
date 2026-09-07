import "server-only";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import MarkdownIt from "markdown-it";

/**
 * Os artigos, lidos de `content/artigos/*.md` no build.
 *
 * Por que arquivo e não banco: decisão do Rodrigo em 2026-08-20 — ele escreve
 * pelo repositório, não por editor no /admin. Isso torna o artigo versionado
 * no git de graça (histórico, diff, revisão em PR) e o corpo do texto fica
 * fora do banco, que não precisa saber que artigo existe.
 *
 * Markdown puro, não MDX. Os artigos são prosa com tabela e link — nenhum
 * precisa de componente React dentro. Trocar por MDX custaria toolchain no
 * build (e o build deste projeto já tem armadilha demais) sem ganhar nada.
 *
 * `server-only` porque isto usa `node:fs`: se um componente de cliente
 * importar por engano, o erro aparece no build e não em produção.
 */

const DIRETORIO = join(process.cwd(), "content", "artigos");

/**
 * Só entra no site o que estiver marcado `publicado`. Todo artigo nasce
 * `rascunho` — assim um texto em revisão pode viver no repositório sem risco
 * de vazar para o ar por descuido. Publicar é trocar uma palavra.
 */
const STATUS_PUBLICADO = "publicado";

export type Artigo = {
  slug: string;
  titulo: string;
  descricao: string;
  data: string;
  autor: string;
  categoria: string;
  /** O corpo já renderizado em HTML. Confiável: vem de arquivo commitado. */
  html: string;
  /** Minutos de leitura, arredondado para cima, mínimo 1. */
  leitura: number;
  /** Desempate editorial entre artigos da MESMA data. Menor vem primeiro. */
  ordem: number;
};

/** Artigo sem `ordem` no frontmatter cai depois dos que têm. */
const ORDEM_PADRAO = 999;

/* `html: true` é seguro AQUI e só aqui: o markdown vem de arquivo no
   repositório, escrito e revisado por nós, não de campo de formulário. Se um
   dia artigo passar a vir do banco (texto digitado no admin), este flag vira
   um buraco de XSS e precisa ser desligado junto com a mudança. */
const md = new MarkdownIt({ html: true, linkify: true, typographer: false });

/* Tabela sai embrulhada num contêiner que rola sozinho no horizontal. Sem
   isto, uma tabela larga empurra o BODY inteiro para o lado no celular — o
   checklist do DESIGN.md §9 proíbe overflow horizontal na página, e a regra
   geral é que conteúdo largo rola dentro do próprio contêiner. Feito no
   renderer porque markdown não tem como declarar um wrapper. */
md.renderer.rules.table_open = () => '<div class="artigo-tabela"><table>';
md.renderer.rules.table_close = () => "</table></div>";

/** Markdown → HTML. Exportado para o teste conseguir exercer a renderização
 *  sem depender de existir artigo publicado no repositório. */
export function renderizarMarkdown(markdown: string): string {
  return md.render(markdown);
}

/** ~200 palavras por minuto: média de leitura de texto técnico em pt-BR. */
function minutosDeLeitura(texto: string): number {
  return Math.max(1, Math.ceil(texto.trim().split(/\s+/).length / 200));
}

function ler(arquivo: string): Artigo | null {
  const bruto = readFileSync(join(DIRETORIO, arquivo), "utf8");
  const { data, content } = matter(bruto);

  if (data.status !== STATUS_PUBLICADO) return null;

  /* Frontmatter incompleto é erro de quem escreveu, e tem que quebrar o build
     em vez de publicar página sem título ou sem description (que o Google
     penaliza em silêncio). */
  for (const campo of ["titulo", "descricao", "slug", "data", "autor", "categoria"]) {
    if (!data[campo]) {
      throw new Error(`content/artigos/${arquivo}: falta "${campo}" no frontmatter.`);
    }
  }

  return {
    slug: String(data.slug),
    titulo: String(data.titulo),
    descricao: String(data.descricao),
    /* `data` do YAML vira Date quando não tem aspas; normaliza para ISO curto. */
    data: data.data instanceof Date ? data.data.toISOString().slice(0, 10) : String(data.data),
    autor: String(data.autor),
    categoria: String(data.categoria),
    html: md.render(content),
    leitura: minutosDeLeitura(content),
    ordem: Number(data.ordem ?? ORDEM_PADRAO),
  };
}

/** Todos os artigos publicados, do mais recente para o mais antigo. */
export function todosOsArtigos(): Artigo[] {
  let arquivos: string[];
  try {
    arquivos = readdirSync(DIRETORIO).filter((n) => n.endsWith(".md") && n !== "README.md");
  } catch {
    /* Pasta ausente não é erro: significa que ninguém escreveu artigo ainda. */
    return [];
  }

  return arquivos
    .map(ler)
    .filter((a): a is Artigo => a !== null)
    /* Data primeiro, mais recente no topo. `ordem` só desempata dentro do
       mesmo dia — que é o caso quando vários artigos vão ao ar juntos, e aí a
       sequência de leitura é decisão editorial, não cronológica. */
    .sort((a, b) => b.data.localeCompare(a.data) || a.ordem - b.ordem);
}

/**
 * O corpo do artigo em MARKDOWN, como foi escrito — sem frontmatter e sem
 * passar pelo renderizador.
 *
 * Existe para a negociação de conteúdo (lib/markdown-agentes.ts): quando um
 * agente pede `text/markdown`, servir o arquivo original é melhor que
 * converter de volta o HTML que saiu dele. Devolve null para rascunho ou slug
 * inexistente, pela mesma porta que o resto do módulo: `status: publicado` é
 * o portão, e ele não pode ter uma saída lateral.
 */
export function corpoMarkdown(slug: string): string | null {
  if (!todosOsArtigos().some((a) => a.slug === slug)) return null;
  try {
    return matter(readFileSync(join(DIRETORIO, `${slug}.md`), "utf8")).content.trim();
  } catch {
    return null;
  }
}

/** Só os slugs publicados. É a lista branca que o contador de visitas usa para
 *  aceitar "/artigos/<slug>" como rota própria sem deixar um POST forjado
 *  inventar linhas novas em page_views (ver lib/estatisticas.ts). */
export function slugsPublicados(): string[] {
  return todosOsArtigos().map((a) => a.slug);
}

export function artigoPorSlug(slug: string): Artigo | undefined {
  return todosOsArtigos().find((a) => a.slug === slug);
}

/** A data em pt-BR por extenso, para exibição. */
export function dataPorExtenso(iso: string): string {
  const [ano, mes, dia] = iso.split("-").map(Number);
  /* Date com UTC explícito: `new Date("2026-08-20")` é meia-noite UTC, que em
     GMT-3 volta um dia — o artigo apareceria com a data de ontem. */
  return new Date(Date.UTC(ano, mes - 1, dia)).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
