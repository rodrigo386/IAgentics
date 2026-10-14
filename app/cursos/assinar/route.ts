import { NextResponse } from "next/server";
import { site } from "@/lib/content";
import { validarAssinatura, VALOR_ASSINATURA_CENTAVOS, hojeSP } from "@/lib/assinatura/regras";
import { enderecoDe, permitir } from "@/lib/assinatura/limite";
import { anexarAsaas, criarLinha, marcarFalha } from "@/lib/assinatura/assinaturas";
import { clientePorCpf, criarAssinatura, primeiraFatura, redigirCpfs } from "@/lib/asaas/cliente";

/**
 * Checkout da assinatura da Solution, R$ 49,90 por mês (2026-10-14).
 *
 * O preço é fixo AQUI: nada do que o navegador manda escolhe valor. Ordem, a
 * mesma do checkout avulso: grava a linha ANTES de falar com o Asaas; se o
 * Asaas falhar antes de criar a assinatura, a linha vira "falhou"; se a
 * assinatura já existe e só um passo seguinte falhou, a linha fica
 * "pendente" — o webhook ainda a encontra pelo id da assinatura quando o
 * pagamento chegar, e a pessoa é levada à página da assinatura.
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
  const { nome, email, telefone, cpf } = validacao.dados;

  let id: string;
  try {
    id = await criarLinha({ nome, email, telefone, valorCentavos: VALOR_ASSINATURA_CENTAVOS });
  } catch (erro) {
    console.error("[assinar] falha ao gravar", (erro as { code?: string })?.code ?? "sem_codigo");
    return NextResponse.json({ error: "falha" }, { status: 502 });
  }

  const paginaDaAssinatura = `${site.url}/cursos/assinatura/${id}`;
  let assinaturaAsaas: { id: string } | undefined;
  try {
    const cliente = await clientePorCpf({ nome, email, cpf, telefone });
    assinaturaAsaas = await criarAssinatura({
      clienteId: cliente.id,
      valorCentavos: VALOR_ASSINATURA_CENTAVOS,
      proximoVencimento: hojeSP(),
      descricao: "Assinatura mensal da plataforma Solution (IAgentics e Pecege)",
      referencia: id,
    });
    await anexarAsaas(id, { clienteId: cliente.id, assinaturaId: assinaturaAsaas.id });
    const fatura = await primeiraFatura(assinaturaAsaas.id).catch(() => null);
    if (fatura) await anexarAsaas(id, { clienteId: cliente.id, assinaturaId: assinaturaAsaas.id, urlFatura: fatura.urlFatura });
    return NextResponse.json({ url: fatura?.urlFatura ?? paginaDaAssinatura });
  } catch (erro) {
    if (assinaturaAsaas) {
      console.error("[assinar] passo após criar a assinatura falhou", id, assinaturaAsaas.id, (erro as { code?: string })?.code ?? "sem_codigo");
      return NextResponse.json({ url: paginaDaAssinatura });
    }
    await marcarFalha(id).catch(() => {});
    console.error("[assinar] falha no Asaas", redigirCpfs(erro instanceof Error ? erro.message : String(erro)));
    return NextResponse.json({ error: "falha" }, { status: 502 });
  }
}
