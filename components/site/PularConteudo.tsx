"use client";

import { ui as uiPt } from "@/lib/content";
import { ui as uiEn } from "@/lib/content-en/ui";
import { useLingua } from "@/lib/lingua-cliente";

/** O "pular para o conteúdo" do layout raiz, no idioma da página (2026-11-06):
 *  o layout é um só para as duas versões e não sabe o idioma. */
export function PularConteudo() {
  const ui = useLingua() === "en" ? uiEn : uiPt;
  return (
    <a
      href="#conteudo"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-accent focus:px-5 focus:py-3 focus:text-accent-on"
    >
      {ui.pularConteudo}
    </a>
  );
}
