import { NextResponse } from "next/server";
import { ROTA_REFORMA, validarPedido } from "@/lib/reforma";
import { gravarLead, marcarEmailEnviado } from "@/lib/reforma-leads";
import { emailReforma, enviarEmail } from "@/lib/email";
import { enderecoDe, permitir } from "@/lib/assinatura/limite";
import { site } from "@/lib/content";

/**
 * Pedido do comparativo da calculadora da Reforma Tributária (2026-11-18).
 *
 * Grava o contato ANTES de mandar o e-mail: o contato é o que a página existe
 * para captar, e não pode se perder porque o Resend falhou. Falha de envio
 * responde `enviado: false` e a tela diz que a equipe manda depois (o /admin
 * mostra quem ficou sem e-mail).
 *
 * Campo isca (`site`) e limite por endereço, como a /api/diagnose. Log sem
 * dado pessoal.
 */
export async function POST(request: Request) {
  if (!permitir(`reforma:${enderecoDe(request)}`, Number(process.env.REFORMA_LIMITE ?? 10), 60 * 60_000)) {
    return NextResponse.json({ error: "limite" }, { status: 429 });
  }
  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (typeof (corpo as { site?: unknown })?.site === "string" && (corpo as { site: string }).site.trim() !== "") {
    return NextResponse.json({ ok: true, enviado: true });
  }
  const v = validarPedido(corpo);
  if (!v.ok) return NextResponse.json({ error: v.motivo }, { status: 422 });

  let id: string;
  try {
    id = await gravarLead(v.contato, v.cenario);
  } catch (erro) {
    console.error("[reforma] falha ao gravar", erro instanceof Error ? erro.message : erro);
    return NextResponse.json({ error: "falha" }, { status: 500 });
  }

  if (!process.env.RESEND_API_KEY) {
    console.info("[reforma] pedido gravado (RESEND_API_KEY ausente, sem envio)");
    return NextResponse.json({ ok: true, enviado: false });
  }
  const e = emailReforma(v.contato.nome, v.cenario, `${site.url}${ROTA_REFORMA}`);
  const r = await enviarEmail({ para: v.contato.email, assunto: e.assunto, texto: e.texto, html: e.html, responderPara: "contato@iagentics.com.br" });
  if (r.ok) await marcarEmailEnviado(id).catch(() => {});
  return NextResponse.json({ ok: true, enviado: r.ok });
}
