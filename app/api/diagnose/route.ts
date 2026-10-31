import { NextResponse } from "next/server";
import { validarEnvio } from "@/lib/diagnose";
import { emailDiagnose, enviarEmail, PARA_DIAGNOSE } from "@/lib/email";
import { enderecoDe, permitir } from "@/lib/assinatura/limite";

/**
 * Recebe a Diagnose de Compras (/diagnose-compras, 2026-10-31) e manda as
 * respostas por e-mail para a equipe da Academy. Nada é gravado no banco: o
 * questionário original mandava para uma planilha, e o e-mail com o CSV
 * anexo cumpre o mesmo papel sem tabela nova nem dado pessoal guardado aqui.
 *
 * - Campo isca (`site`): preenchido, é robô. Responde ok e não envia nada,
 *   para o robô não aprender a desviar.
 * - Limite por endereço: a rota é pública e cada chamada dispara um e-mail.
 * - Sem RESEND_API_KEY (desenvolvimento e e2e), aceita sem enviar, como o
 *   formulário de contato. Com a chave, falha de envio vira 502 e a pessoa vê
 *   o botão de tentar de novo, em vez de uma prévia que diz "chegou" sem ter
 *   chegado.
 * - Log sem dado pessoal: nem nome, nem e-mail, nem empresa.
 */
export async function POST(request: Request) {
  if (!permitir(`diagnose:${enderecoDe(request)}`, Number(process.env.DIAGNOSE_LIMITE ?? 10), 60 * 60_000)) {
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

  const v = validarEnvio(corpo);
  if (!v.ok) return NextResponse.json({ error: v.motivo }, { status: 422 });

  if (!process.env.RESEND_API_KEY) {
    console.info("[diagnose] resposta recebida (RESEND_API_KEY ausente, sem envio)", { papel: v.dados.papel });
    return NextResponse.json({ ok: true });
  }

  const e = emailDiagnose(v.dados);
  const enviado = await enviarEmail({
    para: process.env.DIAGNOSE_PARA ?? PARA_DIAGNOSE,
    assunto: e.assunto,
    texto: e.texto,
    html: e.html,
    responderPara: v.dados.email,
    anexos: e.anexos,
  });
  if (!enviado.ok) return NextResponse.json({ error: "delivery_failed" }, { status: 502 });

  return NextResponse.json({ ok: true });
}
