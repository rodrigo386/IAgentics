"use client";
import { useEffect, useMemo, useState } from "react";
import { catalogo as t } from "@/lib/content";
import { calcularCarrinho } from "@/lib/catalogo/preco";

/**
 * Estado do carrinho do catálogo, compartilhado pelos layouts (2026-09-26).
 *
 * Mora em localStorage — conveniência por navegador. Tudo com try/catch:
 * janela anônima ou armazenamento bloqueado só fazem o carrinho não
 * sobreviver ao recarregar; a página funciona igual. A MESMA chave em todos os
 * layouts: trocar de opção de layout na prévia não esvazia o carrinho.
 *
 * O preço exibido sai da MESMA calcularCarrinho que o servidor usa; o servidor
 * recalcula de qualquer jeito, e é o valor dele que vai para o Asaas.
 */
export const CHAVE_CARRINHO = "iagentics:carrinho";

export function useCarrinho(precoBaseCentavos: number) {
  const validos = useMemo(() => t.cursos.map((c) => c.slug), []);
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

  const carrinho = calcularCarrinho(slugs, validos, precoBaseCentavos);
  const noCarrinho = new Set(carrinho.itens.map((i) => i.slug));

  return {
    carrinho,
    noCarrinho,
    adicionar: (slug: string) => salvar([...slugs, slug]),
    remover: (slug: string) => salvar(slugs.filter((s) => s !== slug)),
    /* A trilha SOMA ao carrinho, não substitui: quem já escolheu algo à mão não
       perde a escolha. Os cursos da trilha entram depois, na ordem de estudo. */
    aplicarTrilha: (trilha: string[]) => salvar([...slugs, ...trilha.filter((s) => !slugs.includes(s))]),
    limpar: () => {
      try {
        localStorage.removeItem(CHAVE_CARRINHO);
      } catch {}
    },
  };
}

export type Carrinho = ReturnType<typeof useCarrinho>;
