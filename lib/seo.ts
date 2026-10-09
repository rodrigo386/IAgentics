import { site, contact, privacidade } from "@/lib/content";

/**
 * Dados estruturados (JSON-LD) e o inventário de rotas do sitemap.
 *
 * Tudo aqui é FUNÇÃO PURA e deriva de lib/content.ts ou do catálogo real do
 * banco - nada de copy nova escrita à mão. Dado estruturado que não bate com
 * o que a página mostra é penalizado pelo Google, então a única forma segura
 * é gerar a partir da mesma fonte que renderiza a página.
 */

/**
 * As rotas que entram no sitemap.
 *
 * Não confundir com ROTAS_RASTREADAS (lib/estatisticas.ts), que é o
 * inventário do contador de visitas e inclui /certificados.
 *
 * /certificados NÃO entra aqui de propósito: não existe página nesse
 * endereço (a rota é /certificados/[codigo]) e ele responde 404. Cada
 * certificado, por sua vez, é uma URL infinita com NOME DE ALUNO - fica fora
 * do índice por `robots: noindex` na própria página, e não por bloqueio no
 * robots.txt, senão o LinkedIn pararia de gerar a prévia ao compartilhar.
 */
export const ROTAS_SITEMAP = ["/", "/nexo", "/academy", "/cursos", "/spend-lab", "/privacidade"] as const;

/** Prioridade relativa dentro do site. A home lidera; /cursos vem logo atrás
 *  por ser a única página com conversão direta (assinatura). */
export const PRIORIDADE_SITEMAP: Record<string, number> = {
  "/": 1,
  "/cursos": 0.9,
  "/nexo": 0.8,
  "/academy": 0.8,
  "/spend-lab": 0.8,
  /* Baixa de propósito: é página de referência, não de entrada — mas precisa
     estar no índice, porque o Google já exibia essa URL (do site antigo, com
     404) e alguém procurando "iagentics privacidade" tem que achar a certa. */
  "/privacidade": 0.3,
  /* O índice de artigos NÃO está em ROTAS_SITEMAP: ele só entra no sitemap
     quando existe pelo menos um artigo publicado (ver app/sitemap.ts).
     Anunciar uma listagem vazia ao Google é pedir para ser rastreado à toa. */
  "/artigos": 0.7,
};

/** Prioridade de um artigo. Abaixo do índice e das páginas de produto: artigo
 *  atrai visita nova, mas a conversão mora nas páginas de sempre. */
export const PRIORIDADE_ARTIGO = 0.6;

function absoluta(caminho: string): string {
  return caminho === "/" ? site.url : `${site.url}${caminho}`;
}

/**
 * O bloco Open Graph de uma página.
 *
 * Existe porque `openGraph` NÃO é mesclado campo a campo pelo Next: se a
 * página declara o objeto, ele substitui o do layout inteiro. Sem isto, ou a
 * página perdia siteName/locale, ou herdava o `og:url` do layout - e aí toda
 * rota anunciava a home como seu endereço, fazendo LinkedIn e WhatsApp
 * atribuírem qualquer compartilhamento à página inicial.
 */
export function ogDaPagina(caminho: string, title: string, description: string) {
  return {
    title,
    description,
    url: absoluta(caminho),
    siteName: site.name,
    locale: "pt_BR",
    type: "website" as const,
  };
}

/**
 * O bloco Open Graph de um ARTIGO.
 *
 * Difere de `ogDaPagina` em duas coisas que importam para quem compartilha:
 * `type: "article"` (o LinkedIn usa isso para montar o cartão de publicação,
 * não o de site) e `publishedTime`, que é o que faz a data aparecer na prévia.
 */
/** A imagem de compartilhamento padrão do site (app/opengraph-image.tsx). Os
 *  artigos não tinham og:image (2026-10-09): o openGraph declarado na página
 *  não herdava a do layout. */
export const IMAGEM_OG = `${site.url}/opengraph-image`;

export function ogDoArtigo(caminho: string, title: string, description: string, dataISO: string, modificadoISO?: string) {
  return {
    title,
    description,
    url: absoluta(caminho),
    siteName: site.name,
    locale: "pt_BR",
    type: "article" as const,
    publishedTime: dataISO,
    modifiedTime: modificadoISO ?? dataISO,
    images: [{ url: IMAGEM_OG, width: 1200, height: 630 }],
  };
}

/**
 * Um artigo, para o Google e para os assistentes de IA.
 *
 * Recebe o artigo por parâmetro em vez de ler do disco porque este módulo é
 * puro de propósito — `lib/artigos.ts` importa `node:fs` e é `server-only`;
 * se seo.ts o importasse, qualquer componente de cliente que tocasse em
 * `ogDaPagina` arrastaria `fs` para o bundle.
 */
export function artigoJsonLd(artigo: {
  slug: string;
  titulo: string;
  descricao: string;
  data: string;
  atualizado: string;
  autor: string;
}) {
  const url = absoluta(`/artigos/${artigo.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: artigo.titulo,
    description: artigo.descricao,
    datePublished: artigo.data,
    /* Último commit no .md (lib/datas-git.ts), nunca antes da publicação. */
    dateModified: artigo.atualizado,
    image: IMAGEM_OG,
    /* Pessoa, não organização (Prompt 3 de SEO, 2026-10-09, decisão do
       Rodrigo: "Rodrigo Costa" em todos). Sem `url`: o LinkedIn pessoal dele
       não está no código — quando estiver, entra aqui. */
    author: { "@type": "Person", name: artigo.autor },
    publisher: {
      "@type": "Organization",
      name: site.name,
      url: site.url,
      logo: { "@type": "ImageObject", url: `${site.url}/iagentics-lockup.png` },
    },
    /* `mainEntityOfPage` é o que declara ao Google qual URL é a casa deste
       texto. Vale mais aqui que em qualquer outra página do site: os artigos
       são republicados adaptados no LinkedIn, que não suporta canonical —
       este campo é o nosso lado da conversa sobre qual versão é a original. */
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    inLanguage: "pt-BR",
  };
}

/** A trilha Início > Artigos > título, em todo artigo (2026-10-09). */
export function trilhaArtigoJsonLd(artigo: { slug: string; titulo: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: site.url },
      { "@type": "ListItem", position: 2, name: "Artigos", item: absoluta("/artigos") },
      { "@type": "ListItem", position: 3, name: artigo.titulo, item: absoluta(`/artigos/${artigo.slug}`) },
    ],
  };
}

/**
 * Cursos como lista de Course (Prompt 3 de SEO, 2026-10-09), SEMPRE a partir
 * do mesmo objeto que a página mostra — curso no JSON-LD que a página não
 * mostra é o caso que fez remover o antigo `cursosJsonLd` em 2026-08-28.
 * `horas` ("8 horas") vira duração ISO 8601 quando houver.
 */
export function cursosJsonLd(
  caminho: string,
  itens: ReadonlyArray<{ nome: string; descricao: string; horas?: string; formato?: string }>,
) {
  const provedor = { "@type": "Organization", name: site.name, sameAs: site.url };
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    url: absoluta(caminho),
    itemListElement: itens.map((c, i) => {
      const horas = c.horas?.match(/(\d+)\s*hora/)?.[1];
      return {
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Course",
          name: c.nome,
          description: c.descricao,
          provider: provedor,
          inLanguage: "pt-BR",
          url: absoluta(caminho),
          ...(c.formato || horas
            ? {
                hasCourseInstance: {
                  "@type": "CourseInstance",
                  ...(c.formato ? { courseMode: c.formato } : {}),
                  ...(horas ? { courseWorkload: `PT${horas}H` } : {}),
                },
              }
            : {}),
        },
      };
    }),
  };
}

/**
 * A listagem de artigos como coleção (Prompt 2 de SEO, 2026-10-09): o Google
 * rastreou a /artigos e não indexou, por ser só uma lista de links. Diz o que
 * a página é (CollectionPage) e quais artigos ela reúne, na ordem da tela.
 */
export function colecaoArtigosJsonLd(meta: { titulo: string; descricao: string }, lista: ReadonlyArray<{ slug: string; titulo: string }>) {
  const url = absoluta("/artigos");
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: meta.titulo,
    description: meta.descricao,
    url,
    inLanguage: "pt-BR",
    isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: lista.length,
      itemListElement: lista.map((a, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: absoluta(`/artigos/${a.slug}`),
        name: a.titulo,
      })),
    },
  };
}

/** A empresa, para o Knowledge Graph. `sameAs` são os perfis oficiais já
 *  publicados no rodapé - é o que amarra o site às contas sociais. */
export function organizacaoJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: site.url,
    logo: `${site.url}/iagentics-lockup.png`,
    description: site.description,
    slogan: site.tagline,
    /* Só perfis (LinkedIn, Instagram): o link do WhatsApp é canal de
       conversa, não identidade da empresa — vai no contactPoint. */
    sameAs: contact.social.filter((s) => !s.href.includes("wa.me")).map((s) => s.href),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: privacidade.contato.email,
      telephone: `+55 ${contact.whatsapp.numero}`,
      areaServed: "BR",
      availableLanguage: "pt-BR",
    },
  };
}

/**
 * As perguntas frequentes, no formato que o Google e os assistentes leem.
 *
 * O texto vem do MESMO objeto que a página renderiza (nexoPage.faq): dado
 * estruturado que promete uma resposta e mostra outra é penalizado, e aqui
 * não há como divergir.
 */
export function faqJsonLd(itens: ReadonlyArray<{ pergunta: string; resposta: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: itens.map((item) => ({
      "@type": "Question",
      name: item.pergunta,
      acceptedAnswer: { "@type": "Answer", text: item.resposta },
    })),
  };
}

/** A Academy como instituição de ensino, na /academy. */
export function academyJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: `${site.name} Academy`,
    url: absoluta("/academy"),
    parentOrganization: { "@type": "Organization", name: site.name, url: site.url },
  };
}
