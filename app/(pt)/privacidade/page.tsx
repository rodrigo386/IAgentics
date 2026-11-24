import { metadataPrivacidade, PaginaPrivacidade } from "@/components/paginas/Privacidade";

/* O conteúdo da página mora em components/paginas/Privacidade.tsx, compartilhado
   com a versão em inglês (2026-11-06). */
export const metadata = metadataPrivacidade("pt");

export default function Page() {
  return <PaginaPrivacidade lingua="pt" />;
}
