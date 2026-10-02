/**
 * Regra de preço do catálogo.
 *
 * Cada curso avulso custa o preço cheio (base R$ 200), quantos estiverem no
 * carrinho. Até 2026-10-02 havia uma escada — cada curso novo saía 5% mais
 * barato que o anterior, até 25% — e ela saiu a pedido do Rodrigo, junto com
 * os packs por nível (2026-09-26 a 2026-10-02). Desconto hoje só vem do curso
 * de preço próprio em promoção (ver precosFixos).
 *
 * Função pura e sem "server-only" de propósito: o carrinho no navegador e o
 * checkout no servidor chamam a MESMA função. O que a pessoa vê é o que se
 * cobra — mas quem decide o valor cobrado é sempre o servidor, que recebe só
 * os slugs e recalcula tudo aqui.
 */

/** Base da PRÉVIA (/preview/catalogo). Constante no código, não variável de
 *  ambiente: não pode existir configuração que faça a página pública cobrar
 *  R$ 5. R$ 5,00 é também o mínimo de uma cobrança no Asaas. */
export const PRECO_TESTE_CENTAVOS = 500;

/** `cheioCentavos` é o preço sem desconto DAQUELE item — a base, ou o cheio
 *  de um curso com preço próprio. É o que aparece riscado ao lado dele. */
export type ItemCarrinho = { slug: string; descontoPct: number; precoCentavos: number; cheioCentavos: number };

/** Curso com preço próprio (ver precosFixos): preço cobrado e preço cheio. */
export type PrecoFixo = { precoCentavos: number; cheioCentavos: number };

export type Carrinho = {
  itens: ItemCarrinho[];
  totalCentavos: number;
  /** Quanto custaria sem desconto — a diferença é a economia mostrada. */
  cheioCentavos: number;
};

export function calcularCarrinho(
  slugs: readonly string[],
  validos: readonly string[],
  precoBaseCentavos: number,
  /** Cursos com preço próprio (ver precosFixos). */
  fixos: ReadonlyMap<string, PrecoFixo> = new Map(),
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

  const itens = limpos.map((slug) => {
    const fixo = fixos.get(slug);
    return fixo
      ? {
          slug,
          descontoPct: Math.round((1 - fixo.precoCentavos / fixo.cheioCentavos) * 100),
          precoCentavos: fixo.precoCentavos,
          cheioCentavos: fixo.cheioCentavos,
        }
      : { slug, descontoPct: 0, precoCentavos: precoBaseCentavos, cheioCentavos: precoBaseCentavos };
  });

  return {
    itens,
    totalCentavos: itens.reduce((soma, item) => soma + item.precoCentavos, 0),
    cheioCentavos: itens.reduce((soma, item) => soma + item.cheioCentavos, 0),
  };
}

const REAIS = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatarReais(centavos: number): string {
  return REAIS.format(centavos / 100);
}

/* ---------------------------------------------------------------------------
   PREÇO PRÓPRIO DE CURSO (2026-10-02, pedido do Rodrigo): Fundamentos de IA
   para Negócios custa R$ 49,90 e sai por R$ 19,90 no lançamento (`preco` no
   curso, em content.ts).

   Na PRÉVIA, todo preço é de teste: o curso de preço próprio cobra o mínimo
   do Asaas (PRECO_TESTE_CENTAVOS) e o riscado guarda a MESMA proporção do
   real — a tela de teste conta a mesma história de desconto que a de verdade.
--------------------------------------------------------------------------- */
export type CursoComPreco = { slug: string; preco?: { cheioCentavos: number; promoCentavos: number } };

export function precosFixos(cursos: readonly CursoComPreco[], modo: "teste" | "real"): Map<string, PrecoFixo> {
  const mapa = new Map<string, PrecoFixo>();
  for (const c of cursos) {
    if (!c.preco) continue;
    const { cheioCentavos, promoCentavos } = c.preco;
    mapa.set(
      c.slug,
      modo === "real"
        ? { precoCentavos: promoCentavos, cheioCentavos }
        : { precoCentavos: PRECO_TESTE_CENTAVOS, cheioCentavos: Math.round((PRECO_TESTE_CENTAVOS * cheioCentavos) / promoCentavos) },
    );
  }
  return mapa;
}
