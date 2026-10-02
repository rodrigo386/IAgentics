"use client";
import { useEffect, useState } from "react";
import { catalogo as t } from "@/lib/content";
import { calcularCarrinho, precosFixos } from "@/lib/catalogo/preco";

/**
 * Estado do carrinho do catálogo (2026-09-26).
 *
 * Mora em localStorage — conveniência por navegador. Tudo com try/catch:
 * janela anônima ou armazenamento bloqueado só fazem o carrinho não
 * sobreviver ao recarregar; a página funciona igual.
 *
 * O preço exibido sai da MESMA calcularCarrinho que o servidor usa; o servidor
 * recalcula de qualquer jeito, e é o valor dele que vai para o Asaas. Slug que
 * não existe mais no catálogo (de quando havia 63 cursos e packs) é descartado
 * pelo cálculo, então um carrinho antigo guardado no navegador não quebra nada.
 */
export const CHAVE_CARRINHO = "iagentics:carrinho";

const VALIDOS = t.cursos.map((c) => c.slug);

export function useCarrinho(precos: { cursoCentavos: number; modo: "teste" | "real" }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  // Preço de cada curso, no modo da página — o mesmo cálculo do servidor.
  const fixos = precosFixos(t.cursos, precos.modo);

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

  const carrinho = calcularCarrinho(slugs, VALIDOS, precos.cursoCentavos, fixos);
  const noCarrinho = new Set(carrinho.itens.map((i) => i.slug));

  return {
    carrinho,
    fixos,
    noCarrinho,
    /** Preço de um curso sem preço próprio (a base). */
    precoCursoCentavos: precos.cursoCentavos,
    adicionar: (slug: string) => salvar([...slugs, slug]),
    remover: (slug: string) => salvar(slugs.filter((s) => s !== slug)),
    limpar: () => {
      try {
        localStorage.removeItem(CHAVE_CARRINHO);
      } catch {}
    },
  };
}

export type Carrinho = ReturnType<typeof useCarrinho>;
