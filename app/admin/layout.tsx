import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/* O /admin não é indexável e não deve ser pré-renderizado: lê o banco a cada
   request, e o build do Railway não alcança o Postgres (mesmo incidente que
   derrubou o primeiro deploy do site). */
export const dynamic = "force-dynamic";

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-bg text-fg">{children}</div>;
}
