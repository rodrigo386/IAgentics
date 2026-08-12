import type { Metadata } from "next";
import { exigirAdmin } from "@/lib/admin/sessao";
import { ShellAdmin } from "@/components/admin/ShellAdmin";

export const metadata: Metadata = {
  title: { default: "Administração", template: "%s · IAgentics Academy" },
  robots: { index: false }, // área de admin não indexa
};

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  // Portão do admin: roda antes de qualquer render. Falha vira 404 (ver lib/admin/sessao.ts).
  await exigirAdmin();

  return (
    <div className="min-h-dvh bg-bg text-fg lg:flex">
      <ShellAdmin />
      <main className="mx-auto w-full max-w-[1200px] px-5 py-10 sm:px-8 lg:px-10">{children}</main>
    </div>
  );
}
