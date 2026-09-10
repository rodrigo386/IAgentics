"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { naoContarEsteNavegador } from "@/lib/nao-contar";

/**
 * Contador de visitas do site: um POST por troca de rota, via sendBeacon
 * (não disputa banda com a navegação e sobrevive à página fechando).
 *
 * Privacidade por construção: manda o pathname e, na PRIMEIRA visualização do
 * documento, o hostname de quem indicou - sem cookie, sem id, sem user-agent,
 * sem caminho nem querystring do referrer. O servidor agrega por dia+seção e
 * reduz o hostname a um balde fechado (lib/estatisticas.ts).
 *
 * A ENTRADA É SÓ A PRIMEIRA. `document.referrer` não muda em navegação de
 * cliente do App Router: ele continua sendo quem trouxe a pessoa ao site.
 * Mandá-lo em toda troca de rota contaria a mesma chegada quatro vezes e
 * transformaria "quantos vieram do Google" num número inflado pela quantidade
 * de páginas que a pessoa leu. Marcando só a primeira, `entradas` conta
 * chegadas e `page_views` conta leituras - e a diferença entre os dois é a
 * navegação dentro do site.
 *
 * /app e /admin são pulados aqui E revalidados no servidor.
 */

/* Módulo, não estado de React: precisa viver enquanto o DOCUMENTO viver, que é
   exatamente o recorte de "uma entrada". Um useRef reiniciaria a cada
   remontagem do componente. */
let jaRegistrouEntrada = false;

export function Beacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || /^\/(app|admin)(\/|$)/.test(pathname)) return;
    /* Quem marcou "não contar" no /admin sai da medição antes de qualquer
       outra coisa - inclusive antes de gastar a entrada. */
    if (naoContarEsteNavegador()) return;

    const corpo: { rota: string; origem?: string } = { rota: pathname };
    if (!jaRegistrouEntrada) {
      jaRegistrouEntrada = true;
      corpo.origem = hostDeQuemIndicou();
    }

    const dados = JSON.stringify(corpo);
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/estatisticas", new Blob([dados], { type: "application/json" }));
    } else {
      fetch("/api/estatisticas", { method: "POST", body: dados, keepalive: true }).catch(() => {});
    }
  }, [pathname]);

  return null;
}

/** SÓ O HOSTNAME. O resto do referrer - caminho e querystring - é onde mora o
 *  que poderia identificar alguém: termo de busca, id de campanha, token
 *  colado num link. Nada disso precisa sair do navegador para responder "de
 *  onde vieram", então não sai. */
function hostDeQuemIndicou(): string {
  try {
    return document.referrer ? new URL(document.referrer).hostname : "";
  } catch {
    return "";
  }
}
