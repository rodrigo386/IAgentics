ALTER TABLE "users" ADD COLUMN "email_confirmado_em" timestamp with time zone;--> statement-breakpoint
-- Backfill: toda conta existente é considerada confirmada — ninguém ativo é
-- trancado para fora quando o bloqueio ligar.
UPDATE "users" SET "email_confirmado_em" = now();--> statement-breakpoint
CREATE TABLE "auth_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "tipo" text NOT NULL,
  "token_hash" text NOT NULL,
  "expira_em" timestamp with time zone NOT NULL,
  "usado_em" timestamp with time zone,
  "criado_em" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "auth_tokens_token_hash_unique" UNIQUE("token_hash"),
  CONSTRAINT "auth_tokens_tipo_chk" CHECK ("tipo" in ('confirmacao','reset'))
);--> statement-breakpoint
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_tokens_user_tipo_idx" ON "auth_tokens" ("user_id","tipo");
