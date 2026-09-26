import type { Tema } from "@/lib/content";

/**
 * Regra do "Monte sua trilha" (2026-09-26): respostas do questionário → lista
 * de cursos para o carrinho.
 *
 * Pura e sem "server-only": roda no navegador de quem responde, e nada do que
 * a pessoa escolhe sai de lá. O carrinho recebe só os slugs, como se ela os
 * tivesse adicionado à mão — o preço continua sendo decidido pelo servidor.
 *
 * Como escolhe (2026-09-26, por cotas — a primeira versão pontuava tudo junto
 * e os 8 cursos intermediários de custos engoliam a trilha, fazendo as
 * respostas "junto" e "alcance" não mudarem nada na tela):
 *   - próximo nível: se a pessoa pediu, cerca de 1/3 da trilha vem dele;
 *   - habilidade "junto": cerca de 1/3 vem do tema dela, no nível atual;
 *   - o resto é o objetivo principal, completado pela base do nível.
 * Dentro de cada cota vale a ordem da planilha, que já é ordem de estudo. Se
 * um nível não tiver cursos que bastem, a sobra passa para o outro. A trilha
 * sai ordenada por nível e, dentro dele, pela planilha.
 */

export type CursoTrilha = { slug: string; nivel: number; temas: readonly Tema[] };

export type Respostas = {
  /** 0 Iniciante · 1 Intermediário · 2 Especialista · 3 Avançado */
  momento: 0 | 1 | 2 | 3;
  objetivo: Tema;
  junto: Tema | "nenhum";
  /** 0 fica no nível; 1 inclui o nível seguinte. */
  alcance: 0 | 1;
  tamanho: 3 | 6 | 9;
};

/** `motivo` é o tema que trouxe o curso; null quando entrou só como base do nível. */
export type ItemTrilha = { slug: string; motivo: Tema | null };

export function recomendarTrilha(r: Respostas, cursos: readonly CursoTrilha[]): ItemTrilha[] {
  const indexados = cursos.map((curso, ordem) => ({ curso, ordem }));
  const atual = indexados.filter(({ curso }) => curso.nivel === r.momento);
  const proximo = r.alcance ? indexados.filter(({ curso }) => curso.nivel === r.momento + 1) : [];
  const terco = Math.round(r.tamanho / 3);

  const escolhidos = new Set<number>();
  const tem = (tema: Tema) => (c: { curso: CursoTrilha }) => c.curso.temas.includes(tema);
  /** Pega até `n` cursos de `pool` que passem no filtro, na ordem da planilha. */
  function pegar(pool: typeof indexados, n: number, filtro: (c: (typeof indexados)[number]) => boolean = () => true) {
    let pegos = 0;
    for (const c of pool) {
      if (pegos >= n) break;
      if (escolhidos.has(c.ordem) || !filtro(c)) continue;
      escolhidos.add(c.ordem);
      pegos++;
    }
    return pegos;
  }

  const cotaProximo = proximo.length ? Math.min(terco, proximo.length) : 0;
  const cotaAtual = r.tamanho - cotaProximo;

  // Nível atual: primeiro a habilidade "junto" (os que NÃO são também do
  // objetivo, para ela aparecer de fato), depois o objetivo, depois a base.
  if (r.junto !== "nenhum") {
    const junto = r.junto;
    const cota = Math.min(terco, cotaAtual);
    const pegos = pegar(atual, cota, (c) => tem(junto)(c) && !tem(r.objetivo)(c));
    pegar(atual, cota - pegos, tem(junto));
  }
  pegar(atual, cotaAtual - escolhidos.size, tem(r.objetivo));
  pegar(atual, cotaAtual - escolhidos.size);

  // Próximo nível: objetivo primeiro, depois "junto", depois a base.
  const antes = escolhidos.size;
  const faltaProximo = () => cotaProximo - (escolhidos.size - antes);
  pegar(proximo, faltaProximo(), tem(r.objetivo));
  if (r.junto !== "nenhum") pegar(proximo, faltaProximo(), tem(r.junto));
  pegar(proximo, faltaProximo());

  // Sobra de um nível curto passa para o outro.
  pegar(atual, r.tamanho - escolhidos.size);
  pegar(proximo, r.tamanho - escolhidos.size);

  return indexados
    .filter(({ ordem }) => escolhidos.has(ordem))
    .sort((a, b) => a.curso.nivel - b.curso.nivel || a.ordem - b.ordem)
    .map(({ curso }) => ({
      slug: curso.slug,
      motivo: curso.temas.includes(r.objetivo)
        ? r.objetivo
        : r.junto !== "nenhum" && curso.temas.includes(r.junto)
          ? r.junto
          : null,
    }));
}
