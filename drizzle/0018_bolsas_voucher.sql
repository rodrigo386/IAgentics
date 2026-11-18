ALTER TABLE "bolsas_inscricoes" ADD COLUMN IF NOT EXISTS "voucher_codigo" text;
--> statement-breakpoint
ALTER TABLE "bolsas_inscricoes" ADD COLUMN IF NOT EXISTS "voucher_enviado_em" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "bolsas_inscricoes" ADD COLUMN IF NOT EXISTS "voucher_valido_ate" date;
--> statement-breakpoint
ALTER TABLE "bolsas_inscricoes" ADD COLUMN IF NOT EXISTS "voucher_usado_em" timestamp with time zone;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "bolsas_inscricoes_voucher_unico" ON "bolsas_inscricoes" ("voucher_codigo");
--> statement-breakpoint
ALTER TABLE "assinaturas" ADD COLUMN IF NOT EXISTS "preco_fundador_ate" date;
--> statement-breakpoint
ALTER TABLE "assinaturas" ADD COLUMN IF NOT EXISTS "bolsa_inscricao_id" uuid;
