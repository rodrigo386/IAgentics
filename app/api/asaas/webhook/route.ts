import { NextResponse } from "next/server";
import { processarEventoAsaas, type EventoAsaas } from "@/lib/asaas/webhook";

/** Webhook de cobranças do Asaas. Autentica pelo header asaas-access-token
 *  (valor combinado no cadastro do webhook — scripts/configurar-webhook.mjs). */
export async function POST(request: Request) {
  const token = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!token || request.headers.get("asaas-access-token") !== token) {
    return new NextResponse(null, { status: 401 });
  }

  let evento: EventoAsaas;
  try {
    evento = (await request.json()) as EventoAsaas;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  try {
    await processarEventoAsaas(evento);
  } catch (e) {
    console.error("webhook asaas", e);
    return new NextResponse(null, { status: 500 }); // 500 → o Asaas reentrega
  }
  return NextResponse.json({ ok: true });
}
