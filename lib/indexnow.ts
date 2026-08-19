import { site } from "@/lib/content";

/**
 * IndexNow: avisa o Bing (e os buscadores parceiros) assim que uma URL muda,
 * em vez de esperar o rastreio passar de novo.
 *
 * Por que isto existe: a orientação da Microsoft para aparecer em respostas
 * de IA (Copilot, e o que consome o índice do Bing) pesa FRESCOR - o
 * conteúdo citado precisa ser o atual. Publicar um curso novo no admin muda
 * a /cursos na hora; sem este aviso, o índice só perceberia dias depois.
 *
 * A chave NÃO é segredo: o protocolo exige que ela esteja publicada em
 * `https://iagentics.com.br/<chave>.txt` — é justamente assim que o buscador
 * confere que quem avisou é dono do domínio. Por isso ela vive no código e
 * em `public/`, não no .env.
 */
export const CHAVE_INDEXNOW = "c669dbfd2730b1928728be4e5a6dd24b";

const ENDPOINT = "https://api.indexnow.org/IndexNow";

/** O corpo exigido pelo protocolo. Separado da chamada de rede para poder
 *  ser testado sem tocar na internet. */
export function corpoIndexNow(urls: string[]) {
  return {
    host: site.domain,
    key: CHAVE_INDEXNOW,
    keyLocation: `${site.url}/${CHAVE_INDEXNOW}.txt`,
    urlList: urls,
  };
}

/**
 * Dispara o aviso. NUNCA lança e NUNCA bloqueia a ação do admin: um
 * buscador fora do ar não pode impedir alguém de publicar um curso. Chame
 * dentro de `after()` para não segurar a resposta.
 *
 * Só roda em produção: avisar o Bing sobre `localhost` seria ruído, e em
 * teste a rede não é chamada de propósito.
 */
export async function avisarIndexNow(urls: string[]): Promise<void> {
  if (urls.length === 0) return;
  if (process.env.NODE_ENV !== "production") return;

  try {
    const resposta = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(corpoIndexNow(urls)),
      signal: AbortSignal.timeout(8000),
    });
    // 200 e 202 são os aceites do protocolo; o resto vira uma linha de log e
    // nada mais - sem URL de conteúdo sensível, só o status e a contagem.
    if (!resposta.ok) console.warn(`[indexnow] status ${resposta.status} para ${urls.length} url(s)`);
  } catch (e) {
    console.warn(`[indexnow] falhou: ${e instanceof Error ? e.message : "erro desconhecido"}`);
  }
}

/** A página pública afetada por qualquer mudança no catálogo. As formações
 *  não têm página própria (o conteúdo vive atrás do login), então o que muda
 *  aos olhos do buscador é sempre a landing. */
export const URL_CATALOGO = `${site.url}/cursos`;
