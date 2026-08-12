import type { Metadata } from "next";
import { ShellHeader } from "@/components/plataforma/ShellHeader";

export const metadata: Metadata = {
  title: { default: "Plataforma", template: "%s · IAgentics Academy" },
  robots: { index: false }, // área logada não indexa
};

export default function LayoutPlataforma({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <ShellHeader />
      <main className="mx-auto w-full max-w-[1200px] px-5 py-10 sm:px-8">{children}</main>
    </div>
  );
}
