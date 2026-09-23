import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware: negociação de markdown para agentes, e Basic Auth do /admin.
 *
 * Basic Auth do /admin.
 *
 * Vive no MIDDLEWARE, não em cada página: assim nenhuma rota sob /admin pode
 * nascer desprotegida por esquecimento — inclusive a que exporta o CSV com
 * nome e e-mail dos inscritos. Proteção que depende de lembrar de aplicar é
 * proteção que uma hora não é aplicada.
 *
 * A prévia do catálogo (/preview/catalogo) ficou atrás desta senha no
 * primeiro dia e saiu dela em 2026-09-22, a pedido do Rodrigo, para ser
 * testada sem senha. Ela segue escondida (noindex, fora do sitemap, sem link)
 * e cobra a preço de teste; as vendas entram no painel marcadas "teste", e
 * ninguém ganha curso sem que alguém libere o acesso à mão.
 *
 * Basic Auth é proporcional ao problema: um operador, nenhuma sessão, nenhuma
 * tabela de usuários, nenhuma dependência nova. O prompt é o do navegador.
 *
 * SEM as variáveis definidas, o /admin responde 503 e não abrem — falha
 * FECHADA. O contrário (abrir quando a credencial não está configurada) é
 * como um deploy sem variável vira vazamento de dado pessoal.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /* Calculado ANTES da negociação de markdown: senão um Accept: text/markdown
     reescreveria o /admin para /api/markdown por fora da senha. */
  const protegida = pathname.startsWith("/admin");

  /* Negociação de conteúdo (RFC 9110 §12): quem pede `Accept: text/markdown`
     recebe a página em markdown; navegador, que pede text/html, não vê
     diferença nenhuma.
     
     A checagem é por substring e não por parse do Accept com qualidade
     relativa: agentes mandam `text/markdown` puro ou no topo da lista, e um
     parser de q-values aqui seria precisão que ninguém exercita. O que
     importa é não capturar o navegador — e navegador não pede markdown.
     
     `x-markdown-render` é a trava anti-laço: é o próprio conversor buscando o
     HTML desta página, e ele não pode ser mandado de volta para si mesmo. */
  if (
    !protegida &&
    !req.headers.get("x-markdown-render") &&
    (req.headers.get("accept") ?? "").includes("text/markdown")
  ) {
    /* A rota viaja em HEADER, não em query string. Num rewrite, o Route
       Handler enxerga a URL ORIGINAL em `request.url` — a query que o
       middleware acrescenta ao destino não chega lá. O sintoma foi silencioso
       e uniforme: /nexo, /cursos e todos os artigos devolviam a home, porque
       `searchParams.get("rota")` vinha null e caía no padrão "/".
       `request.headers` é o canal que o Next garante do middleware ao
       handler. */
    const cabecalhos = new Headers(req.headers);
    cabecalhos.set("x-md-rota", pathname);

    const destino = req.nextUrl.clone();
    destino.pathname = "/api/markdown";
    return NextResponse.rewrite(destino, { request: { headers: cabecalhos } });
  }

  if (!protegida) return NextResponse.next();

  const usuario = process.env.ADMIN_USUARIO;
  const senha = process.env.ADMIN_SENHA;

  if (!usuario || !senha) {
    return new NextResponse("Administração indisponível.", { status: 503 });
  }

  const header = req.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ") && confere(header.slice(6), usuario, senha)) {
    return NextResponse.next();
  }

  return new NextResponse("Autenticação necessária.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="IAgentics", charset="UTF-8"',
      /* Nenhuma resposta do /admin pode ser cacheada por intermediário: o
         conteúdo é dado pessoal e a autenticação é por request. */
      "Cache-Control": "no-store",
    },
  });
}

/** Comparação em tempo constante — evita distinguir credencial por latência. */
function confere(base64: string, usuario: string, senha: string): boolean {
  let decodificado: string;
  try {
    decodificado = atob(base64);
  } catch {
    return false;
  }
  const esperado = `${usuario}:${senha}`;
  if (decodificado.length !== esperado.length) return false;

  let diferenca = 0;
  for (let i = 0; i < esperado.length; i++) {
    diferenca |= decodificado.charCodeAt(i) ^ esperado.charCodeAt(i);
  }
  return diferenca === 0;
}

/* O matcher cobre /admin (Basic Auth) e as rotas HTML
   públicas (negociação de markdown). Assets e /api ficam de fora: nem um nem
   outro tem versão em markdown, e rodar middleware em cada imagem é custo sem
   retorno. */
export const config = {
  matcher: [
    "/admin/:path*",
    "/admin",
    "/",
    "/nexo",
    "/academy",
    "/cursos",
    "/spend-lab",
    "/privacidade",
    "/artigos",
    "/artigos/:slug",
  ],
};
