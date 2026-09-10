import { sql } from "drizzle-orm";
import { date, integer, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

/**
 * Schema do site público.
 *
 * Sobrou UMA tabela. Em 2026-08-28 a plataforma de ensino própria foi
 * desligada (parceria com o Pecege — ver docs/ROADMAP-ACADEMY.md) e com ela
 * saíram as 14 tabelas de aluno, curso, assinatura, certificado e contrato
 * B2B. O histórico delas está no git e nas migrações anteriores.
 *
 * `page_views` ficou porque nunca foi da plataforma: ela é do site
 * institucional, escrita pelo beacon a cada visita. Dropá-la junto teria
 * quebrado o site que continua no ar.
 *
 * `lista_espera` nasceu depois (2026-08-29), com o formulário de espera do
 * lançamento na Solution.
 */

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

/**
 * ENTRADAS: de onde a pessoa veio, contadas uma vez por visita (2026-09-09).
 *
 * NÃO é um recorte de `page_views`, e por isso é tabela separada em vez de uma
 * coluna lá. As duas medem coisas diferentes e nenhuma é derivável da outra:
 * `page_views` conta TODA visualização de página, e `entradas` conta só a
 * PRIMEIRA de cada documento — a chegada. Quem entra pela busca e clica em
 * quatro páginas soma 4 em `page_views` e 1 em `entradas`, o que é justamente
 * o que faz "quantos chegaram pelo Google" ser uma pergunta respondível.
 *
 * A diferença entre os dois totais é a navegação dentro do site, de graça.
 *
 * `origem` é um balde fechado (ver lib/estatisticas.ts), nunca a URL de quem
 * indicou: o beacon manda só o hostname do referrer, sem caminho nem
 * querystring. Cardinalidade máxima: |rotas| × 6 por dia.
 *
 * `rota` aqui é a PÁGINA DE ENTRADA, e é o cruzamento que decide pauta: um
 * artigo que aparece com origem "busca" está trazendo gente de fora.
 */
export const entradas = pgTable("entradas", {
  dia: date("dia").notNull(),
  rota: text("rota").notNull(),
  origem: text("origem").notNull(),
  visitas: integer("visitas").notNull().default(0),
}, (t) => [primaryKey({ columns: [t.dia, t.rota, t.origem] })]);

/**
 * Lista de espera do lançamento das formações na Solution (2026-08-29).
 *
 * É a PRIMEIRA tabela do site com dado pessoal desde o desligamento da
 * plataforma, e por isso carrega mais cuidado que o tamanho dela sugere:
 *
 * - `email` é único por lower() — reenviar o formulário não duplica ninguém,
 *   e a rota trata o conflito como sucesso: quem já está na lista não precisa
 *   saber que já estava, e responder "já cadastrado" vazaria a informação de
 *   que aquele e-mail está na base para quem apenas o digitou.
 * - `consentimentoEm` existe separado de `criadoEm` de propósito. São a mesma
 *   coisa hoje, mas registram fatos diferentes: quando a pessoa entrou, e
 *   quando ela consentiu com o compartilhamento com o Pecege. Se o texto do
 *   consentimento mudar e for preciso recoletar, é esta coluna que diz quem
 *   consentiu sob qual regime — a data de cadastro não serviria de prova.
 */
export const listaEspera = pgTable("lista_espera", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  email: text("email").notNull(),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  consentimentoEm: timestamp("consentimento_em", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("lista_espera_email_unico").on(sql`lower(${t.email})`)]);
