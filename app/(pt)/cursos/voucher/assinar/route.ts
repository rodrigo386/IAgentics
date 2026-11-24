import { NextResponse } from "next/server";
import { validarAssinatura, hojeSP } from "@/lib/assinatura/regras";
import { enderecoDe, permitir } from "@/lib/assinatura/limite";
import { iniciarAssinatura } from "@/lib/assinatura/checkout";
import { agoraBolsas, VALOR_FUNDADOR_CENTAVOS } from "@/lib/bolsas/regras";
import { devolverVoucher, usarVoucher } from "@/lib/bolsas/inscricoes";
import { fimDoPrecoFundador } from "@/lib/bolsas/voucher";

/**
 * Assinatura com o voucher do Desafio Prova Real (2026-11-18): R$ 29,90 por
 * mês durante 12 meses, depois o preço público (o /admin/bolsas avisa quando
 * reajustar).
 *
 * O valor é fixo AQUI, como na /cursos. O voucher é marcado como usado ANTES
 * de falar com o Asaas (dois cliques não geram duas assinaturas baratas) e
 * devolvido se a assinatura não nasce. A validade é conferida pelo relógio
 * das bolsas (o e2e o fixa); o vencimento da fatura, pelo dia real.
 */
export async function POST(request: Request) {
  if (!permitir(`voucher:${enderecoDe(request)}`, Number(process.env.ASSINATURA_LIMITE ?? 5))) {
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

  const codigo = typeof (payload as { codigo?: unknown }).codigo === "string" ? (payload as { codigo: string }).codigo : "";
  const inscricaoId = await usarVoucher(codigo, hojeSP(agoraBolsas())).catch(() => null);
  if (!inscricaoId) return NextResponse.json({ error: "voucher" }, { status: 409 });

  const primeiroVencimento = hojeSP();
  const r = await iniciarAssinatura({
    dados: validacao.dados,
    valorCentavos: VALOR_FUNDADOR_CENTAVOS,
    primeiroVencimento,
    precoFundadorAte: fimDoPrecoFundador(primeiroVencimento),
    bolsaInscricaoId: inscricaoId,
    descricao: "Assinatura mensal da plataforma Solution (IAgentics e Pecege), preço de fundador do Desafio Prova Real por 12 meses",
  });
  if (!r.ok) {
    await devolverVoucher(codigo).catch(() => {});
    return NextResponse.json({ error: "falha" }, { status: 502 });
  }
  return NextResponse.json({ url: r.url });
}
