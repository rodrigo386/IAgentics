import "server-only";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { after } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { emitirToken, consumirToken } from "@/lib/plataforma/tokens";
import { emailDeConfirmacao, emailDeReset, emailTransacionalAtivo, enviarEmail, urlBase } from "@/lib/plataforma/email";

/** Hash bcrypt sintaticamente válido mas que nenhuma senha real gera — usado para
 *  comparar contra "nada" sem pular o custo do bcrypt.compare. Compartilhado entre
 *  verificarCredenciais e credenciaisValidasMasNaoConfirmadas: mesma defesa contra
 *  timing oracle nos dois lugares (ver comentário na segunda função). */
const HASH_DUMMY = "$2a$10$invalidoinvalidoinvalidoinvalidoinvalido12345678901234";

export async function criarUsuario(d: { nome: string; email: string; senha: string }):
  Promise<{ ok: true; id: string; confirmacaoPendente: boolean } | { ok: false; motivo: "email_existe" }> {
  // Defesa em profundidade: a action já barra nome/senha curtos antes de chamar
  // esta função, mas criarUsuario pode ser chamada diretamente (script, teste,
  // outra rota futura) — nunca deve criar conta com dado abaixo do piso.
  if (d.nome.trim().length < 2 || d.senha.length < 8) throw new Error("dados invalidos");
  const senhaHash = await bcrypt.hash(d.senha, 10);
  // Bloqueio total é decisão de produto, mas só faz sentido com canal de e-mail:
  // sem RESEND_API_KEY (nem caixa de teste) a conta nasce confirmada — o
  // comportamento de sempre, zero regressão até a chave existir.
  const confirmacaoPendente = emailTransacionalAtivo();
  try {
    const [linha] = await db
      .insert(users)
      .values({
        nome: d.nome.trim(),
        email: d.email.trim().toLowerCase(),
        senhaHash,
        emailConfirmadoEm: confirmacaoPendente ? null : new Date(),
      })
      .returning({ id: users.id });
    return { ok: true, id: linha.id, confirmacaoPendente };
  } catch (e: any) {
    // drizzle-orm@0.45 envolve o erro do driver em DrizzleQueryError; o código
    // pg real (23505 = unique_violation) vem em e.cause.code, não em e.code.
    const codigoPg = e?.code ?? e?.cause?.code;
    if (codigoPg === "23505") return { ok: false, motivo: "email_existe" }; // unique lower(email)
    throw e;
  }
}

/** Nome/e-mail atuais direto do banco — nunca do session.user (JWT): a sessão
 *  não se atualiza sozinha depois de salvarNome, então usar session.user.name
 *  aqui mostraria o nome antigo até o próximo login. */
export async function buscarUsuario(userId: string): Promise<{ nome: string; email: string } | null> {
  const [u] = await db.select({ nome: users.nome, email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
  return u ?? null;
}

/** Troca de senha exigindo a atual: com conta paga (ciclo Asaas), um cookie de
 *  sessão roubado não pode virar takeover permanente — trocar a senha passa a
 *  provar posse da senha vigente, não só da sessão. */
export async function trocarSenhaVerificando(
  userId: string,
  atual: string,
  nova: string,
): Promise<{ ok: true } | { ok: false; motivo: "senha_atual_errada" }> {
  if (nova.length < 8) throw new Error("dados invalidos");
  const [u] = await db.select({ senhaHash: users.senhaHash }).from(users).where(eq(users.id, userId)).limit(1);
  if (!u || !(await bcrypt.compare(atual, u.senhaHash))) return { ok: false, motivo: "senha_atual_errada" };
  await db.update(users).set({ senhaHash: await bcrypt.hash(nova, 10) }).where(eq(users.id, userId));
  return { ok: true };
}

export async function verificarCredenciais(email: string, senha: string) {
  const [u] = await db.select().from(users)
    .where(eq(sql`lower(${users.email})`, email.trim().toLowerCase())).limit(1);
  if (!u) { await bcrypt.compare(senha, HASH_DUMMY); return null; } // tempo constante
  const senhaOk = await bcrypt.compare(senha, u.senhaHash); // roda sempre — o tempo não muda entre ativo e desativado
  if (!senhaOk) return null;
  // INVARIANTE: não confirmado nunca loga. Checagem depois da senha, para não
  // mudar o perfil de tempo entre existente/inexistente.
  if (!u.emailConfirmadoEm) return null;
  return u.ativo ? u : null;
}

/** Para a página de login distinguir "senha errada" de "falta confirmar":
 *  só roda DEPOIS de um AuthError (caminho raro), custo extra de bcrypt ok.
 *  Roda SEMPRE exatamente um bcrypt.compare — mesma família de defesa contra
 *  timing oracle do hash dummy em verificarCredenciais e do after() em
 *  reenviarConfirmacaoPorEmail/pedirResetPorEmail (este é o 3º caso da série).
 *  Sem isso, quem chama esta função só depois de um AuthError (a action de
 *  login) veria dois perfis de tempo: 1 bcrypt para conta inexistente ou já
 *  confirmada, 2 bcrypts para conta existente e não confirmada — a latência
 *  denunciaria cadastros pendentes de confirmação por e-mail. */
export async function credenciaisValidasMasNaoConfirmadas(email: string, senha: string): Promise<boolean> {
  const [u] = await db.select().from(users)
    .where(eq(sql`lower(${users.email})`, email.trim().toLowerCase())).limit(1);
  const pendente = !!u && !u.emailConfirmadoEm;
  const senhaOk = await bcrypt.compare(senha, pendente ? u.senhaHash : HASH_DUMMY);
  return pendente && senhaOk;
}

/** Emite e envia o link de confirmação. Folga de 60s vira log, não erro —
 *  quem chama nunca precisa tratar. Nunca loga o token. */
export async function emitirEEnviarConfirmacao(userId: string, nome: string, email: string): Promise<void> {
  const t = await emitirToken(userId, "confirmacao");
  if (!t.ok) {
    console.info("[confirmacao] reenvio dentro da folga de 60s", { userId });
    return;
  }
  const msg = emailDeConfirmacao(nome, `${urlBase()}/app/confirmar-email/${t.segredo}`);
  const r = await enviarEmail({ para: email, ...msg });
  if (!r.ok) console.error("[confirmacao] envio falhou", { userId });
}

/** Caminho público de reenvio: resposta é sempre a mesma para quem chama, e no
 *  MESMO TEMPO — mesmo espírito do bcrypt dummy em verificarCredenciais (que
 *  compara contra um hash inválido quando o e-mail não existe, para o tempo
 *  de resposta não denunciar se a conta existe). Aqui o SELECT sozinho já é
 *  rápido e igual nos dois ramos; o que variaria é a transação de emitirToken
 *  + a chamada de rede do envio, que só acontecem quando a conta existe e não
 *  está confirmada. `after` agenda esse trabalho para RODAR DEPOIS da resposta
 *  já ter saído, então a latência do request fica igual nos dois casos. Erros
 *  já são logados dentro de emitirEEnviarConfirmacao. */
export async function reenviarConfirmacaoPorEmail(email: string): Promise<void> {
  const [u] = await db.select({ id: users.id, nome: users.nome, email: users.email, emailConfirmadoEm: users.emailConfirmadoEm })
    .from(users).where(eq(sql`lower(${users.email})`, email.trim().toLowerCase())).limit(1);
  if (!u || u.emailConfirmadoEm) return;
  after(() => emitirEEnviarConfirmacao(u.id, u.nome, u.email));
}

/** Consome o token de confirmação e marca o e-mail como confirmado. */
export async function confirmarEmailPorToken(segredo: string): Promise<boolean> {
  const r = await consumirToken(segredo, "confirmacao");
  if (!r.ok) return false;
  await db.update(users).set({ emailConfirmadoEm: new Date() }).where(eq(users.id, r.userId));
  return true;
}

/** Emite e envia o link de reset. Folga de 60s vira log, não erro. Nunca loga
 *  o token nem o link. */
async function emitirEEnviarReset(userId: string, nome: string, email: string): Promise<void> {
  const t = await emitirToken(userId, "reset");
  if (!t.ok) {
    console.info("[reset] pedido dentro da folga de 60s", { userId });
    return;
  }
  const msg = emailDeReset(nome, `${urlBase()}/app/redefinir-senha/${t.segredo}`);
  const r = await enviarEmail({ para: email, ...msg });
  if (!r.ok) console.error("[reset] envio falhou", { userId });
}

/** Caminho público do "esqueci minha senha": resposta neutra sempre, e NO
 *  MESMO TEMPO — mesmo espírito do bcrypt dummy em verificarCredenciais e do
 *  `after` em reenviarConfirmacaoPorEmail (evita timing oracle que denunciaria
 *  se a conta existe). O SELECT sozinho é rápido e igual nos dois ramos; o que
 *  variaria é a transação de emitirToken + a chamada de rede do envio, que só
 *  acontecem quando a conta existe. `after` agenda esse trabalho para RODAR
 *  DEPOIS da resposta já ter saído, então a latência do request fica igual
 *  nos dois casos. Erros já são logados dentro de emitirEEnviarReset. */
export async function pedirResetPorEmail(email: string): Promise<void> {
  const [u] = await db.select({ id: users.id, nome: users.nome, email: users.email })
    .from(users).where(eq(sql`lower(${users.email})`, email.trim().toLowerCase())).limit(1);
  if (!u) return;
  after(() => emitirEEnviarReset(u.id, u.nome, u.email));
}

/** Redefine a senha com o token. VALIDA ANTES de consumir: senha curta não
 *  pode queimar o link. Reset concluído também confirma o e-mail (posse). */
export async function redefinirSenhaComToken(segredo: string, novaSenha: string): Promise<boolean> {
  if (novaSenha.length < 8) throw new Error("dados invalidos");
  const senhaHash = await bcrypt.hash(novaSenha, 10);
  const r = await consumirToken(segredo, "reset");
  if (!r.ok) return false;
  await db.update(users)
    .set({ senhaHash, emailConfirmadoEm: sql`coalesce(${users.emailConfirmadoEm}, now())` })
    .where(eq(users.id, r.userId));
  return true;
}
