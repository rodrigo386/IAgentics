CREATE TABLE IF NOT EXISTS "vendas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"criada_em" timestamp with time zone DEFAULT now() NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"telefone" text NOT NULL,
	"itens" jsonb NOT NULL,
	"total_centavos" integer NOT NULL,
	"modo" text NOT NULL,
	"status" text DEFAULT 'pendente' NOT NULL,
	"asaas_cliente_id" text,
	"asaas_cobranca_id" text,
	"url_fatura" text,
	"consentimento_em" timestamp with time zone DEFAULT now() NOT NULL,
	"pago_em" timestamp with time zone,
	"acesso_liberado_em" timestamp with time zone,
	CONSTRAINT "vendas_modo_valido" CHECK ("vendas"."modo" in ('teste', 'real')),
	CONSTRAINT "vendas_status_valido" CHECK ("vendas"."status" in ('pendente', 'pago', 'cancelado', 'estornado', 'falhou'))
);
