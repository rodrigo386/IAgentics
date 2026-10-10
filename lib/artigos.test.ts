import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { describe, it, expect } from "vitest";
import { todosOsArtigos, artigoPorSlug, dataPorExtenso, renderizarMarkdown } from "@/lib/artigos";
import { IDS_EXPLICADORES, MARCADOR_EXPLICADOR } from "@/lib/explicadores";
import { artigos as textosArtigos } from "@/lib/content";

const DIRETORIO = join(process.cwd(), "content", "artigos");

const arquivos = readdirSync(DIRETORIO).filter((n) => n.endsWith(".md") && n !== "README.md");

function frontmatter(arquivo: string) {
  return matter(readFileSync(join(DIRETORIO, arquivo), "utf8")).data;
}

/**
 * Estes testes valem para RASCUNHO TAMBÉM, e é esse o ponto.
 *
 * O build só valida o frontmatter de quem está `publicado` — um rascunho pela
 * metade não pode derrubar o deploy. Mas erro de frontmatter descoberto no
 * momento da publicação é erro descoberto tarde: o texto está pronto, a
 * decisão foi tomada, e aí o build quebra. Aqui o aviso chega antes.
 */
describe("frontmatter de todos os artigos (inclusive rascunhos)", () => {
  it("existe pelo menos um arquivo de artigo", () => {
    expect(arquivos.length).toBeGreaterThan(0);
  });

  it.each(arquivos)("%s tem todos os campos obrigatórios", (arquivo) => {
    const dados = frontmatter(arquivo);
    for (const campo of ["titulo", "descricao", "slug", "data", "autor", "categoria", "status"]) {
      expect(dados[campo], `falta "${campo}"`).toBeTruthy();
    }
  });

  it.each(arquivos)("%s tem slug em formato de URL", (arquivo) => {
    const slug = String(frontmatter(arquivo).slug);
    /* Minúsculas, dígitos e hífen. Acento e maiúscula em URL viram
       percent-encoding, que aparece feio em compartilhamento e quebra a
       correspondência com o que o autor escreveu. */
    expect(slug).toMatch(/^[a-z0-9-]+$/);
  });

  it.each(arquivos)("%s tem o slug igual ao nome do arquivo", (arquivo) => {
    /* Sem esta regra, achar o arquivo por trás de uma URL vira caça ao
       tesouro numa pasta com trinta textos. */
    expect(`${frontmatter(arquivo).slug}.md`).toBe(arquivo);
  });

  it("não repete slug entre artigos", () => {
    const slugs = arquivos.map((a) => String(frontmatter(a).slug));
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  /* A listagem agrupa pelas quatro categorias (2026-10-09). Categoria fora da
     lista some da /artigos em silêncio — o teste avisa antes. */
  it.each(arquivos)("%s usa uma das categorias da listagem", (arquivo) => {
    expect(textosArtigos.categorias).toContain(String(frontmatter(arquivo).categoria));
  });

  /* Agendamento (2026-10-09): "agendado" só com data, e só sem [VALIDAR]. */
  it.each(arquivos)("%s, se agendado, tem publicarEm e nenhum [VALIDAR]", (arquivo) => {
    const { data, content } = matter(readFileSync(join(DIRETORIO, arquivo), "utf8"));
    expect(["publicado", "rascunho", "agendado"]).toContain(data.status);
    if (data.status !== "agendado") return;
    const quando = data.publicarEm instanceof Date ? data.publicarEm.toISOString().slice(0, 10) : String(data.publicarEm);
    expect(quando).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(content).not.toContain("[VALIDAR]");
  });

  /* Título de busca (2026-10-09): até 60 caracteres, terminando na marca. */
  it.each(arquivos)("%s tem tituloSeo válido, se tiver", (arquivo) => {
    const t = frontmatter(arquivo).tituloSeo;
    if (t === undefined) return;
    expect(String(t).length).toBeLessThanOrEqual(60);
    expect(String(t)).toMatch(/\| IAgentics$/);
  });

  /* FAQ e marcador andam juntos: FAQ sem `<!-- faq -->` não aparece na página
     (e o FAQPage prometeria o que a tela não mostra); marcador sem FAQ vira
     buraco. */
  it.each(arquivos)("%s tem FAQ e marcador juntos, ou nenhum dos dois", (arquivo) => {
    const { data, content } = matter(readFileSync(join(DIRETORIO, arquivo), "utf8"));
    const temFaq = Array.isArray(data.faq) && data.faq.length > 0;
    expect(/<!--\s*faq\s*-->/.test(content)).toBe(temFaq);
    if (temFaq) for (const f of data.faq) expect(f.pergunta && f.resposta).toBeTruthy();
  });

  it.each(arquivos)("%s tem descrição em tamanho útil para busca", (arquivo) => {
    /* A description é o que o Google mostra abaixo do título. Curta demais
       desperdiça o espaço; longa demais é cortada no meio da frase. */
    const descricao = String(frontmatter(arquivo).descricao);
    expect(descricao.length).toBeGreaterThanOrEqual(70);
    expect(descricao.length).toBeLessThanOrEqual(200);
  });
});

/* Explicação animada chamada por `<!-- explicador:id -->` (2026-10-07): um id
   sem componente não quebra a página — ela simplesmente pula o marcador —, e
   é por isso que o teste existe: o buraco no meio do texto seria silencioso. */
describe("explicadores nos artigos", () => {
  it.each(arquivos)("%s só chama explicadores que existem", (arquivo) => {
    const corpo = matter(readFileSync(join(DIRETORIO, arquivo), "utf8")).content;
    const ids = [...corpo.matchAll(new RegExp(MARCADOR_EXPLICADOR.source, "g"))].map((m) => m[1]);
    for (const id of ids) expect(IDS_EXPLICADORES).toContain(id);
  });

  it("o marcador atravessa o markdown como comentário, sem virar texto", () => {
    const html = renderizarMarkdown("Antes.\n\n<!-- explicador:mapa-de-cotacao -->\n\nDepois.");
    expect(html).toMatch(MARCADOR_EXPLICADOR);
    expect(html).not.toContain("<p><!--");
  });
});

describe("publicação", () => {
  it("só devolve artigos marcados publicado", () => {
    const publicadosNoDisco = arquivos.filter((a) => frontmatter(a).status === "publicado");
    expect(todosOsArtigos()).toHaveLength(publicadosNoDisco.length);
  });

  it("devolve os campos que a página precisa, todos preenchidos", () => {
    for (const artigo of todosOsArtigos()) {
      expect(artigo.slug).toBeTruthy();
      expect(artigo.titulo).toBeTruthy();
      expect(artigo.descricao).toBeTruthy();
      expect(artigo.data).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(artigo.autor).toBeTruthy();
      expect(artigo.categoria).toBeTruthy();
      expect(artigo.html).toBeTruthy();
      expect(artigo.leitura).toBeGreaterThan(0);
    }
  });

  it("ordena do mais recente para o mais antigo", () => {
    const datas = todosOsArtigos().map((a) => a.data);
    expect([...datas]).toEqual([...datas].sort((a, b) => b.localeCompare(a)));
  });

  it("desempata por `ordem` dentro da mesma data", () => {
    /* Vários artigos indo ao ar no mesmo dia é o caso real da primeira
       publicação — e aí a sequência de leitura é decisão editorial, não
       cronológica. Sem o desempate, a ordem viria do sistema de arquivos. */
    const lista = todosOsArtigos();
    for (let i = 1; i < lista.length; i++) {
      if (lista[i].data === lista[i - 1].data) {
        expect(lista[i].ordem).toBeGreaterThanOrEqual(lista[i - 1].ordem);
      }
    }
  });

  it("não repete `ordem` entre artigos da mesma data", () => {
    const porData = new Map<string, number[]>();
    for (const a of todosOsArtigos()) {
      porData.set(a.data, [...(porData.get(a.data) ?? []), a.ordem]);
    }
    for (const [data, ordens] of porData) {
      expect(new Set(ordens).size, `ordem repetida em ${data}`).toBe(ordens.length);
    }
  });

  it("não encontra artigo por slug inexistente", () => {
    expect(artigoPorSlug("slug-que-nao-existe")).toBeUndefined();
  });

  it("não encontra rascunho por slug", () => {
    const rascunho = arquivos.find((a) => frontmatter(a).status !== "publicado");
    if (!rascunho) return;
    /* A página usa `dynamicParams = false`, então isto vira 404 — mas a
       garantia começa aqui: rascunho não é alcançável por URL adivinhada. */
    expect(artigoPorSlug(String(frontmatter(rascunho).slug))).toBeUndefined();
  });
});

describe("data por extenso", () => {
  it("escreve em pt-BR", () => {
    expect(dataPorExtenso("2026-08-20")).toBe("20 de agosto de 2026");
  });

  it("não volta um dia no fuso do Brasil", () => {
    /* `new Date("2026-01-01")` é meia-noite UTC; formatado em GMT-3 sem
       timeZone explícito, sai "31 de dezembro de 2025" — o artigo apareceria
       publicado no ano anterior. Esta asserção é o que protege o UTC do
       dataPorExtenso de ser "simplificado" por alguém depois. */
    expect(dataPorExtenso("2026-01-01")).toBe("1 de janeiro de 2026");
  });
});

describe("renderização de markdown", () => {
  it("embrulha tabela em contêiner que rola sozinho", () => {
    /* Sem o wrapper, tabela larga empurra a página inteira no celular. */
    const html = renderizarMarkdown("| a | b |\n|---|---|\n| 1 | 2 |");
    expect(html).toContain('<div class="artigo-tabela"><table>');
    expect(html).toContain("</table></div>");
  });

  it("renderiza citação, título e ênfase", () => {
    const html = renderizarMarkdown('## Título\n\n> "Uma fala."\n\nTexto com **peso**.');
    expect(html).toContain("<h2>");
    expect(html).toContain("<blockquote>");
    expect(html).toContain("<strong>");
  });

  it("mantém link relativo intacto", () => {
    /* Os artigos linkam /nexo, /spend-lab e /cursos — se o parser mexesse no
       href, o link interno viraria externo ou quebrado. */
    expect(renderizarMarkdown("[Nexo](/nexo)")).toContain('href="/nexo"');
  });
});
