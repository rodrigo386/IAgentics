import { estimarTokens, markdownDaRota } from "@/lib/markdown-agentes";

/**
 * Serve a versão markdown de uma página. Não é um endpoint para humanos: quem
 * chega aqui foi reescrito pelo middleware por ter pedido `Accept:
 * text/markdown` na página de verdade, e a URL original fica na barra.
 *
 * A rota chega no header `x-md-rota`, posto pelo middleware. Não em query:
 * num rewrite o handler vê a URL original, e a query do destino não sobrevive
 * (ver o comentário no middleware). A query fica como entrada alternativa
 * para chamada direta — útil para depurar e para o teste.
 */
export const dynamic = "force-dynamic";

/** Só rotas HTML públicas do próprio site — nada de /admin, /api ou externo. */
const PERMITIDAS = /^\/(?:|nexo|academy|cursos|spend-lab|privacidade|artigos(?:\/[a-z0-9-]+)?)\/?$/;

export async function GET(req: Request) {
  const rota = req.headers.get("x-md-rota") ?? new URL(req.url).searchParams.get("rota") ?? "/";

  /* A lista branca é a trava: sem ela, `?rota=` viraria um proxy que busca
     qualquer caminho da origem e devolve o conteúdo — incluindo o que o
     middleware protege. O middleware já filtra antes, mas esta rota é
     alcançável direto. */
  if (!PERMITIDAS.test(rota)) {
    return new Response("Rota não disponível em markdown.\n", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const origem = new URL(req.url).origin;
  const markdown = await markdownDaRota(rota, async (r) => {
    /* Accept explícito de HTML: sem ele, o fetch herdaria o padrão e o
       middleware poderia reescrever esta busca de volta para cá — um laço.
       O header sentinela é a segunda trava, caso o padrão mude. */
    const resposta = await fetch(`${origem}${r}`, {
      headers: { Accept: "text/html", "x-markdown-render": "1" },
      cache: "no-store",
    });
    return resposta.ok ? resposta.text() : null;
  });

  if (!markdown) {
    return new Response("Página não encontrada.\n", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      /* Estimativa, não contagem — ver estimarTokens. */
      "x-markdown-tokens": String(estimarTokens(markdown)),
      /* Sem isto, um cache intermediário guardaria esta resposta para a URL da
         página e serviria markdown a um navegador. É a linha que torna a
         negociação segura atrás de CDN. */
      Vary: "Accept",
      "Cache-Control": "public, max-age=0, s-maxage=300",
    },
  });
}
