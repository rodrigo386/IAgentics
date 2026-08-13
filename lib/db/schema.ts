import { boolean, check, index, integer, numeric, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull().default(""),
  email: text("email").notNull(),
  senhaHash: text("senha_hash").notNull(),
  role: text("role").notNull().default("aluno"),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
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
