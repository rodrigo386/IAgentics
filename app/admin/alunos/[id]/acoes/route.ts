import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/admin/sessao";
import {
  confirmarEmailManual,
  definirAtivo,
  definirRole,
  liberarAcesso,
  revogarAcesso,
  type ResultadoAcao,
} from "@/lib/admin/alunos";

/**
 * As ações rápidas da ficha do aluno como POST de FORM NATIVO + 303.
 *
 * Por que um route handler e não server action (2026-08-15): sob carga, o
 * React 19 descartava de forma intermitente a RESPOSTA da action - POST 200,
 * banco gravado, e o cliente preso em pending (nem o redirect da action
 * escapava, porque ele também viaja na resposta que o React descarta). Aqui o
 * form é HTML puro: o NAVEGADOR faz o POST, recebe o 303 e navega. Não existe
 * camada que possa perder o resultado.
 *
 * Segurança igual às actions: exigirAdmin (404 para não-admin), regras de
 * "a si mesmo" recusadas nas funções de lib/admin/alunos.ts, e o feedback via
 * chave de querystring validada (lib/admin/mensagens-aluno.ts).
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const executor = await exigirAdmin();
  const { id } = await params;
  const form = await req.formData();
  const acao = String(form.get("acao") ?? "");

  let r: ResultadoAcao;
  let chave: string;
  switch (acao) {
    case "liberar":
      r = await liberarAcesso(executor.id, id);
      chave = "acessoLiberado";
      break;
    case "revogar":
      r = await revogarAcesso(executor.id, id);
      chave = "acessoRevogado";
      break;
    case "tornar-admin":
      r = await definirRole(executor.id, id, "admin");
      chave = "salvo";
      break;
    case "tornar-aluno":
      r = await definirRole(executor.id, id, "aluno");
      chave = "salvo";
      break;
    case "desativar":
      r = await definirAtivo(executor.id, id, false);
      chave = "contaDesativada";
      break;
    case "reativar":
      r = await definirAtivo(executor.id, id, true);
      chave = "contaReativada";
      break;
    case "confirmar-email":
      r = await confirmarEmailManual(executor.id, id);
      chave = "emailConfirmadoOk";
      break;
    default:
      return NextResponse.redirect(new URL(`/admin/alunos/${id}`, req.url), 303);
  }

  if (r.ok) {
    revalidatePath("/admin/alunos");
    revalidatePath(`/admin/alunos/${id}`);
  }
  const destino = new URL(`/admin/alunos/${id}`, req.url);
  if (r.ok) destino.searchParams.set("msg", chave);
  else destino.searchParams.set("erro", r.motivo);
  // 303 See Other: o navegador troca o POST por GET no destino - nunca 307,
  // que re-enviaria o POST para a página.
  return NextResponse.redirect(destino, 303);
}
