"use server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { iniciarAssinatura } from "@/lib/asaas/assinatura";

export async function assinarAction(_: unknown, formData: FormData): Promise<{ erro: string } | never> {
  const sessao = await auth();
  if (!sessao?.user?.id) redirect("/app/entrar");
  const r = await iniciarAssinatura(sessao.user.id, String(formData.get("cpf") ?? ""));
  if (!r.ok) return { erro: r.erro };
  // "liberado": self-heal achou pagamento já RECEIVED/CONFIRMED no Asaas (ver
  // lib/asaas/assinatura.ts) — acesso já está ativo, não existe fatura pra ir.
  if ("liberado" in r) redirect("/app");
  redirect(r.url); // fatura hospedada do Asaas (URL externa — redirect aceita absoluta)
}
