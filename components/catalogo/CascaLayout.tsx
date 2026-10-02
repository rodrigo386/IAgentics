"use client";
import { useState, type ReactNode } from "react";
import { catalogo as t } from "@/lib/content";
import { BarraCarrinho } from "./BarraCarrinho";
import { Gaveta } from "./Gaveta";
import { PainelCarrinho } from "./PainelCarrinho";
import { Trilha } from "./Trilha";
import { useCarrinho, type Carrinho } from "./useCarrinho";

/**
 * A moldura da Vitrine (2026-09-26): o estado do carrinho, a barra fixa com a
 * escada do desconto, a gaveta do carrinho/checkout e a do questionário. Nasceu
 * para servir a três opções de layout; ficou a Vitrine, e a separação continua
 * útil — a vitrine só desenha, recebendo o estado e o "abrir trilha" pela
 * render prop.
 */
type Acoes = { estado: Carrinho; abrirTrilha: () => void };
type Props = { precoBaseCentavos: number; precoPackCentavos: number; modo: "teste" | "real"; urlCheckout: string; children: (a: Acoes) => ReactNode };

export function CascaLayout({ precoBaseCentavos, precoPackCentavos, modo, urlCheckout, children }: Props) {
  const estado = useCarrinho({ cursoCentavos: precoBaseCentavos, packCentavos: precoPackCentavos, modo });
  const [gaveta, setGaveta] = useState<"carrinho" | "trilha" | null>(null);
  // Remonta o questionário a cada abertura: sempre começa da pergunta 1.
  const [rodada, setRodada] = useState(0);
  const abrirTrilha = () => {
    setRodada((r) => r + 1);
    setGaveta("trilha");
  };

  return (
    <>
      {/* Espaço para a barra fixa não cobrir o fim da página. */}
      <div className="pb-24">{children({ estado, abrirTrilha })}</div>

      <BarraCarrinho estado={estado} aoVerCarrinho={() => setGaveta("carrinho")} aoMontarTrilha={abrirTrilha} />

      <Gaveta aberta={gaveta === "carrinho"} aoFechar={() => setGaveta(null)} titulo={t.gaveta.carrinho}>
        <PainelCarrinho estado={estado} precoBaseCentavos={precoBaseCentavos} urlCheckout={urlCheckout} />
      </Gaveta>

      <Gaveta aberta={gaveta === "trilha"} aoFechar={() => setGaveta(null)} titulo={t.gaveta.trilha} centro>
        {gaveta === "trilha" ? (
          <Trilha
            key={rodada}
            precoBaseCentavos={precoBaseCentavos}
            fixos={estado.fixos}
            aoAplicar={(slugs) => {
              estado.aplicarTrilha(slugs);
              // Depois de aplicar, mostra o carrinho: é o próximo passo natural.
              setGaveta("carrinho");
            }}
          />
        ) : null}
      </Gaveta>
    </>
  );
}
