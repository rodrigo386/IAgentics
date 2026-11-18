ALTER TABLE "bolsas_inscricoes" ALTER COLUMN "cargo" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "bolsas_inscricoes" ALTER COLUMN "nivel" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "bolsas_inscricoes" ALTER COLUMN "area" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "bolsas_inscricoes" ALTER COLUMN "tamanho_time" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "bolsas_inscricoes" ADD COLUMN IF NOT EXISTS "grupo_whatsapp_em" timestamp with time zone;
