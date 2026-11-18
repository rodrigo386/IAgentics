ALTER TABLE "bolsas_inscricoes" ADD COLUMN IF NOT EXISTS "clareza" smallint;
--> statement-breakpoint
ALTER TABLE "bolsas_inscricoes" ADD COLUMN IF NOT EXISTS "solucao_30_dias" smallint;
--> statement-breakpoint
ALTER TABLE "bolsas_inscricoes" ADD COLUMN IF NOT EXISTS "seguiu_academy" boolean;
--> statement-breakpoint
ALTER TABLE "bolsas_inscricoes" ADD COLUMN IF NOT EXISTS "publicou_post" boolean;
--> statement-breakpoint
ALTER TABLE "bolsas_inscricoes" ADD COLUMN IF NOT EXISTS "observacao" text;
--> statement-breakpoint
ALTER TABLE "bolsas_inscricoes" ADD COLUMN IF NOT EXISTS "resultado_enviado_em" timestamp with time zone;
