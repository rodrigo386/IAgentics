"use server";
import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/admin/sessao";
import { salvarConfiguracoes } from "@/lib/admin/configuracoes";
import { admin } from "@/lib/content-admin";

// Vazio é aceito (limpa o valor); se preenchido, tem que começar por "/" ou
// "http(s)://" — evita salvar algo que nunca vira link clicável válido.
const CTA_VALIDA = /^(\/|https?:\/\/)/;

type Estado = { ok: true } | { ok: false; erro: string };

export async function salvarConfiguracoesAction(valores: {
  ctaDestino: string;
  avisoTopo: string;
  emailContato: string;
}): Promise<Estado> {
  await exigirAdmin();

  const ctaDestino = valores.ctaDestino.trim();
  if (ctaDestino && !CTA_VALIDA.test(ctaDestino)) {
    return { ok: false, erro: admin.configuracoes.erros.urlInvalida };
  }

  await salvarConfiguracoes({
    cta_destino: ctaDestino,
    aviso_topo: valores.avisoTopo.trim(),
    email_contato: valores.emailContato.trim(),
  });

  // /app: a faixa de aviso e o CTA das travas dependem do que acabou de ser
  // salvo. /admin/configuracoes: o próprio formulário, para refletir o valor
  // já normalizado (trim) na próxima leitura via lerTodas().
  revalidatePath("/app");
  revalidatePath("/admin/configuracoes");
  return { ok: true };
}
