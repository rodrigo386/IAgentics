import { boolean, check, date, index, integer, numeric, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull().default(""),
  email: text("email").notNull(),
  senhaHash: text("senha_hash").notNull(),
  role: text("role").notNull().default("aluno"),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  emailConfirmadoEm: timestamp("email_confirmado_em", { withTimezone: true }),
}, (t) => [
  uniqueIndex("users_email_unico").on(sql`lower(${t.email})`),
  check("users_role_chk", sql`${t.role} in ('aluno','admin')`),
]);

/** Configurações-chave/valor do admin (Task 4+). Upsert por chave. */
export const settings = pgTable("settings", {
  chave: text("chave").primaryKey(),
  valor: text("valor").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  titulo: text("titulo").notNull(),
  descricao: text("descricao").notNull().default(""),
  capaUrl: text("capa_url").notNull().default(""),
  nivel: text("nivel").notNull().default("Iniciante"),
  cargaHoras: numeric("carga_horas").notNull().default("0"),
  publicado: boolean("publicado").notNull().default(false),
  ordem: integer("ordem").notNull().default(0),
});

export const modules = pgTable("modules", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  titulo: text("titulo").notNull(),
  ordem: integer("ordem").notNull().default(0),
});

export const lessons = pgTable("lessons", {
  id: uuid("id").primaryKey().defaultRandom(),
  moduleId: uuid("module_id").notNull().references(() => modules.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  titulo: text("titulo").notNull(),
  descricao: text("descricao").notNull().default(""),
  duracaoSeg: integer("duracao_seg").notNull().default(0),
  ordem: integer("ordem").notNull().default(0),
  gratuita: boolean("gratuita").notNull().default(false),
}, (t) => [uniqueIndex("lessons_modulo_slug").on(t.moduleId, t.slug)]);

/** Separada de lessons DE PROPÓSITO: com YouTube não listado o ID é o acesso.
 *  A camada de dados só entrega esta linha depois de decidir autorização. */
export const lessonMedia = pgTable("lesson_media", {
  lessonId: uuid("lesson_id").primaryKey().references(() => lessons.id, { onDelete: "cascade" }),
  videoProvider: text("video_provider").notNull().default("youtube"),
  videoId: text("video_id").notNull(),
}, (t) => [check("media_provider_chk", sql`${t.videoProvider} in ('youtube','panda','mux')`)]);

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  asaasCustomerId: text("asaas_customer_id"),
  asaasSubscriptionId: text("asaas_subscription_id"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("subscriptions_user_idx").on(t.userId),
  check("subscriptions_status_chk", sql`${t.status} in ('manual','ativa','inadimplente','cancelada','pendente')`),
]);

export const lessonProgress = pgTable("lesson_progress", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lessonId: uuid("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  concluida: boolean("concluida").notNull().default(false),
  segundosAssistidos: integer("segundos_assistidos").notNull().default(0),
  // Quando a aula foi concluída pela PRIMEIRA vez — nunca "refresca" em replay
  // (ver gravarProgresso). updatedAt continua subindo a cada toque (último
  // acesso da Task 2 depende disso); concluidaEm é o proxy correto pra
  // métricas de "aulas concluídas por período" (Task 3).
  concluidaEm: timestamp("concluida_em", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.userId, t.lessonId] })]);

/** Certificados de conclusão: um por aluno por formação, válido PARA SEMPRE
 *  (decisão do ciclo: a página pública não checa assinatura). `codigo` é a
 *  chave da URL pública — unique, alfabeto sem ambíguos, gerado em
 *  lib/plataforma/certificados.ts. */
export const certificates = pgTable("certificates", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  codigo: text("codigo").notNull().unique(),
  emitidoEm: timestamp("emitido_em", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("certificates_aluno_curso_unico").on(t.userId, t.courseId)]);

/** Tokens de uso único dos fluxos de e-mail (confirmação de cadastro e reset
 *  de senha). O banco guarda só o SHA-256 do segredo; o segredo vive apenas na
 *  URL enviada por e-mail. Ver lib/plataforma/tokens.ts. */
export const authTokens = pgTable("auth_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tipo: text("tipo").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiraEm: timestamp("expira_em", { withTimezone: true }).notNull(),
  usadoEm: timestamp("usado_em", { withTimezone: true }),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("auth_tokens_user_tipo_idx").on(t.userId, t.tipo),
  check("auth_tokens_tipo_chk", sql`${t.tipo} in ('confirmacao','reset')`),
]);

/** Visitas do site público, agregadas por dia+rota - alimentadas pelo beacon
 *  (components/site/Beacon.tsx → app/api/estatisticas/route.ts). Agregado de
 *  propósito: nenhum dado pessoal, nenhum cookie, nenhum user-agent; a
 *  cardinalidade de `rota` é limitada pelo normalizador em lib/estatisticas.ts
 *  (seções conhecidas + "/outras"), então a tabela cresce no máximo
 *  |rotas| linhas por dia. */
export const pageViews = pgTable("page_views", {
  dia: date("dia").notNull(),
  rota: text("rota").notNull(),
  visitas: integer("visitas").notNull().default(0),
}, (t) => [primaryKey({ columns: [t.dia, t.rota] })]);

/* ---------------------------------------------------------------------------
   VENDA B2B EM GRUPO (etapa 2, 2026-08-20)

   Uma empresa contrata acesso para N pessoas a CURSOS ESPECÍFICOS, cobrado
   fora do Asaas. É por isso que a etapa 1 existiu: acesso deixou de ser
   booleano e virou conjunto de cursos.

   O contrato é a SEGUNDA fonte de direito (a primeira é a assinatura), e as
   duas se somam em UNIÃO — nunca "a mais recente vence". Ver
   lib/plataforma/dados.ts e o spec em
   docs/superpowers/specs/2026-08-20-contrato-b2b-design.md
--------------------------------------------------------------------------- */

export const empresas = pgTable("empresas", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  cnpj: text("cnpj"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contratos = pgTable("contratos", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  /** Guardado já aqui para a etapa 4 somar ao MRR sem exigir migração nova. */
  valor: numeric("valor", { precision: 10, scale: 2 }).notNull(),
  vagas: integer("vagas").notNull(),
  inicioEm: timestamp("inicio_em", { withTimezone: true }).notNull().defaultNow(),
  /** NULO = não expira. A decisão do Rodrigo foi "depende do contrato". */
  fimEm: timestamp("fim_em", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("contratos_empresa_idx").on(t.empresaId),
  check("contratos_vagas_chk", sql`${t.vagas} > 0`),
  check("contratos_periodo_chk", sql`${t.fimEm} is null or ${t.fimEm} > ${t.inicioEm}`),
]);

/** Os cursos que o contrato libera. É esta tabela que torna o contrato
 *  específico por curso — sem ela, a etapa 1 não teria razão de existir. */
export const contratoCursos = pgTable("contrato_cursos", {
  contratoId: uuid("contrato_id").notNull().references(() => contratos.id, { onDelete: "cascade" }),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.contratoId, t.courseId] })]);

/**
 * Membro do contrato, chaveado por E-MAIL — não por usuário.
 *
 * É o que permite PRÉ-AUTORIZAR alguém que ainda não tem conta: o admin importa
 * a lista, `userId` nasce nulo, e é preenchido quando a pessoa cria a conta com
 * aquele e-mail. Não existe canal de e-mail em produção (RESEND_API_KEY é
 * pendência), então convite por e-mail não era opção — ver o spec.
 *
 * Remoção é LÓGICA (`removidoEm`): a vaga volta, o histórico fica para a etapa
 * 3 relatar ao gestor, e quem for readmitido reencontra o próprio progresso,
 * que está preso ao userId e não à participação.
 */
export const contratoMembros = pgTable("contrato_membros", {
  id: uuid("id").primaryKey().defaultRandom(),
  contratoId: uuid("contrato_id").notNull().references(() => contratos.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  removidoEm: timestamp("removido_em", { withTimezone: true }),
}, (t) => [
  index("contrato_membros_contrato_idx").on(t.contratoId),
  index("contrato_membros_email_idx").on(t.email),
  index("contrato_membros_user_idx").on(t.userId),
  /* O BANCO recusa caixa alta, não só o código. `users` tem unique sobre
     lower(email); se a planilha do cliente trouxer "Maria@Empresa.com" e a
     conta for "maria@empresa.com", a pessoa fica pré-autorizada e NUNCA recebe
     acesso — falha silenciosa e chata de diagnosticar. Aqui ela morre na
     origem, sem depender de disciplina de quem escrever a próxima função. */
  check("contrato_membros_email_minusculo_chk", sql`${t.email} = lower(${t.email})`),
  /* Mesmo e-mail não entra duas vezes ATIVO no mesmo contrato. Removidos podem
     repetir: readmissão gera linha nova, preservando o histórico. */
  uniqueIndex("contrato_membros_ativo_unico")
    .on(t.contratoId, t.email)
    .where(sql`${t.removidoEm} is null`),
]);
