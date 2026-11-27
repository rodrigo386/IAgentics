import { campoCsv } from "@/lib/admin/csv";
import { listarLeads } from "@/lib/nexo-demo/leads";
import { PASSOS } from "@/lib/nexo-demo/regras";

/** CSV dos cadastros do Nexo Demo (2026-11-27), para o comercial. Ponto e vírgula e BOM, como os outros CSVs do painel. */
export const dynamic = "force-dynamic";

export async function GET() {
  const linhas = await listarLeads(10_000);
  const fmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
  const cabecalho = ["cadastro", "empresa", "email", "celular", "linkedin", "passo", "ate_onde_foi", "ultimo_avanco", "concluiu", "email_enviado"];
  const csv = [
    cabecalho.join(";"),
    ...linhas.map((l) =>
      [
        fmt.format(l.criadoEm),
        l.empresa,
        l.email,
        l.celular,
        l.linkedin,
        `${l.passo + 1}/${PASSOS.length}`,
        PASSOS[l.passo] ?? PASSOS[0],
        l.passoEm ? fmt.format(l.passoEm) : "",
        l.concluiuEm ? "sim" : "não",
        l.emailEnviadoEm ? "sim" : "não",
      ]
        .map((v) => campoCsv(String(v)))
        .join(";"),
    ),
  ].join("\r\n");
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="nexo-demo.csv"',
      "Cache-Control": "no-store",
    },
  });
}
