/**
 * A marca "não conte este navegador", em localStorage.
 *
 * POR QUE ISSO EXISTE: o site recebe ~30 visitas por dia útil, e o beacon
 * conta qualquer navegador — inclusive o de quem faz o site. Meia dúzia de
 * conferências internas por dia é 20% do número, e um painel com 20% de ruído
 * próprio não sustenta decisão nenhuma. Este é o menor jeito de separar os
 * dois sem identificar ninguém.
 *
 * O CONTROLE MORA NO /admin, atrás do Basic Auth, e isso é de propósito: só
 * quem tem a credencial pode se descontar da medição. Um botão dessses numa
 * página pública seria um jeito de qualquer um sumir do relatório.
 *
 * Vive no navegador, então vale por navegador e por dispositivo — trocar de
 * máquina, de perfil ou abrir anônima recomeça contando. Não dá para fazer
 * melhor sem identificar quem visita, que é exatamente o que este site
 * decidiu não fazer.
 *
 * NÃO ALCANÇA O GOOGLE ANALYTICS, que é script de terceiro com contagem
 * própria: lá a exclusão é filtro de tráfego interno por IP, no painel do GA4.
 */
export const CHAVE_NAO_CONTAR = "iagentics:nao-contar";

/** Lê a marca. Safari em janela privada LANÇA ao tocar em localStorage, e o
 *  padrão em caso de erro é contar — errar contando é ruído; errar sem contar
 *  é dado que some sem ninguém perceber. */
export function naoContarEsteNavegador(): boolean {
  try {
    return window.localStorage.getItem(CHAVE_NAO_CONTAR) === "1";
  } catch {
    return false;
  }
}

export function definirNaoContar(valor: boolean): void {
  try {
    if (valor) window.localStorage.setItem(CHAVE_NAO_CONTAR, "1");
    else window.localStorage.removeItem(CHAVE_NAO_CONTAR);
  } catch {
    /* Sem localStorage não há o que marcar; a interface avisa pelo estado que lê. */
  }
}
