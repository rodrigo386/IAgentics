CREATE TABLE "contrato_cursos" (
	"contrato_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	CONSTRAINT "contrato_cursos_contrato_id_course_id_pk" PRIMARY KEY("contrato_id","course_id")
);
--> statement-breakpoint
CREATE TABLE "contrato_membros" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contrato_id" uuid NOT NULL,
	"email" text NOT NULL,
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"removido_em" timestamp with time zone,
	CONSTRAINT "contrato_membros_email_minusculo_chk" CHECK ("contrato_membros"."email" = lower("contrato_membros"."email"))
);
--> statement-breakpoint
CREATE TABLE "contratos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"valor" numeric(10, 2) NOT NULL,
	"vagas" integer NOT NULL,
	"inicio_em" timestamp with time zone DEFAULT now() NOT NULL,
	"fim_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contratos_vagas_chk" CHECK ("contratos"."vagas" > 0),
	CONSTRAINT "contratos_periodo_chk" CHECK ("contratos"."fim_em" is null or "contratos"."fim_em" > "contratos"."inicio_em")
);
--> statement-breakpoint
CREATE TABLE "empresas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"cnpj" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contrato_cursos" ADD CONSTRAINT "contrato_cursos_contrato_id_contratos_id_fk" FOREIGN KEY ("contrato_id") REFERENCES "public"."contratos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contrato_cursos" ADD CONSTRAINT "contrato_cursos_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contrato_membros" ADD CONSTRAINT "contrato_membros_contrato_id_contratos_id_fk" FOREIGN KEY ("contrato_id") REFERENCES "public"."contratos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contrato_membros" ADD CONSTRAINT "contrato_membros_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contrato_membros_contrato_idx" ON "contrato_membros" USING btree ("contrato_id");--> statement-breakpoint
CREATE INDEX "contrato_membros_email_idx" ON "contrato_membros" USING btree ("email");--> statement-breakpoint
CREATE INDEX "contrato_membros_user_idx" ON "contrato_membros" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "contrato_membros_ativo_unico" ON "contrato_membros" USING btree ("contrato_id","email") WHERE "contrato_membros"."removido_em" is null;--> statement-breakpoint
CREATE INDEX "contratos_empresa_idx" ON "contratos" USING btree ("empresa_id");