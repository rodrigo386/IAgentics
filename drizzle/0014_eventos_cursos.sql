CREATE TABLE IF NOT EXISTS "eventos_cursos" (
	"dia" date NOT NULL,
	"evento" text NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "eventos_cursos_dia_evento_pk" PRIMARY KEY("dia","evento")
);
