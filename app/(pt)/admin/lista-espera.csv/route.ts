import { inscritos } from "@/lib/admin/dados";
import { campoCsv } from "@/lib/admin/csv";

/**
 * Exportação da lista de espera em CSV.
 *
 * Protegida pelo Basic Auth do middleware, como todo /admin — este arquivo não
 * repete a checagem porque o matcher cobre `/admin/:path*`, e duas travas que
 * podem divergir são piores que uma que não pode.
 *
 * Separador PONTO E VÍRGULA e BOM UTF-8: é o que o Excel em português abre
 * direto, com acento certo e sem passar pelo assistente de importação. Vírgula
 * e UTF-8 puro geram a planilha de uma coluna só que todo mundo já viu.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const linhas = await inscritos();
  const fmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

  const csv = [
    ["nome", "email", "inscricao", "consentimento"].join(";"),
    ...linhas.map((l) =>
      [campoCsv(l.nome), campoCsv(l.email), campoCsv(fmt.format(l.criadoEm)), campoCsv(fmt.format(l.consentimentoEm))].join(
        ";",
      ),
    ),
  ].join("\r\n");

  const hoje = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lista-espera-${hoje}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
