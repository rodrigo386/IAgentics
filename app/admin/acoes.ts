"use server";
import { revalidatePath } from "next/cache";
import { marcarAcessoLiberado } from "@/lib/catalogo/vendas";

/* Server action do /admin: o POST vai para o caminho do painel, que o
   middleware cobre com o Basic Auth — sem credencial, a ação nem executa. */
export async function liberarAcesso(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await marcarAcessoLiberado(id);
  revalidatePath("/admin");
}
