"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ChartLine,
  UsersThree,
  FolderOpen,
  GearSix,
  ArrowSquareOut,
  CaretDoubleLeft,
} from "@phosphor-icons/react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { admin } from "@/lib/content-admin";

const links = [
  { href: "/admin", label: admin.shell.metricas, Icone: ChartLine },
  { href: "/admin/alunos", label: admin.shell.alunos, Icone: UsersThree },
  { href: "/admin/conteudo", label: admin.shell.conteudo, Icone: FolderOpen },
  { href: "/admin/configuracoes", label: admin.shell.configuracoes, Icone: GearSix },
];

const CHAVE = "iagentics-admin-sidebar";

/**
 * Shell do /admin, agora recolhível em lg+ (pedido de 2026-08-15): o rail de
 * ícones sobra 64px e devolve a largura para as tabelas e gráficos. A escolha
 * persiste em localStorage; o primeiro paint SSR nasce expandido e pode
 * ajustar após a hidratação - aceitável numa área logada de um admin só.
 *
 * A transição anima width (200ms) - exceção consciente à regra de animar só
 * transform: é UMA interação discreta disparada por clique, não animação
 * contínua; rótulos fazem fade de opacity junto. motion-reduce corta tudo.
 *
 * Cada link ganha `aria-current` quando ativo (o passo visual usa isso).
 * Abaixo de lg nada muda: nav no topo, quebrando linha.
 */
export function ShellAdmin() {
  const pathname = usePathname();
  const [recolhida, setRecolhida] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(CHAVE) === "recolhida";
    } catch {
      return false;
    }
  });

  function alternar() {
    setRecolhida((r) => {
      try {
        localStorage.setItem(CHAVE, r ? "expandida" : "recolhida");
      } catch {}
      return !r;
    });
  }

  const ativa = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <aside
      className={`border-b border-line transition-[width] duration-200 motion-reduce:transition-none lg:flex lg:min-h-dvh lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r ${
        recolhida ? "lg:w-16" : "lg:w-60"
      }`}
    >
      <div className="flex h-16 items-center justify-between px-5 sm:px-8 lg:h-auto lg:flex-col lg:items-stretch lg:gap-6 lg:px-3 lg:py-8">
        <Link href="/admin" aria-label={admin.nome} className={recolhida ? "lg:self-center" : "lg:px-3"}>
          {/* Recolhida, o wordmark inteiro não cabe: fica só o símbolo,
              cortado por overflow no contêiner de 40px. */}
          <span className={`block overflow-hidden ${recolhida ? "lg:w-10" : ""}`}>
            <Image
              src="/plataforma/academy-logo.png"
              alt={admin.nome}
              width={893}
              height={254}
              className="h-8 w-auto max-w-none invert dark:invert-0"
              priority
            />
          </span>
        </Link>
        <div className={recolhida ? "lg:self-center" : "lg:px-3"}>
          <ThemeToggle />
        </div>
      </div>
      <nav
        aria-label={admin.nome}
        className="flex flex-wrap gap-1 border-t border-line px-3 py-2 sm:px-6 lg:flex-1 lg:flex-col lg:flex-nowrap lg:border-t-0 lg:px-3 lg:py-0"
      >
        {links.map(({ href, label, Icone }) => (
          <Link
            key={href}
            href={href}
            aria-current={ativa(href) ? "page" : undefined}
            title={recolhida ? label : undefined}
            className={`flex shrink-0 items-center gap-3 whitespace-nowrap rounded-control px-4 py-2 text-sm transition-colors ${
              ativa(href) ? "bg-surface text-fg" : "text-fg-muted hover:bg-surface hover:text-fg"
            } ${recolhida ? "lg:justify-center lg:px-0 lg:py-2.5" : ""}`}
          >
            <Icone size={18} aria-hidden="true" className="hidden shrink-0 lg:block" />
            <span className={recolhida ? "lg:hidden" : ""}>{label}</span>
          </Link>
        ))}
        <Link
          href="/app"
          title={recolhida ? admin.shell.verComoAluno : undefined}
          className={`flex shrink-0 items-center gap-3 whitespace-nowrap rounded-control border border-line px-4 py-2 text-sm text-fg-muted transition-colors hover:border-line-strong hover:text-fg lg:mt-auto ${
            recolhida ? "lg:justify-center lg:border-0 lg:px-0 lg:py-2.5" : ""
          }`}
        >
          <ArrowSquareOut size={18} aria-hidden="true" className="hidden shrink-0 lg:block" />
          <span className={recolhida ? "lg:hidden" : ""}>{admin.shell.verComoAluno}</span>
        </Link>
        <button
          type="button"
          onClick={alternar}
          aria-expanded={!recolhida}
          title={recolhida ? admin.shell.expandir : admin.shell.recolher}
          className={`hidden shrink-0 items-center gap-3 rounded-control px-4 py-2 text-sm text-fg-subtle transition-colors hover:bg-surface hover:text-fg lg:mb-6 lg:flex ${
            recolhida ? "lg:justify-center lg:px-0 lg:py-2.5" : ""
          }`}
        >
          <CaretDoubleLeft
            size={18}
            aria-hidden="true"
            className={`shrink-0 transition-transform duration-200 motion-reduce:transition-none ${recolhida ? "rotate-180" : ""}`}
          />
          <span className={recolhida ? "lg:hidden" : ""}>{admin.shell.recolher}</span>
        </button>
      </nav>
    </aside>
  );
}
