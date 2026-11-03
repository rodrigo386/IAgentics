import { NextResponse } from "next/server";
import { agoraBolsas, faseDasInscricoes, validarInscricao } from "@/lib/bolsas/regras";
import { inscrever } from "@/lib/bolsas/inscricoes";
import { emailInscricaoBolsa, enviarEmail, RESPONDER_BOLSAS } from "@/lib/email";
import { enderecoDe, permitir } from "@/lib/assinatura/limite";

/**
 * Inscrição no Desafio das 50 Bolsas (/bolsas, 2026-11-03).
 *
 * - Fora da janela (05/11 a 11/11, horário de SP), recusa com 409: a página
 *   esconde o formulário, mas a rota é pública e confere de novo.
 * - Campo isca (`site`): preenchido, é robô. Responde ok e não grava.
 * - Limite por endereço (`BOLSAS_LIMITE`, padrão 10 por hora; o e2e sobe com
 *   1000): cada inscrição nova dispara um e-mail.
 * - A gravação é o essencial; o e-mail de confirmação não derruba a inscrição
 *   (como era na lista de espera). Inscrição repetida responde igual e não
 *   reenvia o e-mail.
 * - Log sem dado pessoal.
 */
export async function POST(request: Request) {
  if (faseDasInscricoes(agoraBolsas()) !== "abertas") {
    return NextResponse.json({ error: "fechadas" }, { status: 409 });
  }
  if (!permitir(`bolsas:${enderecoDe(request)}`, Number(process.env.BOLSAS_LIMITE ?? 10), 60 * 60_000)) {
    return NextResponse.json({ error: "limite" }, { status: 429 });
  }

  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (typeof (corpo as { site?: unknown })?.site === "string" && (corpo as { site: string }).site.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const v = validarInscricao(corpo);
  if (!v.ok) return NextResponse.json({ error: v.motivo }, { status: 422 });

  let resultado: { novo: boolean; token: string };
  try {
    resultado = await inscrever(v.dados);
  } catch (erro) {
    console.error("[bolsas] falha ao gravar", erro instanceof Error ? erro.message.slice(0, 80) : "erro");
    return NextResponse.json({ error: "falha" }, { status: 502 });
  }

  if (resultado.novo) {
    const e = emailInscricaoBolsa(v.dados.nome, resultado.token);
    const enviado = await enviarEmail({ para: v.dados.email, responderPara: RESPONDER_BOLSAS, ...e });
    if (!enviado.ok) console.error("[bolsas] confirmação não enviada");
  }

  return NextResponse.json({ ok: true });
}
