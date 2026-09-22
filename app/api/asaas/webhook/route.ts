import { NextResponse } from "next/server";
import { aplicarEventoAsaas, type EventoAsaas } from "@/lib/catalogo/vendas";

/**
 * Webhook de cobranças do Asaas (2026-09-22).
 *
 * MESMO caminho do webhook da plataforma antiga, que continua registrado na
 * conta do Asaas: voltar aqui evita recadastrar. Fica FORA do Basic Auth (o
 * Asaas não tem a senha) e se autentica pelo header asaas-access-token.
 *
 * Responde 200 para tudo que não é falha nossa — evento irrelevante, venda
 * desconhecida, reentrega. O Asaas pausa a fila da conta depois de erros
 * seguidos, e fila pausada é pagamento confirmado que nunca chega aqui.
 */
export async function POST(request: Request) {
  const token = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!token || request.headers.get("asaas-access-token") !== token) {
    return NextResponse.json({ error: "nao_autorizado" }, { status: 401 });
  }

  let evento: EventoAsaas;
  try {
    evento = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  try {
    const resultado = await aplicarEventoAsaas(evento);
    if (resultado === "sem-efeito" && evento.payment?.externalReference) {
      console.info("[asaas-webhook] sem efeito", evento.event, evento.payment.id ?? "");
    }
  } catch (erro) {
    // Banco fora: 500 faz o Asaas reentregar mais tarde, que é o que queremos.
    console.error("[asaas-webhook] falha ao aplicar", erro instanceof Error ? erro.message : erro);
    return NextResponse.json({ error: "falha" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
