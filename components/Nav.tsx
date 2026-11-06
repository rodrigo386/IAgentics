"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, X } from "@phosphor-icons/react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { nav as navPt, cta as ctaPt, ui as uiPt } from "@/lib/content";
import { nav as navEn, cta as ctaEn } from "@/lib/content-en/geral";
import { ui as uiEn } from "@/lib/content-en/ui";
import { rotaNoOutroIdioma } from "@/lib/i18n";
import { useLingua } from "@/lib/lingua-cliente";

/**
 * Desktop nav is a single 64px line: lockup, five links, theme control, one CTA.
 * Below lg it collapses to a sheet so nothing ever wraps to a second line.
 *
 * `contato`: para onde vai o "Vamos conversar". O padrão é o formulário da
 * home (/#contato), que serve em qualquer página; as páginas que têm o próprio
 * <Contact> (home, /nexo, /academy, /spend-lab) passam "#contato". Era
 * "#contato" fixo, e na /cursos, nos artigos e na privacidade o botão não
 * levava a lugar nenhum (revisão de 2026-10-14). Decidido por página, no
 * servidor: descobrir no cliente deixaria o HTML inicial com o link quebrado.
 */
export function Nav({ contato: contatoPedido }: { contato?: string } = {}) {
  const lingua = useLingua();
  const rota = usePathname() ?? "/";
  const contato = contatoPedido ?? (lingua === "en" ? "/en#contato" : "/#contato");
  const [nav, cta, ui] = lingua === "en" ? [navEn, ctaEn, uiEn] : [navPt, ctaPt, uiPt];
  const [open, setOpen] = useState(false);

  // Locks background scroll while the mobile sheet is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-[50] border-b border-line bg-bg/85 backdrop-blur-md">
      <nav
        aria-label={ui.principal}
        className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-5 sm:px-8"
      >
        <Link href={lingua === "en" ? "/en" : "/"} className="shrink-0 text-fg" aria-label={ui.inicio}>
          <Logo className="w-[132px]" />
        </Link>

        <ul className="ml-auto hidden items-center gap-7 lg:flex">
          {nav.links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm text-fg-muted transition-colors duration-200 hover:text-fg"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-3 lg:ml-0">
          {/* O idioma de destino, com o nome por extenso para leitor de tela
              (2026-11-06). Página sem versão em inglês leva à home em inglês. */}
          <Link
            href={rotaNoOutroIdioma(rota)}
            hrefLang={ui.idioma.lingua}
            lang={ui.idioma.lingua}
            aria-label={ui.idioma.nome}
            className="grid h-10 place-items-center rounded-control border border-line px-3 font-mono text-xs tracking-[0.12em] text-fg transition-colors duration-200 hover:border-line-strong"
          >
            {ui.idioma.rotulo}
          </Link>
          <ThemeToggle />

          <a
            href={contato}
            className="hidden whitespace-nowrap rounded-control bg-accent px-5 py-2.5 text-sm font-medium text-accent-on transition-[background-color,transform] duration-200 hover:bg-accent-hover active:scale-[0.98] sm:inline-block"
          >
            {cta.contact}
          </a>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? ui.fecharMenu : ui.abrirMenu}
            className="grid size-10 place-items-center rounded-control border border-line text-fg transition-colors duration-200 hover:border-line-strong active:scale-[0.96] lg:hidden"
          >
            {open ? <X size={18} weight="regular" /> : <List size={18} weight="regular" />}
          </button>
        </div>
      </nav>

      {open ? (
        <div
          id="menu-mobile"
          className="border-t border-line bg-bg lg:hidden"
        >
          <ul className="mx-auto flex max-w-[1400px] flex-col px-5 sm:px-8">
            {nav.links.map((link) => (
              <li key={link.href} className="border-b border-line last:border-b-0">
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block py-4 text-lg text-fg"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mx-auto max-w-[1400px] px-5 pb-6 pt-5 sm:px-8">
            <a
              href={contato}
              onClick={() => setOpen(false)}
              className="block rounded-control bg-accent px-5 py-3 text-center font-medium text-accent-on"
            >
              {cta.contact}
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}
