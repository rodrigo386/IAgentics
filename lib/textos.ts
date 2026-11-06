import { cache } from "react";
import * as pt from "@/lib/content";
import * as en from "@/lib/content-en";
import type { Lingua } from "@/lib/i18n";

/**
 * Os textos no idioma da página que está sendo montada (2026-11-06).
 *
 * A página em inglês chama `definirLingua("en")` na primeira linha; os
 * componentes de servidor abaixo dela leem `textos()`. O estado vive em
 * `cache` do React, que dura UMA renderização: é o mesmo mecanismo do
 * `setRequestLocale` do next-intl, e evita passar `lingua` por trinta
 * componentes. Componente de cliente não enxerga isto: usa `useLingua()`
 * (lib/lingua-cliente.ts), que lê o endereço.
 */
const estado = cache(() => ({ lingua: "pt" as Lingua }));

export function definirLingua(lingua: Lingua) {
  estado().lingua = lingua;
}

export function linguaAtual(): Lingua {
  return estado().lingua;
}

const PT = {
  ui: pt.ui,
  paginas: pt.paginas,
  site: pt.site,
  cta: pt.cta,
  naoEncontrada: pt.naoEncontrada,
  privacidade: pt.privacidade,
  nav: pt.nav,
  hero: pt.hero,
  problema: pt.problema,
  partners: pt.partners,
  credenciais: pt.credenciais,
  solutions: pt.solutions,
  contact: pt.contact,
  footer: pt.footer,
  nexo: pt.nexo,
  nexoPage: pt.nexoPage,
  academy: pt.academy,
  spendLab: pt.spendLab,
};

/* O inglês tem de ter exatamente as mesmas chaves (o tipo confere). */
const EN: { [K in keyof typeof PT]: (typeof en)[K] } = {
  ui: en.ui,
  paginas: en.paginas,
  site: en.site,
  cta: en.cta,
  naoEncontrada: en.naoEncontrada,
  privacidade: en.privacidade,
  nav: en.nav,
  hero: en.hero,
  problema: en.problema,
  partners: en.partners,
  credenciais: en.credenciais,
  solutions: en.solutions,
  contact: en.contact,
  footer: en.footer,
  nexo: en.nexo,
  nexoPage: en.nexoPage,
  academy: en.academy,
  spendLab: en.spendLab,
};

export type Textos = typeof EN;

export function textosEm(lingua: Lingua): Textos {
  return lingua === "en" ? EN : PT;
}

/** Os textos da página em montagem (componentes de servidor). */
export function textos(): Textos {
  return textosEm(estado().lingua);
}
