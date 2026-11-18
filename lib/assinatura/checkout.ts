import "server-only";
import { site } from "@/lib/content";
import { anexarAsaas, criarLinha, marcarFalha } from "./assinaturas";
import { clientePorCpf, criarAssinatura, primeiraFatura, redigirCpfs } from "@/lib/asaas/cliente";
import type { DadosAssinatura } from "./regras";

/**
 * O caminho de uma assinatura nova, do banco ao Asaas (tirado da rota da
 * /cursos em 2026-11-18, quando o voucher do Prova Real passou a usar o mesmo
 * caminho com outro valor).
 *
 * Grava a linha ANTES de falar com o Asaas; se o Asaas falhar antes de criar
 * a assinatura, a linha vira "falhou" e a resposta diz que nada nasceu
 * (`criada: false`); se a assinatura já existe e só um passo seguinte
 * falhou, a linha fica "pendente" e a pessoa vai à página da assinatura.
 */
export async function iniciarAssinatura(d: {
  dados: DadosAssinatura;
  valorCentavos: number;
  descricao: string;
  primeiroVencimento: string;
  precoFundadorAte?: string;
  bolsaInscricaoId?: string;
}): Promise<{ ok: true; url: string } | { ok: false; criada: false }> {
  const { nome, email, telefone, cpf } = d.dados;

  let id: string;
  try {
    id = await criarLinha({ nome, email, telefone, valorCentavos: d.valorCentavos, precoFundadorAte: d.precoFundadorAte, bolsaInscricaoId: d.bolsaInscricaoId });
  } catch (erro) {
    console.error("[assinar] falha ao gravar", (erro as { code?: string })?.code ?? "sem_codigo");
    return { ok: false, criada: false };
  }

  const paginaDaAssinatura = `${site.url}/cursos/assinatura/${id}`;
  let assinaturaAsaas: { id: string } | undefined;
  try {
    const cliente = await clientePorCpf({ nome, email, cpf, telefone });
    assinaturaAsaas = await criarAssinatura({
      clienteId: cliente.id,
      valorCentavos: d.valorCentavos,
      proximoVencimento: d.primeiroVencimento,
      descricao: d.descricao,
      referencia: id,
    });
    await anexarAsaas(id, { clienteId: cliente.id, assinaturaId: assinaturaAsaas.id });
    const fatura = await primeiraFatura(assinaturaAsaas.id).catch(() => null);
    if (fatura) await anexarAsaas(id, { clienteId: cliente.id, assinaturaId: assinaturaAsaas.id, urlFatura: fatura.urlFatura });
    return { ok: true, url: fatura?.urlFatura ?? paginaDaAssinatura };
  } catch (erro) {
    if (assinaturaAsaas) {
      console.error("[assinar] passo após criar a assinatura falhou", id, assinaturaAsaas.id, (erro as { code?: string })?.code ?? "sem_codigo");
      return { ok: true, url: paginaDaAssinatura };
    }
    await marcarFalha(id).catch(() => {});
    console.error("[assinar] falha no Asaas", redigirCpfs(erro instanceof Error ? erro.message : String(erro)));
    return { ok: false, criada: false };
  }
}
