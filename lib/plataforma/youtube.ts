/** Normaliza o que o admin colar no campo de vídeo para o ID de 11 caracteres
 *  do YouTube — ou null quando não dá para extrair com certeza.
 *
 *  Motivo: a IFrame API recebe o valor cru como videoId; uma URL colada no
 *  lugar do ID vira um player preto mudo, sem erro nenhum (bug da aula "teste",
 *  2026-08-13). Usado na gravação (salvarMidiaAction valida e recusa) e na
 *  leitura (a página da aula cura linhas antigas salvas com URL). */
const ID_YOUTUBE = /^[A-Za-z0-9_-]{11}$/;
const HOSTS = /(^|\.)youtube(-nocookie)?\.com$|(^|\.)youtu\.be$/;

export function extrairYoutubeId(valor: string): string | null {
  const bruto = valor.trim();
  if (!bruto) return null;
  if (ID_YOUTUBE.test(bruto)) return bruto;

  let url: URL;
  try {
    // URL sem protocolo ("youtube.com/watch?v=…") também aparece colada.
    url = new URL(/^[a-z]+:\/\//i.test(bruto) ? bruto : `https://${bruto}`);
  } catch {
    return null;
  }
  if (!HOSTS.test(url.hostname)) return null;

  const doParametro = url.searchParams.get("v");
  if (doParametro && ID_YOUTUBE.test(doParametro)) return doParametro;

  // youtu.be/<id> e youtube.com/{embed,shorts,live}/<id>: o ID é um segmento do caminho.
  const segmentos = url.pathname.split("/").filter(Boolean);
  const candidato = segmentos.find((s) => ID_YOUTUBE.test(s));
  return candidato ?? null;
}
