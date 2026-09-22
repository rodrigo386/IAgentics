import { listarVendas } from "@/lib/admin/dados";
import { campoCsv } from "@/lib/admin/csv";
import { formatarReais } from "@/lib/catalogo/preco";

/**
 * Exportação das vendas — é daqui que sai a lista para liberar os acessos na
 * Solution. Protegida pelo Basic Auth do middleware, como todo /admin.
 * Sem CPF: ele não existe no nosso banco (fica no Asaas).
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const modo = new URL(request.url).searchParams.get("modo") === "teste" ? "teste" : "real";
  const linhas = await listarVendas(modo);
  const fmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

  const csv = [
    ["data", "nome", "email", "telefone", "cursos", "total", "status", "pago_em", "acesso_liberado_em"].join(";"),
    ...linhas.map((l) =>
      [
        fmt.format(l.criadaEm),
        l.nome,
        l.email,
        l.telefone,
        l.itens.map((i) => i.nome).join(" | "),
        formatarReais(l.totalCentavos),
        l.status,
        l.pagoEm ? fmt.format(l.pagoEm) : "",
        l.acessoLiberadoEm ? fmt.format(l.acessoLiberadoEm) : "",
      ]
        .map(campoCsv)
        .join(";"),
    ),
  ].join("\r\n");

  const hoje = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vendas-${modo}-${hoje}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
