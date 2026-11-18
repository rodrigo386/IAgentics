import "server-only";
import { asc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { bolsasInscricoes } from "@/lib/db/schema";
import { novoToken, type InscricaoValida } from "./regras";

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
