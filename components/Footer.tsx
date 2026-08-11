import { Logo } from "@/components/ui/Logo";
import { nav, contact, site, footer } from "@/lib/content";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line py-16">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 px-5 sm:px-8 md:grid-cols-12">
        <div className="md:col-span-5">
          <span className="block text-fg">
            <Logo className="w-[150px]" />
          </span>
          <p className="mt-6 max-w-[34ch] text-sm leading-relaxed text-fg-muted">
            {footer.note}
          </p>
        </div>

        <nav aria-label="Rodapé" className="md:col-span-4">
          <ul className="grid grid-cols-2 gap-y-3">
            {nav.links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm text-fg-muted transition-colors duration-200 hover:text-fg"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-3">
          <ul className="grid gap-3">
            {contact.social.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-sm text-fg-muted transition-colors duration-200 hover:text-fg"
                >
                  {s.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href={site.url}
                className="font-mono text-sm text-fg-muted transition-colors duration-200 hover:text-fg"
              >
                {site.domain}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-14 max-w-[1400px] border-t border-line px-5 pt-8 sm:px-8">
        <p className="text-sm text-fg-subtle">
          © {year} {site.name}
        </p>
      </div>
    </footer>
  );
}
