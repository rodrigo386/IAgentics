"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { emailResultadoBolsa, emailVoucherBolsa, enviarEmail, RESPONDER_BOLSAS } from "@/lib/email";
import { site } from "@/lib/content";
import { hojeSP, VALOR_ASSINATURA_CENTAVOS } from "@/lib/assinatura/regras";
import { reajustarAssinatura } from "@/lib/assinatura/assinaturas";
import { aplicarRanking, desfazerReservaResultado, desfazerVoucher, proximosVouchers, reservarVoucher, proximosResultados, reservarResultado, salvarAvaliacao, STATUS_VALIDOS } from "@/lib/bolsas/inscricoes";
import { agoraBolsas, faseDasInscricoes } from "@/lib/bolsas/regras";
import { lerNota, lerSimNao } from "@/lib/bolsas/selecao";
import { janelaDoVoucher, validadeDoVoucher, type GrupoVoucher } from "@/lib/bolsas/voucher";
import type { StatusBolsa } from "@/lib/db/schema";

/* Server actions do /admin/bolsas. O POST vai para o caminho do painel, que o
   middleware cobre com o Basic Auth: sem credencial, a ação nem executa. */

const PAGINA = "/admin/bolsas";
const LOTE = 30;

export async function avaliarInscricao(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as StatusBolsa;
  if (!id || !STATUS_VALIDOS.includes(status)) return;
  const observacao = String(formData.get("observacao") ?? "").trim().slice(0, 1000);
  await salvarAvaliacao(id, {
    clareza: lerNota(formData.get("clareza")),
    solucao30Dias: lerNota(formData.get("solucao")),
    seguiuAcademy: lerSimNao(formData.get("seguiu")),
    publicouPost: lerSimNao(formData.get("publicou")),
    observacao: observacao || null,
    status,
  });
  revalidatePath(PAGINA);
}

export async function aplicarRankingAdmin(formData: FormData) {
  if (formData.get("confirmar") !== "on") return;
  const r = await aplicarRanking();
  revalidatePath(PAGINA);
  redirect(`${PAGINA}?ranking=${r.selecionados}-${r.naoSelecionados}`);
}

/** Envia o resultado em lotes. Reserva antes de enviar (clique duplo não manda
 *  duas vezes) e devolve a reserva se o envio falhar. */
export async function enviarResultados() {
  if (faseDasInscricoes(agoraBolsas()) !== "encerradas") redirect(`${PAGINA}?resultado=cedo`);
  const lote = await proximosResultados(LOTE);
  let ok = 0;
  let falhas = 0;
  for (const l of lote) {
    if (!(await reservarResultado(l.id))) continue;
    const e = emailResultadoBolsa(l.nome, l.status === "selecionado");
    const r = await enviarEmail({ para: l.email, responderPara: RESPONDER_BOLSAS, ...e });
    if (r.ok) ok++;
    else {
      falhas++;
      await desfazerReservaResultado(l.id);
    }
    await new Promise((res) => setTimeout(res, 600)); // o Resend limita a ~2 por segundo
  }
  revalidatePath(PAGINA);
  redirect(`${PAGINA}?resultado=${ok}-${falhas}`);
}

/** Envia o voucher de um grupo, em lotes. O código é gerado ANTES do envio
 *  (clique duplo não gera dois) e apagado se o e-mail falhar. */
export async function enviarVouchers(formData: FormData) {
  const grupo = String(formData.get("grupo") ?? "") as GrupoVoucher;
  if (grupo !== "bolsista" && grupo !== "nao_selecionado") return;
  const hoje = hojeSP(agoraBolsas());
  if (janelaDoVoucher(grupo, hoje) === "cedo") redirect(`${PAGINA}?voucher=cedo`);
  const validoAte = validadeDoVoucher(hoje);
  const lote = await proximosVouchers(grupo, LOTE);
  let ok = 0;
  let falhas = 0;
  for (const l of lote) {
    const codigo = await reservarVoucher(l.id, validoAte);
    if (!codigo) continue;
    const e = emailVoucherBolsa(l.nome, {
      url: `${site.url}/cursos/voucher/${codigo}`,
      validoAte: validoAte.split("-").reverse().join("/"),
      bolsista: grupo === "bolsista",
    });
    const r = await enviarEmail({ para: l.email, responderPara: RESPONDER_BOLSAS, ...e });
    if (r.ok) ok++;
    else {
      falhas++;
      await desfazerVoucher(l.id);
    }
    await new Promise((res) => setTimeout(res, 600));
  }
  revalidatePath(PAGINA);
  redirect(`${PAGINA}?voucher=${ok}-${falhas}`);
}

/** Fim do preço de fundador: passa a assinatura a R$ 49,90 no Asaas e aqui. */
export async function reajustarAssinaturaAdmin(formData: FormData) {
  try {
    await reajustarAssinatura(String(formData.get("id") ?? ""), VALOR_ASSINATURA_CENTAVOS);
  } catch (erro) {
    console.error("[admin] reajuste falhou", erro instanceof Error ? erro.message.slice(0, 40) : "erro");
  }
  revalidatePath(PAGINA);
  revalidatePath("/admin");
}
