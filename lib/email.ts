import "server-only";
import { site, diagnose } from "@/lib/content";
import { chave, decimal, maiorSalto, nivel, resumir, type EnvioValido } from "@/lib/diagnose";

/**
 * Envio transacional do site.
 *
 * Existe desde 2026-08-29, com a lista de espera. É o herdeiro enxuto do
 * antigo canal da plataforma: só o que o site público precisa.
 */

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function enviarEmail(msg: {
  para: string;
  assunto: string;
  texto: string;
  html: string;
  /** Para onde vai o "responder" (o remetente é nao-responda). */
  responderPara?: string;
  /** Anexos em texto (o Resend recebe o conteúdo em base64). */
  anexos?: { arquivo: string; conteudo: string }[];
}): Promise<{ ok: boolean }> {
  const chave = process.env.RESEND_API_KEY;
  if (!chave) return { ok: false };
  try {
    const resposta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        from: process.env.CONTATO_DE ?? "IAgentics <nao-responda@iagentics.com.br>",
        to: [msg.para],
        subject: msg.assunto,
        ...(msg.responderPara ? { reply_to: msg.responderPara } : {}),
        text: msg.texto,
        html: msg.html,
        ...(msg.anexos?.length
          ? { attachments: msg.anexos.map((a) => ({ filename: a.arquivo, content: Buffer.from(a.conteudo, "utf-8").toString("base64") })) }
          : {}),
      }),
    });
    if (!resposta.ok) {
      console.error("[email] Resend recusou", resposta.status);
      return { ok: false };
    }
    return { ok: true };
  } catch (erro) {
    console.error("[email] falha no envio", erro instanceof Error ? erro.message : erro);
    return { ok: false };
  }
}

/**
 * Faixa com as três marcas, no topo do e-mail.
 *
 * É UMA imagem, não três, e hospedada em URL absoluta — as duas coisas são
 * decisões de entregabilidade, não preguiça:
 *
 * - Uma imagem só garante o alinhamento entre as marcas em qualquer cliente.
 *   Três <img> lado a lado dependem de CSS que Outlook e Gmail tratam de
 *   formas diferentes, e o resultado é logo empilhado ou desalinhado.
 * - URL absoluta porque `data:` URI é bloqueado pelo Gmail e CID exige anexo.
 * - O arquivo foi gerado JÁ na cor certa para fundo claro (scripts/marcas):
 *   o lockup da IAgentics e o texto da Solution são brancos no original e
 *   sumiriam aqui — o mesmo problema que o site teve.
 *
 * Cliente com imagem bloqueada é o caso normal, não a exceção: por isso o
 * `alt` nomeia as três marcas e o corpo do e-mail funciona sem a figura.
 */
function marcas(): string {
  return `<p style="margin:0 0 28px"><img src="${site.url}/email/marcas.png" width="532" alt="IAgentics, Pecege e Solution" style="display:block;width:100%;max-width:532px;height:auto;border:0"></p>`;
}

function moldura(conteudo: string): string {
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#131723">
<div style="max-width:560px;margin:0 auto;padding:32px 20px">
<div style="background:#ffffff;border-radius:12px;padding:32px 28px">
${marcas()}
${conteudo}
</div>
<p style="font-size:12px;color:#5a6070;margin:24px 0 0;text-align:center">IAgentics · iagentics.com.br</p>
</div></body></html>`;
}

/** Confirmação de inscrição na pré-venda. Enviada ao próprio inscrito. */
export function emailListaEspera(nome: string) {
  const primeiroNome = nome.trim().split(/\s+/)[0];
  const seguro = escapeHtml(primeiroNome);
  const URL_SOLUTION = "https://plataformasolution.com.br/";

  /* O corpo é montado em duas versões porque só o HTML pode ter link. No texto
     puro a URL aparece por extenso — cliente que só lê texto ainda consegue
     chegar na plataforma. */
  const agradecimento = "Obrigado pelo seu interesse. Sua inscrição na pré-venda está confirmada.";
  const ondeAntes = "As formações online da IAgentics serão disponibilizadas na ";
  const ondeDepois = ", a plataforma de educação online do Pecege, a mesma organização por trás dos MBAs USP/Esalq.";
  const promessa =
    "Você será avisado em primeiro lugar quando elas entrarem no ar, com os 10% de desconto de lançamento garantidos.";

  const paragrafo = (conteudo: string) =>
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3c4250">${conteudo}</p>`;

  return {
    assunto: "Sua inscrição na pré-venda está confirmada — IAgentics e Pecege",
    texto: [
      `Olá, ${primeiroNome}.`,
      agradecimento,
      `${ondeAntes}Solution (${URL_SOLUTION})${ondeDepois}`,
      promessa,
      "IAgentics · iagentics.com.br",
    ].join("\n\n"),
    html: moldura(
      `<p style="margin:0 0 16px;font-size:16px">Olá, ${seguro}.</p>` +
        paragrafo(agradecimento) +
        paragrafo(
          `${ondeAntes}<a href="${URL_SOLUTION}" style="color:#7607e8;text-decoration:underline">Solution</a>${ondeDepois}`,
        ) +
        paragrafo(promessa),
    ),
  };
}

/**
 * Boas-vindas a quem pagou a assinatura (2026-10-16, pedido do Rodrigo: "o
 * usuário tem que receber um e-mail de boas-vindas dizendo que em até 24
 * horas úteis iremos liberar o acesso através da Plataforma Solution").
 * Enviado UMA vez por assinatura, no primeiro pagamento confirmado
 * (lib/assinatura/assinaturas.ts). Respostas vão para o contato.
 */
export const RESPONDER_ASSINATURA = "contato@iagentics.com.br";

export function emailBoasVindas(nome: string) {
  const primeiroNome = nome.trim().split(/\s+/)[0];
  const seguro = escapeHtml(primeiroNome);
  const URL_SOLUTION = "https://plataformasolution.com.br/";

  const confirmado = "Seu pagamento foi confirmado e a sua assinatura está ativa. Boas-vindas!";
  const prazo = "Em até 24 horas úteis vamos liberar o seu acesso pela Plataforma Solution, a plataforma online do Pecege, da USP/Esalq. Você vai receber um e-mail com os dados de entrada assim que o acesso estiver liberado.";
  const inclui = "A assinatura dá acesso às formações de IA aplicada da IAgentics Academy e às trilhas de cursos da Solution, no seu ritmo.";
  const cobranca = "A mensalidade é de R$ 49,90, e a fatura de cada mês chega por e-mail. Você tem 7 dias de garantia: se desistir nesse prazo, devolvemos 100% do valor. Depois disso, para cancelar é só falar com a gente pelo WhatsApp ou por este e-mail; o acesso continua até o fim do mês pago.";
  const duvidas = "Ficou alguma dúvida? Responda este e-mail.";

  const paragrafo = (conteudo: string) =>
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3c4250">${conteudo}</p>`;

  return {
    assunto: "Boas-vindas! Seu acesso à Solution chega em até 24 horas úteis",
    texto: [`Olá, ${primeiroNome}.`, confirmado, prazo, inclui, cobranca, duvidas, `Solution: ${URL_SOLUTION}`, "IAgentics · iagentics.com.br"].join("\n\n"),
    html: moldura(
      `<p style="margin:0 0 16px;font-size:16px">Olá, ${seguro}.</p>` +
        `<p style="margin:0 0 16px;font-size:17px;line-height:1.5;font-weight:bold;color:#131723">${confirmado}</p>` +
        paragrafo(prazo.replace("Plataforma Solution", `<a href="${URL_SOLUTION}" style="color:#7607e8;text-decoration:underline">Plataforma Solution</a>`)) +
        paragrafo(inclui) +
        paragrafo(cobranca) +
        paragrafo(duvidas),
    ),
  };
}

/**
 * As respostas da Diagnose de Compras para a equipe da Academy (2026-10-31).
 * Vai para DIAGNOSE_PARA (padrão: o Vinícius, contato que o questionário
 * original já trazia), com "responder" para quem respondeu.
 *
 * O resumo no corpo é o MESMO cálculo da prévia (lib/diagnose.ts). As notas
 * de cada processo vão num CSV anexo, uma linha por processo e com a empresa
 * em toda linha: juntar os CSVs do gestor e do time de uma empresa numa
 * planilha é o que mostra onde as percepções divergem.
 */
export const PARA_DIAGNOSE = "vinicius.ferreira@iagentics.com.br";

/** Célula de CSV: aspas escapadas e fórmula neutralizada (o Excel executaria "=..."). */
function celula(v: string | number | null | undefined): string {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function emailDiagnose(d: EnvioValido) {
  const gestor = d.papel === "gestor";
  const r = resumir(d.respostas, d.papel);
  const geral = r.geral ?? 0;
  const lv = nivel(geral);
  const salto = gestor ? maiorSalto(r) : null;
  const papel = diagnose.identificacao.papeis[d.papel].titulo;

  const quem = [
    `Nome: ${d.nome}`,
    `E-mail: ${d.email}`,
    `Empresa: ${d.empresa}`,
    `Cargo: ${d.cargo}`,
    `WhatsApp: ${d.whatsapp || "não informado"}`,
    `Papel: ${papel}`,
  ];
  const linhaPilar = (p: (typeof r.pilares)[number]) =>
    `${p.nome}: hoje ${p.hoje === null ? "-" : decimal(p.hoje)}${gestor && p.potencial !== null ? ` · em 12 meses ${decimal(p.potencial)}` : ""}`;

  const cabecalho = ["empresa", "nome", "email", "cargo", "papel", "pilar", "processo", "hoje", "potencial_12_meses", "impacto"];
  const linhas = diagnose.pilares.flatMap((p, pi) =>
    p.processos.map((pr, ii) => {
      const n = d.respostas[chave(pi, ii)];
      return [d.empresa, d.nome, d.email, d.cargo, d.papel, p.nome, pr.nome, n.h, n.p ?? null, n.i ?? null].map(celula).join(";");
    }),
  );
  /* BOM para o Excel em português abrir com acento e separar por ";". */
  const csv = "\uFEFF" + [cabecalho.join(";"), ...linhas].join("\r\n");
  const arquivo = `diagnose-compras-${d.empresa.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "empresa"}-${d.papel}.csv`;

  const e = escapeHtml;
  const paragrafo = (conteudo: string) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#3c4250">${conteudo}</p>`;

  return {
    assunto: `Diagnose de Compras: ${d.empresa} (${gestor ? "gestor" : "time"}, ${d.nome})`,
    anexos: [{ arquivo, conteudo: csv }],
    texto: [
      "Nova resposta da Diagnose de Compras.",
      quem.join("\n"),
      `Maturidade média hoje: ${decimal(geral)} (${lv.nome})`,
      r.pilares.map(linhaPilar).join("\n"),
      salto ? `Maior salto possível: ${salto.nome}` : "",
      "As notas de cada processo estão no CSV anexo.",
    ]
      .filter(Boolean)
      .join("\n\n"),
    html: moldura(
      `<p style="margin:0 0 16px;font-size:17px;font-weight:bold;color:#131723">Nova resposta da Diagnose de Compras</p>` +
        paragrafo(quem.map(e).join("<br>")) +
        paragrafo(`<b>Maturidade média hoje: ${decimal(geral)} (${e(lv.nome)})</b>`) +
        paragrafo(r.pilares.map((p) => e(linhaPilar(p))).join("<br>")) +
        (salto ? paragrafo(`Maior salto possível: <b>${e(salto.nome)}</b>`) : "") +
        paragrafo("As notas de cada processo estão no CSV anexo."),
    ),
  };
}
