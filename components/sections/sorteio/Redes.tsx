import { InstagramLogo, LinkedinLogo } from "@phosphor-icons/react/dist/ssr";
import { sorteio } from "@/lib/content";

const ICONES = { LinkedIn: LinkedinLogo, Instagram: InstagramLogo } as const;

/** LinkedIn e Instagram da IAgentics, visíveis na página e depois do cadastro (pedido do Rodrigo). */
export function Redes() {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{sorteio.redes.titulo}</p>
      <div className="flex flex-wrap gap-3">
        {sorteio.redes.itens.map((r) => {
          const Icone = ICONES[r.rede];
          return (
            <a
              key={r.href}
              href={r.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-control border border-line px-4 py-2.5 text-sm font-medium text-fg transition-colors hover:border-fg"
            >
              <Icone size={20} weight="regular" aria-hidden="true" />
              {r.rotulo}
            </a>
          );
        })}
      </div>
    </div>
  );
}
