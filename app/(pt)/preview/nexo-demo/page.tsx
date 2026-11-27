import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { NexoDemo } from "@/components/sections/nexo-demo/NexoDemo";
import { nexoDemo } from "@/lib/content";

/**
 * PRÉVIA do Nexo Demo (2026-11-27, pedido do Rodrigo: uma versão do Nexo
 * dentro do site para demonstração de vendas). As travas de toda prévia:
 * noindex aqui, /preview/ no Disallow do robots.txt, fora do sitemap, sem
 * link no site e fora do contador de visitas. Sem canonical: a URL definitiva
 * (/nexo/demo) ainda não existe.
 *
 * O cadastro e a demonstração inteira ficam no componente de cliente; o menu
 * e o rodapé do site entram como filhos, para aparecerem só na entrada
 * (dentro da demonstração a tela é a do produto).
 */
export const metadata: Metadata = {
  title: { absolute: nexoDemo.meta.titulo },
  description: nexoDemo.meta.descricao,
  robots: { index: false, follow: false },
};

export default function PreviaNexoDemo() {
  return <NexoDemo nav={<Nav />} rodape={<Footer />} />;
}
