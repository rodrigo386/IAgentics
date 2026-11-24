import { NextResponse } from "next/server";
import { validarAssinatura, VALOR_ASSINATURA_CENTAVOS, hojeSP } from "@/lib/assinatura/regras";
import { enderecoDe, permitir } from "@/lib/assinatura/limite";
import { iniciarAssinatura } from "@/lib/assinatura/checkout";

/**
 * Checkout da assinatura da Solution, R$ 49,90 por mês (2026-10-14).
 *
 * O preço é fixo AQUI: nada do que o navegador manda escolhe valor. O caminho
 * do banco ao Asaas mora em lib/assinatura/checkout.ts (desde 2026-11-18,
 * dividido com o voucher do Desafio Prova Real).
 *
 * Limite de tentativas por endereço (lib/assinatura/limite.ts) e cliente
 * reaproveitado pelo CPF: as duas pendências que barravam ir a público.
 */
export async function POST(request: Request) {
  /* 5 por padrão; o e2e sobe com ASSINATURA_LIMITE alto (vários testes do
     mesmo 127.0.0.1). O limitador em si é testado em lib/assinatura. */
  if (!permitir(enderecoDe(request), Number(process.env.ASSINATURA_LIMITE ?? 5))) {
    return NextResponse.json({ error: "muitas_tentativas" }, { status: 429 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const validacao = validarAssinatura(payload);
  if (!validacao.ok) return NextResponse.json({ error: validacao.motivo }, { status: 422 });

  const r = await iniciarAssinatura({
    dados: validacao.dados,
    valorCentavos: VALOR_ASSINATURA_CENTAVOS,
    primeiroVencimento: hojeSP(),
    descricao: "Assinatura mensal da plataforma Solution (IAgentics e Pecege)",
  });
  return r.ok ? NextResponse.json({ url: r.url }) : NextResponse.json({ error: "falha" }, { status: 502 });
}
