import "server-only";
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { bolsasInscricoes, type StatusBolsa } from "@/lib/db/schema";
import { novoToken, type InscricaoValida } from "./regras";
import { decidir, VAGAS } from "./selecao";
import { CODIGO_VOUCHER, novoCodigoVoucher, type GrupoVoucher } from "./voucher";

/**
 * Banco do Desafio Prova Real. Uma inscrição por e-mail: reenviar não
 * duplica e não sobrescreve (quem quer corrigir responde o e-mail de
 * confirmação). A rota responde igual nos dois casos, para não revelar a quem
 * digitou um endereço alheio que ele já está inscrito.
 */
export async function inscrever(d: InscricaoValida): Promise<{ novo: boolean }> {
  const agora = new Date();
  const [linha] = await db
    .insert(bolsasInscricoes)
    .values({
      token: novoToken(),
      nome: d.nome,
      email: d.email,
      whatsapp: d.whatsapp,
      empresa: d.empresa,
      instagram: d.instagram,
      linkedin: d.linkedin,
      problema: d.problema,
      regulamentoEm: agora,
      cienciaDadosEm: agora,
      contatoComercialEm: d.contatoComercial ? agora : null,
      grupoWhatsappEm: d.grupoWhatsapp ? agora : null,
      usoImagemEm: d.usoImagem ? agora : null,
    })
    .onConflictDoNothing()
    .returning({ id: bolsasInscricoes.id });
  return { novo: Boolean(linha) };
}

/* ---------- painel ---------- */

export type ResumoBolsas = { inscritos: number; contatoComercial: number; grupoWhatsapp: number; usoImagem: number };

export async function resumoBolsas(): Promise<ResumoBolsas> {
  const [r] = await db
    .select({
      inscritos: sql<number>`count(*)::int`,
      contatoComercial: sql<number>`count(*) filter (where contato_comercial_em is not null)::int`,
      grupoWhatsapp: sql<number>`count(*) filter (where grupo_whatsapp_em is not null)::int`,
      usoImagem: sql<number>`count(*) filter (where uso_imagem_em is not null)::int`,
    })
    .from(bolsasInscricoes);
  return r;
}

/** Inscrições por dia, no dia de SP. */
export async function bolsasPorDia(): Promise<{ dia: string; inscritos: number }[]> {
  const r = await db.execute<{ dia: string; inscritos: number }>(sql`
    select (criada_em at time zone 'America/Sao_Paulo')::date::text as dia, count(*)::int as inscritos
    from bolsas_inscricoes group by 1 order by 1`);
  return r.rows;
}

export async function listarInscricoes() {
  return db.select().from(bolsasInscricoes).orderBy(asc(bolsasInscricoes.criadaEm));
}

/* ---------- seleção (migração 0017) ---------- */

export const STATUS_VALIDOS: StatusBolsa[] = ["inscrito", "selecionado", "espera", "nao_selecionado", "aceitou", "perdeu"];

export type Avaliar = {
  clareza: number | null;
  solucao30Dias: number | null;
  seguiuAcademy: boolean | null;
  publicouPost: boolean | null;
  observacao: string | null;
  status: StatusBolsa;
};

/** Grava a avaliação de uma inscrição. Mudar o status de quem já recebeu o
 *  resultado não reenvia nada: o envio é por `resultado_enviado_em`. */
export async function salvarAvaliacao(id: string, a: Avaliar): Promise<void> {
  await db.update(bolsasInscricoes).set(a).where(eq(bolsasInscricoes.id, id));
}

/** Aplica o ranking às avaliadas ainda "inscrito". As vagas que sobram são as
 *  50 menos quem já está selecionado ou aceitou. Devolve quantos subiram e
 *  quantos ficaram de fora. */
export async function aplicarRanking(): Promise<{ selecionados: number; naoSelecionados: number; vagasRestantes: number }> {
  return db.transaction(async (tx) => {
    const [ocupadas] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(bolsasInscricoes)
      .where(inArray(bolsasInscricoes.status, ["selecionado", "aceitou"]));
    const vagasRestantes = Math.max(0, VAGAS - ocupadas.n);
    const linhas = await tx.select().from(bolsasInscricoes).where(eq(bolsasInscricoes.status, "inscrito"));
    const { selecionar, naoSelecionar } = decidir(linhas, vagasRestantes);
    if (selecionar.length) await tx.update(bolsasInscricoes).set({ status: "selecionado" }).where(inArray(bolsasInscricoes.id, selecionar));
    if (naoSelecionar.length) await tx.update(bolsasInscricoes).set({ status: "nao_selecionado" }).where(inArray(bolsasInscricoes.id, naoSelecionar));
    return { selecionados: selecionar.length, naoSelecionados: naoSelecionar.length, vagasRestantes };
  });
}

export type ResumoSelecao = { porStatus: Record<string, number>; resultadoPendente: number; resultadoEnviado: number; naoAvaliadas: number };

export async function resumoSelecao(): Promise<ResumoSelecao> {
  const [r] = await db.execute<{ porStatus: Record<string, number>; pendente: number; enviado: number; nao_avaliadas: number }>(sql`
    select
      coalesce((select jsonb_object_agg(status, n) from (select status, count(*)::int n from bolsas_inscricoes group by status) s), '{}'::jsonb) as "porStatus",
      count(*) filter (where status in ('selecionado','nao_selecionado') and resultado_enviado_em is null)::int as pendente,
      count(*) filter (where resultado_enviado_em is not null)::int as enviado,
      count(*) filter (where status = 'inscrito' and (clareza is null or solucao_30_dias is null or seguiu_academy is null or publicou_post is null))::int as nao_avaliadas
    from bolsas_inscricoes`).then((x) => x.rows);
  return { porStatus: r.porStatus, resultadoPendente: r.pendente, resultadoEnviado: r.enviado, naoAvaliadas: r.nao_avaliadas };
}

/** Reserva o envio (marca antes, como o e-mail de boas-vindas: clique duplo
 *  não manda duas vezes). Devolve false se outro clique já reservou. */
export async function reservarResultado(id: string): Promise<boolean> {
  const r = await db
    .update(bolsasInscricoes)
    .set({ resultadoEnviadoEm: new Date() })
    .where(and(eq(bolsasInscricoes.id, id), isNull(bolsasInscricoes.resultadoEnviadoEm)))
    .returning({ id: bolsasInscricoes.id });
  return r.length > 0;
}

export async function desfazerReservaResultado(id: string): Promise<void> {
  await db.update(bolsasInscricoes).set({ resultadoEnviadoEm: null }).where(eq(bolsasInscricoes.id, id));
}

/** Próximas inscrições com resultado decidido e ainda sem e-mail. */
export async function proximosResultados(limite: number) {
  return db
    .select({ id: bolsasInscricoes.id, nome: bolsasInscricoes.nome, email: bolsasInscricoes.email, status: bolsasInscricoes.status })
    .from(bolsasInscricoes)
    .where(and(inArray(bolsasInscricoes.status, ["selecionado", "nao_selecionado"]), isNull(bolsasInscricoes.resultadoEnviadoEm)))
    .orderBy(asc(bolsasInscricoes.criadaEm))
    .limit(limite);
}

/* ---------- voucher (migração 0018) ---------- */

const STATUS_DO_GRUPO: Record<GrupoVoucher, StatusBolsa[]> = { bolsista: ["selecionado", "aceitou"], nao_selecionado: ["nao_selecionado"] };

/** Próximos a receber o voucher. O não selecionado só depois de ter recebido o
 *  resultado: o voucher não pode chegar antes da notícia. */
export async function proximosVouchers(grupo: GrupoVoucher, limite: number) {
  return db
    .select({ id: bolsasInscricoes.id, nome: bolsasInscricoes.nome, email: bolsasInscricoes.email })
    .from(bolsasInscricoes)
    .where(
      and(
        inArray(bolsasInscricoes.status, STATUS_DO_GRUPO[grupo]),
        isNull(bolsasInscricoes.voucherCodigo),
        grupo === "nao_selecionado" ? sql`${bolsasInscricoes.resultadoEnviadoEm} is not null` : undefined,
      ),
    )
    .orderBy(asc(bolsasInscricoes.criadaEm))
    .limit(limite);
}

/** Gera o código e a validade, só se a linha ainda não tem voucher (clique
 *  duplo não gera dois). Devolve o código, ou null se outro clique chegou antes. */
export async function reservarVoucher(id: string, validoAte: string): Promise<string | null> {
  const codigo = novoCodigoVoucher();
  const r = await db
    .update(bolsasInscricoes)
    .set({ voucherCodigo: codigo, voucherEnviadoEm: new Date(), voucherValidoAte: validoAte })
    .where(and(eq(bolsasInscricoes.id, id), isNull(bolsasInscricoes.voucherCodigo)))
    .returning({ id: bolsasInscricoes.id });
  return r.length ? codigo : null;
}

export async function desfazerVoucher(id: string): Promise<void> {
  await db
    .update(bolsasInscricoes)
    .set({ voucherCodigo: null, voucherEnviadoEm: null, voucherValidoAte: null })
    .where(and(eq(bolsasInscricoes.id, id), isNull(bolsasInscricoes.voucherUsadoEm)));
}

export async function voucherPorCodigo(codigo: string) {
  if (!CODIGO_VOUCHER.test(codigo)) return null;
  const [l] = await db
    .select({ id: bolsasInscricoes.id, nome: bolsasInscricoes.nome, validoAte: bolsasInscricoes.voucherValidoAte, usadoEm: bolsasInscricoes.voucherUsadoEm })
    .from(bolsasInscricoes)
    .where(eq(bolsasInscricoes.voucherCodigo, codigo));
  return l ?? null;
}

/** Marca o voucher como usado, só se ainda vale em `hoje`. Devolve o id da
 *  inscrição, ou null (inexistente, usado ou vencido). */
export async function usarVoucher(codigo: string, hoje: string): Promise<string | null> {
  if (!CODIGO_VOUCHER.test(codigo)) return null;
  const r = await db
    .update(bolsasInscricoes)
    .set({ voucherUsadoEm: new Date() })
    .where(
      and(
        eq(bolsasInscricoes.voucherCodigo, codigo),
        isNull(bolsasInscricoes.voucherUsadoEm),
        sql`${bolsasInscricoes.voucherValidoAte} >= ${hoje}::date`,
      ),
    )
    .returning({ id: bolsasInscricoes.id });
  return r[0]?.id ?? null;
}

/** Devolve o voucher quando a assinatura não chegou a nascer no Asaas. */
export async function devolverVoucher(codigo: string): Promise<void> {
  await db.update(bolsasInscricoes).set({ voucherUsadoEm: null }).where(eq(bolsasInscricoes.voucherCodigo, codigo));
}

export async function resumoVouchers(): Promise<{ bolsistasAEnviar: number; naoSelecionadosAEnviar: number; enviados: number; usados: number }> {
  const [r] = await db
    .select({
      bolsistasAEnviar: sql<number>`count(*) filter (where status in ('selecionado','aceitou') and voucher_codigo is null)::int`,
      naoSelecionadosAEnviar: sql<number>`count(*) filter (where status = 'nao_selecionado' and voucher_codigo is null and resultado_enviado_em is not null)::int`,
      enviados: sql<number>`count(*) filter (where voucher_codigo is not null)::int`,
      usados: sql<number>`count(*) filter (where voucher_usado_em is not null)::int`,
    })
    .from(bolsasInscricoes);
  return r;
}
