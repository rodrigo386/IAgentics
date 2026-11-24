"use server";
import { revalidatePath } from "next/cache";
import { marcarAcessoLiberado } from "@/lib/catalogo/vendas";
import {
  cancelarAssinatura,
  marcarAcessoLiberado as liberarAssinatura,
  marcarAcessoRevogado as revogarAssinatura,
} from "@/lib/assinatura/assinaturas";

/* Server action do /admin: o POST vai para o caminho do painel, que o
   middleware cobre com o Basic Auth — sem credencial, a ação nem executa. */
export async function liberarAcesso(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await marcarAcessoLiberado(id);
  revalidatePath("/admin");
}

/* Assinaturas da Solution (2026-10-14). Os botões vivem no /admin e no
   quadro do fluxo do /admin/cursos (2026-10-16): as duas páginas se atualizam. */
function atualizarPaineis() {
  revalidatePath("/admin");
  revalidatePath("/admin/cursos");
}

export async function liberarAcessoAssinatura(formData: FormData) {
  await liberarAssinatura(String(formData.get("id") ?? ""));
  atualizarPaineis();
}

export async function revogarAcessoAssinatura(formData: FormData) {
  await revogarAssinatura(String(formData.get("id") ?? ""));
  atualizarPaineis();
}

export async function cancelarAssinaturaAdmin(formData: FormData) {
  try {
    await cancelarAssinatura(String(formData.get("id") ?? ""));
  } catch (erro) {
    // Só o código: a mensagem do Asaas pode trazer dado do cliente.
    console.error("[admin] cancelar assinatura falhou", erro instanceof Error ? erro.message.slice(0, 40) : "erro");
  }
  atualizarPaineis();
}
