import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);
const PUBLICAS = ["/app/entrar", "/app/criar-conta", "/api/auth"];

export default auth((req) => {
  const rota = req.nextUrl.pathname;
  const ehPublica = PUBLICAS.some((p) => rota.startsWith(p));
  if (!req.auth && !ehPublica) {
    const destino = req.nextUrl.clone();
    destino.pathname = "/app/entrar";
    // Fix round final (I2): "authjs" também casa com csrf-token e callback-url,
    // que o Auth.js já grava na primeira visita anônima — todo visitante novo
    // via "Sua sessão expirou" na segunda visita. Só o cookie de sessão conta
    // como "tinha sessão"; endsWith cobre o prefixo __Secure- de produção (https).
    const tinhaSessao = req.cookies.getAll().some((c) => c.name.endsWith("authjs.session-token"));
    destino.search = `?voltar=${encodeURIComponent(rota)}${tinhaSessao ? "&sessao=expirada" : ""}`;
    return NextResponse.redirect(destino);
  }
  if (req.auth && (rota.startsWith("/app/entrar") || rota.startsWith("/app/criar-conta"))) {
    const destino = req.nextUrl.clone();
    destino.pathname = "/app"; destino.search = "";
    return NextResponse.redirect(destino);
  }
  return NextResponse.next();
});
export const config = { matcher: ["/app/:path*", "/admin/:path*"] };
