import type { Metadata } from "next";
import { auth } from "@/auth";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { CursosEstante } from "@/components/sections/cursos/Estante";
import { CursosCatalogo } from "@/components/sections/cursos/Catalogo";
import { CursosComoFunciona } from "@/components/sections/cursos/ComoFunciona";
import { CursosAssinatura } from "@/components/sections/cursos/Assinatura";
import { CursosApoiadores } from "@/components/sections/cursos/Apoiadores";
import { cursos as t } from "@/lib/content";
import { buscarCatalogo, temAcesso } from "@/lib/plataforma/dados";
import { JsonLd } from "@/components/seo/JsonLd";
import { cursosJsonLd, ogDaPagina } from "@/lib/seo";
import { VALOR_MENSAL } from "@/lib/asaas/cliente";

export const metadata: Metadata = {
  title: t.meta.titulo,
  description: t.meta.descricao,
  alternates: { canonical: "/cursos" },
  openGraph: ogDaPagina("/cursos", `${t.meta.titulo} · IAgentics Academy`, t.meta.descricao),
};

// Consulta banco e sessão a cada request - o build do Railway não tem rede
// para o banco, então esta página NÃO pode ser prerenderizada (mesmo
// incidente documentado em app/app/layout.tsx, herdado do antigo /planos).
export const dynamic = "force-dynamic";

/**
 * Landing pública da plataforma (/cursos) - o que o /app é, antes do login.
 * Ordem do argumento: o acervo em si (estante + catálogo com dado real),
 * como se usa, quanto custa e quem apoia. Um destino só para o funil de
 * assinatura; /planos redireciona para cá (next.config.ts).
 */
export default async function PaginaCursos() {
  const sessao = await auth();
  const logado = Boolean(sessao?.user?.id);
  const assinante = sessao?.user?.id ? await temAcesso(sessao.user.id) : false;
  const cursos = await buscarCatalogo();
  const destino = logado ? "/app/assinar" : "/app/criar-conta?voltar=/app/assinar";

  return (
    <>
      {/* Dado estruturado gerado do MESMO catálogo que a página renderiza -
          curso despublicado some dos dois ao mesmo tempo. */}
      <JsonLd dados={cursosJsonLd(cursos, VALOR_MENSAL)} />
      <Nav />
      <main id="conteudo" className="pt-16">
        <CursosEstante cursos={cursos} destino={destino} assinante={assinante} logado={logado} />
        <CursosCatalogo cursos={cursos} />
        <CursosComoFunciona />
        <CursosAssinatura destino={destino} assinante={assinante} />
        <CursosApoiadores />
      </main>
      <Footer />
    </>
  );
}
