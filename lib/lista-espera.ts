import "server-only";
import { db } from "@/lib/db";
import { listaEspera } from "@/lib/db/schema";

/**
 * Lista de espera do lançamento na Solution.
 *
 * A validação vive separada da rota (`validarInscricao`) para ser testável sem
 * subir HTTP nem banco — é ela que carrega as regras, e regra sem teste é
 * regra que muda sozinha.
 */

export type Inscricao = { nome: string; email: string };

export type Validacao =
  | { ok: true; dados: Inscricao }
  | { ok: false; motivo: "nome" | "email" | "consentimento" };

/* Deliberadamente permissivo: exige @ com algo antes e um domínio com ponto, e
   só. Regex de e-mail "completa" é folclore — a RFC aceita coisas que nenhuma
   regex curta cobre, e o preço de errar aqui é recusar um endereço VÁLIDO de
   alguém tentando entrar na lista. Quem digitar errado simplesmente não recebe
   o e-mail; quem for barrado à toa vai embora. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarInscricao(entrada: unknown): Validacao {
  const { nome, email, consentimento } = (entrada ?? {}) as Record<string, unknown>;

  if (typeof nome !== "string" || nome.trim().length < 2) return { ok: false, motivo: "nome" };
  if (typeof email !== "string" || !EMAIL.test(email.trim())) return { ok: false, motivo: "email" };
  /* O consentimento é conferido NO SERVIDOR, não só na marcação do checkbox.
     Ele é a base legal do compartilhamento com o Pecege — aceitar um POST sem
     ele gravaria um dado pessoal sem amparo, e o cliente é território do
     visitante, não nosso. */
  if (consentimento !== true) return { ok: false, motivo: "consentimento" };

  return { ok: true, dados: { nome: nome.trim(), email: email.trim().toLowerCase() } };
}

/**
 * Grava a inscrição. Idempotente por e-mail: reenviar não duplica e não falha.
 *
 * Devolve `jaEstava` para o chamador decidir o que fazer (não mandar o e-mail
 * de boas-vindas duas vezes, por exemplo) — mas a RESPOSTA ao visitante é a
 * mesma nos dois casos, de propósito. Dizer "você já está na lista" confirmaria,
 * para qualquer um que digitasse um endereço alheio, que aquele endereço está
 * na nossa base.
 */
export async function inscrever(dados: Inscricao): Promise<{ jaEstava: boolean }> {
  const linhas = await db
    .insert(listaEspera)
    .values(dados)
    /* Sem `target`: o índice único da tabela é sobre lower(email), uma
       EXPRESSÃO, e o `target` do Drizzle só aceita coluna. Como esta é a única
       constraint única da tabela, o ON CONFLICT sem alvo cobre exatamente o
       mesmo caso — e continua cobrindo se o índice for renomeado. */
    .onConflictDoNothing()
    .returning({ id: listaEspera.id });

  return { jaEstava: linhas.length === 0 };
}
