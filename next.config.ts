import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Every image is a local asset in /public, so no remote patterns are needed.
    formats: ["image/avif", "image/webp"],
  },
  /* Vídeos do painel sob /plataforma/ (ex.: banner-boasvindas-v1.mp4, o
     fundo em loop do banner de boas-vindas) são versionados à mão no nome
     do arquivo — ver comentário em app/app/page.tsx. Isso é o que torna
     seguro marcar a resposta como `immutable`: o navegador/CDN nunca
     precisa revalidar porque o conteúdo daquele nome literalmente nunca
     muda; um re-render publica um nome novo (-v2, -v3...), não sobrescreve
     este. Sem essa disciplina de nome, `immutable` seria uma armadilha —
     um re-render silencioso ficaria preso em cache por até um ano. */
  /* /planos virou a landing /cursos (2026-08-14). Redirect permanente para
     não quebrar link antigo em e-mail, WhatsApp ou índice de busca. */
  async redirects() {
    return [
      { source: "/planos", destination: "/cursos", permanent: true },
      /* www → apex (2026-10-09, Prompt 1 de SEO). O Cloudflare entrega o www
         na mesma origem, então o redirect pode morar aqui, sem regra no
         painel. 301 explícito, a pedido; o `permanent` do Next daria 308,
         que o Google trata igual. */
      {
        source: "/:caminho*",
        has: [{ type: "host", value: "www.iagentics.com.br" }],
        destination: "https://iagentics.com.br/:caminho*",
        statusCode: 301,
      },
      /* Endereço truncado que o Google guardou para o artigo de "como
         começar" (2026-10-09). */
      { source: "/artigos/como-comecar-como-primeiro-", destination: "/artigos/como-comecar-com-ia-em-compras", statusCode: 301 },
    ];
  },
  async headers() {
    /* Link headers para descoberta por agentes (RFC 8288), pedido de
       2026-09-06 a partir de um verificador de "agent readiness".

       DOIS rels, e só dois, porque só dois têm alvo REAL:
         - describedby → /llms.txt, a descrição do site para agentes;
         - privacy-policy → /privacidade.
       Ambos são relation types registrados na IANA e ambos respondem 200.

       O que ficou DE FORA de propósito: `api-catalog`, `service-desc` e
       `service-doc`, que o verificador também aceita. A IAgentics não expõe
       API pública — anunciar um catálogo que não existe passa no teste
       automático e mente para o agente que seguir o link. É a mesma regra que
       tirou o `cursosJsonLd` do site em 2026-08-28: não anunciar o que não
       está lá. Se um dia houver API, o rel entra junto com ela.

       Aplicado a páginas HTML, não a assets: a primeira entrada é a home, a
       segunda são os caminhos sem ponto (logo, sem extensão) fora de /_next e
       /api. Um Link header em cima de um JPEG não serve a ninguém. */
    /* UM header com os dois valores separados por vírgula, não dois headers
       com a mesma chave: o Next deduplica por `key` e só o último sobreviveria
       (medido — a resposta vinha só com privacy-policy). A RFC 8288 aceita as
       duas formas; esta é a que atravessa o framework. */
    const descoberta = [
      {
        key: "Link",
        value: '</llms.txt>; rel="describedby"; type="text/plain", </privacidade>; rel="privacy-policy"',
      },
      /* A MESMA URL responde HTML ou markdown conforme o Accept (ver
         middleware.ts). Sem `Vary: Accept` aqui, um cache intermediário
         guardaria a resposta HTML e a devolveria a um agente que pediu
         markdown — e vice-versa. O header vai nos dois lados da negociação:
         a resposta markdown também o declara. */
      { key: "Vary", value: "Accept" },
    ];

    return [
      { source: "/", headers: descoberta },
      { source: "/:caminho((?!_next/|api/)[^.]*)", headers: descoberta },
      {
        source: "/plataforma/:path*.mp4",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
