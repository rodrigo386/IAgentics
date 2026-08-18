import { site, contact, cursos as textoCursos } from "@/lib/content";
import type { Curso } from "@/lib/plataforma/tipos";

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
export const ROTAS_SITEMAP = ["/", "/nexo", "/academy", "/cursos", "/spend-lab"] as const;

/** Prioridade relativa dentro do site. A home lidera; /cursos vem logo atrás
 *  por ser a única página com conversão direta (assinatura). */
export const PRIORIDADE_SITEMAP: Record<string, number> = {
  "/": 1,
  "/cursos": 0.9,
  "/nexo": 0.8,
  "/academy": 0.8,
  "/spend-lab": 0.8,
};

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
    sameAs: contact.social.map((s) => s.href),
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

/**
 * O catálogo da /cursos como lista de Course.
 *
 * `precoMensal` chega de fora (VALOR_MENSAL, em lib/asaas/cliente.ts) porque
 * aquele módulo é `server-only`: importá-lo aqui contaminaria este arquivo e
 * o tiraria do alcance dos testes.
 *
 * Sem `url` por curso de propósito: não existe página pública por curso (o
 * conteúdo vive atrás do login), e apontar todos para /cursos criaria itens
 * duplicados no índice.
 */
export function cursosJsonLd(lista: Curso[], precoMensal: number) {
  const oferta = {
    "@type": "Offer",
    price: precoMensal.toFixed(2),
    priceCurrency: "BRL",
    category: "Subscription",
    availability: "https://schema.org/InStock",
    url: absoluta("/cursos"),
  };

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: textoCursos.catalogo.titulo,
    numberOfItems: lista.length,
    itemListElement: lista.map((curso, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Course",
        name: curso.titulo,
        description: curso.descricao,
        educationalLevel: curso.nivel,
        inLanguage: "pt-BR",
        isAccessibleForFree: false,
        provider: { "@type": "Organization", name: `${site.name} Academy`, url: site.url },
        offers: oferta,
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          /* ISO 8601: 12 horas -> "PT12H". A carga vem do banco, então o
             número no dado estruturado é o mesmo que a página exibe. */
          courseWorkload: `PT${curso.cargaHoras}H`,
        },
      },
    })),
  };
}
