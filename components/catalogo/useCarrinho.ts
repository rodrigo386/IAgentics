"use client";
import { useEffect, useState } from "react";
import { catalogo as t } from "@/lib/content";
import { calcularPedido, precosFixos } from "@/lib/catalogo/preco";

/**
 * Estado do carrinho do catálogo (2026-09-26).
 *
 * Mora em localStorage — conveniência por navegador. Tudo com try/catch:
 * janela anônima ou armazenamento bloqueado só fazem o carrinho não
 * sobreviver ao recarregar; a página funciona igual.
 *
 * Guarda slugs de cursos E de packs, na ordem em que entraram. O preço exibido
 * sai da MESMA calcularPedido que o servidor usa; o servidor recalcula de
 * qualquer jeito, e é o valor dele que vai para o Asaas.
 */
export const CHAVE_CARRINHO = "iagentics:carrinho";

const NIVEL_DO_CURSO = new Map<string, number>(t.cursos.map((c) => [c.slug, c.nivel]));
const NIVEL_DO_PACK = new Map<string, number>(t.packs.map((p) => [p.slug, p.nivel]));

export function useCarrinho(precos: { cursoCentavos: number; packCentavos: number; modo: "teste" | "real" }) {
  // Cursos de preço próprio, no modo da página — o mesmo cálculo do servidor.
  const fixos = precosFixos(t.cursos, precos.modo);
  const [slugs, setSlugs] = useState<string[]>([]);

  // Lê depois de montar: no SSR não há localStorage, e ler no render quebraria a hidratação.
  useEffect(() => {
    try {
      const salvo = JSON.parse(localStorage.getItem(CHAVE_CARRINHO) ?? "[]");
      if (Array.isArray(salvo)) setSlugs(salvo.filter((s) => typeof s === "string"));
    } catch {}
  }, []);

  function salvar(novos: string[]) {
    setSlugs(novos);
    try {
      localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(novos));
    } catch {}
  }

  const carrinho = calcularPedido(slugs, t.cursos, t.packs, { ...precos, fixos });
  const niveisCobertos = new Set(carrinho.packs.map((p) => p.nivel));
  const noCarrinho = new Set([...carrinho.itens.map((i) => i.slug), ...carrinho.packs.map((p) => p.slug)]);
  /** Curso cujo nível já está num pack do carrinho — não se compra de novo. */
  const coberto = (slug: string) => niveisCobertos.has(NIVEL_DO_CURSO.get(slug) ?? -1);

  return {
    carrinho,
    fixos,
    /** Preço de um curso avulso (sem escada: todos iguais). */
    precoCursoCentavos: precos.cursoCentavos,
    noCarrinho,
    coberto,
    adicionar: (slug: string) => {
      const nivelPack = NIVEL_DO_PACK.get(slug);
      /* Pack entrando tira os avulsos do mesmo nível da lista guardada — além
         de o cálculo já ignorá-los, isso evita que eles "voltem" se o pack
         for removido depois sem a pessoa ter pedido. */
      if (nivelPack !== undefined) salvar([...slugs.filter((s) => NIVEL_DO_CURSO.get(s) !== nivelPack), slug]);
      else if (!coberto(slug)) salvar([...slugs, slug]);
    },
    remover: (slug: string) => salvar(slugs.filter((s) => s !== slug)),
    /* A trilha SOMA ao carrinho, não substitui: quem já escolheu algo à mão não
       perde a escolha. Entram depois, na ordem de estudo, e o que um pack já
       cobre fica de fora. */
    aplicarTrilha: (trilha: string[]) => salvar([...slugs, ...trilha.filter((s) => !slugs.includes(s) && !coberto(s))]),
    limpar: () => {
      try {
        localStorage.removeItem(CHAVE_CARRINHO);
      } catch {}
    },
  };
}

export type Carrinho = ReturnType<typeof useCarrinho>;
