import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { ShellHeader } from "@/components/plataforma/ShellHeader";
import { lerConfiguracao } from "@/lib/admin/configuracoes";
import { plataforma } from "@/lib/content-plataforma";
import { buscarAssinatura } from "@/lib/plataforma/dados";

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
  const [aviso, sessao] = await Promise.all([lerConfiguracao("aviso_topo"), auth()]);

  /* Faixa de cobrança vencida (Onda 1.2): fica no LAYOUT porque o aluno
     inadimplente não tem mais motivo para abrir o painel — sem acesso, ele
     pode cair direto em /app/conta ou numa aula pelo histórico, e a faixa
     precisa alcançá-lo em qualquer uma. Uma query a mais por request no /app,
     em paralelo com a do aviso; /app/entrar e /app/criar-conta não têm sessão
     e não pagam nem isso. */
  const inadimplente = sessao?.user?.id ? (await buscarAssinatura(sessao.user.id)) === "inadimplente" : false;

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <ShellHeader />
      {inadimplente ? (
        <div
          role="status"
          className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-line bg-brand-ink px-5 py-3 text-center text-sm text-brand-paper sm:px-8"
        >
          <span>{plataforma.shell.faixaInadimplente}</span>
          <Link href="/app/assinar" className="font-medium text-brand-paper underline underline-offset-4">
            {plataforma.shell.faixaInadimplenteCta}
          </Link>
        </div>
      ) : null}
      {aviso ? (
        <div role="status" className="border-b border-line bg-surface px-5 py-3 text-center text-sm text-fg sm:px-8">
          {aviso}
        </div>
      ) : null}
      <main className="mx-auto w-full max-w-[1200px] px-5 py-10 sm:px-8">{children}</main>
    </div>
  );
}
