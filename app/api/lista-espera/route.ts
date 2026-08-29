import { NextResponse } from "next/server";
import { emailListaEspera, enviarEmail } from "@/lib/email";
import { inscrever, validarInscricao } from "@/lib/lista-espera";

/**
 * Lista de espera do lançamento na Solution.
 *
 * Saem DOIS e-mails: a confirmação para o inscrito e o aviso para a IAgentics.
 *
 * A gravação é o que importa; os dois e-mails são secundários e NUNCA derrubam
 * a inscrição. Se o Resend falhar, a pessoa continua na lista e o log registra
 * — o contrário (perder a inscrição porque um e-mail não saiu) trocaria o
 * essencial pelo acessório. Por isso os envios não são aguardados nem
 * encadeados na resposta.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const validacao = validarInscricao(payload);
  if (!validacao.ok) {
    return NextResponse.json({ error: validacao.motivo }, { status: 422 });
  }

  let jaEstava = false;
  try {
    ({ jaEstava } = await inscrever(validacao.dados));
  } catch (erro) {
    console.error("[lista-espera] falha ao gravar", erro instanceof Error ? erro.message : erro);
    return NextResponse.json({ error: "falha" }, { status: 502 });
  }

  /* Só na primeira vez: reenviar o formulário não vira e-mail repetido, nem
     para o inscrito nem para a caixa da IAgentics. */
  if (!jaEstava) {
    void confirmar(validacao.dados.nome, validacao.dados.email);
    void avisar(validacao.dados.nome, validacao.dados.email);
  }

  /* Resposta idêntica para inscrição nova e repetida, de propósito: responder
     "já estava" confirmaria, para quem digitasse um endereço alheio, que
     aquele endereço está na nossa base. */
  return NextResponse.json({ ok: true });
}

/** Confirmação para quem se inscreveu — com as três marcas no topo. */
async function confirmar(nome: string, email: string) {
  const { ok } = await enviarEmail({ para: email, ...emailListaEspera(nome) });
  if (!ok) console.error("[lista-espera] confirmação não enviada ao inscrito");
}

/** Aviso interno, para a IAgentics acompanhar as inscrições em tempo real. */
async function avisar(nome: string, email: string) {
  const chave = process.env.RESEND_API_KEY;
  if (!chave) {
    console.info("[lista-espera] inscrição registrada (RESEND_API_KEY ausente, sem aviso)");
    return;
  }
  const para = process.env.CONTATO_PARA ?? "rodrigo.costa@iagentics.com.br";
  const de = process.env.CONTATO_DE ?? "IAgentics <nao-responda@iagentics.com.br>";
  try {
    const resposta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        from: de,
        to: [para],
        reply_to: email,
        subject: `Lista de espera: ${nome}`,
        text: `Nova inscrição na lista de espera do lançamento na Solution.\n\nNome: ${nome}\nE-mail: ${email}`,
      }),
    });
    if (!resposta.ok) console.error("[lista-espera] Resend recusou o aviso", resposta.status);
  } catch (erro) {
    console.error("[lista-espera] aviso não enviado", erro instanceof Error ? erro.message : erro);
  }
}
