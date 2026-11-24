import { ROTAS_EN, type Lingua, type RotaComIngles } from "@/lib/i18n";
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
export const ROTAS_SITEMAP = ["/", "/nexo", "/academy", "/cursos", "/spend-lab", "/diagnose-compras", "/reforma-tributaria-compras", "/consulta-ncm-cclasstrib", "/bolsas", "/privacidade"] as const;

/* `priority` e `changefreq` saíram do sitemap em 2026-11-24 (auditoria de
   SEO): o Google ignora os dois, e a conta de prioridade do inglês ainda
   gerava 0.6000000000000001. Fica só o `lastmod`, que ele usa. */

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
/**
 * Canonical e as versões de idioma de uma página que existe em português e em
 * inglês (2026-11-06). Cada versão é canônica de si mesma e aponta a outra
 * (hreflang); `x-default` é o português, a versão principal do site.
 */
export function alternatesDe(rotaPt: RotaComIngles, lingua: Lingua) {
  const en = ROTAS_EN[rotaPt];
  return {
    canonical: lingua === "en" ? en : rotaPt,
    languages: { "pt-BR": rotaPt, en, "x-default": rotaPt },
  };
}

export function ogDaPagina(caminho: string, title: string, description: string, lingua: Lingua = "pt") {
  return {
    title,
    description,
    url: absoluta(caminho),
    siteName: site.name,
    locale: lingua === "en" ? "en_US" : "pt_BR",
    type: "website" as const,
    /* Declarada aqui (2026-11-24): o openGraph da página substitui o do
       layout inteiro, e só a home ganhava a imagem pela convenção de arquivo. */
    images: [IMAGEM_OG_COMPLETA],
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
export const IMAGEM_OG_COMPLETA = { url: IMAGEM_OG, width: 1200, height: 630, alt: `${site.name} · ${site.tagline}` };

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

/** Uma trilha de navegação (BreadcrumbList) a partir da home. Os nomes são os
 *  do menu ou o título da página, os mesmos que a pessoa vê. */
export function trilhaJsonLd(passos: ReadonlyArray<{ nome: string; caminho: string }>, lingua: Lingua = "pt") {
  const inicio = { nome: lingua === "en" ? "Home" : "Início", caminho: lingua === "en" ? "/en" : "/" };
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [inicio, ...passos].map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.nome,
      item: absoluta(p.caminho),
    })),
  };
}

/** A trilha Início > página das páginas do menu (2026-11-24, auditoria de
 *  SEO): o nome é o rótulo do próprio menu (`nav.links`) no idioma da página. */
export function trilhaDaPagina(links: ReadonlyArray<{ label: string; href: string }>, caminho: string, lingua: Lingua) {
  const item = links.find((l) => l.href === caminho);
  if (!item) throw new Error(`Rota fora do menu: ${caminho}`);
  return trilhaJsonLd([{ nome: item.label, caminho }], lingua);
}

/** A trilha Início > Artigos > título, em todo artigo (2026-10-09). */
export function trilhaArtigoJsonLd(artigo: { slug: string; titulo: string }) {
  return trilhaJsonLd([
    { nome: "Artigos", caminho: "/artigos" },
    { nome: artigo.titulo, caminho: `/artigos/${artigo.slug}` },
  ]);
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
  /** Preço quando a página VENDE (a /cursos, por assinatura, desde 2026-10-14). */
  oferta?: { preco: string; categoria: string },
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
          ...(oferta
            ? { offers: { "@type": "Offer", price: oferta.preco, priceCurrency: "BRL", category: oferta.categoria, url: absoluta(caminho) } }
            : {}),
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

/** O identificador da empresa no grafo: as outras entidades (WebSite, o
 *  serviço do Nexo, a assinatura) apontam para ele em vez de repetir tudo. */
export const ORGANIZACAO_ID = `${site.url}/#organizacao`;

/** O site, na home (2026-11-24, auditoria de SEO). Sem SearchAction: o site
 *  não tem busca própria, e anunciar uma seria prometer o que não existe. */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${site.url}/#site`,
    name: site.name,
    url: site.url,
    description: site.description,
    inLanguage: ["pt-BR", "en"],
    publisher: { "@id": ORGANIZACAO_ID },
  };
}

/** As três soluções como serviços da IAgentics, na home (2026-11-24): nome,
 *  promessa e endereço do MESMO `solutions.items` que o palco da home mostra. */
export function solucoesJsonLd(itens: ReadonlyArray<{ name: string; promise: string; href: string }>, lingua: Lingua) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: lingua === "en" ? "IAgentics solutions" : "Soluções da IAgentics",
    itemListElement: itens.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Service",
        name: s.name,
        description: s.promise,
        url: absoluta(s.href),
        provider: { "@type": "Organization", "@id": ORGANIZACAO_ID, name: site.name, url: site.url },
        areaServed: { "@type": "Country", name: "Brasil" },
      },
    })),
  };
}

/** O Nexo como serviço da IAgentics, na /nexo (2026-11-24). Nome, descrição e
 *  título são os da própria página; sem preço, porque a página não mostra um
 *  (o Nexo é vendido por proposta). */
export function nexoServicoJsonLd(t: { titulo: string; descricao: string }, lingua: Lingua) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Nexo",
    alternateName: t.titulo,
    description: t.descricao,
    url: absoluta(lingua === "en" ? ROTAS_EN["/nexo"] : "/nexo"),
    serviceType: lingua === "en" ? "AI agents for procurement and spend management" : "Agentes de IA para Compras e gestão de gastos",
    provider: { "@type": "Organization", "@id": ORGANIZACAO_ID, name: site.name, url: site.url },
    areaServed: { "@type": "Country", name: "Brasil" },
    inLanguage: lingua === "en" ? "en" : "pt-BR",
  };
}

/**
 * A assinatura da plataforma Solution, na /cursos (2026-11-24): Product com a
 * Offer mensal. O preço sai do MESMO valor que o checkout cobra
 * (VALOR_ASSINATURA_CENTAVOS), passado pela página; o nome e a descrição, do
 * título e da descrição da página.
 */
export function assinaturaJsonLd(t: { nome: string; descricao: string; centavos: number; imagem: string }) {
  const preco = (t.centavos / 100).toFixed(2);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: t.nome,
    description: t.descricao,
    image: absoluta(t.imagem),
    url: absoluta("/cursos"),
    brand: { "@type": "Brand", name: site.name },
    offers: {
      "@type": "Offer",
      url: absoluta("/cursos#assinar"),
      price: preco,
      priceCurrency: "BRL",
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", "@id": ORGANIZACAO_ID, name: site.name },
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: preco,
        priceCurrency: "BRL",
        /* Cobrança mensal, sem fidelidade. */
        referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" },
      },
    },
  };
}

/** A empresa, para o Knowledge Graph. `sameAs` são os perfis oficiais já
 *  publicados no rodapé - é o que amarra o site às contas sociais. */
export function organizacaoJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZACAO_ID,
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
