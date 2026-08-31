import { inscritos } from "@/lib/admin/dados";

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

function campo(valor: string): string {
  /* Aspas duplicadas e o campo entre aspas: nome com ponto e vírgula ou quebra
     de linha não pode partir a coluna. O `=` inicial é neutralizado porque o
     Excel interpretaria como fórmula — um nome que começa com "=" viraria
     execução na planilha de quem abrir. */
  const seguro = /^[=+\-@]/.test(valor) ? `'${valor}` : valor;
  return `"${seguro.replace(/"/g, '""')}"`;
}

export async function GET() {
  const linhas = await inscritos();
  const fmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

  const csv = [
    ["nome", "email", "inscricao", "consentimento"].join(";"),
    ...linhas.map((l) =>
      [campo(l.nome), campo(l.email), campo(fmt.format(l.criadoEm)), campo(fmt.format(l.consentimentoEm))].join(";"),
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
