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
    return [{ source: "/planos", destination: "/cursos", permanent: true }];
  },
  async headers() {
    return [
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
