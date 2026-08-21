import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/admin/sessao";
import { criarEmpresa } from "@/lib/admin/contratos";

/**
 * Criação de empresa: POST de FORM NATIVO + 303.
 *
 * Mesma razão de app/admin/alunos/[id]/acoes/route.ts (armadilha 6): sob
 * carga, o React 19 descartava de forma intermitente a RESPOSTA da server
 * action — POST 200, banco gravado, cliente preso em pending, e até o redirect
 * da action se perdia. Aqui quem faz o POST é o navegador, que recebe o 303 e
 * navega. Não existe camada capaz de perder o resultado.
 */
export async function POST(req: Request) {
  await exigirAdmin();
  const form = await req.formData();

  if (String(form.get("acao")) !== "criarEmpresa") {
    return NextResponse.redirect(new URL("/admin/empresas", req.url), 303);
  }

  const r = await criarEmpresa({
    nome: String(form.get("nome") ?? ""),
    cnpj: (String(form.get("cnpj") ?? "").trim() || null) as string | null,
  });

  revalidatePath("/admin/empresas");

  const destino = r.ok
    ? `/admin/empresas/${r.id}?msg=empresaCriada`
    : `/admin/empresas?erro=${r.motivo}`;
  return NextResponse.redirect(new URL(destino, req.url), 303);
}
