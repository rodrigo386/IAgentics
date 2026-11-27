import { NextResponse } from "next/server";
import { tokenValido } from "@/lib/nexo-demo/cadastro";
import { acessoPorToken } from "@/lib/nexo-demo/leads";
import { enderecoDe, permitir } from "@/lib/assinatura/limite";

/**
 * Volta ao Nexo Demo pelo link do e-mail (2026-11-27): troca o token pela
 * empresa (para a saudação) e pelo passo em que a pessoa parou. POST, para o
 * token não ficar em log de URL deste endpoint. Token desconhecido: 404.
 */
export async function POST(request: Request) {
  if (!permitir(`nexo-demo-entrar:${enderecoDe(request)}`, Number(process.env.NEXO_DEMO_LIMITE ?? 10) * 3, 60 * 60_000)) {
    return NextResponse.json({ error: "limite" }, { status: 429 });
  }
  const corpo = (await request.json().catch(() => null)) as { token?: unknown } | null;
  if (!tokenValido(corpo?.token)) return NextResponse.json({ error: "acesso" }, { status: 404 });
  try {
    const acesso = await acessoPorToken(corpo.token);
    if (!acesso) return NextResponse.json({ error: "acesso" }, { status: 404 });
    return NextResponse.json(acesso);
  } catch {
    return NextResponse.json({ error: "falha" }, { status: 502 });
  }
}
