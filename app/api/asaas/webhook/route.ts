import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { aplicarEventoAsaas, type EventoAsaas } from "@/lib/catalogo/vendas";

/**
 * Webhook de cobranças do Asaas (2026-09-22).
 *
 * MESMO caminho do webhook da plataforma antiga, que continua registrado na
 * conta do Asaas: voltar aqui evita recadastrar. Fica FORA do Basic Auth (o
 * Asaas não tem a senha) e se autentica pelo header asaas-access-token,
 * comparado em tempo constante — comparação por `!==` vaza, por tempo, quanto
 * do token o atacante já acertou.
 *
 * Responde 200 para tudo que não é falha nossa — evento irrelevante, venda
 * desconhecida, reentrega, corpo que não é um evento de verdade. O Asaas
 * pausa a fila da conta depois de erros seguidos, e fila pausada é pagamento
 * confirmado que nunca chega aqui.
 *
 * Runtime Node (padrão do Route Handler): `timingSafeEqual` não existe no
 * Edge.
 */
function tokenValido(token: string | null, recebido: string | null): boolean {
  if (!token || !recebido) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(recebido);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const token = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!tokenValido(token ?? null, request.headers.get("asaas-access-token"))) {
    return NextResponse.json({ error: "nao_autorizado" }, { status: 401 });
  }

  let evento: EventoAsaas;
  try {
    const corpo: unknown = await request.json();
    if (typeof corpo !== "object" || corpo === null) return NextResponse.json({ ok: true });
    evento = corpo as EventoAsaas;
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
