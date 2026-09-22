/**
 * Regra de preço do catálogo (2026-09-22, decisão do Rodrigo).
 *
 * Cada curso novo no carrinho sai 5% mais barato que o anterior, até 25%:
 * com base R$ 200, a sequência é 200, 190, 180, 170, 160, 150, 150…
 *
 * Função pura e sem "server-only" de propósito: o carrinho no navegador e o
 * checkout no servidor chamam a MESMA função. O que a pessoa vê é o que se
 * cobra — mas quem decide o valor cobrado é sempre o servidor, que recebe só
 * os slugs e recalcula tudo aqui.
 */

/** Base da PRÉVIA (/preview/catalogo). Constante no código, não variável de
 *  ambiente: não pode existir configuração que faça a página pública cobrar
 *  R$ 5. R$ 5,00 é também o mínimo de uma cobrança no Asaas, e o teto de 25%
 *  leva o item a R$ 3,75 — o TOTAL nunca fica abaixo de R$ 5. */
export const PRECO_TESTE_CENTAVOS = 500;

export const DESCONTO_POR_CURSO_PCT = 5;
export const DESCONTO_MAXIMO_PCT = 25;

export function descontoDaPosicao(i: number): number {
  return Math.min(i * DESCONTO_POR_CURSO_PCT, DESCONTO_MAXIMO_PCT);
}

function precoNaPosicao(i: number, base: number): number {
  return Math.round((base * (100 - descontoDaPosicao(i))) / 100);
}

export type ItemCarrinho = { slug: string; descontoPct: number; precoCentavos: number };

export type Carrinho = {
  itens: ItemCarrinho[];
  totalCentavos: number;
  /** Quanto custaria sem desconto — a diferença é a economia mostrada. */
  cheioCentavos: number;
  /** O gatilho "adicione mais um e ele sai por R$ X". Null quando não há mais
   *  curso para adicionar. */
  proximo: { descontoPct: number; precoCentavos: number } | null;
};

export function calcularCarrinho(
  slugs: readonly string[],
  validos: readonly string[],
  precoBaseCentavos: number,
): Carrinho {
  const conhecidos = new Set(validos);
  const vistos = new Set<string>();
  const limpos: string[] = [];
  for (const slug of slugs) {
    if (conhecidos.has(slug) && !vistos.has(slug)) {
      vistos.add(slug);
      limpos.push(slug);
    }
  }

  const itens = limpos.map((slug, i) => ({
    slug,
    descontoPct: descontoDaPosicao(i),
    precoCentavos: precoNaPosicao(i, precoBaseCentavos),
  }));

  const n = itens.length;
  return {
    itens,
    totalCentavos: itens.reduce((soma, item) => soma + item.precoCentavos, 0),
    cheioCentavos: n * precoBaseCentavos,
    proximo: n < conhecidos.size ? { descontoPct: descontoDaPosicao(n), precoCentavos: precoNaPosicao(n, precoBaseCentavos) } : null,
  };
}

const REAIS = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatarReais(centavos: number): string {
  return REAIS.format(centavos / 100);
}
