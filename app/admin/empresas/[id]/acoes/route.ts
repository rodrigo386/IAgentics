import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/admin/sessao";
import { criarContrato, importarMembros, readmitirMembro, removerMembro } from "@/lib/admin/contratos";

/**
 * Ações do contrato: criar, importar lista, remover e readmitir membro.
 *
 * Form nativo + 303 (armadilha 6). O feedback viaja por CHAVE na querystring,
 * validada na página contra os mapas de lib/admin/mensagens-empresa.ts —
 * valor desconhecido na URL nunca vira texto na tela.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await exigirAdmin();
  const { id } = await params;
  const form = await req.formData();
  const acao = String(form.get("acao") ?? "");

  let ok = false;
  let motivo = "nao_encontrado";
  let chaveSucesso = "";

  switch (acao) {
    case "criarContrato": {
      const fimBruto = String(form.get("fimEm") ?? "").trim();
      const inicioBruto = String(form.get("inicioEm") ?? "").trim();
      const r = await criarContrato({
        empresaId: id,
        valor: String(form.get("valor") ?? "0"),
        vagas: Number(form.get("vagas") ?? 0),
        inicioEm: inicioBruto ? new Date(inicioBruto) : new Date(),
        /* Vazio = NULO = não expira. É a decisão "depende do contrato": alguns
           com prazo, outros sem. */
        fimEm: fimBruto ? new Date(fimBruto) : null,
        cursos: form.getAll("cursos").map(String),
      });
      ok = r.ok;
      if (!r.ok) motivo = r.motivo;
      chaveSucesso = "contratoCriado";
      break;
    }
    case "importar": {
      const r = await importarMembros(String(form.get("contratoId") ?? ""), String(form.get("emails") ?? ""));
      ok = r.ok;
      if (!r.ok) motivo = r.motivo;
      chaveSucesso = "importados";
      break;
    }
    case "removerMembro": {
      const r = await removerMembro(String(form.get("membroId") ?? ""));
      ok = r.ok;
      if (!r.ok) motivo = r.motivo;
      chaveSucesso = "membroRemovido";
      break;
    }
    case "readmitirMembro": {
      const r = await readmitirMembro(String(form.get("membroId") ?? ""));
      ok = r.ok;
      if (!r.ok) motivo = r.motivo;
      chaveSucesso = "membroReadmitido";
      break;
    }
  }

  /* O direito de acesso é derivado, então não há cache de acesso a limpar —
     mas a página do admin mostra vagas e membros, e essa sim precisa revalidar. */
  revalidatePath(`/admin/empresas/${id}`);
  revalidatePath("/admin/empresas");

  const query = ok ? `?msg=${chaveSucesso}` : `?erro=${motivo}`;
  return NextResponse.redirect(new URL(`/admin/empresas/${id}${query}`, req.url), 303);
}
