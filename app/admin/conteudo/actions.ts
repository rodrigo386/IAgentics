"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/admin/sessao";
import { criarCurso } from "@/lib/admin/conteudo";
import { admin } from "@/lib/content-admin";

type Estado = { erro: string | null };

/** Única action deste arquivo: criar curso. As demais (salvar, publicar,
 *  módulos, aulas, mídia) vivem em [slug]/actions.ts, que já opera sobre um
 *  curso carregado — esta aqui ainda não tem slug até o insert acontecer. */
export async function criarCursoAction(_estado: Estado, formData: FormData): Promise<Estado> {
  await exigirAdmin();
  const titulo = String(formData.get("titulo") ?? "").trim();
  if (!titulo) return { erro: admin.conteudo.erros.generico };

  const resultado = await criarCurso(titulo);
  if (!resultado.ok) return { erro: admin.conteudo.erros.slugExiste };

  revalidatePath("/admin/conteudo");
  redirect(`/admin/conteudo/${resultado.slug}`);
}
