import { NextResponse } from "next/server";
import { agoraSorteio, cadastroAberto, formatarNumero, validarCadastro } from "@/lib/sorteio/regras";
import { cadastrar, marcarEmailEnviado } from "@/lib/sorteio/cadastros";
import { emailSorteio, enviarEmail } from "@/lib/email";
import { enderecoDe, permitir } from "@/lib/assinatura/limite";

/**
 * Cadastro do sorteio no Case 2026 (/sorteio, 2026-11-23).
 *
 * - Depois das 18h de 26/11 (SP), recusa com 409.
 * - Campo isca (`site`): preenchido, é robô. Responde como repetido e não grava.
 * - Limite por endereço (`SORTEIO_LIMITE`, padrão 30 por hora): no estande,
 *   muita gente se cadastra pelo MESMO wi-fi do evento, então o limite é mais
 *   folgado que o da /bolsas. O e2e sobe com 1000.
 * - Cadastro novo devolve o número e manda o e-mail (que não derruba o
 *   cadastro). E-mail repetido responde `repetido`, sem o número.
 * - Log sem dado pessoal.
 */
export async function POST(request: Request) {
  if (!cadastroAberto(agoraSorteio())) return NextResponse.json({ error: "fechado" }, { status: 409 });
  if (!permitir(`sorteio:${enderecoDe(request)}`, Number(process.env.SORTEIO_LIMITE ?? 30), 60 * 60_000)) {
    return NextResponse.json({ error: "limite" }, { status: 429 });
  }

  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (typeof (corpo as { site?: unknown })?.site === "string" && (corpo as { site: string }).site.trim() !== "") {
    return NextResponse.json({ repetido: true });
  }

  const v = validarCadastro(corpo);
  if (!v.ok) return NextResponse.json({ error: v.motivo }, { status: 422 });

  let r: Awaited<ReturnType<typeof cadastrar>>;
  try {
    r = await cadastrar(v.dados);
  } catch (erro) {
    console.error("[sorteio] falha ao gravar", erro instanceof Error ? erro.message.slice(0, 80) : "erro");
    return NextResponse.json({ error: "falha" }, { status: 502 });
  }
  if (!r.novo) return NextResponse.json({ repetido: true });

  const numero = formatarNumero(r.numero);
  const enviado = await enviarEmail({ para: v.dados.email, responderPara: "contato@iagentics.com.br", ...emailSorteio(v.dados.nome, numero) });
  if (enviado.ok) await marcarEmailEnviado(r.id).catch(() => undefined);
  else console.error("[sorteio] número não enviado por e-mail");

  return NextResponse.json({ numero });
}
