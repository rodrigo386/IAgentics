import type { MetadataRoute } from "next";
import { site } from "@/lib/content";

/**
 * O robots.txt da aplicação.
 *
 * ATENÇÃO (2026-08-18): o Cloudflare injeta o "Managed Content Signals" na
 * frente deste arquivo, e aquele bloco traz `Disallow: /` para ClaudeBot,
 * GPTBot e Google-Extended. Enquanto ele estiver ligado no painel, o que
 * está aqui NÃO é o robots.txt final que os robôs leem. Desligar lá é
 * decisão do Rodrigo (ver docs/PLANO-SEO.md, Fase 2) - o /llms.txt convida
 * os assistentes de IA que aquele bloco barra.
 *
 * /admin e /preview já mandam `noindex` na própria página; o Disallow aqui
 * evita o gasto de rastreio. /preview/ são páginas em construção esperando
 * aprovação do Rodrigo — nunca podem ser descobertas antes de virarem a
 * página oficial.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/app/", "/admin/", "/api/", "/preview/"] }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.domain,
  };
}
