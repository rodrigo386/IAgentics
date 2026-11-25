import "server-only";
import { site, diagnose, bolsas, reforma, sorteio, PRECO_FUNDADOR } from "@/lib/content";
import { calcular, pct, reais, type Cenario } from "@/lib/reforma";
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

/** `comMarcas: false` tira a faixa IAgentics + Pecege + Solution (e-mail que não fala da plataforma). */
function moldura(conteudo: string, comMarcas = true): string {
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#131723">
<div style="max-width:560px;margin:0 auto;padding:32px 20px">
<div style="background:#ffffff;border-radius:12px;padding:32px 28px">
${comMarcas ? marcas() : `<p style="margin:0 0 24px;font-size:20px;font-weight:bold;letter-spacing:-0.02em;color:#131723">IAgentics</p>`}
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
  const ondeDepois = ", a plataforma de educação online do Pecege.";
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
  const prazo = "Em até 24 horas úteis vamos liberar o seu acesso pela Plataforma Solution, a plataforma online do Pecege. Você vai receber um e-mail com os dados de entrada assim que o acesso estiver liberado.";
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

/**
 * Confirmação da inscrição no Desafio Prova Real (2026-11-03; refeita em
 * 2026-11-18). Leva o próximo passo (seguir a @iagenticsacademy e publicar o
 * post), as datas e o regulamento. Respostas vão para o contato: é por elas
 * que o inscrito corrige um dado.
 */
export const RESPONDER_BOLSAS = "contato@iagentics.com.br";

/**
 * Voucher do preço de fundador (2026-11-18). Bolsista recebe quando a bolsa
 * acaba; não selecionado, até 10/01/2027. O link leva à página do voucher,
 * que só existe para quem tem o código.
 */
export function emailVoucherBolsa(nome: string, d: { url: string; validoAte: string; bolsista: boolean }) {
  const primeiroNome = nome.trim().split(/\s+/)[0];
  const e = escapeHtml;
  const abertura = d.bolsista
    ? "Sua bolsa no Desafio Prova Real terminou. Obrigado por participar!"
    : "Prometemos, e aqui está: o seu voucher exclusivo do Desafio Prova Real.";
  const oferta = `Com ele, você assina a plataforma da IAgentics Academy por ${PRECO_FUNDADOR} por mês durante 12 meses, no lugar do preço público. Depois dos 12 meses, vale o preço público da assinatura, com aviso por e-mail antes. Sem fidelidade.`;
  const validade = `O voucher vale até ${d.validoAte}, para uma assinatura. A assinatura só começa se você usar.`;
  const duvidas = "Dúvidas? É só responder este e-mail.";
  const paragrafo = (c: string) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3c4250">${c}</p>`;
  const botao = `<p style="margin:0 0 24px"><a href="${d.url}" style="display:inline-block;background:#7607e8;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:6px">Usar o voucher</a></p>`;

  return {
    assunto: `Seu voucher: ${PRECO_FUNDADOR} por mês na IAgentics Academy`,
    texto: [`Olá, ${primeiroNome}.`, abertura, oferta, `Use o voucher: ${d.url}`, validade, duvidas, "IAgentics Academy · iagentics.com.br"].join("\n\n"),
    html: moldura(
      `<p style="margin:0 0 16px;font-size:16px">Olá, ${e(primeiroNome)}.</p>` +
        `<p style="margin:0 0 16px;font-size:17px;line-height:1.5;font-weight:bold;color:#131723">${e(abertura)}</p>` +
        paragrafo(e(oferta)) +
        botao +
        paragrafo(e(validade)) +
        paragrafo(e(duvidas)),
    ),
  };
}

/**
 * Resultado do Desafio Prova Real (24 de dezembro). Dois textos: quem foi
 * selecionado e quem não foi. O segundo promete o voucher por e-mail até 10 de
 * janeiro de 2027, válido por 15 dias, como a página e o regulamento dizem.
 */
export function emailResultadoBolsa(nome: string, selecionado: boolean) {
  const primeiroNome = nome.trim().split(/\s+/)[0];
  const e = escapeHtml;
  const preco = PRECO_FUNDADOR;
  const paragrafos = selecionado
    ? [
        "Você foi selecionado(a) para o Desafio Prova Real da IAgentics Academy. Parabéns!",
        "A sua bolsa vai de 2 de janeiro a 2 de fevereiro de 2027: 30 dias gratuitos na plataforma, para usar no problema que você descreveu.",
        "No dia 2 de janeiro você recebe por e-mail a política e o período de uso e as instruções de cadastro na plataforma. Até lá, não precisa fazer nada.",
        `Terminada a bolsa, você recebe um voucher para assinar por ${preco} por mês durante 12 meses, se quiser continuar. A assinatura só começa se você usar o voucher.`,
      ]
    : [
        "Obrigado por participar do Desafio Prova Real da IAgentics Academy. Desta vez, você não foi um dos 50 selecionados.",
        `Como agradecimento, você receberá por e-mail, até 10 de janeiro de 2027, um voucher exclusivo para se cadastrar na plataforma por ${preco} por mês durante 12 meses. O voucher vale por 15 dias.`,
        "A assinatura só começa se você usar o voucher.",
      ];
  const corrigir = "Dúvidas? É só responder este e-mail.";
  const paragrafo = (c: string) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3c4250">${c}</p>`;

  return {
    assunto: selecionado ? "Você foi selecionado(a): Desafio Prova Real" : "Resultado do Desafio Prova Real",
    texto: [`Olá, ${primeiroNome}.`, ...paragrafos, corrigir, "IAgentics Academy · iagentics.com.br"].join("\n\n"),
    html: moldura(
      `<p style="margin:0 0 16px;font-size:16px">Olá, ${e(primeiroNome)}.</p>` +
        `<p style="margin:0 0 16px;font-size:17px;line-height:1.5;font-weight:bold;color:#131723">${e(paragrafos[0])}</p>` +
        paragrafos.slice(1).map((p) => paragrafo(e(p))).join("") +
        paragrafo(e(corrigir)),
    ),
  };
}

export function emailInscricaoBolsa(nome: string, opcoes: { grupo: boolean }) {
  const primeiroNome = nome.trim().split(/\s+/)[0];
  const linkRegulamento = `${site.url}/bolsas/regulamento`;
  const { instagram, postEditavel } = bolsas.criterios;

  const recebida = "Sua inscrição no Desafio Prova Real da IAgentics Academy está confirmada.";
  const proximo = `Faltam dois passos, que entram na seleção: seguir a ${instagram.handle} no Instagram e publicar o post “Eu estou participando do Desafio Prova Real”, no Instagram ou no LinkedIn, com a identificação de parceria paga da rede ou #publi no começo da legenda.`;
  const linkPost = postEditavel ? `Post editável: ${postEditavel}` : "";
  const resultado = "O resultado sai em 24 de dezembro, por e-mail e em post nas redes da IAgentics Academy. A bolsa vai de 2 de janeiro a 2 de fevereiro de 2027.";
  const grupo = opcoes.grupo ? "Você pediu para entrar no grupo exclusivo do desafio no WhatsApp: o convite chega por aqui quando o grupo abrir." : "";
  const corrigir = "Errou algum dado? Responda este e-mail contando o que corrigir.";

  const e = escapeHtml;
  const paragrafo = (conteudo: string) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3c4250">${conteudo}</p>`;
  const botao = `<p style="margin:0 0 24px"><a href="${instagram.url}" style="display:inline-block;background:#7607e8;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:6px">Seguir ${e(instagram.handle)}</a></p>`;

  return {
    assunto: "Inscrição confirmada: Desafio Prova Real",
    texto: [
      `Olá, ${primeiroNome}.`,
      recebida,
      proximo,
      `Siga a ${instagram.handle}: ${instagram.url}`,
      linkPost,
      resultado,
      grupo,
      `Regulamento: ${linkRegulamento}`,
      corrigir,
      "IAgentics Academy · iagentics.com.br",
    ]
      .filter(Boolean)
      .join("\n\n"),
    html: moldura(
      `<p style="margin:0 0 16px;font-size:16px">Olá, ${e(primeiroNome)}.</p>` +
        `<p style="margin:0 0 16px;font-size:17px;line-height:1.5;font-weight:bold;color:#131723">${e(recebida)}</p>` +
        paragrafo(e(proximo)) +
        botao +
        (postEditavel ? paragrafo(`<a href="${postEditavel}" style="color:#7607e8;text-decoration:underline">Baixar o post editável</a>`) : "") +
        paragrafo(e(resultado)) +
        (grupo ? paragrafo(e(grupo)) : "") +
        paragrafo(`Leia também o <a href="${linkRegulamento}" style="color:#7607e8;text-decoration:underline">regulamento</a>.`) +
        paragrafo(e(corrigir)),
    ),
  };
}

/**
 * Comparativo da calculadora da Reforma Tributária (2026-11-18), enviado a quem
 * pediu. A conta é refeita aqui com o mesmo código do navegador
 * (lib/reforma.ts): o e-mail nunca repete um número que o servidor não calculou.
 */
export function emailReforma(nome: string, c: Cenario, url: string) {
  const t = reforma;
  const e = escapeHtml;
  const primeiroNome = nome.trim().split(/\s+/)[0];
  const { taxa, resultados, diferencaAnual } = calcular(c);
  const regime = (r: keyof typeof t.calculadora.regimes) => t.calculadora.regimes[r];
  const cenario = [
    `${t.calculadora.ano}: ${c.ano}`,
    `${t.calculadora.taxa}: ${pct(taxa)}`,
    t.calculadora.reducoes[c.reducao],
    c.compradorCredita ? t.calculadora.comCredito : t.calculadora.semCredito,
  ];
  const linhasTexto = resultados.map(
    (r) =>
      `${r.nome} (${regime(r.regime)}): nota ${reais(r.valor)}, crédito ${reais(r.credito)}, custo líquido ${reais(r.liquido)}` +
      (r.melhor ? ` (${t.calculadora.melhor})` : `, ${reais(r.acimaDaMelhor)} acima da melhor`) +
      (r.empate !== null && !r.melhor ? `. ${t.calculadora.empate} ${reais(r.empate)}` : ""),
  );
  const td = 'style="padding:8px 6px;border-bottom:1px solid #e3e5ea;font-size:14px;vertical-align:top"';
  const tabela =
    `<table role="presentation" style="width:100%;border-collapse:collapse;margin:0 0 20px">` +
    `<tr>${[t.calculadora.colunas.fornecedor, t.calculadora.colunas.nota, t.calculadora.colunas.credito, t.calculadora.colunas.liquido]
      .map((h) => `<th align="left" style="padding:8px 6px;border-bottom:2px solid #131723;font-size:12px;text-transform:uppercase;color:#5a6070">${e(h)}</th>`)
      .join("")}</tr>` +
    resultados
      .map(
        (r) =>
          `<tr><td ${td}><b>${e(r.nome)}</b>${r.melhor ? ` <span style="color:#7607e8">· ${e(t.calculadora.melhor)}</span>` : ""}<br><span style="color:#5a6070;font-size:12px">${e(regime(r.regime))}</span></td>` +
          `<td ${td}>${reais(r.valor)}</td><td ${td}>${reais(r.credito)}</td><td ${td}><b>${reais(r.liquido)}</b></td></tr>`,
      )
      .join("") +
    `</table>`;
  const empates = resultados
    .filter((r) => r.empate !== null && !r.melhor)
    .map((r) => `${r.nome}: ${t.calculadora.empate.charAt(0).toLowerCase()}${t.calculadora.empate.slice(1)} ${reais(r.empate!)}.`);
  const anual = diferencaAnual !== null ? `${t.calculadora.anual}: ${reais(diferencaAnual)}.` : null;
  const p = (s: string) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#3c4250">${s}</p>`;
  const lista = `<ol style="margin:0 0 20px;padding-left:20px;font-size:14px;line-height:1.6;color:#3c4250">${t.checklist.itens.map((i) => `<li style="margin:0 0 6px">${e(i)}</li>`).join("")}</ol>`;
  const botao = `<p style="margin:0 0 24px"><a href="${url}" style="display:inline-block;background:#7607e8;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:6px">${e(t.email.voltar)}</a></p>`;

  return {
    assunto: t.email.assunto,
    texto: [
      `${t.email.ola}, ${primeiroNome}.`,
      t.email.intro,
      `${t.email.cenario}:\n${cenario.join("\n")}`,
      linhasTexto.join("\n"),
      ...(anual ? [anual] : []),
      ...(c.ano < 2033 ? [t.calculadora.avisoTransicao] : []),
      `${t.checklist.titulo}:\n${t.checklist.itens.map((i, n) => `${n + 1}. ${i}`).join("\n")}`,
      `${t.email.voltar}: ${url}`,
      `${t.nexo.titulo} ${t.nexo.texto} ${site.url}/nexo`,
      t.email.rodape,
    ].join("\n\n"),
    html: moldura(
      `<p style="margin:0 0 16px;font-size:16px">${e(t.email.ola)}, ${e(primeiroNome)}.</p>` +
        p(e(t.email.intro)) +
        `<p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#5a6070">${cenario.map(e).join("<br>")}</p>` +
        tabela +
        empates.map((s) => p(e(s))).join("") +
        (anual ? p(`<b>${e(anual)}</b>`) : "") +
        (c.ano < 2033 ? p(e(t.calculadora.avisoTransicao)) : "") +
        `<p style="margin:8px 0 10px;font-size:17px;font-weight:bold;color:#131723">${e(t.checklist.titulo)}</p>` +
        lista +
        botao +
        p(`${e(t.nexo.titulo)} ${e(t.nexo.texto)} <a href="${site.url}/nexo" style="color:#7607e8">${e(t.nexo.cta)}</a>`) +
        `<p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#5a6070">${e(t.email.rodape)}</p>`,
      false,
    ),
  };
}

/** Número da sorte do sorteio no Case 2026 (/sorteio, 2026-11-23). Ao próprio cadastrado. */
export function emailSorteio(nome: string, numero: string) {
  const primeiroNome = nome.trim().split(/\s+/)[0];
  const { ok, redes } = sorteio;
  const linkPlataforma = `${site.url}${ok.plataformaHref}`;
  const linkRegulamento = `${site.url}/sorteio/regulamento`;
  const participa = "Você está participando do sorteio do porta-lata moletom IAgentics no Case 2026.";
  const quando = "O sorteio é no encerramento do Case 2026, em 26 de novembro. Se o seu número sair, avisamos por este e-mail e pelo WhatsApp do cadastro.";
  const e = escapeHtml;
  const paragrafo = (conteudo: string) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3c4250">${conteudo}</p>`;
  const link = (href: string, texto: string) => `<a href="${href}" style="color:#7607e8;text-decoration:underline">${e(texto)}</a>`;
  return {
    assunto: `Seu número da sorte: ${numero}`,
    texto: [
      `Olá, ${primeiroNome}.`,
      participa,
      `Seu número da sorte: ${numero}`,
      quando,
      `${ok.plataformaTitulo}: ${linkPlataforma}`,
      ...redes.itens.map((r) => `${r.rotulo}: ${r.href}`),
      `Regulamento: ${linkRegulamento}`,
      "IAgentics · iagentics.com.br",
    ].join("\n\n"),
    html: moldura(
      `<p style="margin:0 0 16px;font-size:16px">Olá, ${e(primeiroNome)}.</p>` +
        paragrafo(e(participa)) +
        `<p style="margin:0 0 8px;font-size:13px;color:#5a6070;text-transform:uppercase;letter-spacing:0.12em">Seu número da sorte</p>` +
        `<p style="margin:0 0 24px;font-size:44px;font-weight:bold;letter-spacing:0.06em;color:#131723">${e(numero)}</p>` +
        paragrafo(e(quando)) +
        paragrafo(e(`${ok.plataformaTitulo}. ${ok.plataformaTexto}`)) +
        `<p style="margin:0 0 24px"><a href="${linkPlataforma}" style="display:inline-block;background:#7607e8;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:6px">${e(ok.plataformaBotao)}</a></p>` +
        paragrafo(redes.itens.map((r) => link(r.href, r.rotulo)).join(" · ")) +
        paragrafo(link(linkRegulamento, "Regulamento do sorteio")),
      false,
    ),
  };
}
