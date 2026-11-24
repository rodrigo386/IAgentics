import { campoCsv } from "@/lib/admin/csv";
import { listarInscricoes } from "@/lib/bolsas/inscricoes";

/**
 * CSV das inscrições do Desafio Prova Real para a avaliação (2026-11-03;
 * refeito em 2026-11-18). Protegido pelo Basic Auth do middleware, como todo
 * /admin.
 *
 * As colunas de avaliação trazem o que já foi preenchido no painel (vazias
 * se nada foi): clareza e solução em 30 dias, em nota; seguiu a página e
 * publicou o post, em sim ou não; mais o status e a observação. Ponto e vírgula e BOM, como os outros
 * CSVs do painel.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const linhas = await listarInscricoes();
  const fmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

  const cabecalho = [
    "id", "inscricao", "nome", "email", "whatsapp", "empresa", "instagram", "linkedin", "problema",
    "status", "grupo_whatsapp", "contato_comercial", "uso_imagem",
    "clareza", "solucao_30_dias", "seguiu_academy", "publicou_post", "observacao",
  ];

  const csv = [
    cabecalho.join(";"),
    ...linhas.map((l) =>
      [
        l.id,
        fmt.format(l.criadaEm),
        l.nome,
        l.email,
        l.whatsapp,
        l.empresa,
        l.instagram ?? "",
        l.linkedin ?? "",
        l.problema,
        l.status,
        l.grupoWhatsappEm ? "sim" : "não",
        l.contatoComercialEm ? "sim" : "não",
        l.usoImagemEm ? "sim" : "não",
        l.clareza ?? "",
        l.solucao30Dias ?? "",
        l.seguiuAcademy === null ? "" : l.seguiuAcademy ? "sim" : "não",
        l.publicouPost === null ? "" : l.publicouPost ? "sim" : "não",
        l.observacao ?? "",
      ]
        .map((v) => campoCsv(String(v)))
        .join(";"),
    ),
  ].join("\r\n");

  const hoje = new Date().toISOString().slice(0, 10);
  return new Response("\ufeff" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="prova-real-inscricoes-${hoje}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
