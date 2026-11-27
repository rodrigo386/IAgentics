import { NextResponse } from "next/server";
import { validarCadastro } from "@/lib/nexo-demo/cadastro";
import { cadastrar, marcarEmailEnviado } from "@/lib/nexo-demo/leads";
import { emailAvisoNexoDemo, emailNexoDemo, enviarEmail } from "@/lib/email";
import { enderecoDe, permitir } from "@/lib/assinatura/limite";
import { site } from "@/lib/content";
import { ROTA_NEXO_DEMO } from "@/lib/nexo-demo/rota";

/**
 * Cadastro do Nexo Demo (2026-11-27). A pessoa entra NA HORA (decisão do
 * Rodrigo): a resposta já traz o token de acesso, e o e-mail leva o mesmo
 * token num link, para ela voltar depois. O e-mail não é conferido.
 *
 * - Grava ANTES de mandar e-mail: o contato é o que a página existe para
 *   captar. Falha de envio não derruba o cadastro.
 * - Dois e-mails: o acesso, a quem se cadastrou, e o aviso ao comercial
 *   (`NEXO_DEMO_PARA`, padrão contato@iagentics.com.br).
 * - Campo isca (`site`) e limite por endereço (`NEXO_DEMO_LIMITE`, padrão 10
 *   por hora; o e2e sobe com 1000). Log sem dado pessoal.
 */
export async function POST(request: Request) {
  if (!permitir(`nexo-demo:${enderecoDe(request)}`, Number(process.env.NEXO_DEMO_LIMITE ?? 10), 60 * 60_000)) {
    return NextResponse.json({ error: "limite" }, { status: 429 });
  }
  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (typeof (corpo as { site?: unknown })?.site === "string" && (corpo as { site: string }).site.trim() !== "") {
    return NextResponse.json({ error: "falha" }, { status: 422 });
  }
  const v = validarCadastro(corpo);
  if (!v.ok) return NextResponse.json({ error: v.motivo }, { status: 422 });

  let lead: { id: string; token: string };
  try {
    lead = await cadastrar(v.dados);
  } catch (erro) {
    console.error("[nexo-demo] falha ao gravar", erro instanceof Error ? erro.message.slice(0, 80) : "erro");
    return NextResponse.json({ error: "falha" }, { status: 502 });
  }

  const url = `${site.url}${ROTA_NEXO_DEMO}?acesso=${lead.token}`;
  const [acesso] = await Promise.all([
    enviarEmail({ para: v.dados.email, responderPara: "contato@iagentics.com.br", ...emailNexoDemo(url) }),
    enviarEmail({ para: process.env.NEXO_DEMO_PARA ?? "contato@iagentics.com.br", responderPara: v.dados.email, ...emailAvisoNexoDemo(v.dados, "entrou") }),
  ]);
  if (acesso.ok) await marcarEmailEnviado(lead.id).catch(() => undefined);

  return NextResponse.json({ token: lead.token, empresa: v.dados.empresa });
}
