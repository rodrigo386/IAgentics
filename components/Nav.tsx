"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { List, X } from "@phosphor-icons/react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { nav, cta } from "@/lib/content";

/**
 * Desktop nav is a single 64px line: lockup, five links, theme control, one CTA.
 * Below lg it collapses to a sheet so nothing ever wraps to a second line.
 */
export function Nav() {
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
        aria-label="Principal"
        className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-5 sm:px-8"
      >
        <Link href="/" className="shrink-0 text-fg" aria-label="IAgentics, início">
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
          <ThemeToggle />

          <a
            href="#contato"
            className="hidden whitespace-nowrap rounded-control bg-accent px-5 py-2.5 text-sm font-medium text-accent-on transition-[background-color,transform] duration-200 hover:bg-accent-hover active:scale-[0.98] sm:inline-block"
          >
            {cta.contact}
          </a>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
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
              href="#contato"
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
