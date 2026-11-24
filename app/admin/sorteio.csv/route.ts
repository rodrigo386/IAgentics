import { campoCsv } from "@/lib/admin/csv";
import { listarCadastros } from "@/lib/sorteio/cadastros";
import { formatarNumero } from "@/lib/sorteio/regras";

/** CSV dos cadastros do sorteio no Case 2026 (2026-11-23), para sortear por fora e para os leads. Ponto e vírgula e BOM, como os outros CSVs do painel. */
export const dynamic = "force-dynamic";

export async function GET() {
  const linhas = await listarCadastros();
  const fmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
  const cabecalho = ["numero", "cadastro", "nome", "email", "whatsapp", "area", "empresa", "cargo", "comunicacoes", "email_enviado"];
  const csv = [
    cabecalho.join(";"),
    ...[...linhas]
      .sort((a, b) => a.numero - b.numero)
      .map((l) =>
        [
          formatarNumero(l.numero),
          fmt.format(l.criadoEm),
          l.nome,
          l.email,
          l.whatsapp,
          l.area,
          l.empresa,
          l.cargo,
          l.comunicacoesEm ? "sim" : "não",
          l.emailEnviadoEm ? "sim" : "não",
        ]
          .map((v) => campoCsv(String(v)))
          .join(";"),
      ),
  ].join("\r\n");
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="sorteio-case-2026.csv"',
      "Cache-Control": "no-store",
    },
  });
}
