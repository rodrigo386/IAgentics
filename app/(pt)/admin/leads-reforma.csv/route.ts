import { listarLeads } from "@/lib/reforma-leads";
import { campoCsv } from "@/lib/admin/csv";
import { calcular, type Cenario } from "@/lib/reforma";

/**
 * Contatos da calculadora da Reforma Tributária em CSV (2026-11-18). Mesmo
 * formato das outras exportações (ponto e vírgula e BOM, para o Excel em
 * português) e o mesmo Basic Auth do /admin, pelo middleware.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const linhas = await listarLeads(5000);
  const fmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
  const cab = ["nome", "email", "empresa", "cargo", "pedido", "avisar_aliquotas", "email_enviado", "ano", "cotacoes", "regimes", "maior_nota", "diferenca_anual"];
  const csv = [
    cab.join(";"),
    ...linhas.map((l) => {
      const c = l.cenario as Cenario;
      const r = calcular(c);
      return [
        campoCsv(l.nome),
        campoCsv(l.email),
        campoCsv(l.empresa),
        campoCsv(l.cargo ?? ""),
        campoCsv(fmt.format(l.criadoEm)),
        l.avisarAliquotasEm ? "sim" : "não",
        l.emailEnviadoEm ? "sim" : "não",
        String(c.ano),
        String(c.cotacoes.length),
        campoCsv(c.cotacoes.map((q) => q.regime).join(",")),
        String(Math.max(...c.cotacoes.map((q) => q.valor))).replace(".", ","),
        r.diferencaAnual === null ? "" : String(r.diferencaAnual).replace(".", ","),
      ].join(";");
    }),
  ].join("\r\n");
  const hoje = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="calculadora-reforma-${hoje}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
