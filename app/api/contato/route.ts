import { NextResponse } from "next/server";

/**
 * Contact endpoint — entrega via Resend quando RESEND_API_KEY existe.
 *
 * Destino: CONTATO_PARA (padrão rodrigo.costa@iagentics.com.br, pedido de
 * 2026-08-13). Remetente: CONTATO_DE — o domínio precisa estar verificado no
 * Resend; reply-to é o e-mail do visitante, então responder no cliente de
 * e-mail já conversa com o lead.
 *
 * Sem RESEND_API_KEY o endpoint só loga e aceita (comportamento de sempre):
 * o formulário nunca quebra por falta da credencial. COM a credencial, falha
 * de envio vira 502 — o visitante vê o estado de erro e tenta de novo, em vez
 * de um "enviado" falso com a mensagem indo para o nada.
 */
export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { name, email, message } = (payload ?? {}) as Record<string, unknown>;

  const valid =
    typeof name === "string" &&
    name.trim().length > 0 &&
    typeof email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    typeof message === "string" &&
    message.trim().length >= 8;

  if (!valid) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 422 });
  }

  const chave = process.env.RESEND_API_KEY;
  if (!chave) {
    console.info("[contato] nova mensagem recebida (RESEND_API_KEY ausente, sem envio)", { name, email });
    return NextResponse.json({ ok: true });
  }

  const para = process.env.CONTATO_PARA ?? "rodrigo.costa@iagentics.com.br";
  const de = process.env.CONTATO_DE ?? "IAgentics <contato@iagentics.com.br>";

  try {
    const resposta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        from: de,
        to: [para],
        reply_to: email,
        subject: `Contato pelo site — ${name.trim()}`,
        text: `Nome: ${name.trim()}\nE-mail: ${email}\n\n${message.trim()}`,
      }),
    });
    if (!resposta.ok) {
      console.error("[contato] Resend recusou o envio", resposta.status, await resposta.text().then((t) => t.slice(0, 300)).catch(() => ""));
      return NextResponse.json({ error: "delivery_failed" }, { status: 502 });
    }
  } catch (erro) {
    console.error("[contato] falha ao enviar via Resend", erro instanceof Error ? erro.message : erro);
    return NextResponse.json({ error: "delivery_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
