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
    const tinhaSessao = req.cookies.getAll().some((c) => c.name.includes("authjs"));
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
export const config = { matcher: ["/app/:path*"] };
