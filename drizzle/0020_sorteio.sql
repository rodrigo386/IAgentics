CREATE SEQUENCE IF NOT EXISTS "sorteio_numero" START 1;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sorteio_cadastros" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero" integer DEFAULT nextval('sorteio_numero') NOT NULL,
	"evento" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"whatsapp" text NOT NULL,
	"empresa" text NOT NULL,
	"cargo" text NOT NULL,
	"area" text NOT NULL,
	"regulamento_em" timestamp with time zone NOT NULL,
	"comunicacoes_em" timestamp with time zone,
	"email_enviado_em" timestamp with time zone,
	CONSTRAINT "sorteio_cadastros_numero_unique" UNIQUE("numero")
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "sorteio_evento_email" ON "sorteio_cadastros" USING btree ("evento","email");
