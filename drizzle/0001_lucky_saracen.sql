CREATE TABLE "settings" (
	"chave" text PRIMARY KEY NOT NULL,
	"valor" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ativo" boolean DEFAULT true NOT NULL;