CREATE TABLE IF NOT EXISTS "leads_reforma" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"empresa" text NOT NULL,
	"cargo" text,
	"cenario" jsonb NOT NULL,
	"consentimento_em" timestamp with time zone NOT NULL,
	"avisar_aliquotas_em" timestamp with time zone,
	"email_enviado_em" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_reforma_email" ON "leads_reforma" USING btree (lower("email"));
