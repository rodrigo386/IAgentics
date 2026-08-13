import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { admin } from "@/lib/content-admin";

const links = [
  { href: "/admin", label: admin.shell.metricas },
  { href: "/admin/alunos", label: admin.shell.alunos },
  { href: "/admin/conteudo", label: admin.shell.conteudo },
  { href: "/admin/configuracoes", label: admin.shell.configuracoes },
];

/**
 * Shell do /admin: mesmos tokens e logo Academy de components/plataforma/ShellHeader.tsx.
 * Em lg+ vira nav lateral fixa; abaixo disso a nav quebra em quantas linhas
 * precisar no topo — rolagem horizontal escondia "Configurações" sem nenhum
 * indício de que havia mais abas.
 */
export function ShellAdmin() {
  return (
    <aside className="border-b border-line lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
      <div className="flex h-16 items-center justify-between px-5 sm:px-8 lg:h-auto lg:flex-col lg:items-stretch lg:gap-6 lg:px-6 lg:py-8">
        <Link href="/admin" aria-label={admin.nome}>
          <Image
            src="/plataforma/academy-logo.png"
            alt={admin.nome}
            width={893}
            height={254}
            className="h-8 w-auto invert dark:invert-0"
            priority
          />
        </Link>
        <ThemeToggle />
      </div>
      <nav
        aria-label={admin.nome}
        className="flex flex-wrap gap-1 border-t border-line px-3 py-2 sm:px-6 lg:flex-col lg:border-t-0 lg:px-3 lg:py-0"
      >
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="shrink-0 whitespace-nowrap rounded-control px-4 py-2 text-sm text-fg-muted transition-colors hover:bg-surface hover:text-fg"
          >
            {l.label}
          </Link>
        ))}
        <Link
          href="/app"
          className="shrink-0 whitespace-nowrap rounded-control border border-line px-4 py-2 text-sm text-fg-muted transition-colors hover:border-line-strong hover:text-fg lg:mb-6 lg:mt-auto"
        >
          {admin.shell.verComoAluno}
        </Link>
      </nav>
    </aside>
  );
}
