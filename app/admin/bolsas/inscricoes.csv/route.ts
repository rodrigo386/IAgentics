import { bolsas } from "@/lib/content";
import { campoCsv } from "@/lib/admin/csv";
import { listarInscricoes } from "@/lib/bolsas/inscricoes";
import { grupoDoNivel, type Nivel } from "@/lib/bolsas/regras";

/**
 * CSV das inscrições do Desafio das 50 Bolsas para a banca (2026-11-03).
 * Protegido pelo Basic Auth do middleware, como todo /admin.
 *
 * As colunas de nota vêm VAZIAS, uma por critério e por avaliador, mais a
 * frase de retorno: a banca preenche esta mesma planilha, e é ela que volta
 * para o site na Fase 3 (importação e aplicação das cotas). Não renomeie as
 * colunas sem mudar a importação junto.
 *
 * Ponto e vírgula e BOM, como os outros CSVs do painel.
 */
export const dynamic = "force-dynamic";

const CRITERIOS = ["clareza", "potencial", "comunicacao", "encaixe", "presenca"] as const;

export async function GET() {
  const linhas = await listarInscricoes();
  const fmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
  const f = bolsas.formulario;

  const cabecalho = [
    "id", "inscricao", "nome", "email", "whatsapp", "cargo", "nivel", "grupo_cota", "empresa", "area", "tamanho_time",
    "instagram", "linkedin", "problema", "video", "video_em", "contato_comercial", "uso_imagem",
    ...["a1", "a2"].flatMap((a) => CRITERIOS.map((c) => `${a}_${c}`)),
    "retorno",
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
        l.cargo,
        f.niveis[l.nivel as Nivel] ?? l.nivel,
        grupoDoNivel(l.nivel as Nivel),
        l.empresa,
        f.areas[l.area as keyof typeof f.areas] ?? l.area,
        f.tamanhos[l.tamanhoTime as keyof typeof f.tamanhos] ?? l.tamanhoTime,
        l.instagram ?? "",
        l.linkedin ?? "",
        l.problema,
        l.videoUrl ?? "",
        l.videoEm ? fmt.format(l.videoEm) : "",
        l.contatoComercialEm ? "sim" : "não",
        l.usoImagemEm ? "sim" : "não",
        ...Array(CRITERIOS.length * 2 + 1).fill(""),
      ]
        .map((v) => campoCsv(String(v)))
        .join(";"),
    ),
  ].join("\r\n");

  const hoje = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bolsas-inscricoes-${hoje}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
