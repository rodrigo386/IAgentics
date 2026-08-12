import type { Metadata } from "next";
import { ShellHeader } from "@/components/plataforma/ShellHeader";
import { lerConfiguracao } from "@/lib/admin/configuracoes";

export const metadata: Metadata = {
  title: { default: "Plataforma", template: "%s · IAgentics Academy" },
  robots: { index: false }, // área logada não indexa
};

/**
 * Árvore /app inteira é dinâmica, E ISSO É CORREÇÃO DE DEPLOY, não estilo.
 *
 * Este layout lê `aviso_topo` do banco. Sem esta linha, o `next build` tenta
 * PRÉ-RENDERIZAR /app/entrar e /app/criar-conta (as únicas páginas sem cookies
 * na árvore) e conecta no Postgres em tempo de build — na máquina de build do
 * Railway a rede interna do banco não existe e o build inteiro morre com
 * ENOTFOUND postgres.railway.internal. Foi exatamente o primeiro deploy falho.
 *
 * Dinâmica também é o comportamento CERTO para o aviso: o admin liga a faixa
 * de manutenção e o aluno a vê no próximo request, não no próximo build.
 */
export const dynamic = "force-dynamic";

export default async function LayoutPlataforma({ children }: { children: React.ReactNode }) {
  // Faixa opcional definida em /admin/configuracoes ("aviso_topo") — vazia,
  // padrão, não renderiza nada aqui.
  const aviso = await lerConfiguracao("aviso_topo");

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <ShellHeader />
      {aviso ? (
        <div role="status" className="border-b border-line bg-surface px-5 py-3 text-center text-sm text-fg sm:px-8">
          {aviso}
        </div>
      ) : null}
      <main className="mx-auto w-full max-w-[1200px] px-5 py-10 sm:px-8">{children}</main>
    </div>
  );
}
