"use client";
import { useState, type ReactNode } from "react";
import { catalogo as t } from "@/lib/content";
import { BarraCarrinho } from "./BarraCarrinho";
import { Gaveta } from "./Gaveta";
import { PainelCarrinho } from "./PainelCarrinho";
import { useCarrinho, type Carrinho } from "./useCarrinho";

/**
 * A moldura da Vitrine (2026-09-26): o estado do carrinho, a barra fixa do
 * carrinho e a gaveta do carrinho/checkout. A vitrine só desenha, recebendo o
 * estado pela render prop. (Até 2026-10-02 havia também a gaveta do
 * questionário "Monte sua trilha", que saiu com o catálogo de 63 cursos.)
 */
type Props = { precoBaseCentavos: number; modo: "teste" | "real"; urlCheckout: string; children: (estado: Carrinho) => ReactNode };

export function CascaLayout({ precoBaseCentavos, modo, urlCheckout, children }: Props) {
  const estado = useCarrinho({ cursoCentavos: precoBaseCentavos, modo });
  const [aberta, setAberta] = useState(false);

  return (
    <>
      {/* Espaço para a barra fixa não cobrir o fim da página. */}
      <div className="pb-24">{children(estado)}</div>

      <BarraCarrinho estado={estado} aoVerCarrinho={() => setAberta(true)} />

      <Gaveta aberta={aberta} aoFechar={() => setAberta(false)} titulo={t.gaveta.carrinho}>
        <PainelCarrinho estado={estado} urlCheckout={urlCheckout} />
      </Gaveta>
    </>
  );
}
