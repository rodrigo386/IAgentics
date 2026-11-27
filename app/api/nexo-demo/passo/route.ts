import { passoValido, tokenValido } from "@/lib/nexo-demo/cadastro";
import { registrarPasso } from "@/lib/nexo-demo/leads";
import { emailAvisoNexoDemo, enviarEmail } from "@/lib/email";
import { enderecoDe, permitir } from "@/lib/assinatura/limite";
import { AVISO_PADRAO } from "@/lib/nexo-demo/rota";

/**
 * Passo alcançado no Nexo Demo (2026-11-27), ligado ao cadastro (decisão do
 * Rodrigo: o vendedor liga sabendo até onde a pessoa foi). Só o índice do
 * passo viaja; o que a pessoa digitou na demonstração fica no navegador.
 * Responde sempre 204, como /api/eventos: medição nunca atrapalha a tela.
 * Quem chega ao fim dispara, uma vez, o aviso ao comercial.
 */
export async function POST(request: Request) {
  const vazio = new Response(null, { status: 204 });
  if (!permitir(`nexo-demo-passo:${enderecoDe(request)}`, 300, 60 * 60_000)) return vazio;
  const corpo = (await request.json().catch(() => null)) as { token?: unknown; passo?: unknown } | null;
  if (!tokenValido(corpo?.token) || !passoValido(corpo?.passo)) return vazio;
  try {
    const r = await registrarPasso(corpo.token, corpo.passo);
    if (r.concluiuAgora) {
      const { concluiuAgora: _, ...lead } = r;
      await enviarEmail({ para: process.env.NEXO_DEMO_PARA ?? AVISO_PADRAO, responderPara: lead.email, ...emailAvisoNexoDemo(lead, "concluiu") });
    }
  } catch {
    console.error("[nexo-demo] falha ao gravar o passo");
  }
  return vazio;
}
