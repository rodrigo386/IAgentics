import { NextResponse } from "next/server";
import { acessoMaisRecentePorEmail } from "@/lib/nexo-demo/leads";
import { emailNexoDemo, enviarEmail } from "@/lib/email";
import { enderecoDe, permitir } from "@/lib/assinatura/limite";
import { site } from "@/lib/content";
import { ROTA_NEXO_DEMO } from "@/lib/nexo-demo/rota";

/**
 * Login de quem já tem cadastro no Nexo Demo (2026-11-27, pedido do Rodrigo:
 * "tela para login para quem já tem cadastro"). Não há senha: a pessoa digita
 * o e-mail e recebe NELE o link de acesso do cadastro mais recente.
 *
 * Entrar só por digitar o e-mail, sem passar pela caixa de entrada, daria a
 * qualquer um o nome, a empresa e o avanço de outra pessoa. Por isso a
 * resposta é SEMPRE a mesma, exista o cadastro ou não: a tela não confirma
 * quem está na base. Limite por endereço e por e-mail (para ninguém encher a
 * caixa de um terceiro). Log sem dado pessoal.
 */
export async function POST(request: Request) {
  const limite = Number(process.env.NEXO_DEMO_LIMITE ?? 10);
  if (!permitir(`nexo-demo-login:${enderecoDe(request)}`, limite, 60 * 60_000)) {
    return NextResponse.json({ error: "limite" }, { status: 429 });
  }
  const corpo = (await request.json().catch(() => null)) as { email?: unknown; site?: unknown } | null;
  const email = typeof corpo?.email === "string" ? corpo.email.trim().toLowerCase().slice(0, 200) : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return NextResponse.json({ error: "email" }, { status: 422 });
  const ok = NextResponse.json({ ok: true });
  if (typeof corpo?.site === "string" && corpo.site.trim() !== "") return ok;
  if (!permitir(`nexo-demo-login-email:${email}`, Math.min(limite, 3), 60 * 60_000)) return ok;
  try {
    const acesso = await acessoMaisRecentePorEmail(email);
    if (acesso) {
      const r = await enviarEmail({ para: email, responderPara: "contato@iagentics.com.br", ...emailNexoDemo(acesso.nome, `${site.url}${ROTA_NEXO_DEMO}?acesso=${acesso.token}`) });
      if (!r.ok) console.error("[nexo-demo] link de login não enviado");
    }
  } catch {
    console.error("[nexo-demo] falha no login");
  }
  return ok;
}
