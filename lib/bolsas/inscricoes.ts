import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { bolsasInscricoes } from "@/lib/db/schema";
import { novoToken, type InscricaoValida } from "./regras";

/**
 * Banco do Desafio das 50 Bolsas. Uma inscrição por e-mail: reenviar não
 * duplica e não sobrescreve (quem quer corrigir responde o e-mail de
 * confirmação). A rota responde igual nos dois casos, para não revelar a quem
 * digitou um endereço alheio que ele já está inscrito.
 */
export async function inscrever(d: InscricaoValida): Promise<{ novo: boolean; token: string }> {
  const agora = new Date();
  const token = novoToken();
  const [linha] = await db
    .insert(bolsasInscricoes)
    .values({
      token,
      nome: d.nome,
      email: d.email,
      whatsapp: d.whatsapp,
      cargo: d.cargo,
      nivel: d.nivel,
      empresa: d.empresa,
      area: d.area,
      tamanhoTime: d.tamanhoTime,
      instagram: d.instagram,
      linkedin: d.linkedin,
      problema: d.problema,
      regulamentoEm: agora,
      cienciaDadosEm: agora,
      contatoComercialEm: d.contatoComercial ? agora : null,
      usoImagemEm: d.usoImagem ? agora : null,
    })
    .onConflictDoNothing()
    .returning({ token: bolsasInscricoes.token });
  return linha ? { novo: true, token: linha.token } : { novo: false, token: "" };
}

export async function inscricaoPorToken(token: string) {
  const [linha] = await db
    .select({ id: bolsasInscricoes.id, nome: bolsasInscricoes.nome, videoUrl: bolsasInscricoes.videoUrl })
    .from(bolsasInscricoes)
    .where(eq(bolsasInscricoes.token, token))
    .limit(1);
  return linha ?? null;
}

/** Grava (ou troca) o link do vídeo. Devolve false se o token não existe. */
export async function registrarVideo(token: string, url: string): Promise<boolean> {
  const r = await db
    .update(bolsasInscricoes)
    .set({ videoUrl: url, videoEm: new Date() })
    .where(eq(bolsasInscricoes.token, token))
    .returning({ id: bolsasInscricoes.id });
  return r.length > 0;
}

/* ---------- painel ---------- */

export type ResumoBolsas = { inscritos: number; comVideo: number; contatoComercial: number; usoImagem: number };

export async function resumoBolsas(): Promise<ResumoBolsas> {
  const [r] = await db
    .select({
      inscritos: sql<number>`count(*)::int`,
      comVideo: sql<number>`count(*) filter (where video_url is not null)::int`,
      contatoComercial: sql<number>`count(*) filter (where contato_comercial_em is not null)::int`,
      usoImagem: sql<number>`count(*) filter (where uso_imagem_em is not null)::int`,
    })
    .from(bolsasInscricoes);
  return r;
}

/** Inscrições e vídeos por dia, no dia de SP. */
export async function bolsasPorDia(): Promise<{ dia: string; inscritos: number; videos: number }[]> {
  const r = await db.execute<{ dia: string; inscritos: number; videos: number }>(sql`
    with i as (
      select (criada_em at time zone 'America/Sao_Paulo')::date as dia, count(*)::int as n from bolsas_inscricoes group by 1
    ), v as (
      select (video_em at time zone 'America/Sao_Paulo')::date as dia, count(*)::int as n from bolsas_inscricoes where video_em is not null group by 1
    )
    select coalesce(i.dia, v.dia)::text as dia, coalesce(i.n, 0) as inscritos, coalesce(v.n, 0) as videos
    from i full outer join v on i.dia = v.dia
    order by 1`);
  return r.rows;
}

/** Contagem por um campo da lista fechada (área, nível ou tamanho do time). */
export async function bolsasPor(campo: "area" | "nivel" | "tamanho_time"): Promise<{ chave: string; total: number; comVideo: number }[]> {
  const coluna = sql.raw(campo);
  const r = await db.execute<{ chave: string; total: number; comVideo: number }>(sql`
    select ${coluna} as chave, count(*)::int as total, count(*) filter (where video_url is not null)::int as "comVideo"
    from bolsas_inscricoes group by 1 order by 2 desc`);
  return r.rows;
}

export async function listarInscricoes() {
  return db.select().from(bolsasInscricoes).orderBy(asc(bolsasInscricoes.criadaEm));
}
