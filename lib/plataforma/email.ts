import "server-only";
import { appendFileSync } from "fs";
import { plataforma } from "@/lib/content-plataforma";

/** Canal transacional ativo? A caixa de teste (e2e) tem precedência sobre a
 *  API real — com ela setada, NADA sai para a rede. */
export function emailTransacionalAtivo(): boolean {
  return Boolean(process.env.EMAIL_CAIXA_TESTE || process.env.RESEND_API_KEY);
}

export function urlBase(): string {
  return (process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

/** Escapa caracteres HTML no texto para evitar injeção via nome/URL. */
function escapeHtml(s: string): string {
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
}): Promise<{ ok: boolean }> {
  const caixa = process.env.EMAIL_CAIXA_TESTE;
  if (caixa) {
    try {
      appendFileSync(caixa, JSON.stringify({ ...msg, em: new Date().toISOString() }) + "\n");
      return { ok: true };
    } catch (erro) {
      console.error("[email] caixa de teste falhou", erro instanceof Error ? erro.message : erro);
      return { ok: false };
    }
  }
  const chave = process.env.RESEND_API_KEY;
  if (!chave) return { ok: false };
  try {
    const resposta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        from: process.env.EMAIL_DE ?? "IAgentics Academy <nao-responda@iagentics.com.br>",
        to: [msg.para],
        subject: msg.assunto,
        text: msg.texto,
        html: msg.html,
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

/** HTML mínimo da marca: fundo claro, wordmark em texto, botão violeta e o
 *  link repetido em texto puro. Sem imagens externas (entregabilidade). */
function moldura(conteudo: string): string {
  const [primeira, ...resto] = plataforma.nome.split(" ");
  const wordmark = `<strong>${primeira}</strong> ${resto.join(" ")}`;
  return `<!doctype html><html><body style="margin:0;background:#f8f8f8;font-family:Arial,Helvetica,sans-serif;color:#131723">
<div style="max-width:520px;margin:0 auto;padding:32px 20px">
<p style="font-size:14px;letter-spacing:.12em;text-transform:uppercase;margin:0 0 24px">${wordmark}</p>
${conteudo}
<p style="font-size:12px;color:#5a6070;margin-top:32px">${plataforma.emails.rodape}</p>
</div></body></html>`;
}

function botao(url: string, rotulo: string): string {
  const urlEscapada = escapeHtml(url);
  return `<p style="margin:24px 0"><a href="${urlEscapada}" style="background:#7607e8;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:999px;display:inline-block;font-weight:bold">${rotulo}</a></p>
<p style="font-size:12px;color:#5a6070;word-break:break-all">${plataforma.emails.copie} ${urlEscapada}</p>`;
}

export function emailDeConfirmacao(nome: string, url: string) {
  const t = plataforma.emails.confirmacao;
  const nomeEscapado = escapeHtml(nome);
  return {
    assunto: t.assunto,
    texto: `${t.saudacao(nome)}\n\n${t.corpo}\n\n${url}\n\n${t.ignorar}\n\n${plataforma.emails.rodape}`,
    html: moldura(`<p>${t.saudacao(nomeEscapado)}</p><p>${t.corpo}</p>${botao(url, t.botao)}<p style="font-size:12px;color:#5a6070">${t.ignorar}</p>`),
  };
}

export function emailDeReset(nome: string, url: string) {
  const t = plataforma.emails.reset;
  const nomeEscapado = escapeHtml(nome);
  return {
    assunto: t.assunto,
    texto: `${t.saudacao(nome)}\n\n${t.corpo}\n\n${url}\n\n${t.ignorar}\n\n${plataforma.emails.rodape}`,
    html: moldura(`<p>${t.saudacao(nomeEscapado)}</p><p>${t.corpo}</p>${botao(url, t.botao)}<p style="font-size:12px;color:#5a6070">${t.ignorar}</p>`),
  };
}
