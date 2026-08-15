-- Editada à mão depois do generate: o snapshot 0005 (autorado manualmente no
-- ciclo da confirmação de e-mail) não registrava "certificates" nem o check de
-- subscriptions, então o diff quis recriar objetos que JÁ EXISTEM no banco e a
-- migração falharia no primeiro CREATE. Só o que é novo de verdade fica aqui;
-- o snapshot 0006 gerado junto reflete o schema completo e conserta a cadeia.
CREATE TABLE "page_views" (
	"dia" date NOT NULL,
	"rota" text NOT NULL,
	"visitas" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "page_views_dia_rota_pk" PRIMARY KEY("dia","rota")
);
