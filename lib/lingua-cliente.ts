"use client";

import { usePathname } from "next/navigation";
import type { Lingua } from "@/lib/i18n";

/** O idioma da página, para componentes de cliente: tudo sob /en é inglês. */
export function useLingua(): Lingua {
  const rota = usePathname() ?? "/";
  return rota === "/en" || rota.startsWith("/en/") ? "en" : "pt";
}
