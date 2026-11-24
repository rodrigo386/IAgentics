import { metadataAcademy, PaginaAcademy } from "@/components/paginas/Academy";

/* O conteúdo da página mora em components/paginas/Academy.tsx, compartilhado
   com a versão em inglês (2026-11-06). */
export const metadata = metadataAcademy("pt");

export default function Page() {
  return <PaginaAcademy lingua="pt" />;
}
