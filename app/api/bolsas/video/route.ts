import { NextResponse } from "next/server";
import { agoraBolsas, tokenValido, validarVideo, videoAberto } from "@/lib/bolsas/regras";
import { registrarVideo } from "@/lib/bolsas/inscricoes";
import { enderecoDe, permitir } from "@/lib/assinatura/limite";

/**
 * O link do vídeo de entrada, enviado pela página pessoal
 * /bolsas/video/[token] até 15/11. Trocar o link é permitido até o prazo:
 * vale o último.
 */
export async function POST(request: Request) {
  if (!videoAberto(agoraBolsas())) return NextResponse.json({ error: "prazo" }, { status: 409 });
  if (!permitir(`bolsas-video:${enderecoDe(request)}`, Number(process.env.BOLSAS_LIMITE ?? 20), 60 * 60_000)) {
    return NextResponse.json({ error: "limite" }, { status: 429 });
  }

  let corpo: { token?: unknown; url?: unknown };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!tokenValido(corpo?.token)) return NextResponse.json({ error: "token" }, { status: 404 });
  const url = validarVideo(corpo.url);
  if (!url) return NextResponse.json({ error: "url" }, { status: 422 });

  try {
    if (!(await registrarVideo(corpo.token, url))) return NextResponse.json({ error: "token" }, { status: 404 });
  } catch (erro) {
    console.error("[bolsas] falha ao gravar vídeo", erro instanceof Error ? erro.message.slice(0, 80) : "erro");
    return NextResponse.json({ error: "falha" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, url });
}
