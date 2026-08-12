import type { Metadata } from "next";
import { ShellHeader } from "@/components/plataforma/ShellHeader";
import { lerConfiguracao } from "@/lib/admin/configuracoes";

export const metadata: Metadata = {
  title: { default: "Plataforma", template: "%s · IAgentics Academy" },
  robots: { index: false }, // área logada não indexa
};

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
