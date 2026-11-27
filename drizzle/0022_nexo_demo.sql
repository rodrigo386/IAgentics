CREATE TABLE IF NOT EXISTS "nexo_demo_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"email" text NOT NULL,
	"empresa" text NOT NULL,
	"celular" text NOT NULL,
	"linkedin" text NOT NULL,
	"ciencia_em" timestamp with time zone NOT NULL,
	"passo" smallint DEFAULT 0 NOT NULL,
	"passo_em" timestamp with time zone,
	"concluiu_em" timestamp with time zone,
	"email_enviado_em" timestamp with time zone,
	CONSTRAINT "nexo_demo_leads_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "nexo_demo_leads_email" ON "nexo_demo_leads" USING btree (lower("email"));
