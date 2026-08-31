import { NextResponse, type NextRequest } from "next/server";

/**
 * Basic Auth do /admin.
 *
 * Vive no MIDDLEWARE, não em cada página: assim nenhuma rota sob /admin pode
 * nascer desprotegida por esquecimento — inclusive a que exporta o CSV com
 * nome e e-mail dos inscritos. Proteção que depende de lembrar de aplicar
 * é proteção que uma hora não é aplicada.
 *
 * Basic Auth é proporcional ao problema: um operador, nenhuma sessão, nenhuma
 * tabela de usuários, nenhuma dependência nova. O prompt é o do navegador.
 *
 * SEM as variáveis definidas, o /admin responde 503 e não abre — falha
 * FECHADA. O contrário (abrir quando a credencial não está configurada) é
 * como um deploy sem variável vira vazamento de dado pessoal.
 */
export function middleware(req: NextRequest) {
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

export const config = { matcher: ["/admin/:path*", "/admin"] };
