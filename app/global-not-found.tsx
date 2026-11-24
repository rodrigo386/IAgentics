import type { Metadata } from "next";
import { Documento } from "@/components/site/Documento";
import { NaoEncontrada } from "@/components/site/NaoEncontrada";
import { naoEncontrada } from "@/lib/content";

/**
 * 404 de URL que não casa com rota nenhuma (2026-11-24). Com dois layouts
 * raiz (app/(pt) e app/en), não há layout acima dele: o documento vem aqui.
 */
export const metadata: Metadata = { title: naoEncontrada.titulo, robots: { index: false } };

export default function GlobalNotFound() {
  return (
    <Documento lingua="pt">
      <NaoEncontrada />
    </Documento>
  );
}
