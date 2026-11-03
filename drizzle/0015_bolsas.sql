CREATE TABLE IF NOT EXISTS "bolsas_inscricoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"criada_em" timestamp with time zone DEFAULT now() NOT NULL,
	"token" text NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"whatsapp" text NOT NULL,
	"cargo" text NOT NULL,
	"nivel" text NOT NULL,
	"empresa" text NOT NULL,
	"area" text NOT NULL,
	"tamanho_time" text NOT NULL,
	"instagram" text,
	"linkedin" text,
	"problema" text NOT NULL,
	"video_url" text,
	"video_em" timestamp with time zone,
	"status" text DEFAULT 'inscrito' NOT NULL,
	"regulamento_em" timestamp with time zone NOT NULL,
	"ciencia_dados_em" timestamp with time zone NOT NULL,
	"contato_comercial_em" timestamp with time zone,
	"uso_imagem_em" timestamp with time zone,
	CONSTRAINT "bolsas_inscricoes_token_unique" UNIQUE("token"),
	CONSTRAINT "bolsas_inscricoes_status_valido" CHECK ("bolsas_inscricoes"."status" in ('inscrito', 'selecionado', 'espera', 'nao_selecionado', 'aceitou', 'perdeu'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "bolsas_inscricoes_email_unico" ON "bolsas_inscricoes" USING btree (lower("email"));
