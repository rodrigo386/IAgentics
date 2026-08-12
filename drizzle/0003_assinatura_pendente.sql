ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_status_chk";--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_status_chk" CHECK ("status" in ('manual','ativa','inadimplente','cancelada','pendente'));
