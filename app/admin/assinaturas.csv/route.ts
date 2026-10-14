import { campoCsv } from "@/lib/admin/csv";
import { listarAssinaturas } from "@/lib/assinatura/assinaturas";
import { acaoDoAdmin, hojeSP } from "@/lib/assinatura/regras";

/**
 * Exportação das assinaturas da Solution (2026-10-14): é daqui que sai a lista
 * para o Pecege liberar e revogar acessos. Protegida pelo Basic Auth do
 * middleware, como todo /admin. Sem CPF: ele fica no Asaas.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const linhas = await listarAssinaturas();
  const hoje = hojeSP();
  const fmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
  const csv = [
    ["data", "nome", "email", "telefone", "status", "pago_ate", "fazer", "acesso_liberado_em", "acesso_revogado_em", "cancelada_em"].join(";"),
    ...linhas.map((l) =>
      [
        fmt.format(l.criadaEm),
        l.nome,
        l.email,
        l.telefone,
        l.status,
        l.pagoAte ?? "",
        acaoDoAdmin(l, hoje) ?? "",
        l.acessoLiberadoEm ? fmt.format(l.acessoLiberadoEm) : "",
        l.acessoRevogadoEm ? fmt.format(l.acessoRevogadoEm) : "",
        l.canceladaEm ? fmt.format(l.canceladaEm) : "",
      ]
        .map(campoCsv)
        .join(";"),
    ),
  ].join("\r\n");
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="assinaturas-${hoje}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
