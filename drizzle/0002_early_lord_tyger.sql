ALTER TABLE "lesson_progress" ADD COLUMN "concluida_em" timestamp with time zone;
--> statement-breakpoint
-- Backfill: linhas já concluídas antes desta coluna existir usam updated_at
-- como a melhor aproximação disponível da data de conclusão.
UPDATE "lesson_progress" SET "concluida_em" = "updated_at" WHERE "concluida";