CREATE TABLE IF NOT EXISTS "entradas" (
	"dia" date NOT NULL,
	"rota" text NOT NULL,
	"origem" text NOT NULL,
	"visitas" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "entradas_dia_rota_origem_pk" PRIMARY KEY("dia","rota","origem")
);
