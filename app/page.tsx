import { metadataHome, PaginaHome } from "@/components/paginas/Home";

/* O conteúdo da página mora em components/paginas/Home.tsx, compartilhado
   com a versão em inglês (2026-11-06). */
export const metadata = metadataHome("pt");

export default function Page() {
  return <PaginaHome lingua="pt" />;
}
