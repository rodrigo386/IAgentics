import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { nav, contact, site, footer, privacidade, credenciais } from "@/lib/content";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line py-16">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 px-5 sm:px-8 md:grid-cols-12">
        <div className="md:col-span-4">
          <span className="block text-fg">
            <Logo className="w-[150px]" />
          </span>
          <p className="mt-6 max-w-[34ch] text-sm leading-relaxed text-fg-muted">
            {footer.note}
          </p>
        </div>

        {/* `Link`, não `<a>` (2026-08-19): medido, o rodapé recarregava o
            documento inteiro a cada clique enquanto o cabeçalho navegava sem
            recarga — a mesma ação parecia lenta ou instantânea dependendo de
            onde o visitante clicasse.
            `prefetch={false}` pela razão do painel admin (armadilha 8): o
            rodapé aparece em TODA página e /cursos é force-dynamic, então
            prefetch aqui viraria consulta ao banco em cada rolagem até o fim. */}
        <nav aria-label="Rodapé" className="md:col-span-3">
          <ul className="grid grid-cols-2 gap-y-3">
            {nav.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  prefetch={false}
                  className="text-sm text-fg-muted transition-colors duration-200 hover:text-fg"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-2">
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

        {/* Credenciais (2026-10-08): o selo Claude Partner em todas as páginas,
            como imagem com link para a verificação no Credly — sem o script e o
            iframe do embed oficial. Ver `credenciais` em content.ts. */}
        <div className="md:col-span-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">{credenciais.titulo}</p>
          <a
            href={credenciais.claudePartner.href}
            target="_blank"
            rel="noreferrer noopener"
            className="group mt-4 flex items-center gap-4"
          >
            <Image
              src={credenciais.claudePartner.src}
              alt={credenciais.claudePartner.alt}
              width={credenciais.claudePartner.w}
              height={credenciais.claudePartner.h}
              className="size-20 shrink-0"
            />
            <span className="text-sm leading-snug text-fg-muted">
              {credenciais.claudePartner.legenda}
              <span className="mt-1 block text-fg transition-colors group-hover:text-accent-text">{credenciais.claudePartner.verificar} ↗</span>
            </span>
          </a>
        </div>
      </div>

      <div className="mx-auto mt-14 max-w-[1400px] border-t border-line px-5 pt-8 sm:px-8">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <p className="text-sm text-fg-subtle">
            © {year} {site.name}
          </p>
          {/* A política precisa ser alcançável de qualquer página — é o lugar
              onde todo mundo procura, e o Google já exibia essa URL. */}
          <Link
            href="/privacidade"
            prefetch={false}
            className="text-sm text-fg-subtle transition-colors duration-200 hover:text-fg"
          >
            {privacidade.meta.titulo}
          </Link>
        </div>
      </div>
    </footer>
  );
}
