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
  /** O gatilho "adicione mais um e ele sai por R$ X". Null quando não há mais
   *  curso para adicionar. */
  proximo: { descontoPct: number; precoCentavos: number } | null;
};

export function calcularCarrinho(
  slugs: readonly string[],
  validos: readonly string[],
  precoBaseCentavos: number,
  /** Cursos com preço próprio. O preço deles é fixo, mas eles OCUPAM a
   *  posição na escada — o curso seguinte ganha o degrau normalmente. */
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

  const itens = limpos.map((slug, i) => {
    const fixo = fixos.get(slug);
    return fixo
      ? {
          slug,
          descontoPct: Math.round((1 - fixo.precoCentavos / fixo.cheioCentavos) * 100),
          precoCentavos: fixo.precoCentavos,
          cheioCentavos: fixo.cheioCentavos,
        }
      : { slug, descontoPct: descontoDaPosicao(i), precoCentavos: precoNaPosicao(i, precoBaseCentavos), cheioCentavos: precoBaseCentavos };
  });

  const n = itens.length;
  return {
    itens,
    totalCentavos: itens.reduce((soma, item) => soma + item.precoCentavos, 0),
    cheioCentavos: itens.reduce((soma, item) => soma + item.cheioCentavos, 0),
    proximo: n < conhecidos.size ? { descontoPct: descontoDaPosicao(n), precoCentavos: precoNaPosicao(n, precoBaseCentavos) } : null,
  };
}

const REAIS = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatarReais(centavos: number): string {
  return REAIS.format(centavos / 100);
}

/* ---------------------------------------------------------------------------
   PACKS (2026-09-26, pedido do Rodrigo): todos os cursos de um nível —
   Iniciante, Intermediário, Especialista — por um preço fixo (R$ 99).

   Regras, na ordem em que o cálculo as aplica:
   - pack é item de preço FIXO e não entra na escada de desconto, que continua
     sendo só dos cursos avulsos;
   - pack no carrinho COBRE o nível: curso avulso daquele nível é descartado
     do cálculo (ninguém paga duas vezes pelo mesmo curso), e o "próximo curso"
     do gatilho só considera o que ainda não está coberto;
   - `cheioCentavos` do pack é o preço cheio dos cursos que ele contém — é daí
     que sai a economia mostrada ao lado dele.
--------------------------------------------------------------------------- */

/** Pack na PRÉVIA: R$ 5, o mínimo de uma cobrança no Asaas. Mesmo raciocínio
 *  do PRECO_TESTE_CENTAVOS: constante no código, nunca variável de ambiente. */
export const PRECO_TESTE_PACK_CENTAVOS = 500;

export type CursoDoPedido = { slug: string; nivel: number };
export type PackDoPedido = { slug: string; nivel: number };
export type ItemPack = { slug: string; nivel: number; cursos: number; precoCentavos: number; cheioCentavos: number };
export type Pedido = Carrinho & { packs: ItemPack[] };

export function calcularPedido(
  slugs: readonly string[],
  cursos: readonly CursoDoPedido[],
  packs: readonly PackDoPedido[],
  precos: { cursoCentavos: number; packCentavos: number; fixos?: ReadonlyMap<string, PrecoFixo> },
): Pedido {
  const fixos = precos.fixos ?? new Map<string, PrecoFixo>();
  const porSlug = new Map(packs.map((p) => [p.slug, p]));
  const escolhidos = [...new Set(slugs)].filter((s) => porSlug.has(s)).map((s) => porSlug.get(s)!);
  const cobertos = new Set(escolhidos.map((p) => p.nivel));

  const disponiveis = cursos.filter((c) => !cobertos.has(c.nivel)).map((c) => c.slug);
  const avulsos = calcularCarrinho(slugs, disponiveis, precos.cursoCentavos, fixos);

  const itensPack = escolhidos.map((p) => {
    const doNivel = cursos.filter((c) => c.nivel === p.nivel);
    // O "valor em avulsos" do pack soma o cheio de cada curso — inclusive o
    // de preço próprio, que não vale a base.
    const cheio = doNivel.reduce((s, c) => s + (fixos.get(c.slug)?.cheioCentavos ?? precos.cursoCentavos), 0);
    return { slug: p.slug, nivel: p.nivel, cursos: doNivel.length, precoCentavos: precos.packCentavos, cheioCentavos: cheio };
  });

  return {
    ...avulsos,
    packs: itensPack,
    totalCentavos: avulsos.totalCentavos + itensPack.reduce((s, p) => s + p.precoCentavos, 0),
    cheioCentavos: avulsos.cheioCentavos + itensPack.reduce((s, p) => s + p.cheioCentavos, 0),
  };
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
